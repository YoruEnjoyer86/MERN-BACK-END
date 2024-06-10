const express = require("express");
const database = require("./config/database");
const eventRoutes = require("./routes/eventRoutes");
const cors = require("cors");
const Product = require("./models/productModel");
const Account = require("./models/accountModel");
const FavoriteList = require("./models/favoriteListModel");
const ShoppingCart = require("./models/shopping_cart");
const MegaCategory = require("./models/megaCategory");
const Category = require("./models/category");
const Subcategory = require("./models/subcategory");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const Heap = require("heap");

const product_images_folder = "./product_images";
const local_front_url = "http://localhost:5173";
const deployed_front_url = "https://ecommerce-bibart-alexandru.onrender.com";

const app = express();
app.use(
  cors({
    origin: [
      process.env.NODE_ENV === "production"
        ? deployed_front_url
        : local_front_url,
    ],
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
      secure: process.env.NODE_ENV === "production" ? true : false,
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

app.post("/add_product_image", async (req, res) => {
  let ok = true;
  await upload.single("file")(req, res, (err) => {
    ok = false;
  });
  if (ok === false)
    return res.status(400).send({
      message: "❌Error at saving product image" + err,
    });
  res.status(200).send({
    message: "✅Product image saved succsessfully",
  });
});

app.post("/add_product_to_database", async (req, res) => {
  // console.log(req.file);
  // console.log("BODY", req.body);
  const productObject = {
    name: req.body.name,
    description: req.body.description,
    quantity: req.body.quantity,
    seller: req.body.seller,
    price: req.body.price,
    mega_category: req.body.mega_category,
    subcategory: req.body.subcategory,
    category: req.body.category,
  };
  const productToAdd = new Product(productObject);
  await productToAdd.save().catch((err) => {
    return res.status(400).send({
      message: "Error at saving product to database❌",
    });
  });
  return res.status(200).send({
    message: "Product saved to databaase successfully✅",
    product_id: productToAdd._id,
  });
});

app.post("/delete_product_from_database", async (req, res) => {
  const product_id = req.product_id;
  await Product.findByIdAndDelete(product_id).catch((err) => {
    return res.status(400).send({
      message: err,
    });
  });
  res.status(200).send({
    message: "✅Product deleted from database successfuly!",
  });
});

app.post("/get_products_of_any_type_categoryID", async (req, res) => {
  const categoryType = req.body.categoryType;
  const catId = req.body.id;
  let products = [];
  switch (categoryType) {
    case 0:
      products = await Product.find({ subcategory: catId });
      break;
    case 1:
      products = await Product.find({ category: catId });
      break;
    case 2:
      products = await Product.find({ mega_category: catId });
      break;
    default:
      return res.status(400).json({
        erro:
          "INVALID CATEGORY TYPE! MUST BE 0,1 OR 2. RECIEVED : " + categoryType,
      });
  }
  res.json({ products });
});

app.post("/api/get_product_image", async (req, res) => {
  const product_id = req.body.product_id;
  let errorMSG = "INVALID PRODUCT, COULD NOT FIND PRODUCT IMAGE!";
  let foundImage = false;
  let imageTypes = ["png", "jpeg", "webp", "jpg", "avif"];
  let uri;
  for (let i = 0; i < imageTypes.length; i++) {
    let imagePath = path.join(
      product_images_folder,
      product_id + "." + imageTypes[i]
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
    return res.status(444).send({
      message: errorMSG,
    });
  return res.status(200).send({
    img: uri,
  });
});

app.post("/api/sign_up", async (req, res) => {
  let message = "Sign Up failed.";
  const newAccount = new Account({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    user_type: req.body.user_type,
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

app.get("/check_connected", async (req, res) => {
  if (req.session.userId != undefined)
    res.json({ ok: true, user_id: req.session.userId });
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

app.post("/get_products_with_name_and_categories", async (req, res) => {
  let foundObjects = [];
  if (req.body.subcategory != undefined)
    foundObjects = await Product.find({
      name: { $regex: "^" + req.body.text, $options: "i" },
      subcategory: req.body.subcategory._id,
    });
  else if (req.body.category != undefined)
    foundObjects = await Product.find({
      name: { $regex: "^" + req.body.text, $options: "i" },
      category: req.body.category._id,
    });
  else if (req.body.mega_category != undefined)
    foundObjects = await Product.find({
      name: { $regex: "^" + req.body.text, $options: "i" },
      mega_category: req.body.mega_category._id,
    });
  else
    foundObjects = await Product.find({
      name: { $regex: "^" + req.body.text, $options: "i" },
    });
  res.json(foundObjects);
});

app.post("/get_search_results", async (req, res) => {
  let foundObjects = await Product.find({
    name: { $regex: "^" + req.body.text, $options: "i" }, //optiunea i e pt case insensitive si .* inseamna 0..inf charact oricare, ^ inseamna de la inceput
  });
  let foundObjectsForDisplay = [];
  if (foundObjects.length > 5)
    foundObjectsForDisplay = [
      foundObjects[0],
      foundObjects[1],
      foundObjects[2],
      foundObjects[3],
      foundObjects[4],
    ];
  else foundObjectsForDisplay = foundObjects;
  let foundCategories = new Map();
  for (let obj of foundObjects) {
    if (foundCategories.has(String(obj.mega_category)) == false) {
      foundCategories.set(String(obj.mega_category), 1);
    } else
      foundCategories.set(
        String(obj.mega_category),
        foundCategories.get(String(obj.mega_category)) + 1
      );
    if (foundCategories.has(String(obj.category)) == false)
      foundCategories.set(String(obj.category), 1);
    else
      foundCategories.set(
        String(obj.category),
        foundCategories.get(String(obj.category)) + 1
      );
    if (foundCategories.has(String(obj.subcategory)) == false)
      foundCategories.set(String(obj.subcategory), 1);
    else
      foundCategories.set(
        String(obj.subcategory),
        foundCategories.get(String(obj.subcategory)) + 1
      );
  }

  const maxHeap = new Heap((a, b) => b[1] - a[1]);
  for (let [key, freq] of foundCategories) {
    if (key != "undefined") maxHeap.push([key, freq]);
  }
  let categoriesIDs = [];
  while (categoriesIDs.length < 3 && maxHeap.size() !== 0)
    categoriesIDs.push(maxHeap.pop()[0]);
  let categoriesToDisplay = [];
  for (let i = 0; i < categoriesIDs.length; i++) {
    let found = await MegaCategory.findById(categoriesIDs[i]);
    if (found == null) found = await Category.findById(categoriesIDs[i]);
    if (found == null) found = await Subcategory.findById(categoriesIDs[i]);
    // console.log(
    //   "TYPE : " +
    //     typeof found +
    //     " VALUE : " +
    //     found +
    //     " ID : " +
    //     categoriesIDs[i]
    // );
    categoriesToDisplay.push(found);
  }
  let result = [...foundObjectsForDisplay, ...categoriesToDisplay];
  return res.json({ results: result });
});

app.post("/get_mega_categories", async (req, res) => {
  let mega_categories = await MegaCategory.find().exec();
  res.json({ megaCategories: mega_categories });
});

app.post("/get_categories", async (req, res) => {
  let mega_category = req.body.mega_category;
  let categories = [];
  for (let i = 0; i < mega_category.categories.length; i++)
    categories.push(await Category.findById(mega_category.categories[i]));
  res.json({ categories });
});

app.post("/get_subcategories", async (req, res) => {
  let category = req.body.category;
  // console.log(category.name);
  let subcategories = [];
  for (let i = 0; i < category.subcategories.length; i++)
    subcategories.push(await Subcategory.findById(category.subcategories[i]));
  res.json({ subcategories });
});

app.post("/get_category_of_any_type_by_id", async (req, res) => {
  let type = req.body.categoryType;
  switch (type) {
    case 0:
      return res.json({ result: await Subcategory.findById(req.body.id) });
    case 1:
      return res.json({ result: await Category.findById(req.body.id) });
    case 2:
      return res.json({ result: await MegaCategory.findById(req.body.id) });
    default:
      return res
        .status(400)
        .json({ error: "TYPE OF THE CATEGORY IS INVALID! MUST BE 0,1, OR 2" });
  }
});

app.get("/get_search_data", (req, res) => {
  return res.json({ search_data: req.session.search_data });
});

app.post("/set_search_data", async (req, res) => {
  let search_data = req.body.search_data;
  if (search_data.category_of_unknown_type != undefined) {
    let res = await MegaCategory.findById(
      search_data.category_of_unknown_type._id
    );
    if (res != null) {
      search_data.mega_category = search_data.category_of_unknown_type;
    } else {
      res = await Category.findById(search_data.category_of_unknown_type._id);
      if (res != null)
        search_data.category = search_data.category_of_unknown_type;
      else search_data.subcategory = search_data.category_of_unknown_type;
    }
    search_data.category_of_unknown_type = undefined;
  }
  req.session.search_data = req.body.search_data;
  res.json(search_data);
});

app.post("/set_product_page_product_id", (req, res) => {
  req.session.product_page_product_id = req.body.id;
  res.json({ ok: true });
});

app.get("/get_product_page_product_id", (req, res) => {
  res.json(req.session.product_page_product_id);
});

app.post("/get_product_with_id", async (req, res) => {
  let prod = await Product.findById(req.body.id);
  res.json(prod);
});

app.post("/fetch_user_by_id", async (req, res) => {
  let account = await Account.findById(req.body.id);
  if (account == null)
    return res
      .status(444)
      .send({ message: "FETCH USER BY ID ERROR : ACCOUNT DOES NOT EXIST!" });
  res.status(200).send(account);
});

app.get("/get_user_type", async (req, res) => {
  let account = await Account.findById(req.session.userId);
  res.status(200).send(account.user_type.toString());
});

app.post("/get_most_sold_products_from_category", async (req, res) => {
  let type_of_cat = undefined;
  let cat_id = req.body.cat_id;
  let num_products =
    req.body.num_products === undefined ? 3 : req.body.num_products;
  let found = await MegaCategory.findById(cat_id);
  type_of_cat = 0;
  if (found === null) {
    found = await Category.findById(cat_id);
    type_of_cat = 1;
  }
  if (found === null) {
    found = await Subcategory.findById(cat_id);
    type_of_cat = 2;
  }
  if (found === null)
    return res.status(444).send({
      message:
        "Error at get_most_sold_products_from_category: Category id is invalid!",
    });
  let products = [];
  switch (type_of_cat) {
    case 0:
      products = (await Product.find({ subcategory: cat_id })).filter(
        (prod, index) => index < num_products
      );
      break;
    case 1:
      products = (await Product.find({ category: cat_id })).filter(
        (prod, index) => index < num_products
      );
      break;
    case 2:
      products = (await Product.find({ mega_category: cat_id })).filter(
        (prod, index) => index < num_products
      );
      break;
  }
  return res.status(200).send(products);
});

app.post("/get_image", async (req, res) => {
  const img_name = req.body.img_name;
  const image_path = path.join("./public", img_name);
  if (!fs.existsSync(image_path))
    return res.status(444).send({ message: "Image does not exist" });
  try {
    let image_type = img_name.split(".")[1];
    let data = fs.readFileSync(image_path);
    let mime = "image/" + image_type;
    let encoding = "base64";
    uri = "data:" + mime + ";" + encoding + "," + data.toString(encoding);
  } catch (error) {
    errorMSG =
      "EROARE LA DESCHIDERE IMAGINE PRODUS(IMAGINEA EXISTA) : " + error;
  }
  return res.status(200).send({
    img: uri,
  });
});
