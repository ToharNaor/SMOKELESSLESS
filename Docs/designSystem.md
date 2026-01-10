# Design System & CSS Architecture 🖌️

Smokelessless uses a cohesive **"Neon Arcade"** aesthetic. This document outlines the CSS patterns used to create this look without using external frameworks.

## Global Theme Variables

While we use Vanilla CSS, the theme follows these core principles:

- **Background**: Deep Black/Blue (`#0a0a10`).
- **Accents**:
  - **Cyan (`#00eaff`)**: Primary UI elements, borders, Pong paddles.
  - **Green (`#00ff00`)**: Snake, Flappy Pipes (Matrix/Retro vibe).
  - **Magenta (`#ff00ff`)**: Critical alerts, Game Over screens.
- **Fonts**: 'Press Start 2P' (Google Fonts) for that 8-bit feel.

## Visual Effects

### 1. The CRT Scanline Effect

Every game screen includes a `.scanlines` div overlay.

```css
.scanlines {
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    rgba(0, 0, 0, 0.2) 50%
  );
  background-size: 100% 4px; /* Creates the horizontal lines */
  animation: scroll 10s linear infinite; /* Slowly moves them */
}
```

This simulates an old monitor by darkening every other pixel row and scrolling it slowly. `pointer-events: none` ensures clicking clicks "through" the effect.

### 2. Neon Glow (Box Shadow)

We use CSS `box-shadow` and `text-shadow` to create the glowing light effect.

```css
box-shadow: 0 0 20px #00eaff;
text-shadow: 0 0 10px #00eaff;
```

This mimics the light bleed of a CRT monitor or neon tube.

### 3. Responsive Layout

- **Flexbox**: Used for centering the game canvas on the screen. `display: flex; justify-content: center; align-items: center;`.
- **Canvas Size**: currently fixed at 800x600. On smaller screens, the browser scale might crop it, but the simple layout ensures the center remains visible.

## File Structure

- Each game has its own `styles.css` (e.g., `flappy-online/styles.css`).
- Rationale: Keeps games modular. If we delete Snake, we delete its styles without breaking Pong.
- **Refactor Opportunity**: A shared `global.css` could define the Scanlines and Fonts to reduce duplication.
