const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  nickname: { type: String, required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone_number: { type: String, required: false },
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
