const app = require("../src/index");
const express = require("express");
const router = express.Router();
const serverless = require("serverless-http");

router.get("/", (req, res) => res.send("default route is working!✅✅😁"));

api.use("/api/", router);
module.exports.handler = serverless(app);
