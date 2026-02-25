// backend/models/Product.js
const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    hsnCode: { type: String, required: true }, // Tax purpose
    category: String,
    stock: { type: Number, default: 0 },
    imageUrl: String
});
module.exports = mongoose.model('Product', productSchema);