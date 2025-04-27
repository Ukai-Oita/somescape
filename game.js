// game.js
// This script sets up the main Phaser game configuration and initializes the game instance.
// It assumes GameScene and UIScene classes are loaded globally via <script> tags in index.html.

/**
 * Main Phaser Game Configuration object.
 * Defines core settings like rendering type, dimensions, physics, scaling, and scenes.
 */
const config = {
    type: Phaser.CANVAS, // Use the Canvas renderer
    width: 1024,         // Base logical width of the game
    height: 768,         // Base logical height of the game
    physics: {
        default: 'arcade', // Use the Arcade Physics engine
        arcade: {
            gravity: { y: 0 }, // No global gravity
            debug: false       // Set to true to see physics bodies and velocity vectors
        }
    },
    // Configure the Scale Manager to handle resizing and centering
    scale: {
        mode: Phaser.Scale.FIT,         // Scale the game to fit within the parent container, maintaining aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game canvas both horizontally and vertically
        parent: 'body',                 // The HTML element ID to inject the canvas into (defaults to document body)
        width: '100%',                  // Make the canvas container take 100% of the parent's width
        height: '100%'                  // Make the canvas container take 100% of the parent's height
    },
    scene: [GameScene, UIScene] // List of scenes to load; GameScene runs first, UIScene runs concurrently on top
};

/**
 * Initialize the Phaser Game instance with the configuration.
 */
const game = new Phaser.Game(config);

/**
 * Prevent the default browser right-click context menu from appearing over the game canvas.
 * This is useful because right-click is often used for game actions (like off-hand actions).
 * Waits a short moment to ensure the canvas element exists.
 */
setTimeout(() => {
    if (game.canvas) {
        game.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // Stop the browser menu
        });
        console.log("Browser context menu disabled on game canvas.");
    } else {
        console.warn("Could not find game canvas to disable context menu.");
    }
}, 100); // Wait 100ms just in case canvas isn't immediately available