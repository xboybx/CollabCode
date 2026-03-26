import express, { urlencoded } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db/dbconfig";
import { initializeSocket } from "./socket";
import http from "http"

const PORT = process.env.PORT || 5000;

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(urlencoded({ extended: true }));
/* 
Wrapping the express app or server in the standard HTTP server
Even though we dont do it ,express does it automatically-
but to have socket and express on same port we do this like 
Controllin the server gate.
Imagine like the sever is the http door wich welcomes http methods , and behind it
is the express wich process the http requests and give response and the socket io as the watchman like at the door
who only responds for special requests and handles them individually and not givivng these req to the express
The server is the DOOR
app is the worker behind the door
socket is the watchman before the door 
*/
const server = http.createServer(app)//The main Door

// Initialize Socket.io wich has the whole express sever with it like a waiter before it
initializeSocket(server)

connectDB();
console.log("Log after the Db is connected")

app.get("/", (req, res) => {
    res.send("Hello World!")
})


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});
