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
        type: Number,
        required:true
    },
  });

  const sellerSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    city:{
        type: String,
        require: true
    },
    products: [productSchema]
  });

  const Seller = mongoose.model('Seller',sellerSchema);

  module.exports = Seller;