// functions/index.js

// Importa el SDK de Admin y inicialízalo
const admin = require("firebase-admin");
const functions = require("firebase-functions");

// Comentamos esta línea para evitar conflictos con la inicialización del lado del cliente
// admin.initializeApp();

// Importa Cloud Functions v2 y FieldValue
const { onDocumentCreated } = require("firebase-functions/v2/firestore"); // Importa el trigger v2
const { FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions"); // Importa el logger

// Unified collection name
const USERS_COLLECTION = "users";

// Importaciones adicionales para la nueva función
const axios = require("axios");

/**
 * Cloud Function (v2) triggered on new document creation in USERS_COLLECTION.
 * If the new user has user_type === 'broker' AND a referredBy field,
 * increments the referralCount of the referring user.
 */
exports.incrementReferralCountV2 = onDocumentCreated(`${USERS_COLLECTION}/{userId}`, async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.warn("No data associated with the event:", event);
        return;
    }
    const newUser = snapshot.data();
    const newUserId = event.params.userId;

    // Check if the new user is of type 'broker'
    if (newUser?.user_type !== 'broker') {
        logger.log(`User ${newUserId} created with type ${newUser?.user_type || 'undefined'}. Skipping referral count check.`);
        return; // Not a broker user, ignore.
    }

    // Check if there's a referrer ID
    const referrerId = newUser?.referredBy;
    if (!referrerId) {
        logger.log(`Broker user ${newUserId} created without referrer.`);
        return; // No referrer, nothing to increment.
    }

    logger.log(`Broker user ${newUserId} referred by ${referrerId}. Attempting to increment count.`);

    // Reference to the referrer's document in the SAME collection
    const referrerDocRef = admin.firestore()
                                 .collection(USERS_COLLECTION) // Use the unified collection
                                 .doc(referrerId);

    try {
        // Increment referralCount atomically
        await referrerDocRef.update({
            referralCount: FieldValue.increment(1)
        });
        logger.log(`Referral count for ${referrerId} incremented successfully by broker user ${newUserId}.`);
        return;
    } catch (error) {
        // Log error if update fails (e.g., referrer document doesn't exist)
        logger.error(`Error incrementing referral count for ${referrerId} (referred by ${newUserId}):`, error);
        return;
    }
});

// Puedes añadir otras Cloud Functions aquí si las necesitas

exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// --- Lógica de Replicación de Copytrading ---

// Configuración de la API de Python (debe estar en variables de entorno)
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://your-vps-ip:5000/api";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY; // Clave para la comunicación segura entre servicios

/**
 * Calcula el volumen de la operación para el seguidor.
 * @param {object} masterTrade - Detalles del trade del master.
 * @param {object} masterAccount - Datos de la cuenta del master.
 * @param {object} followerAccount - Datos de la cuenta del seguidor.
 * @param {object} relationship - La relación de copia entre ambos.
 * @return {number} - El volumen calculado para el seguidor.
 */
const calculateFollowerVolume = (masterTrade, masterAccount, followerAccount, relationship) => {
  const masterVolume = masterTrade.volume;
  const masterBalance = masterAccount.balance;
  const followerBalance = followerAccount.balance;
  const riskRatio = relationship.risk_ratio || 1.0;

  if (masterBalance <= 0) return 0; // Evitar división por cero

  // Fórmula de replicación proporcional
  const proportionalVolume = masterVolume * (followerBalance / masterBalance) * riskRatio;
  
  // Redondear a 2 decimales y asegurarse de que es un valor válido
  return Math.round(proportionalVolume * 100) / 100;
};


exports.processReplicationQueue = onDocumentCreated("replication_queue/{jobId}", async (event) => {
  const logger = require("firebase-functions/logger");

  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No hay datos asociados al evento, saliendo.");
    return;
  }
  
  const job = snapshot.data();
  const jobId = event.params.jobId;

  // 1. Evitar re-procesamiento
  if (job.status !== "pending") {
    logger.log(`Job ${jobId} ya procesado (estado: ${job.status}). Omitiendo.`);
    return;
  }

  logger.info(`Procesando Job ${jobId} para el master ${job.master_mt5_account_id}`);

  try {
    const { master_mt5_account_id, master_trade_details } = job;

    // 2. Obtener todos los seguidores activos de este master
    const db = admin.firestore();
    const relationshipsRef = db.collection("copy_relationships");
    const followersSnapshot = await relationshipsRef
      .where("master_mt5_account_id", "==", master_mt5_account_id)
      .where("status", "==", "active")
      .get();

    if (followersSnapshot.isEmpty) {
      logger.warn(`No se encontraron seguidores para el master ${master_mt5_account_id}.`);
      await snapshot.ref.update({ status: "completed_no_followers" });
      return;
    }
    
    // 3. Obtener datos de la cuenta del master para el cálculo
    // (Asumimos que la API Python puede devolver datos de la cuenta)
    const masterAccountResponse = await axios.get(`${PYTHON_API_URL}/accounts/${master_mt5_account_id}`, {
        headers: { "Authorization": `Bearer ${INTERNAL_API_KEY}` },
    });
    const masterAccount = masterAccountResponse.data;

    // 4. Iterar sobre cada seguidor y ejecutar el trade
    const replicationPromises = followersSnapshot.docs.map(async (doc) => {
      const relationship = doc.data();
      const followerMt5Id = relationship.follower_mt5_account_id;
      
      try {
        // Obtener datos de la cuenta del seguidor
        const followerAccountResponse = await axios.get(`${PYTHON_API_URL}/accounts/${followerMt5Id}`, {
            headers: { "Authorization": `Bearer ${INTERNAL_API_KEY}` },
        });
        const followerAccount = followerAccountResponse.data;

        // Calcular volumen
        const followerVolume = calculateFollowerVolume(master_trade_details, masterAccount, followerAccount, relationship);

        if (followerVolume <= 0.00) {
          throw new Error("El volumen calculado es cero o negativo.");
        }
        
        // Ejecutar el trade a través de la API de Python
        const tradePayload = {
          login: followerMt5Id,
          symbol: master_trade_details.symbol,
          order_type: master_trade_details.type, // Asegurarse que los tipos coinciden (0=BUY, 1=SELL)
          volume: followerVolume,
          sl: master_trade_details.sl,
          tp: master_trade_details.tp,
          comment: `Copied from ${master_mt5_account_id} (Job: ${jobId})`,
        };
        
        await axios.post(`${PYTHON_API_URL}/trades/execute`, tradePayload, {
            headers: { "Authorization": `Bearer ${INTERNAL_API_KEY}` },
        });

        logger.info(`Trade replicado exitosamente para el seguidor ${followerMt5Id}.`);
        return { follower: followerMt5Id, status: "success" };
      } catch (error) {
        logger.error(`Falló la replicación para el seguidor ${followerMt5Id}:`, error.message);
        return { follower: followerMt5Id, status: "failed", error: error.message };
      }
    });

    const results = await Promise.all(replicationPromises);
    
    // 5. Actualizar el estado del job principal
    await snapshot.ref.update({
      status: "completed",
      processed_at: new Date(),
      results: results,
    });

  } catch (error) {
    logger.error(`Error crítico procesando el job ${jobId}:`, error);
    await snapshot.ref.update({
      status: "failed",
      error: error.message,
      processed_at: new Date(),
    });
  }
});