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

    if (!uid || isNaN(amount)) {
        return res.status(400).send("Error: Invalid Parameters");
    }

    try {
        const userRef = db.collection("users").doc(uid);
        
        // 'update' ki jagah 'set' aur 'merge: true' lagaya hai
        // Ab agar document nahi bhi hoga toh naya ban jayega
        await userRef.set({
            balance: FieldValue.increment(amount)
        }, { merge: true });

        console.log(`Success: User ${uid} ko ${amount} coins mil gaye.`);
        
        return res.status(200).send("1"); 
        
    } catch (error) {
        console.error("Firebase Update Error: ", error);
        // Taki agar agli baar error aaye, toh browser par exact reason dikhe
        return res.status(500).send("DB Error: " + error.message);
    }
};