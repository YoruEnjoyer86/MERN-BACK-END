const assert = require('assert') ;
const Product = require('../models/productModel') ;

describe('saving products', function(){
    it('saves product to database', function(done){ // pasam ca parametru functia mocha.done care spune ca testul curent e gata

        let produsNou = new Product({
            name:'Slap',
            description:'Imbracaminte',
            quantity:15,
            seller:'Gucci'
        })
        
        produsNou.save().then(function(){
            assert(produsNou.isNew === false); // .isNew e true daca e creat local si nu e salvat in baza de date
            done();
        }) ;

    });
})