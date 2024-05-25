const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  seller: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  num_reviews: {
    type: Number,
    required: false,
    default: 0,
  },
  reviews: {
    type: [],
    required: false,
    default: [],
  },
  rating: {
    type: Number,
    required: false,
    default: Math.floor(Math.random() * 5),
  },
  category: {
    type: mongoose.Types.ObjectId,
    ref: "Category",
    required: false,
    default: "no_category",
  },
  mega_category: {
    type: mongoose.Types.ObjectId,
    ref: "MegaCategory",
    required: true,
  },
  subcategory: {
    type: mongoose.Types.ObjectId,
    ref: "Subcategory",
    required: false,
    default: "",
  },
});

const Product = mongoose.model("Product", productSchema);

//schema pt recorduri
//model pt collection

module.exports = Product;
