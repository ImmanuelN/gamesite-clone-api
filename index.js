var Express = require("express");
var MongoClient = require("mongodb").MongoClient;
var cors = require("cors");
const multer = require("multer");

var app = Express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for file uploads

var CONNECTION_STRING = "mongodb+srv://Imms:imms@cluster0.2ccip.mongodb.net/?retryWrites=true&w=majority&appName=Cluster";
var DATABASENAME = "GameHub_Database";
var database;

// Establish MongoDB connection and start the server
MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
    if (error) {
        console.error("MongoDB Connection Failed:", error);
        return;
    }
    database = client.db(DATABASENAME);
    console.log("MongoDB Connection Successful");
    app.listen(5038, () => {
        console.log("Server is running on port 5038");
    });
});

// Fetch all games
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

// Add a new game
app.post('/api/gamehub/addGame', upload.fields([{ name: 'thumbnail' }, { name: 'gameFile' }]), async (request, response) => {
    console.log('API called'); // Log when the API is called

    try {
      console.log('Uploaded files:', request.files);
        // Create a new game object
        const newGame = {
            name: request.body.newGame,
            description: request.body.description,
            //gamePic: request.files['thumbnail'] ? request.files['thumbnail'][0].buffer : null, // Store file buffer for thumbnail
            //gameFile: request.files['gameFile'] ? request.files['gameFile'][0].buffer : null, // Store file buffer for game file
            
        };

        // Insert the new game into the database
        await database.collection("Games").insertOne(newGame);
        response.json("Added Successfully");
    } catch (error) {
        console.error("Error adding game:", error.message); // Log error message for debugging
        response.status(500).json("An error occurred while adding the game");
    }
});