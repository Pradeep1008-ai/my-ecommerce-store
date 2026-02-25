const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const sampleProducts = [
  { name: "Mechanical Keyboard V1", description: "Tactile robotic keyboard", price: 129.99, hsnCode: "847160", category: "Accessories", stock: 50, imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=500" },
  { name: "Cyber Mouse X-9", description: "High precision gaming mouse", price: 79.99, hsnCode: "847160", category: "Accessories", stock: 100, imageUrl: "https://images.unsplash.com/photo-1615663245857-ac1e99b79830?auto=format&fit=crop&q=80&w=500" },
  { name: "Neon Headset Pro", description: "Immersive audio experience", price: 149.99, hsnCode: "851830", category: "Audio", stock: 30, imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=500" }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected for Seeding...');
    await Product.deleteMany(); // Patha data unte clear chesthundi
    await Product.insertMany(sampleProducts);
    console.log('Sample Products Added Successfully! 🚀');
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });