const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const serviceAccount = require("./firebase-key.json");

if (getApps().length === 0) {
    try {
        initializeApp({
            credential: cert(serviceAccount)
        });
    } catch (error) {
        console.error("Firebase Init Error:", error);
    }
}

const db = getFirestore();

module.exports = async (req, res) => {
    const uid = req.query.uid;
    const amount = parseInt(req.query.amount);
    const secret = req.query.secret; // Naya Security Check

    // APNI SECRET KEY YAHAN SET KAREIN (Kisi ko mat batana)
    const MY_SECRET_KEY = "EarnNovaPro@2026_Secure"; 

    if (secret !== MY_SECRET_KEY) {
        return res.status(403).send("Error: Unauthorized Access!");
    }

    if (!uid || isNaN(amount)) {
        return res.status(400).send("Error: Invalid Parameters");
    }

    try {
        const userRef = db.collection("users").doc(uid);
        
        // Update user balance safely
        await userRef.set({
            balance: FieldValue.increment(amount)
        }, { merge: true });

        console.log(`Success: User ${uid} ko ${amount} coins mil gaye.`);
        
        return res.status(200).send("1"); 
        
    } catch (error) {
        console.error("Firebase Update Error: ", error);
        return res.status(500).send("DB Error: " + error.message);
    }
};