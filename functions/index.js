// functions/index.js

// Importa el SDK de Admin y inicialízalo
const admin = require("firebase-admin");
admin.initializeApp();

// Importa Cloud Functions v2 y FieldValue
const { onDocumentCreated } = require("firebase-functions/v2/firestore"); // Importa el trigger v2
const { FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions"); // Importa el logger

// Unified collection name
const USERS_COLLECTION = "users";

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