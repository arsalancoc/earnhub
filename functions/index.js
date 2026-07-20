// index.js ke top par import add karein
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const db = getFirestore();

// Yeh function file ke neeche kahin bhi add kar dein
window.requestWithdrawal = async (amount, method, details) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        alert("Pehle login karo!");
        return;
    }

    try {
        await addDoc(collection(db, "withdrawals"), {
            userId: user.uid,
            name: user.displayName || "User",
            amount: amount,
            method: method, 
            details: details,
            status: "Pending", 
            timestamp: serverTimestamp()
        });
        alert("Request bheji gayi! Admin check karega.");
    } catch (e) {
        console.error("Error: ", e);
        alert("Error aaya, firse try karo.");
    }
}
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Database (Firestore) ko backend se control karne ke liye Admin SDK initialize karna zaroori hai
admin.initializeApp();
const db = admin.firestore();

// Yeh ban rahi hai hamari Postback API
exports.offerwallPostback = functions.https.onRequest(async (req, res) => {
    
    // Offerwalls (CPALead waghera) link ke aage data bhejte hain (jaise: ?uid=12345&amount=150)
    const uid = req.query.uid; 
    const amount = parseInt(req.query.amount);

    // Agar link mein User ID ya Amount missing hai, toh error bhej do
    if (!uid || isNaN(amount)) {
        console.error("Error: UID ya Amount missing hai!");
        return res.status(400).send("Error: Invalid Parameters");
    }

    try {
        const userRef = db.collection("users").doc(uid);
        
        // Backend se balance badhane ka sabse safe tareeqa (Increment)
        await userRef.update({
            balance: admin.firestore.FieldValue.increment(amount)
        });

        console.log(`Success: User ${uid} ke account mein ${amount} coins add ho gaye.`);
        
        // Offerwall company ko '1' ya 'OK' likh kar bhejna hota hai taaki unko pata chal jaye ki task poora ho gaya
        return res.status(200).send("1"); 
        
    } catch (error) {
        console.error("Firebase Update Error: ", error);
        return res.status(500).send("Server Error");
    }
});