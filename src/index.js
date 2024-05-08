const express = require("express");
const database = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const cors = require("cors");

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

app.get("/api/products", (req, res) => {
  const placeHolderImage = "../../../public/item.png";
  const products = [
    { name: "Bec", image: placeHolderImage },
    { name: "Lingura", image: placeHolderImage },
    { name: "Hartie", image: placeHolderImage },
    { name: "Stilou", image: placeHolderImage },
    { name: "Pix", image: placeHolderImage },
    { name: "Coca-Cola", image: placeHolderImage },
    { name: "Pepsi", image: placeHolderImage },
    { name: "Ciuperca", image: placeHolderImage },
    { name: "Priza", image: placeHolderImage },
  ];
  res.json(products);
});
