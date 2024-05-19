const mongoose = require("mongoose");

const shopping_cart_schema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  productsDetails: [
    {
      type: {
        id: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
      required: true,
    },
  ],
});

const ShoppingCart = mongoose.model("ShoppingCart", shopping_cart_schema);
module.exports = ShoppingCart;
