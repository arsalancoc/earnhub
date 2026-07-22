const admin = require('firebase-admin');

// 1. Firebase Admin Setup (Bulletproof JSON method)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_JSON);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("🔥 Firebase Init Error (JSON galat hai):", error);
    }
}

const db = admin.firestore();

module.exports = async (req, res) => {
    const { uid, reward, secret } = req.query;
    const MY_SECRET_CODE = "EarnNovaPro2026"; 

    if (secret !== MY_SECRET_CODE) {
        return res.status(401).send("Unauthorized!");
    }

    if (!uid || !reward) {
        return res.status(400).send("UID ya Reward missing hai.");
    }

    try {
        const amountToAdd = parseFloat(reward);
        const userRef = db.collection('users').doc(uid);
        
        await userRef.set({
            balance: admin.firestore.FieldValue.increment(amountToAdd),
            totalGemsEarned: admin.firestore.FieldValue.increment(amountToAdd)
        }, { merge: true });

        await db.collection('transactions').add({
            userId: uid,
            title: "TimeWall Task",
            amount: amountToAdd,
            type: 'earn',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).send("OK");
    } catch (error) {
        console.error("🔥 FIREBASE ERROR:", error);
        res.status(500).send("Server Error: " + error.message);
    }
};