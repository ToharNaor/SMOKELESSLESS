# Routing & Architecture Documentation 🌐

## Overview

The Smokelessless backend (`server.js`) acts as both an **API Server** (for Socket.io game logic) and a **Web Server** (serving html/css/js files). This unified approach keeps the deployment simple for our Oracle Cloud Free Tier goals.

## How It Works

### 1. Static File Serving

We use `express.static` to serve the `FrontEnd/` directory.

```javascript
app.use(express.static(path.join(__dirname, "../FrontEnd")));
```

This means any file in `FrontEnd` is accessible. For example:

- `FrontEnd/styles.css` is available at `http://localhost:3001/styles.css`
- `FrontEnd/games/snake-online/game.js` is available at `http://localhost:3001/games/snake-online/game.js`

### 2. Custom Routes

Instead of making the user type `http://localhost:3001/games/snake-online/index.html`, we created clean URL routes:

- `GET /` -> Serves the Main Menu
- `GET /games/pong` -> Serves the Pong Game File
- `GET /games/snake` -> Serves the Snake Game File

### 3. Namespace Architecture

The **Web Sockets** (Game Logic) run on independent channels called Namespaces. This separates traffic so Snake players don't receive Pong physics updates.

- `io.of('/pong')`: Dedicated channel for Pong.
- `io.of('/snake')`: Dedicated channel for Snake.

## Helper Modules

- `game_logic/pong.js`: Contains physics and state for Pong.
- `game_logic/snake.js`: Contains grid logic and state for Snake.

This modular design prevents `server.js` from becoming a "God File" (too big, too messy).
