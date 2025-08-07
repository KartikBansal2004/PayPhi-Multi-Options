const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;
const route = require("./routes/route");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use(express.static(path.join(__dirname, "public")));

// Import your routes
app.use("/", route);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("views", "./views");



app.get("/buy/:baseAmount", (req, res) => {
  const baseAmount = parseInt(req.params.baseAmount);
  const gstAmount = Math.round(baseAmount * 0.18);
  const totalAmount = baseAmount + gstAmount;

  const productName = getProductNameFromAmount(baseAmount);

  res.render("checkout", {
    baseAmount,
    gstAmount,
    amount: totalAmount,
    productName,
  });
});





// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
