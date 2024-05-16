const express = require("express");
const database = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const cors = require("cors");
const Product = require("./models/productModel");
const fs = require("fs");
const path = require("path");
const { error } = require("console");
const axios = require("axios");
const bodyParser = require("body-parser");

const product_images_folder = "./product_images";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/events", eventRoutes);

//payload too big ??? de ce???
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get("/", (req, res) => {
  res.send("PAGINA DE BACKEND!");
});

app.post("/api/get_products_of_category", async (req, res) => {
  const category = req.body.category;
  const products =
    category === "everything"
      ? await Product.find().exec()
      : await Product.find({ category: category }).exec();
  res.json(products);
});

app.post("/api/add_product", async (req, res) => {
  //console.log(req.body.product);
  const productObject = JSON.parse(req.body.product);
  const productToAdd = new Product(JSON.parse(req.body.product));

  let imgType = productObject.img_src.split("/")[1].split(";")[0];

  let imagePath = path.join(
    product_images_folder,
    productObject.name + "_" + productObject.seller + "." + imgType
  );

  const file = fs.createWriteStream(imagePath);
  axios({
    url: productObject.img_src,
    responseType: "stream",
  }).then((response) => {
    response.data.pipe(file); //pune in fisier informatia binara
    file.on("finish", async () => {
      file.close();
      await productToAdd.save();
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
  let errorMSG =
    "INVALID PRODUCT, COULD NOT FIND PRODUCT IMAGE : " + productDetails.name;
  let foundImage = false;
  let imageTypes = ["png", "jpeg", "webp", "jpg"];
  let uri;
  for (let i = 0; i < imageTypes.length; i++) {
    let imagePath = path.join(
      product_images_folder,
      productDetails.name + "_" + productDetails.seller + "." + imageTypes[i]
    );
    if (!fs.existsSync(imagePath)) continue;
    try {
      let data = fs.readFileSync(imagePath);
      let mime = "image/" + imageTypes[i];
      let encoding = "base64";
      uri = "data:" + mime + ";" + encoding + "," + data.toString(encoding);
      foundImage = true;
    } catch (error) {
      errorMSG =
        "EROARE LA DESCHIDERE IMAGINE PRODUS(IMAGINEA EXISTA) : " + error;
    }
    break;
  }
  if (!foundImage)
    res.json({
      ok: false,
      error: errorMSG,
    });
  else res.json({ ok: true, img: uri });
});
