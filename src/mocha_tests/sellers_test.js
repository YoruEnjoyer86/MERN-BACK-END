const assert = require("assert");
const mongoose = require("mongoose");
const Seller = require("../models/sellerModel");

describe("Tests for seller model", () => {
  it("create seller", (done) => {
    let newSeller = new Seller({
      name: "Razvan",
      city: "Cluj",
      products: [
        {
          name: "Cutit",
          description: "Arma alba",
          quantity: 99,
        },
      ],
    });
    newSeller.save().then(function () {
      assert(newSeller.isNew === false);
      Seller.findById(newSeller._id, function (error, result) {
        assert(error === null);
        assert(result.products.length === 1);
        Seller.findByIdAndDelete(newSeller._id).then(() => {
          done();
        });
      });
    });
  });

  it("add product to seller", function (done) {
    let newSeller = new Seller({
      name: "Razvan",
      city: "Craiova",
      products: [
        {
          name: "Cutit",
          description: "Arma alba",
          quantity: 99,
        },
      ],
    });

    newSeller.save().then(function () {
      Seller.findById(newSeller._id, function (error, result) {
        result.products.push({
          name: "Sabie",
          description: "Unealta ortodontala",
          quantity: 50,
        });
        result.save().then(function () {
          Seller.findById(newSeller._id).then(function (result) {
            assert(result.products.length === 2);
            assert(result.products[1].name === "Sabie");
            Seller.findByIdAndRemove(newSeller._id).then(() => {
              done();
            });
          });
        });
      });
    });
  });
});
