require('dotenv').config();
var Express = require("express");
var MongoClient = require("mongodb").MongoClient;
var cors = require("cors");
const multer = require("multer");
const bycript = require("bcryptjs");
const jwt = require('jsonwebtoken')

var app = Express();
app.use(cors());
app.use(Express.json()); // Add this to handle JSON requests

var CONNECTION_STRING = process.env.DB_CONNECTION_STRING; // Get from .env file
var DATABASENAME = process.env.DB_NAME;
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

app.post("/api/gamehub/sign-up", async (request, response) => {
    try {
        const { username, email, password } = request.body;
        const existingUser = await database.collection("Authentications").findOne({ email: email });

        if (existingUser) {
            return response.status(400).json("Email already exists. Please use a different email.");
        }

        // Hash the password using bcryptjs
        const salt = await bycript.genSalt(10);
        const hashedPassword = await bycript.hash(password, salt);

        const data = {
            username: username,
            email: email,
            password: hashedPassword,
        };
        
        // Insert user data into the Authentications collection
        const userData = await database.collection("Authentications").insertOne(data);
        if (userData) {
            console.log("auth data saved:", userData);
            const user = {
                authId: userData.insertedId,
                username: username,
                email: email,
            }

            // Insert user data into the Users collection
            const userResponse = await database.collection("Users").insertOne(user);
            console.log("user data saved:", userResponse);
        }

        // Return success response
        response.json("Successfully Registered");

    } catch (error) {
        console.error("Error adding user:", error);
        response.status(500).json("An error occurred while registering");
    }
});


// Handle Logins
app.post("/api/gamehub/login", async (request, response) => {
    try {
        const { email, password } = request.body;

        // Check if the user exists in the database
        const existingUser = await database.collection("Authentications").findOne({ email: email });
        
        if (existingUser) {
            // Check if the password is correct
            const isPasswordMatch = await bycript.compare(password, existingUser.password);
            
            if (isPasswordMatch) {
                // Check if JWT_SECRET is defined
                if (!process.env.JWT_SECRET) {
                    console.error('JWT_SECRET is not defined');
                    return response.status(500).json({ message: 'Server configuration error' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { id: existingUser._id}, // Use existingUser to get id and email
                    process.env.JWT_SECRET, // JWT_SECRET loaded from .env
                    { expiresIn: '720h' } // Token validity duration
                );
                
                // Send response with token
                return response.status(200).json({
                    message: "Successfully Logged In",
                    token: token
                });
            } else {
                return response.status(401).json({ message: "Password is incorrect, Try Again" });
            }
        } else {
            return response.status(404).json({ message: "Email does not exist" });
        }
    } catch (error) {
        // Return error response for any internal server errors
        console.error(error);  // Optional: log the error for debugging purposes
        return response.status(500).json({ message: "Error Logging In" });
    }
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