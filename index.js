var Express = require("express");
var Mongoclient=require("mongodb").MongoClient;
var cors=require("cors");
const multer=require("multer");

var app=Express();
app.use(cors());

var CONNECTION_STRING="mongodb+srv://Imms:imms@cluster0.2ccip.mongodb.net/?retryWrites=true&w=majority&appName=Cluster";
var DATABASENAME ="GameHub_Database";
var database;

app.listen(5038,()=>{
    Mongoclient.connect(CONNECTION_STRING,(error,client)=>{
        database=client.db(DATABASENAME);
        console.log("Mongo DB Connection Successful on port 5038");
    })
})

app.get('/api/gamehub/getGames', (request, response) => {
    console.log('API called'); // Log when the API is called
    database.collection("Games").find({}).toArray((error, result) => {
      if (error) {
        console.error('Error fetching games:', error);
        response.status(500).send("Error fetching games");
      } else {
        console.log(result);
        response.send(result);
      }
    });
  });