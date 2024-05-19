const mongoose = require("mongoose");

const favoriteListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  ],
  userId: {
    type: String,
    required: true,
  },
});

const FavoriteList = mongoose.model("FavoriteList", favoriteListSchema);

module.exports = FavoriteList;
