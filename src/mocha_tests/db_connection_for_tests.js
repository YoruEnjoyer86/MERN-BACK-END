require('dotenv').config();
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

//ca sa ruleze scriptu asta inainte de celelalte teste
before(function(done){
    mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const database = mongoose.connection;
    
    database.on('error', (error) => {
      console.error('Connection error:', error);
      process.exit(1);
    });
    database.once('open', function () {
      console.log('Connected to MongoDB');
      done() ;
    });
}) ;

beforeEach(function(done){ //inainte de fiecare test
  mongoose.connection.collections.products.drop(function(){
    done() ;
  }) ;
}) ;
