const admin = require('firebase-admin');

// 1. Firebase Admin Setup (Secure Connection)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        })
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    // TimeWall jo data bhejega wo yahan aayega
    const { uid, reward, secret } = req.query;

    // 2. Security Check: Ek secret code jo sirf aapko aur TimeWall ko pata hoga
    const MY_SECRET_CODE = "EarnNovaPro2026"; 

    if (secret !== MY_SECRET_CODE) {
        return res.status(401).send("Bhai, tu kaun hai? Unauthorized!");
    }

    if (!uid || !reward) {
        return res.status(400).send("UID ya Reward amount missing hai.");
    }

    try {
        const amountToAdd = parseFloat(reward);

        // 3. User ke wallet mein Gems add karna
        const userRef = db.collection('users').doc(uid);
        await userRef.update({
            balance: admin.firestore.FieldValue.increment(amountToAdd),
            totalGemsEarned: admin.firestore.FieldValue.increment(amountToAdd)
        });

        // 4. History (Transactions) mein record add karna
        await db.collection('transactions').add({
            userId: uid,
            title: "TimeWall Task Completed",
            amount: amountToAdd,
            type: 'earn',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // 5. TimeWall ko batana ki sab successful ho gaya
        res.status(200).send("OK");
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).send("Server Error");
    }
}