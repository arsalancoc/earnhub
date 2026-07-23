const admin = require('firebase-admin');

// Firebase Setup
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
            })
        });
    } catch (error) {
        console.error("🔥 Firebase Init Error:", error);
    }
}

const db = admin.firestore();

module.exports = async (req, res) => {
    // CPX parameters receive karna
    const { uid, reward, status, tx, secret } = req.query;
    const MY_SECRET_CODE = "EarnNovaPro2026"; 

    // Security Check
    if (secret !== MY_SECRET_CODE) {
        return res.status(401).send("Unauthorized!");
    }

    if (!uid || !reward) {
        return res.status(400).send("UID or Reward missing.");
    }

    try {
        const amount = parseFloat(reward);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).send("Invalid Amount Error");
        }

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).send("User not found");
        }

        // 🔥 STATUS 1 = Survey Complete (Gems Add Karo)
        if (status === "1") {
            // 1. User ko Gems aur 1 Scratch Card do
            await userRef.set({
                balance: admin.firestore.FieldValue.increment(amount),
                totalGemsEarned: admin.firestore.FieldValue.increment(amount),
                scratchCards: admin.firestore.FieldValue.increment(1)
            }, { merge: true });

            await db.collection('transactions').add({
                userId: uid,
                title: "CPX Research Survey",
                amount: amount,
                type: 'earn',
                txId: tx || "N/A",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // 2. Referral Commission (6%) Logic
            const userData = userDoc.data();
            if (userData.referredBy) {
                const referrerUid = userData.referredBy;
                const commission = Math.round(amount * 0.06); 

                if (commission > 0) {
                    const referrerRef = db.collection('users').doc(referrerUid);
                    await referrerRef.set({
                        balance: admin.firestore.FieldValue.increment(commission),
                        totalCommission: admin.firestore.FieldValue.increment(commission)
                    }, { merge: true });

                    await db.collection('transactions').add({
                        userId: referrerUid,
                        title: "Referral Commission (CPX)",
                        amount: commission,
                        type: 'commission',
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        } 
        // 🔥 STATUS 2 = Fraud / Chargeback (Gems Wapas Kaato)
        else if (status === "2") {
            await userRef.set({
                balance: admin.firestore.FieldValue.increment(-amount),
            }, { merge: true });
            
            await db.collection('transactions').add({
                userId: uid,
                title: "CPX Survey Chargeback",
                amount: -amount,
                type: 'deduct',
                txId: tx || "N/A",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        // CPX ko 200 OK bhejna zaroori hai
        res.status(200).send("OK");
    } catch (error) {
        console.error("🔥 FIREBASE ERROR:", error);
        res.status(500).send("Server Error: " + error.message);
    }
};