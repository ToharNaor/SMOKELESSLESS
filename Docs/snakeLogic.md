# Snake Logic Documentation 🐍

## Overview

The `snake.js` module implements the classic Snake game logic on the server.
**Architecture Update**: As of the "Multi-Instance Refactor", the server no longer runs a single global game. Instead, it maintains a **Map of Sessions**, allowing every connected user to play their own independent game simultaneously.

## Key Components

### 1. Game Implementation (`snake.js`)

- **Sessions Map**: `sessions = new Map<SocketID, GameState>()`.
- **Game State**: Each user gets their own state object:
  - `snake`: Array of segments.
  - `velocity`: Current direction.
  - `food`: Unique food position for this specific player.
  - `score`: Player's personal score.
  - `gameOver`: Status of this specific session.

### 2. The Global Loop

The server runs a **Single Global Loop** at **15 FPS**.

- It iterates through `sessions.forEach()`.
- It calculates physics for _every active player_ in one pass.
- **Efficiency**: If 0 players are connected, the loop stops completely (`clearInterval`). If 100 players are connected, it updates all 100 states and emits 100 individual events. Node.js handles this well for simple logic like Snake.

### 3. Socket.io Integration

Namespace: `/snake`

- **Roles**: Everyone is `player1` of their own universe. There are no spectators (unless we add valid "watch a friend" logic later).
- **Events**:
  - `connection`: Creates a new session in the Map.
  - `disconnect`: Deletes the session from the Map.
  - `changeDirection`: Updates the specific user's velocity.
  - `gameState`: Emitted _only_ to the specific socket (`io.to(socket.id).emit(...)`).

## Why This Approach?

- **Scalability**: Allows unlimited (CPU-bound) concurrent games.
- **Simplicity**: Users don't need to "Create Room". They just join and play.
- **Performance**: One loop is better than 100 `setInterval` timers.
