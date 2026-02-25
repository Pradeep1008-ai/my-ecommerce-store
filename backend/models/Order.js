const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        gstNumber: { type: String, default: 'N/A' },
        // Kothaga add chesina address fields
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
    },
    items: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        hsnCode: { type: String, default: 'N/A' },
        quantity: { type: Number, default: 1 } // PDF mariyu Sheets kosam idi add chesanu
    }],
    subtotal: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Online (Razorpay)' },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);