const express = require("express");
const path = require("path");
const paymentController = require("../controllers/paymentController");
const db = require("../db/dbConnection");

const router = express.Router();

// Route to serve the homepage
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/paymentpage.html"));
});

// ✅ Route to create Razorpay order (controller handles logic)
router.post("/create-order", paymentController.createOrder);

router.post("/jioPGCallback", paymentController.jioPGCallback); 

router.get("/checkstatus", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transactions ORDER BY id DESC LIMIT 1");
    console.log("✅ Status API Response (verifying status):", rows[0]);

    
    if (rows.length === 0) {
      return res.send("<h2>❌ No transaction found yet.</h2>");
    }
    
    const data = rows[0];
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Latest Transaction Status</title>
    <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .info-box {
      border: 1px solid #ccc;
      padding: 15px;
      border-radius: 10px;
      margin-top: 20px;
      }
      </style>
      </head>
      <body>
      <h1>📋 Latest Transaction Details</h1>
      <div class="info-box">
      <p><strong>Transaction ID:</strong> ${data.merchantTxnNo}</p>
      <p><strong>Amount:</strong> ₹${data.amount}</p>
      <p><strong>Response Code:</strong> ${data.responseCode}</p>
      <p><strong>Status:</strong> ${data.status}</p>
      </div>
      </body>
      </html>
      `;
      
      res.send(html);
    } catch (err) {
      console.error("❌ Error retrieving transaction:", err.message);
      res.status(500).send("Internal Server Error");
    }
  });
  
  
  // router.post("/payphi-status", paymentController.fetchPayPhiStatus);


module.exports = router;
