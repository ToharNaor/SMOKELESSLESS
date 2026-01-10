# Pong Logic Documentation 🏓

## Overview

The `pong.js` module handles the server-side game mechanics for the multiplayer Pong game. It ensures that physics and state are authoritative on the server, preventing cheating and ensuring state synchronization between clients.

## Key Components

### 1. Game State Object

The `gameState` object allows the server to track every aspect of the game.

- **Players**: Tracks socket IDs for `player1` and `player2`.
- **Paddles**: Stores the Y-coordinate for each player's paddle.
- **Ball**: Tracks `x`, `y`, `dx` (X velocity), and `dy` (Y velocity).
- **Score**: Keeps count of goals for each player.

### 2. Physics Engine (`gameLoop`)

The server runs a loop at ~60 FPS (using `setInterval`) to calculate physics.
**Performance Note**: The loop is **Dynamic**. It only runs when two players are connected. If a player disconnects, the loop pauses immediately to save server resources (`clearInterval`).

- **Movement**: Updates ball position based on velocity.
- **Wall Collision**: Reverses Y velocity when hitting top/bottom boundaries.
- **Paddle Collision**:
  - Checks collision with left/right paddles.
  - Reverses X velocity.
  - Adds "spin" (adjusts Y velocity) based on where the ball hits the paddle relative to its center.
  - Increases speed slightly on every hit for gameplay intensity.
- **Scoring**: Detection when the ball passes left or right bounds, updating score and resetting the ball.

### 3. Socket.io Integration

The logic is isolated in the `/pong` namespace.

- **Connection**: Assigns roles (`player1`, `player2`, or `spectator`) based on join order.
- **`paddleMove` Event**: Receives paddle position (normalized 0-1 ratio) from clients and updates the server state.
- **State Emisson**: Broadcasts the full `gameState` to all clients every tick.

## How to Scale

In the future, we can add "Rooms" support to allow multiple concurrent matches on the same server instance. Currently, it supports one global match.
