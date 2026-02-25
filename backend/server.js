// ================= IMPORTS =================
require("dotenv").config();
const { google } = require("googleapis");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); 
const PDFDocument = require("pdfkit");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// ================= MODELS =================
const User = require("./models/User");
const Product = require("./models/Product");
const Consultation = require("./models/Consultation");
const Order = require("./models/Order");

// ================= APP =================
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// ================= STATIC =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= RAZORPAY =================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ================= EMAIL =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ================= UPLOAD =================
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file" });

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

// ================= PRODUCTS =================
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch {
    res.status(500).json({ success: false });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ success: true, product });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================= CONSULT =================
app.post("/api/consult", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    const consult = new Consultation({ name, email, phone, message });
    await consult.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Consult: ${name}`,
      text: `${name} | ${phone}\n${message}`,
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================= AUTH =================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email }))
      return res.json({ success: false, message: "User exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hash });
    await user.save();

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================= RAZORPAY =================
app.post("/api/razorpay/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(req.body.amount * 100),
      currency: "INR",
      receipt: "solux_" + Date.now(),
    });

    res.json({ success: true, order });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.post("/api/razorpay/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected === razorpay_signature)
      return res.json({ success: true });

    res.status(400).json({ success: false });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================= ORDERS =================
app.post("/api/orders", async (req, res) => {
  try {
    // Telsina error: Frontend nunchi vachina payload motham Order lo save avvali.
    // Mee schema lo addressLine1, city ivanni levu anukunta, anduke save avvatledu.
    // Model ni kuda update chesukondi.
    const order = new Order(req.body);
    const savedOrder = await order.save();

    res.status(201).json({ success: true, orderId: savedOrder._id });

    // Background email + invoice
    setImmediate(() => sendInvoiceEmail(savedOrder));
    
    // Background lo Google Sheets ki data send cheyadam
    setImmediate(() => appendOrderToSheet(savedOrder));
    
  } catch (err) {
    if (!res.headersSent)
      res.status(500).json({ success: false, error: err.message });
  }
});

// ================= ADMIN & USER ORDERS =================
app.get("/api/orders", async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

app.post("/api/my-orders", async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  const orders = await Order.find({
    "customer.email": user.email,
  }).sort({ createdAt: -1 });

  res.json({ success: true, orders });
});

// ================= ADMIN & USER ORDERS =================
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Database lo update
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true, message: "Order status updated!" });

    // Background lo Google Sheet lo status update cheyadam
    setImmediate(() => updateOrderStatusInSheet(req.params.id, status));

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ================= PDF DOWNLOAD API =================
app.get('/api/orders/:id/invoice', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Solux-Invoice-${order._id.toString().slice(-6).toUpperCase()}.pdf`);

    const doc = generateInvoiceDoc(order);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).send("Error generating invoice");
  }
});

