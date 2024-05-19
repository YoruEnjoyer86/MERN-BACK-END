const express = require("express");
const database = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const cors = require("cors");
const Product = require("./models/productModel");
const Account = require("./models/accountModel");
const FavoriteList = require("./models/favoriteListModel");
const fs = require("fs");
const path = require("path");
const { error } = require("console");
const axios = require("axios");
const FormData = require("form-data");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const product_images_folder = "./product_images";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET"],
    credentials: true,
  })
);
app.use(express.json());
//app.use("/events", eventRoutes);
app.use(cookieParser());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60, // e in secunde
      httpOnly: false,
    },
  })
);

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
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
  const productObject = {
    name: req.body.name,
    description: req.body.description,
    quantity: req.body.quantity,
    seller: req.body.seller,
    price: req.body.price,
    category: req.body.category,
    img_src: req.body.img_src,
  };
  const productToAdd = new Product(productObject);

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
  const productDetails = req.body.productDetails;
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

app.post("/api/sign_up", async (req, res) => {
  let message = "Sign Up failed.";
  const newAccount = new Account({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  let savedCorrectly = false;

  await newAccount.save().then(() => {
    savedCorrectly = true;
  });

  const favorites = new FavoriteList({
    name: "Favorite",
    products: [],
    userId: newAccount._id,
  });

  await favorites.save().catch((err) => {
    savedCorrectly = false;
    message = "Error at creating default list of favorites." + err;
  });

  if (savedCorrectly) {
    req.session.userId = newAccount._id;
    res.send({ ok: true, message: "Sign Up successful!" });
  } else res.send({ ok: true, message: message });
});

app.post("/api/login", async (req, res) => {
  const account = await Account.findOne({
    email: req.body.email,
    password: req.body.password,
  });

  if (account === null) res.send({ ok: false, message: "ACCOUNT NOT FOUND!" });
  else {
    req.session.userId = account._id;
    res.send({ ok: true });
  }
});

app.get("/check_connected", (req, res) => {
  if (req.session.userId) res.json({ ok: true });
  else res.json({ ok: false });
});

app.get("/profile", async (req, res) => {
  const accountData = await Account.findById(req.session.userId);
  return res.json({
    username: accountData.name,
    email: accountData.email,
    nickname: accountData.nickname,
    phone: accountData.phone_number,
  });
});

app.get("/logout", (req, res) => {
  req.session.userId = undefined;
  res.send("USER LOGGED OUT!");
});

app.get("/get_favorite_lists", async (req, res) => {
  let favoriteLists = await FavoriteList.find({ userId: req.session.userId });
  if (favoriteLists === null)
    res.json({ ok: false, message: "Favorite lists not found in database." });
  else res.json({ ok: true, lists: favoriteLists });
});

app.post("/get_products_from_favorite_list", async (req, res) => {
  const favoriteList = await FavoriteList.findOne({
    userId: req.session.userId,
    name: req.body.name,
  });
  if (!favoriteList)
    return res.json({
      ok: false,
      message: "Favorite list was not found in database!",
    });
  let products = [];
  for (let i = 0; i < favoriteList.products.length; i++) {
    let actualProduct = await Product.findById(favoriteList.products[i]);
    products.push(actualProduct);
  }
  res.json({ ok: true, products });
});

app.post("/is_product_favorite", async (req, res) => {
  let list = await FavoriteList.findOne({
    userId: req.session.userId,
    name: "Favorite",
  });
  if (!list)
    return res.json({ ok: false, message: "Favorites list not found." });
  for (let prodId of list.products)
    if (prodId == req.body.id) return res.json({ ok: true, isFavorite: true });
  return res.json({ ok: true, isFavorite: false });
});

app.post("/add_product_to_favorites", async (req, res) => {
  message = "";
  let list = await FavoriteList.findOne({
    userId: req.session.userId,
    name: "Favorite",
  });
  if (!list)
    return res.json({ ok: false, message: "Favorites list not found." });
  let newProductsList = list.products;
  newProductsList.push(mongoose.Types.ObjectId(req.body.id));
  await list.updateOne({ products: newProductsList }).catch((err) => {
    message = err;
  });
  if (message === "") res.json({ ok: true });
  else res.json({ ok: false, message });
});

app.post("/remove_product_from_favorites", async (req, res) => {
  message = "";
  let list = await FavoriteList.findOne({
    userId: req.session.userId,
    name: "Favorite",
  });
  if (!list)
    return res.json({ ok: false, message: "Favorites list not found." });
  let newProductsList = [];
  let indexToRemove = 0;
  for (let i = 0; i < list.products.length; i++)
    if (list.products[i] == req.body.id) {
      indexToRemove = i;
      break;
    }
  for (let i = 0; i < list.products.length; i++)
    if (i != indexToRemove) newProductsList.push(list.products[i]);
  //console.log(newProductsList);
  await list.updateOne({ products: newProductsList }).catch((err) => {
    message = err;
  });
  if (message === "") res.json({ ok: true });
  else res.json({ ok: false, message });
});
