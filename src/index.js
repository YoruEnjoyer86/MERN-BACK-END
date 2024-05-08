const express = require("express");
const database = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const cors = require("cors");
const Product = require("./models/productModel");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/events", eventRoutes);

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get("/", (req, res) => {
  res.send("PAGINA DE BACKEND!");
});

app.get("/api/products", async (req, res) => {
  const products = await Product.find().exec();
  res.json(products);
});

app.post("/api/add_product", async (req, res) => {
  //console.log(req.body.product);
  const productToAdd = new Product(JSON.parse(req.body.product));
  await productToAdd.save();
  res.send("Backendul a primit post request pt adaugare obiect!");
});
