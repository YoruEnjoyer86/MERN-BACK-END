const assert = require('assert') ;
const mongoose = require('mongoose') ;
const Seller = require('../models/sellerModel') ;

describe('Tests for seller model',() => {

    beforeEach(function(done){
        mongoose.connection.collections.sellers.drop().then(function(){
            done() ;
        })
    })

    it('create seller',(done) => {
        let newSeller = new Seller({
            name: 'Razvan',
            city: 'Craiova',
            products: [{
                name: 'Cutit',
                description: 'Arma alba',
                quantity: 99
            }]
        }) ;
        newSeller.save().then(function(){
            assert(newSeller.isNew === false)
            Seller.findById(newSeller._id, function(error,result){
                assert(error === null) ;
                assert(result.products.length === 1) ;
                done() ;
            });
        }) ;
    }) ;

    it('add product to seller', function(){
        let newSeller = new Seller({
            name: 'Razvan',
            city: 'Craiova',
            products: [{
                name: 'Cutit',
                description: 'Arma alba',
                quantity: 99
            }]
        }) ;

        newSeller.save().then(function(){
            Seller.findById(newSeller._id, function(error,result){
                result.products.push({
                    name: 'Sabie',
                    description: 'Unealta ortodontala',
                    quantity: 50
                }) ;
                result.save().then(function(){
                    Seller.findOne({name:'Razvan'}).then(function(result){
                        assert(result.products.length === 2) ;
                        assert(result.products[1].name === 'Sabie') ;
                        done() ;
                    }) ;
                }) ;
            });
        }) ;
    }) ;
}) ;