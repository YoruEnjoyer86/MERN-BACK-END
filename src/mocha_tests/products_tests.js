const assert = require("assert");
const Product = require("../models/productModel");

describe("saving products", function () {
  it("saves product", function (done) {
    // pasam ca parametru functia mocha.done care spune ca testul curent e gata

    let produsNou = new Product({
      name: "Slap",
      description: "Imbracaminte",
      quantity: 15,
      seller: "Gucci",
    });

    produsNou.save().then(() => {
      assert(produsNou.isNew === false);
      Product.findByIdAndDelete(produsNou._id).then(() => {
        done();
      }); // .isNew e true daca e creat local si nu e salvat in baza de date
    });
  });

  it("finds product by name", function (done) {
    let produsNou = new Product({
      name: "Apa",
      description: "Bautura",
      quantity: 3,
      seller: "Lipova",
    });

    produsNou.save().then(function () {
      Product.findOne({
        name: "Apa",
      }).then(function (result) {
        assert(result, produsNou);
        Product.findByIdAndDelete(produsNou._id).then(() => {
          done();
        });
      });
    });
  });

  it("finds product by id", function (done) {
    let produsNou = new Product({
      name: "Apa",
      description: "Bautura",
      quantity: 3,
      seller: "Lipova",
    });

    produsNou.save().then(function () {
      Product.findById(produsNou.id).then(function (result) {
        assert(result.id === produsNou.id);
        Product.findByIdAndDelete(produsNou._id).then(() => {
          done();
        });
      });
    });
  });

  it("deletes record", function (done) {
    let produsNou = new Product({
      name: "Apa",
      description: "Bautura",
      quantity: 3,
      seller: "Lipova",
    });

    produsNou.save().then(function () {
      Product.findByIdAndDelete(produsNou._id).then(() => {
        Product.findById(produsNou.id).then((result) => {
          //findOne returneaza null daca nu gaseste nimic, find returneaza un Cursor daca nu gaseste nimic
          assert(result === null);
          done();
        });
      });
    });
  });

  it("updates product seller", function (done) {
    let produsNou = new Product({
      name: "Apa",
      description: "Bautura",
      quantity: 3,
      seller: "Lipova",
    });

    produsNou.save().then(function () {
      Product.findByIdAndUpdate(produsNou.id, { seller: "Borsec" }).then(() => {
        Product.findById(produsNou.id).then((result) => {
          assert(result.seller === "Borsec");
          Product.findByIdAndDelete(produsNou._id).then(() => {
            done();
          });
        });
      });
    });
  });

  it("increments product quantity", function (done) {
    let produsNou = new Product({
      name: "Apa",
      description: "Bautura",
      quantity: 3,
      seller: "Lipova",
    });

    produsNou.save().then(() => {
      Product.updateMany({}, { $inc: { quantity: 2 } }).then(() => {
        Product.findById(produsNou.id).then((result) => {
          assert(result.quantity === 5);
          Product.findByIdAndDelete(produsNou._id).then(() => {
            done();
          });
        });
      });
    });
  });
});
