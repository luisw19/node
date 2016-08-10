
var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var mongoOp     =   require("./model/mongo");
var router      =   express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

router.get("/",function(req,res){
    res.json({"error" : false,"message" : "Hello World"});
});

////////////////////////////////
//route() will allow you to use same path for different HTTP operation.
//So if you have same URL but with different HTTP OP such as POST,GET etc
//Then use route() to remove redundant code./
router.route("/orders")
    // GET method
    .get(function(req,res){
        var response = {};
        var query = {};
        //construct dynamic query
        //search by customer id
        if(req.query.customer !== undefined){
          query['order.customer.customer_id'] = req.query.customer;
        }
        //from
        if(req.query.date_from !== undefined){
          query['order.created_at'] =  {'$gte': new Date(req.query.date_from)};
        }
        //from and to
        if(req.query.date_from !== undefined  && req.query.date_to!==undefined){
          query['order.created_at'] =  {'$gte': new Date(req.query.date_from), '$lte': new Date(req.query.date_to)};
        }
        //console.log(query);
        //process.exit();
        mongoOp.find(query,function(err,data){
        // Mongo command to fetch all data from collection.
            if(err) {
                response = {"error" : true,"message" : "Error fetching data"};
            } else {
                response = {"error" : false,"message" : data};
            }
            res.json(response);
        });



    })
    // POST method
    .post(function(req,res){
        var db = new mongoOp();
        var response = {};
        // fetch order from REST request.
        // Ideally we should add validation here but this is a dummy API so not needed
        db.order = req.body.order;
        //create random order id
        var order_id = Math.random().toString(36).substr(2, 9);
        //echo id created
        //console.log("Created order id: " + order_id);
        //set the id
        db.order.order_id = order_id;
        //set dates (for some reasons if left to default it won't query properly)
        var now = new Date();
        db.order.created_at = now.toJSON();
        db.order.updated_at = now.toJSON();
        //save the data
        db.save(function(err){
        // save() will run insert() command of MongoDB.
        // it will add new data in collection.
            if(err) {
                console.log(err);
                response = {"error" : true,"message" : "Error adding data"};
            } else {
                response = {"error" : false,"message" : "Created order: " + order_id};
            }
            res.json(response);
        });
});

////////////////////////////////
//methods for a specific order ID
router.route("/orders/:id")
    // get a order that matches the ID in the GET URL
    .get(function(req,res){
       //response variable
       var response = {};
       //create query for later execution
       var query = mongoOp.findOne({ 'order.order_id': req.params.id });

       // execute the query
       query.exec(function (err, data) {
         // This will run Mongo Query to fetch data based on ID.
         if(err) {
           response = {"error" : true,"message" : "Error fetching data"};
         } else {
           response = {"error" : false,"message" : data};
         }
         res.json(response);
       });

      //This would find based on mongo Id
      /*mongoOp.findById(req.params.id,function(err,data){
        // This will run Mongo Query to fetch data based on ID.
        if(err) {
          response = {"error" : true,"message" : "Error fetching data"};
        } else {
          response = {"error" : false,"message" : data};
        }
        res.json(response);
      })*/
    })

    // update the order that matches the ID in the GET url
    .put(function(req,res){
      var response = {};

      //create query to check if order exists
      var query = mongoOp.findOne({ 'order.order_id': req.params.id });

      //execute the query to check that order exists before deleting
      query.exec(function (err, data) {
        if(err) {
          //error fetching data
          response = {"error" : true,"message" : "Error fetching data"};
        } else {
          if(data){
            // ensure that json paylaod is not empty
            if(req.body.order !== undefined) {
              //get the order id and creation date to the previous one
              var order_id = data.order.order_id;
              var created_at = data.order.created_at;
              //get the entire paylaod
              data.order = req.body.order;
              //update order id (in case not in payload) and creation time as it should not change. Update time should be system created
              data.order.order_id = order_id;
              data.order.created_at = created_at;
              //change status to updated
              data.order.status = "UPDATED";
              var now = new Date();
              data.order.updated_at = now.toJSON();
              //save the data
              data.save(function(err){
                if(err) {
                  response = {"error" : true,"message" : "Error updating order"};
                } else {
                  response = {"error" : false,"message" : "Order " + req.params.id + " has been updated"};
                }
                res.json(response);
              })
            }else{
              response = {"error" : false,"message" : "No payload"};;
            }
          }else{
            //order doesn't exist
            response = {"error" : true,"message" : "Order " + req.params.id + " does not exists"};
            res.json(response);
          }
        }
      });

      // This would update based on mongo ID
      /*mongoOp.findById(req.params.id,function(err,data){
        if(err) {
          response = {"error" : true,"message" : "Error fetching data"};
        } else {
          // we got data from Mongo.
          // change it accordingly.
          if(req.body.order !== undefined) {
            // update the entire payload
            data.order = req.body.order;
          }
          // save the data
          data.save(function(err){
            if(err) {
              response = {"error" : true,"message" : "Error updating data"};
            } else {
              response = {"error" : false,"message" : "Data is updated for " + req.params.id};
            }
            res.json(response);
          })
        }
      });*/
  })

  //Delete the order that matches the ID
  .delete(function(req,res){
    var response = {};

    //create query to check if order exists
    var query = mongoOp.findOne({ 'order.order_id': req.params.id });

    //execute the query to check that order exists before deleting
    query.exec(function (err, data) {
      if(err) {
        //error fetching data
        response = {"error" : true,"message" : "Error fetching data"};
      } else {
        if(data){
          //order exists, remove it
          mongoOp.remove({'order.order_id' : req.params.id},function(err){
            if(err) {
              response = {"error" : true,"message" : "Error deleting data"};
            } else {
              response = {"error" : true,"message" : "Order " + req.params.id + " deleted"};
            }
            res.json(response);
          });
        }else{
          //order doesn't exist
          response = {"error" : true,"message" : "Order " + req.params.id + " does not exists"};
          res.json(response);
        }
      }

    });

    // deletes by system id
    /*mongoOp.findById(req.params.id,function(err,data){
        if(err) {
            response = {"error" : true,"message" : "Error fetching data"};
        } else {
            // data exists, remove it.
            mongoOp.remove({_id : req.params.id},function(err){
                if(err) {
                    response = {"error" : true,"message" : "Error deleting data"};
                } else {
                    response = {"error" : true,"message" : "Data associated with "+req.params.id+"is deleted"};
                }
                res.json(response);
            });
        }
    });*/

  })
////////////////////////////////

////////////////////////////////
//methods to delete by system id
router.route("/orders/systemid/:id")

//Delete the order that matches the system ID
.delete(function(req,res){
    var response = {};

    // deletes by system id
    mongoOp.findById(req.params.id,function(err,data){
        if(err) {
            response = {"error" : true,"message" : "Error fetching data"};
        } else {
            // data exists, remove it.
            mongoOp.remove({_id : req.params.id},function(err){
                if(err) {
                    response = {"error" : true,"message" : "Error deleting data"};
                } else {
                    response = {"error" : true,"message" : "Data associated with "+req.params.id+"is deleted"};
                }
                res.json(response);
            });
        }
    });
  });
////////////////////////////////

app.use('/',router);

app.listen(3000);
console.log("Listening to PORT 3000");
