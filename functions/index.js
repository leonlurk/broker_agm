// functions/index.js

// Importa el SDK de Admin y inicialízalo
const admin = require("firebase-admin");
admin.initializeApp();

// Importa Cloud Functions v2 y FieldValue
const { onDocumentCreated } = require("firebase-functions/v2/firestore"); // Importa el trigger v2
const { FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions"); // Importa el logger

// Nombre de la colección (asegúrate que coincida con tu código cliente)
const BROKER_USERS_COLLECTION = "users_broker";

/**
 * Cloud Function (v2) que se dispara al crear un nuevo documento de usuario
 * en la colección BROKER_USERS_COLLECTION.
 * Si el nuevo usuario tiene un campo 'referredBy', incrementa
 * el campo 'referralCount' del usuario referente.
 */
exports.incrementReferralCountV2 = onDocumentCreated(`${BROKER_USERS_COLLECTION}/{userId}`, async (event) => {
    // Obtiene los datos del documento recién creado del evento
    const snapshot = event.data;
    if (!snapshot) {
        logger.warn("No data associated with the event:", event);
        return;
    }
    const newUser = snapshot.data();
    const newUserId = event.params.userId; // Obtiene el ID del nuevo usuario del contexto

    // Verifica si existe el campo 'referredBy'
    const referrerId = newUser?.referredBy;

    if (!referrerId) {
        logger.log(`Usuario ${newUserId} creado sin referente.`);
        return; // No hay referente, termina la función.
    }

    logger.log(`Usuario ${newUserId} referido por ${referrerId}. Intentando incrementar contador.`);

    // Obtiene la referencia al documento del referente
    const referrerDocRef = admin.firestore()
                                 .collection(BROKER_USERS_COLLECTION)
                                 .doc(referrerId);

    try {
        // Incrementa el campo 'referralCount' del referente en 1
        // FieldValue.increment() maneja la operación atómica de forma segura
        await referrerDocRef.update({
            referralCount: FieldValue.increment(1)
        });
        logger.log(`Referral count for ${referrerId} incrementado exitosamente por creación de ${newUserId}.`);
        return;
    } catch (error) {
        logger.error(`Error al incrementar referral count para ${referrerId} (referido por ${newUserId}):`, error);
        // Considera añadir un mecanismo de reintento o alerta si esto falla
        return;
    }
});

// Puedes añadir otras Cloud Functions aquí si las necesitas