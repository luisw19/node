# Order API

Node/Mongo API in a Container, based on:

* [Creating RESTful APIs with NodeJS and MongoDB Tutorial ](http://adrianmejia.com/blog/2014/10/01/creating-a-restful-api-tutorial-with-nodejs-and-mongodb/)
* [Build a RESTful API using Node and MongoDB](https://codeforgeek.com/2015/08/restful-api-node-mongodb/)

## Install  Node with Brew:

1.  If node is already installed manually (not using brew) uninstall as per https://gist.github.com/TonyMtz/d75101d9bdf764c890ef

	After uninstalling and reinstalling node i had issues with npm which I [fixed by cleaning everything up](http://stackoverflow.com/questions/11177954/how-do-i-completely-uninstall-node-js-and-reinstall-from-beginning-mac-os-x).

2.  Install with brew (if not already) by running

        brew install node

	I ran into some issues, resolved with help from [Stackoverflow](http://stackoverflow.com/questions/31374143/trouble-install-node-js-with-homebrew).

## [Install MongoDB](https://docs.mongodb.com/v3.0/tutorial/install-mongodb-on-os-x/)

1.  Install mongodb with brew

        brew install mongodb

2.  Create directory needed by mongo process (mongod) to write data

        mkdir -p /data/db

3.  Change ownership so mongod can write to it

        sudo chown -R luisweir:staff /data

4.  Run mongo

        mongod

## Create MongoDB

1.  Start mongo DB

        mongod

2.  Open a new terminal and run command to open mongo CLI

        mongo

3.  To create a new DB run

        > use orders_db
        > show dbs
        > a = { "order" : { "order_id" : "1073459962", "status" : "created", "created_at" : "2016-04-01T12:00:10-02:00", "updated_at" : "2016-06-06T15:48:20-04:00", "total_price" : 50, "currency" : "EUR", "customer" : { "customer_id" : "76422323213", "first_name" : "Paul", "last_name" : "Norman", "phone" : "+44 (0) 5555-555-555", "email" : "paul.norman@example.com" }, "address" : [ { "type" : "billing, shipping", "city" : "Cambridge", "county" : "Cambridgeshire", "postcode" : "CB4 4SS", "country" : "Great Britain" } ], "line_items" : [ { "line_id" : "1245555432", "product_id" : "1071823172", "product_name" : "Billy Table White", "quantity" : 1, "price" : 50, "currency" : "EUR", "grams" : 8000, "sku" : "BILLY2009WHITE" } ] } }
        > db.orders.insert()
        > show dbs
        > db.orders.find()
        > db.orders.find({ "_id" : ObjectId("578639323179eba600803d19") })

    Note: `.save()` can also be used which is basically an upsert.

    Note: insert a record otherwise db won’t [show](http://www.tutorialspoint.com/mongodb/mongodb_create_database.htm) [info](http://www.tutorialspoint.com/mongodb/mongodb_drop_database.htm).

## Create project package and set up server

1.  Create project folder

        mkdir <path>/<project> ie. mkdir -p $HOME/node/orders_api

2.  Cd into project folder (ie. `$HOME/node/first_api`) and create Node project by running:

        npm init

    This will create a `package.json`, in my example like this:
    
        {
          "name": “oders_system_api”,
          "version": "1.0.0",
          "description": “IKEA orders system API“,
          "main": "server.js",
          "scripts": {
            "test": "test"
          },
          "repository": {
            "type": "git",
            "url": "git+https://github.com/luisw19/node.git"
          },
          "keywords": [
            "Node.js",
            "git"
          ],
          "author": "Luis Weir",
          "license": "ISC",
          "bugs": {
            "url": "https://github.com/luisw19/node/issues"
          },
          "homepage": "https://github.com/luisw19/node#readme"
        }

## Install required modules in project - not globally (express, mongoose, body-parser)

1.  Install express locally on project ([more info](https://codeforgeek.com/2014/10/express-complete-tutorial-part-1/))

        npm install --save express

2.  Install mongoose in project ([more info](http://mongoosejs.com/))

        npm install --save mongoose

    (the `--save` is so mongoose is added to the dependencies in the `package.json` - otherwise is just temporarily added)

3.  Install body-parser

        npm install --save body-parser

4.  Install modules by running (note sure why is this required??)

        npm install

## Test server

1.  Create `server.js` and add basic code

        var express     =   require("express");
        var app         =   express();
        var bodyParser  =   require("body-parser");
        var router      =   express.Router();
        
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({"extended" : false}));
        
        router.get("/",function(req,res){
            res.json({"error" : false,"message" : "Hello World"});
        });
        
        app.use('/',router);
        
        app.listen(3000);
        console.log("Listening to PORT 3000");

2.  Run to test node app

        npm start

    Open a new terminal and test URL with curl (or use postman or simply use the browser)

        curl http://localhost:3000


## Create API model including DB schema and connection

1.  In project folder create a new folder called `model`

        mkdir model

2.  Inside the model folder create `mongo.js`

        touch mongo.js

3.  Add code accordingly. Of most important is that the mongoose schema is done properly… (see file in project)

4.  Back in root project folder add the API code to `server.js`

## Create docker container for API (based on https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

1.  Install docker. On a Mac use `brew cask`:

        brew cask install docker

    Alternatively, docker can be [downloaded from the official website](https://docs.docker.com/engine/installation/).

2.  Create a docker file inside the node application directory

        touch Dockerfile

3.  Edit the file as following:

        FROM node:argon
        
        # Create app directory
        RUN mkdir -p /usr/src/app
        WORKDIR /usr/src/app
        
        # Install app dependencies
        COPY package.json /usr/src/app/
        RUN npm install
        
        # Bundle app source
        COPY . /usr/src/app
        
        EXPOSE 8080
        CMD [ "npm", "start" ]

4.  Build the container

        docker build -t luisw19/orders_api

5.  Push the docker image to docker hub

        docker login --username=<username>
        docker push <image name>

## Install docker compose and create compose file

1.  Install docker compose (or downloaded from the [official page](https://docs.docker.com/compose/))

        brew install docker-compose

2.  Create docker compose file in the parent directory

        touch docker_compose.yml

3.  Add content as following:

        version: '2'
        services:
          order_api:
                    #Uncomment next line if you wish to build from docker-compose
                    #build: ./orders_api
                    image: luisw19/orders_api
              depends_on:
                - mongo_db
              ports:
                - "3000:3000"
              command: npm start
              links:
                - mongo_db
        
          mongo_db:
              image: mongo:3.0.2

4.  Build the container (only if building from source code - otherwise the next step is all needed to run)

        docker-compose build

5.  Create and start the containers

        docker-compose up

    After the initial create, `docker-compose start / stop` can be used instead.

6.  Test the API using the postman collection: `orders_api/ordersSystemAPI.postman_collection`