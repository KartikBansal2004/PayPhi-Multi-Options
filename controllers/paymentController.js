const axios = require("axios");
const crypto = require("crypto");
const db = require("../db/dbConnection");
const path = require("path");

const MERCHANT_ID = "JP2000000000031";
const SECRET_KEY = "abc";

// Create payment order
exports.createOrder = async (req, res) => {
  const baseAmount = parseInt(req.body.amount); // Without GST
  const gstAmount = Math.round(baseAmount * 0.18); // 18% GST
  const totalAmount = baseAmount + gstAmount;

  const txnId = "TXN" + Date.now();

  const payload = {
    merchantId: MERCHANT_ID,
    merchantTxnNo: txnId,
    amount: totalAmount,
    currencyCode: "356",
    payType: "0",
    customerEmailID: "",
    transactionType: "SALE",
    txnDate: getCurrentYmdHis(),
    returnURL: "http://13.235.80.49:3000/jioPGCallback",
    customerMobileNo: "",
    addlParam1: "RES123456789",
    addlParam2: "",
  };

  const sortedKeys = Object.keys(payload).sort();
  let message = "";
  for (const key of sortedKeys) {
    const value = payload[key];
    if (value !== null && value !== "") {
      message += value;
    }
  }

  const hash = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message)
    .digest("hex")
    .toLowerCase();

  payload.secureHash = hash;

  try {
    // Save to DB with initiating status
    await db.execute(
      `INSERT INTO transactions (merchantTxnNo, baseAmount, gstAmount, amount, responseCode, status, productName) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        txnId,
        baseAmount,
        gstAmount,
        totalAmount,
        "----",
        "initiating",
        getProductNameFromAmount(baseAmount),
      ]
    );

    // Call initiateSale API
    const response = await axios.post(
      "https://uat.jiopay.co.in/tsp/pg/api/v2/initiateSale",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ PayPhi Response:", response.data);

    if (response.data.responseCode === "R1000" && response.data.redirectURI) {
      res.json({
        redirectUrl:
          response.data.redirectURI + "?tranCtx=" + response.data.tranCtx,
      });
    } else {
      res.status(400).json({
        error: "PayPhi did not return redirect URL",
        details: response.data,
      });
    }
  } catch (error) {
    console.error("❌ Error creating order:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to get payment URL from server." });
  }
};

// Callback handler
exports.jioPGCallback = async (req, res) => {
  const { merchantTxnNo, amount, responseCode, responseMessage } = req.body;
  console.log("📥 PayPhi Callback Body:", req.body);

  const statusText = responseCode === "0000" ? "Successful" : "Failed";

  try {
    // Update DB with response
    await db.execute(
      `UPDATE transactions SET responseCode = ?, status = ? WHERE merchantTxnNo = ?`,
      [responseCode, statusText, merchantTxnNo]
    );
    console.log("📝 Transaction status updated:", statusText);
  } catch (err) {
    console.error("❌ Error updating transaction status:", err);
  }

  // 🔁 Status API Check
  const statusPayload = {
    merchantId: MERCHANT_ID,
    merchantTxnNo: merchantTxnNo,
    transactionType: "SALE",
    txnDate: getCurrentYmdHis(),
  };

  const sortedKeys = Object.keys(statusPayload).sort();
  let message = "";
  for (const key of sortedKeys) {
    const value = statusPayload[key];
    if (value !== null && value !== "") {
      message += value;
    }
  }

  const hash = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message)
    .digest("hex")
    .toLowerCase();

  statusPayload.secureHash = hash;

  try {
    const statusResponse = await axios.post(
      "https://uat.jiopay.co.in/tsp/pg/api/command",
      statusPayload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("📡 Status API Response:", statusResponse.data);
  } catch (statusErr) {
    console.error(
      "❌ PayPhi Status API Error:",
      statusErr?.response?.data || statusErr.message
    );
  }

  // Render result page
  res.render("paymentResult", {
    merchantTxnNo,
    amount,
    responseCode,
    responseMessage,
    status: statusText,
    statusMessage:
      statusText === "Successful"
        ? "✅ Payment Successful!"
        : "❌ Payment Failed!",
    statusClass: statusText === "Successful" ? "success" : "fail",
  });
};

// Utility functions
function getCurrentYmdHis() {
  const now = new Date();
  const Y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const H = String(now.getHours()).padStart(2, "0");
  const i = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${Y}${m}${d}${H}${i}${s}`;
}

function getProductNameFromAmount(baseAmount) {
  switch (baseAmount) {
    case 399:
      return "T-Shirt";
    case 499:
      return "Hoodie";
    case 199:
      return "Cap";
    default:
      return "Unknown";
  }
}
