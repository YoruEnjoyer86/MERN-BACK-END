const express = require("express");
const database = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const cors = require("cors");
const Product = require("./models/productModel");
const Account = require("./models/accountModel");
const FavoriteList = require("./models/favoriteListModel");
const ShoppingCart = require("./models/shopping_cart");
const fs = require("fs");
const path = require("path");
const { error } = require("console");
const axios = require("axios");
const FormData = require("form-data");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const multer = require("multer");

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

const storageConfiguration = multer.diskStorage({
  destination: "./product_images",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storageConfiguration });

app.post(
  "/api/add_product",
  upload.single("file"), //asa tre sa fie numit fisieru trimis, mai intai o sa fie apelata functia pentru a avea setat sellerName si prodName pt numele fisierului
  async (req, res) => {
    // console.log(req.file);
    // console.log("BODY", req.body);
    const productObject = {
      name: req.body.name,
      description: req.body.description,
      quantity: req.body.quantity,
      seller: req.body.seller,
      price: req.body.price,
      category: req.body.category,
    };
    const productToAdd = new Product(productObject);
    await productToAdd.save().catch((err) => {
      return res.json({ ok: false });
    });
    res.json({ ok: true });
  }
);

app.post("/api/get_products_of_category", async (req, res) => {
  const category = req.body.category;
  const products =
    category === "everything"
      ? await Product.find().exec()
      : await Product.find({ category: category }).exec();
  res.json(products);
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

app.post("/get_products_from_cart", async (req, res) => {
  const cart = await ShoppingCart.findOne({ userId: req.session.userId });
  //console.log(cart);
  if (!cart) return res.json({ ok: true, products: [] });
  else {
    let products = [];
    for (let i = 0; i < cart.productsDetails.length; i++) {
      let prodDetails = cart.productsDetails[i];
      let prod = await Product.findById(prodDetails.id);
      if (prod)
        products.push({
          cartQuantity: prodDetails.quantity,
          name: prod.name,
          description: prod.description,
          quantity: prod.quantity,
          seller: prod.seller,
          price: prod.price,
          num_reviews: prod.num_reviews,
          reviews: prod.reviews,
          rating: prod.rating,
          category: prod.category,
          _id: prod._id,
        });
      else
        return res.json({
          ok: false,
          message: "product that is in cart is no longer available in database",
        });
    }
    //console.log(products);
    return res.json({ ok: true, products });
  }
});

app.post("/increase_product_quantity_in_cart", async (req, res) => {
  let cart = await ShoppingCart.findOne({ userId: req.session.userId });
  if (!cart) {
    cart = new ShoppingCart({
      userId: req.session.userId,
      productsDetails: [],
    });
    await cart.save();
  }
  //console.log(req.body.id);
  let alreadyInCart = false;
  let changeIndex = 0;
  for (let i = 0; i < cart.productsDetails.length; i++) {
    if (cart.productsDetails[i].id == req.body.id) {
      alreadyInCart = true;
      changeIndex = i;
      break;
    }
  }
  if (alreadyInCart) {
    cart.productsDetails[changeIndex].quantity += 1;
    await cart.save();
    res.json({ ok: true });
  } else {
    cart.productsDetails.push({ id: req.body.id, quantity: 1 });
    await cart.save();
    res.json({ ok: true });
  }
});

app.post("/decrese_quantity_product_from_cart", async (req, res) => {
  let cart = await ShoppingCart.findOne({ userId: req.session.userId });
  if (!cart) return res.json({ ok: true, message: "cart does not exist" });
  let isInCart = false;
  let changeIndex = 0;
  for (let i = 0; i < cart.productsDetails.length; i++) {
    if (cart.productsDetails[i].id == req.body.id) {
      isInCart = true;
      changeIndex = i;
      break;
    }
  }
  // console.log(req.body.id);
  if (!isInCart) return res.json({ ok: true, message: "was not in cart" });
  if (cart.productsDetails[changeIndex].quantity === 1) {
    for (let i = changeIndex; i < cart.productsDetails.length - 1; i++)
      cart.productsDetails[i] = cart.productsDetails[i + 1];
    cart.productsDetails.pop();
    await cart.save();
  } else {
    cart.productsDetails[changeIndex].quantity--;
    await cart.save();
  }
  res.json({ ok: true, message: "decreased it" });
});

app.post("/remove_product_from_cart", async (req, res) => {
  let cart = await ShoppingCart.findOne({ userId: req.session.userId });
  if (!cart) return res.json({ ok: true, message: "cart does not exist" });
  let isInCart = false;
  let changeIndex = 0;
  for (let i = 0; i < cart.productsDetails.length; i++) {
    if (cart.productsDetails[i].id == req.body.id) {
      isInCart = true;
      changeIndex = i;
      break;
    }
  }
  // console.log(req.body.id);
  if (!isInCart) return res.json({ ok: true, message: "was not in cart" });

  for (let i = changeIndex; i < cart.productsDetails.length - 1; i++)
    cart.productsDetails[i] = cart.productsDetails[i + 1];
  cart.productsDetails.pop();
  await cart.save();

  res.json({ ok: true, message: "decreased it" });
});

app.post("/get_search_results", async (req, res) => {
  let foundObjects = await Product.find({
    name: { $regex: "^" + req.body.text, $options: "i" }, //optiunea i e pt case insensitive si .* inseamna 0..inf charact oricare, ^ inseamna de la inceput
  });
  return res.json({ results: foundObjects });
});