// ================= INVOICE GENERATOR FUNCTION =================
function generateInvoiceDoc(order) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // ===== HEADER & LOGO =====
  const logoPath = path.join(__dirname, "uploads", "logo.png");
  let startX = 50;
  
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 50, 45, { width: 50 });
      startX = 110; 
    } catch (e) {
      console.log("Logo display error:", e);
    }
  }

  doc.fontSize(14).font("Helvetica-Bold").text("Solux Solar", startX, 50);
  doc.font("Helvetica").fontSize(10)
    .text("Plot No. 105, Sy No. 126 & 103,", startX, 65)
    .text("MSK Mill Road, New Madina Colony,", startX, 80)
    .text("Kalaburagi, Karnataka – 585103.", startX, 95)
    .text("GSTIN: 29GNPPP5506Q1ZU", startX, 110)
    .text("Ph: +91 8123378092", startX, 125)
    .text("Email: sales@soluxsolar.com", startX, 140);

  // ===== TITLE =====
  doc.fontSize(22).font("Helvetica-Bold").text("INVOICE", 50, 50, { align: 'right' });

  // ===== CUSTOMER BLOCK (WITH FULL ADDRESS) =====
  const custY = 180; 
  // Safety check, okavela order.customer undefiened ithe crash avvakunda
  const customer = order.customer || {};

  doc.fontSize(11).font("Helvetica-Bold").text(customer.name || "Customer Name", 50, custY);

  doc.font("Helvetica");
  let currentY = custY + 15;
  
  if (customer.addressLine1) { doc.text(customer.addressLine1, 50, currentY); currentY += 15; }
  if (customer.addressLine2) { doc.text(customer.addressLine2, 50, currentY); currentY += 15; }
  
  const cityState = `${customer.city || ""} ${customer.state || ""}`.trim();
  const pincode = customer.pincode ? `- ${customer.pincode}` : "";
  if (cityState || pincode) {
    doc.text(`${cityState} ${pincode}`.trim(), 50, currentY); 
    currentY += 15;
  }

  if (customer.phone) { doc.text(`Ph: ${customer.phone}`, 50, currentY); currentY += 15; }

  if (customer.gstNumber && customer.gstNumber !== "N/A") {
    doc.text(`GSTIN: ${customer.gstNumber.toUpperCase()}`, 50, currentY);
    currentY += 15;
  }

  // ===== ORDER INFO =====
  const infoX = 350;
  doc.font("Helvetica-Bold").text("Order Number:", infoX, custY);
  doc.font("Helvetica").text(order._id.toString().slice(-6).toUpperCase(), 450, custY, { width: 90, align: 'right' });

  doc.font("Helvetica-Bold").text("Order Date:", infoX, custY + 15);
  doc.font("Helvetica").text(
    new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
    450, custY + 15, { width: 90, align: 'right' }
  );

  doc.font("Helvetica-Bold").text("Payment Method:", infoX, custY + 30);
  doc.font("Helvetica").text(order.paymentMethod || "Cash on delivery", 450, custY + 30, { width: 90, align: 'right' });

  // ===== TABLE HEADER =====
  let tableY = currentY > (custY + 50) ? currentY + 30 : custY + 80;
  doc.font("Helvetica-Bold");
  doc.text("Product", 50, tableY);
  doc.text("Quantity", 350, tableY);
  doc.text("Price", 450, tableY, { width: 90, align: 'right' });

  tableY += 20;
  doc.moveTo(50, tableY).lineTo(540, tableY).lineWidth(0.5).strokeColor('#cccccc').stroke();

  tableY += 15;
  doc.font("Helvetica");

  if(order.items && order.items.length > 0){
    order.items.forEach((item) => {
      doc.fillColor("black").font("Helvetica-Bold").text(item.name, 50, tableY);
      doc.fontSize(9).font("Helvetica").fillColor("gray")
        .text(`SKU/HSN: ${item.hsnCode || "N/A"}`, 50, tableY + 12);

      doc.fontSize(11).fillColor("black").font("Helvetica")
        .text(item.quantity || 1, 350, tableY);

      doc.text(`Rs. ${(item.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 450, tableY, { width: 90, align: 'right' });

      tableY += 35;
    });
  }

  // ===== TOTALS =====
  tableY += 10;
  doc.moveTo(350, tableY).lineTo(540, tableY).lineWidth(0.5).strokeColor('#cccccc').stroke();
  tableY += 15;

  const subtotal = order.subtotal || 0;
  const cgst = (order.gstAmount || 0) / 2;
  const sgst = (order.gstAmount || 0) / 2;
  const total = order.totalAmount || 0;

  const money = (v) => `Rs. ${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  doc.font("Helvetica").text("Subtotal", 350, tableY);
  doc.text(money(subtotal), 450, tableY, { width: 90, align: 'right' });

  tableY += 20;
  doc.text("CGST(9%)", 350, tableY);
  doc.text(money(cgst), 450, tableY, { width: 90, align: 'right' });

  tableY += 20;
  doc.text("SGST(9%)", 350, tableY);
  doc.text(money(sgst), 450, tableY, { width: 90, align: 'right' });

  tableY += 25;
  doc.font("Helvetica-Bold").text("Total", 350, tableY);
  doc.text(money(total), 450, tableY, { width: 90, align: 'right' });

  return doc;
}

function sendInvoiceEmail(order) {
  try {
    const doc = generateInvoiceDoc(order);
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(buffers);
      const customer = order.customer || {};

      await transporter.sendMail({
        from: `"Solux Solar" <${process.env.EMAIL_USER}>`,
        to: customer.email,
        bcc: process.env.EMAIL_USER,
        subject: `Invoice #${order._id.toString().slice(-6).toUpperCase()}`,
        text: `Dear ${customer.name || 'Customer'},\n\nThank you for choosing Solux Solar! Please find your official invoice attached.\n\nBest regards,\nThe Solux Solar Team`,
        attachments: [
          {
            filename: `Solux-Invoice-${order._id.toString().slice(-6).toUpperCase()}.pdf`,
            content: pdfData,
          },
        ],
      });
      console.log(`Invoice emailed to ${customer.email}`);
    });

    doc.end();
  } catch (err) {
    console.error("Invoice error:", err);
  }
}

// ================= GOOGLE SHEETS INTEGRATION =================
async function appendOrderToSheet(order) {
  console.log("📝 Google Sheets update start avuthundi...");
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json", 
      scopes: ["https://www.googleapis.com/auth/spreadsheets"], // Fixed: array format
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const customer = order.customer || {};
    
    // Items anni oka string laaga kalapadaniki
    const productsDetails = order.items && order.items.length > 0
      ? order.items.map((item) => `${item.name} (Qty: ${item.quantity || 1})`).join(", ")
      : "No items";

    // Sheet lo columns order (A, B, C, D...)
    const rowData = [
      order._id ? order._id.toString().slice(-6).toUpperCase() : "N/A", // Order ID
      order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"), // Date
      customer.name || "N/A", // Customer Name
      customer.phone || "N/A", // Phone
      customer.email || "N/A", // Email
      customer.city || "N/A", // City
      productsDetails, // Products
      order.totalAmount || 0, // Total Amount
      order.paymentMethod || "COD", // Payment Method
      order.status || "Pending", // Status
    ];

    const response = await googleSheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:J", 
      valueInputOption: "USER_ENTERED",
      requestBody: { // Fixed: resource badulu requestBody
        values: [rowData],
      },
    });

    console.log("✅ Order added to Google Sheets successfully! Status:", response.status);
  } catch (error) {
    console.error("❌ Google Sheets Error:", error.message);
  }
}
// ================= UPDATE STATUS IN GOOGLE SHEETS =================
async function updateOrderStatusInSheet(orderId, newStatus) {
  console.log(`📝 Google Sheets status update start... Order: ${orderId}, Status: ${newStatus}`);
  try {
    const { google } = require("googleapis");
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Order ID last 6 chars ni extract cheyadam
    const shortOrderId = orderId.toString().slice(-6).toUpperCase();

    // 1. Mundu Column A (Order IDs) motham read cheddam
    const getRows = await googleSheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:A", // Column A matrame read chestunnam
    });

    const rows = getRows.data.values;
    if (!rows || rows.length === 0) {
      console.log("No data found in sheet.");
      return;
    }

    // 2. Aa Order ID ye row lo undo find cheyadam (Sheets 1-indexed kabatti i+1)
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === shortOrderId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      console.log("❌ Order ID sheet lo dorakaledu.");
      return;
    }

    // 3. Status column (Column J) ni update cheyadam
    await googleSheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!J${rowIndex}`, // Example: Sheet1!J5
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[newStatus]],
      },
    });

    console.log(`✅ Order status Google Sheet lo update ayyindi! Row: ${rowIndex}`);
  } catch (error) {
    console.error("❌ Google Sheets Update Error:", error.message);
  }
}
// ================= DB =================
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log("Server running on " + PORT));
  })
  .catch(console.error);