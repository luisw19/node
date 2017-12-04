var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

//Root resource with hello world
router.get("/",function(req,res){
    res.json({"response" : "Hello Birmingham UKOUG"});
});

//orders resource
router.get("/orders",function(req,res){
    res.json(
        [{
          "orderId": "order 1",
          "total_price": 50,
          "line_items": [{
            "lineItem": 1,
            "productName": "Billy Bookshelf",
            "quantity": 1,
            "price": 50,
            "currency": "EUR"
          }]
        }]
      );
});

//use router
app.use('/',router);

app.listen(3000);
console.log("Listening to PORT 3000");
