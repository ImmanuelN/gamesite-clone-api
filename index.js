var Express = require("express");
var MongoClient = require("mongodb").MongoClient;
var cors = require("cors");
const multer = require("multer");

var app = Express();
app.use(cors());
app.use(Express.json()); // Add this to handle JSON requests

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

// Handle adding a new game
app.post('/api/gamehub/addGame', async (request, response) => {
    console.log('Uploading Game');

    try {
        const { gameName, gameDescription, selectedCategory, thumbnailUrl, gameFileUrl } = request.body;

        const newGame = {
            name: gameName,
            description: gameDescription,
            category: selectedCategory,
            gamePic: thumbnailUrl,
            gameFile: gameFileUrl,
        };

        // Insert the new game into the database
        await database.collection("Games").insertOne(newGame);
        response.json("Added Successfully");
    } catch (error) {
        console.error("Error adding game:", error);
        response.status(500).json("An error occurred while adding the game");
    }
});