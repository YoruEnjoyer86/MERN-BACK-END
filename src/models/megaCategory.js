const mongoose = require("mongoose");

const megaCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  categories: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  ],
});

const MegaCategory = mongoose.model("MegaCategory", megaCategorySchema);

module.exports = MegaCategory;
