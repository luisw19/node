var mongoose    =   require("mongoose");
//first_db is the mongo db previously created in earlier steps
mongoose.connect('mongodb://localhost:27017/orders_db');
// create instance of Schema
var schema =   mongoose.Schema;

// create schema: more info on http://mongoosejs.com/docs/schematypes.html

//Address object
var addressVar = {
  //before used the "type" instead of "name" but mongo didn't like it as its a reserved name
  name: String,
  city: String,
  county: String,
  postcode: String,
  country: String
};
//Order lines object
var linesVar = {
  line_id: String,
  product_id: String,
  product_name: String,
  quantity: Number,
  price: Number,
  currency: String,
  grams: Number,
  sku: String
};
//Customer object
var customerVar = {
  customer_id: String,
  first_name: String,
  last_name: String,
  phone: String,
  email: String
};
//Order schema
var orderVar  = new schema({
  order: {
     order_id: String,
     status: { type: String, default: 'CREATED' },
     created_at: { type: Date, default: Date.now },
     updated_at: { type: Date, default: Date.now },
     total_price: Number,
     currency: { type: String, default: 'EUR' },
     customer: customerVar,
     address: [addressVar],
     line_items: [linesVar]
  }
});

// create model if not exists
module.exports = mongoose.model('Order',orderVar);
