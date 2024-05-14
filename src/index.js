const express = require("express");
const database = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const cors = require("cors");
const Product = require("./models/productModel");
const fs = require("fs");
const path = require("path");
const { error } = require("console");
const axios = require("axios");

const product_images_folder = "./product_images";

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
  const productObject = JSON.parse(req.body.product);
  const productToAdd = new Product(JSON.parse(req.body.product));
  await productToAdd.save();

  let imagePath = path.join(
    product_images_folder,
    productObject.name + "_" + productObject.seller + ".png"
  );

  const file = fs.createWriteStream(imagePath);
  axios({
    url: productObject.img_src,
    responseType: "stream",
  }).then((response) => {
    response.data.pipe(file); //pune in fisier informatia binara
    file.on("finish", () => {
      file.close();
      res.send("Descarcat imaginea produsului cu succes!");
    });
    file.on("error", (err) => {
      fs.unlink(imagePath);
      res.send("Descarcarea imaginii produsului a esuat");
    });
  });
});

app.post("/api/get_product_image", async (req, res) => {
  const productDetails = JSON.parse(req.body.productDetails);
  if (productDetails.seller != undefined) {
    let imagePath = path.join(
      product_images_folder,
      productDetails.name + "_" + productDetails.seller + ".png"
    );

    fs.readFile(imagePath, (error, data) => {
      if (error) console.log(error);
      else {
        let mime = "image/png";
        let encoding = "base64";
        let uri =
          "data:" + mime + ";" + encoding + "," + data.toString(encoding);
        res.json({ ok: true, img: uri });
      }
    });
  } else
    res.json({
      ok: false,
      error: "INVALID PRODUCT, NO SELLER : " + productDetails.name,
    });
});
