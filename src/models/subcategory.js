const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Types.ObjectId,
    ref: "Category",
  },
  mega_category: {
    type: mongoose.Types.ObjectId,
    ref: "MegaCategory",
  },
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

module.exports = Subcategory;
