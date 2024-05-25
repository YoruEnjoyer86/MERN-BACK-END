const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subcategories: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
  ],
  mega_category: {
    type: mongoose.Types.ObjectId,
    ref: "MegaCategory",
    required: true,
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
