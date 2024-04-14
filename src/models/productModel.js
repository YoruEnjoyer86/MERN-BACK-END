const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    quantity:{
        type: Int16Array,
        required:true
    },
    seller: {
      type: String,
      required: true,
    },
  });

  const Product = mongoose.model('product',productSchema);

  module.exports = Product;