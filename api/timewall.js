const admin = require('firebase-admin');

// 1. Firebase Admin Setup (Vercel Environment Variables ke through)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // 🔥 Yeh line \n error ko fix karti hai aur bina json file ke login karti hai
                privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
            })
        });
    } catch (error) {
        console.error("🔥 Firebase Init Error:", error);
    }
}

const db = admin.firestore();

module.exports = async (req, res) => {
    // 🔥 Code ko thoda smart banaya: 'reward' aur 'currencyAmount' dono check karega
    const { uid, reward, currencyAmount, secret } = req.query;
    const MY_SECRET_CODE = "EarnNovaPro2026"; 

    if (secret !== MY_SECRET_CODE) {
        return res.status(401).send("Unauthorized!");
    }

    // TimeWall jo bhi naam se bheje, usko final amount maan lo
    const incomingAmount = reward || currencyAmount;

    if (!uid || !incomingAmount) {
        return res.status(400).send("UID ya Amount missing hai link mein.");
    }

    try {
        const amountToAdd = parseFloat(incomingAmount);
        
        // 🔥 Ek aur safety check: Agar TimeWall blank bheje, toh crash na ho
        if (isNaN(amountToAdd)) {
            return res.status(400).send(`Invalid Number Error: TimeWall ne "${incomingAmount}" bheja hai.`);
        }

        const userRef = db.collection('users').doc(uid);
        
        await userRef.set({
            balance: admin.firestore.FieldValue.increment(amountToAdd),
            totalGemsEarned: admin.firestore.FieldValue.increment(amountToAdd)
        }, { merge: true });

        await db.collection('transactions').add({
            userId: uid,
            title: "TimeWall Task Completed",
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