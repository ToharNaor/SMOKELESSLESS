/*
 * Smokelessless Backend Server 🚀
 * Main entry point for our arcade platform.
 * Setting up Express + Socket.io to serve up some W games.
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config(); // Load those secret vars 🤫

const app = express();
const server = http.createServer(app);

const path = require("path");

// Middleware Check - keeping it secure (mostly)
app.use(cors()); // Allow everyone in for now
app.use(express.json());

// --- Static Stats ---
// Serve the entire FrontEnd folder as static assets (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "../FrontEnd")));

// --- Routes ---

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../FrontEnd/index.html"));
});

// Pong
app.get("/games/pong", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../FrontEnd/games/pong-online/index.html")
  );
});

// Snake
app.get("/games/snake", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../FrontEnd/games/snake-online/index.html")
  );
});

// Flappy Bird
app.get("/games/flappy", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../FrontEnd/games/flappy-online/index.html")
  );
});

// Setup Socket.io - The real MVP here 🏆
const io = new Server(server, {
  cors: {
    origin: "*", // Dev mode: Let 'em all in!
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

/*
 * Game Namespaces 🎮
 * Isolating game logic so Pong physics don't mess with Snake.
 * We'll import the logic modules here.
 */

// PONG LOGIC 🏓
// Passing the specialized namespace to the game module
require("./game_logic/pong")(io);

// SNAKE LOGIC 🐍
require("./game_logic/snake")(io);

// FLAPPY BIRD LOGIC 🐦
require("./game_logic/flappy")(io);

// Start the server
server.listen(PORT, () => {
  console.log(`\n>>> 🚀 Server matches started on port ${PORT}`);
  console.log(`>>> 📡 Socket.io is operational. No Cap.`);
});

// Graceful Shutdown (Fixes the "Port in use" issue)
const shutdown = () => {
  console.log("\n>>> 🛑 Shutting down server...");
  server.close(() => {
    console.log(">>> 💤 Server closed. Port released.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
