// scenes/UIScene.js
// This scene manages all User Interface elements displayed over the GameScene.
// It listens for events from GameScene to update UI components like health,
// inventory, stats, equipment, and dialogue.

// =============================================================================
// UI Constants & Configuration
// =============================================================================

// Display names for core stats
const CORE_STAT_NAMES_DISPLAY = ['Might', 'Endurance', 'Agility', 'Stealth', 'Persuasion', 'Fraud', 'Logic', 'Observation'];
// Mapping from internal stat names (lowercase) to display names
const STAT_NAME_MAP = {
    'might': 'Might', 'endurance': 'Endurance', 'agility': 'Agility', 'stealth': 'Stealth',
    'persuasion': 'Persuasion', 'fraud': 'Fraud', 'logic': 'Logic', 'observation': 'Observation'
};
// Valid keys for armor slots
const ARMOR_SLOT_KEYS = ['head', 'upperBody', 'lowerBody', 'feet', 'hands', 'accessory'];
// Colors used for specific stat XP bars
const STAT_COLORS = {
    might: 0xff0000, endurance: 0xffa500, agility: 0xffff00, stealth: 0x00cc00,
    persuasion: 0x40e0d0, fraud: 0x4b0082, logic: 0x800080, observation: 0xff00ff,
    default: 0x888888 // Fallback color
};

// --- UI Scale Factors ---
// These multipliers adjust the base sizes defined below for different UI sections.
const SIDE_BTN_SCALE = 2.0;  // Scale factor for side panel toggle buttons
const PANEL_SCALE = 1.25; // Scale factor for Inventory, Stats, Equipment panels
const STATUS_SCALE = 1.25; // Scale factor for Health bar and Gold display
const HOTBAR_SCALE = 2.0;  // Scale factor for Primary/Off-Hand slots

// --- Base Sizes for UI Elements ---
// These define the 'native' size before scaling factors are applied.
// Adjusting these base values will resize the elements proportionally.

// Side Buttons (Inventory, Stats, Equip toggles)
const BASE_SIDE_BTN_SIZE = 60;     // Width/Height of the button icon
const BASE_SIDE_BTN_MARGIN = 15;   // Margin from screen edge and between elements
const BASE_SIDE_BTN_SPACING = 36;  // Vertical space between buttons
const BASE_SIDE_BTN_FONT_SIZE = 15;// Font size for button labels (Inv, Stats, Equip)
const BASE_SIDE_BTN_LABEL_OFFSET = 0; // Vertical offset for labels below buttons
const BASE_SIDE_BTN_STROKE = 2;    // Stroke thickness for button labels

// Panels (Inventory, Stats, Equipment)
const BASE_PANEL_BORDER = 20;      // Outer border space within the panel background
const BASE_PANEL_PADDING = 15;     // Padding between elements inside the panel

// Inventory Panel
const BASE_INV_SLOT_SIZE = 80;     // Width/Height of each inventory slot background
const BASE_INV_COLS = 4;           // Number of columns in the inventory grid
const BASE_INV_ROWS = 7;           // Number of rows in the inventory grid
const BASE_INV_QTY_FONT_SIZE = 22; // Font size for item stack quantity text
const BASE_INV_QTY_OFFSET = 6;     // Offset for quantity text from bottom-right corner
const BASE_INV_ICON_SCALE = 0.8;   // Scale factor for item icons within slots (relative to slot size)
const BASE_INV_STROKE = 1;         // Stroke thickness for slot borders

// Stats Panel
const BASE_STATS_ICON_SIZE = 40;     // Width/Height of the stat icon
const BASE_STATS_BAR_WIDTH = 250;    // Width of the XP progress bar
const BASE_STATS_BAR_HEIGHT = 16;    // Height of the XP progress bar
const BASE_STATS_BAR_OFFSET_Y = 10;  // Vertical space between stat text and XP bar
const BASE_STATS_SPACING = 18;     // Vertical space between stat entries
const BASE_STATS_NAME_FONT_SIZE = 18;// Font size for the stat name (e.g., "Might:")
const BASE_STATS_LEVEL_FONT_SIZE = 18;// Font size for the stat level number
const BASE_STATS_TEXT_OFFSET_X = BASE_STATS_ICON_SIZE + 20; // Horizontal space after icon before text starts
const BASE_STATS_LEVEL_OFFSET_X = 120; // Horizontal offset for the level number relative to text start
const BASE_STATS_STROKE = 1;         // Stroke thickness for panel border

// Equipment Panel
const BASE_EQUIP_SLOT_SIZE = 80;     // Width/Height of each equipment slot background
const BASE_EQUIP_LABEL_FONT_SIZE = 15;// Font size for slot labels (e.g., "head")
const BASE_EQUIP_LABEL_OFFSET_Y = 8; // Vertical offset for labels above slots
const BASE_EQUIP_ICON_SCALE = 0.8;   // Scale factor for item icons within slots
const BASE_EQUIP_STROKE = 1;         // Stroke thickness for slot borders
const BASE_EQUIP_COLS = 3;           // Layout columns for equipment slots
const BASE_EQUIP_ROWS = 4;           // Layout rows for equipment slots

// Status Bar (Health & Gold)
const BASE_STATUS_BAR_W = 400;     // Width of the health bar background
const BASE_STATUS_BAR_H = 24;      // Height of the health bar background
const BASE_STATUS_MARGIN = 25;     // Margin from bottom-left corner of the screen
const BASE_STATUS_FONT_SIZE = 24;  // Font size for Gold text
const BASE_STATUS_GOLD_OFFSET_X = 25; // Horizontal space between health bar and gold text
const BASE_STATUS_STROKE = 1;      // Stroke thickness for health bar border

// Hotbar (Primary/Off-Hand Slots)
const BASE_HOTBAR_SLOT_SIZE = 64;  // Width/Height of the hotbar slots
const BASE_HOTBAR_SPACING = 15;    // Space between hotbar slots
const BASE_HOTBAR_BOT_MARGIN = 25; // Margin from the bottom edge of the screen
const BASE_HOTBAR_LABEL_FONT_SIZE = 15; // Font size for "LMB" / "RMB" labels
const BASE_HOTBAR_LABEL_OFFSET_Y = 12; // Vertical offset for labels above slots
const BASE_HOTBAR_STROKE = 2;      // Stroke thickness for slot borders and labels
const BASE_HOTBAR_ICON_SCALE = 0.85; // Scale factor for item icons within hotbar slots

// Dialogue Box
const BASE_DIALOGUE_NAME_FONT_SIZE = 64; // Font size for the speaker's name
const BASE_DIALOGUE_TEXT_FONT_SIZE = 48; // Font size for the dialogue text
const BASE_DIALOGUE_PADDING = 20;      // Padding inside the dialogue box background
const BASE_DIALOGUE_NAME_PAD_Y = 10;   // Vertical space between name and text
const BASE_DIALOGUE_TEXT_PAD_Y = 10;   // Extra padding below text (not currently used explicitly)
const BASE_DIALOGUE_STROKE = 1;        // Stroke thickness for dialogue box border

// Level Up Notification
const BASE_LEVELUP_ICON_SIZE = 96;   // Width/Height of the stat icon in the notification
const BASE_LEVELUP_FONT_SIZE = 48;   // Font size for the level up text (e.g., "Might 2")
const BASE_LEVELUP_SPACING = 15;   // Vertical space between icon and text
const BASE_LEVELUP_STROKE = 3;     // Stroke thickness for the level up text

// Default Font
const DEFAULT_FONT_FAMILY = 'Georgia, "Times New Roman", Times, serif'; // Standard serif font fallback

// =============================================================================
// UIScene Class
// =============================================================================

class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' }); // Unique key for this scene

        // References to UI Game Objects
        // Status Bar
        this.healthBg = null;             // Background rectangle for health
        this.healthFg = null;             // Foreground rectangle representing current health
        this.goldText = null;             // Text object for displaying gold

        // Hotbar
        this.primarySlotGraphics = null;  // Graphics object drawing the primary slot BG/border
        this.offHandSlotGraphics = null;  // Graphics object drawing the off-hand slot BG/border
        this.primarySlotPos = null;       // Stores position/size for placing icon/overlay
        this.offHandSlotPos = null;       // Stores position/size for placing icon/overlay
        this.primaryItemIcon = null;      // Image object for the equipped primary item
        this.offHandItemIcon = null;      // Image object for the equipped off-hand item
        this.primaryCooldownOverlay = null; // Rectangle shown during primary item cooldown
        this.offHandCooldownOverlay = null; // Rectangle shown during off-hand item cooldown

        // Panels & Buttons
        this.sideButtonContainer = null; // Container holding the side panel toggle buttons
        this.inventoryPanel = null;      // Container for the inventory grid UI
        this.statsPanel = null;          // Container for the stats display UI
        this.equipmentPanel = null;      // Container for the equipment slots UI
        this.activePanel = null;         // String key ('inventory', 'stats', 'equipment') of the currently visible panel, or null

        // Inventory Internals
        this.inventorySlots = []; // Array to hold references to each slot's {bg, itemImage, qtyText}

        // Stats Internals
        this.statDisplayObjects = {}; // Object mapping statName to {levelText, xpBar, xpBarWidth, statBarHeight}
        this.statXpBarHeight = BASE_STATS_BAR_HEIGHT; // Store base height for updates

        // Equipment Internals
        this.equipmentSlotsUI = {}; // Object mapping slotKey to {bg, itemImage, slotSize}

        // Level Up Notification
        this.lvlUpContainer = null;     // Container for the level up icon and text
        this.lvlUpIcon = null;          // Image object for the stat icon
        this.lvlUpText = null;          // Text object for the level up message

        // Dialogue Box
        this.dialogueContainer = null;  // Container holding the dialogue background and text
        this.dialogueBox = null;        // Graphics object drawing the dialogue background/border
        this.dialogueText = null;       // Text object displaying the current dialogue line
        this.speakerNameText = null;    // Text object displaying the speaker's name
        this.isDialogueActive = false;  // Is the dialogue system currently showing a line?
        this.dialogueLines = [];        // Array of strings for the current conversation
        this.currentLineIndex = 0;      // Index of the currently displayed line
        this.speakerName = '';          // Name of the current speaker
        this.dialogueAdvanceKeyListener = null; // Reference to the 'E' key listener used for advancing dialogue

        // Internal Data Stores (mirrored from GameScene via events)
        this.playerData = {             // Holds player health, gold, and stats
            health: 100,
            maxHealth: 100,
            gold: 0,
            stats: {} // Populated by 'statsChanged' event
        };
        this.inventoryData = [];        // Array representing the player's inventory grid (populated by 'inventoryChanged')
        this.equippedData = {           // Holds currently equipped items
            primary: null,
            offHand: null,
            armor: {} // Populated by 'equipmentChanged' event
        };
        ARMOR_SLOT_KEYS.forEach(key => this.equippedData.armor[key] = null); // Initialize armor slots

        // Cooldown Timers (for UI overlays)
        this.primaryCooldown = { startTime: 0, duration: 0, active: false };
        this.offHandCooldown = { startTime: 0, duration: 0, active: false };

        // Performance optimization (optional, for logging)
        this.logFrameCounter = 0;
        this.logFrequency = 60; // Log every 60 frames (approx 1 second)
    }

    /**
     * Preload assets specifically needed for the UI.
     */
    preload() {
        console.log("UIScene: Preloading UI assets...");
        // Item Icons (redundant if already loaded in GameScene, but safe to include)
        this.load.image('icon_iron_sword', 'assets/images/iron_sword.png');
        this.load.image('icon_iron_axe', 'assets/images/iron_axe.png');
        this.load.image('icon_health_potion', 'assets/images/health_potion.png');
        this.load.image('icon_oak_logs', 'assets/images/oak_logs.png');
        this.load.image('icon_crude_shield', 'assets/images/crude_shield.png');
        this.load.image('icon_iron_spear', 'assets/images/iron_spear.png');
        this.load.image('icon_placeholder', 'assets/images/placeholder.png');
        this.load.image('icon_leather_coif', 'assets/images/leather_coif.png');
        this.load.image('icon_leather_tunic', 'assets/images/leather_tunic.png');
        this.load.image('icon_leather_pants', 'assets/images/leather_pants.png');

        // Stat Icons (for Stats Panel & Level Up Notification)
        this.load.image('icon_might', 'assets/images/might.png');
        this.load.image('icon_endurance', 'assets/images/endurance.png');
        this.load.image('icon_agility', 'assets/images/agility.png');
        this.load.image('icon_stealth', 'assets/images/stealth.png');
        this.load.image('icon_persuasion', 'assets/images/persuasion.png');
        this.load.image('icon_fraud', 'assets/images/fraud.png');
        this.load.image('icon_logic', 'assets/images/logic.png');
        this.load.image('icon_observation', 'assets/images/observation.png');

        // UI Button Icons (for Side Panel Toggles)
        this.load.image('icon_inventory', 'assets/images/inventory.png');
        this.load.image('icon_stats', 'assets/images/stats.png');
        this.load.image('icon_equipment', 'assets/images/equipment.png');
    }

    /**
     * Create all UI elements and set up event listeners.
     * Runs once when the scene starts.
     */
    create() {
        console.log("UIScene: Creating UI elements...");

        // Create static UI elements first
        this.createStatusUI();          // Health bar & Gold
        this.createHotbarUI();          // Primary/Off-Hand slots
        this.createLevelUpNotification(); // Hidden initially
        this.createDialogueBox();       // Hidden initially

        // Create toggleable panels (hidden initially)
        this.createInventoryPanel();
        this.createStatsPanel();
        this.createEquipmentPanel();

        // Create buttons to toggle the panels
        this.createSideButtons();

        // Set up listeners for events from GameScene
        this.setupEventListeners();

        console.log("UIScene: UI Created and Listeners active.");

        // Request initial data from GameScene after a short delay
        // This ensures GameScene has finished its own create() and has data available
        this.requestInitialData();
    }

    /**
     * Sets up listeners for game events emitted by GameScene or other sources.
     */
    setupEventListeners() {
        // Listen for data updates from GameScene
        this.game.events.on('statsChanged', this.handleStatsChanged, this);
        this.game.events.on('inventoryChanged', this.handleInventoryChanged, this);
        this.game.events.on('equipmentChanged', this.handleEquipmentChanged, this);

        // Listen for specific game moments
        this.game.events.on('statLeveledUp', this.handleStatLeveledUp, this);
        this.game.events.on('primaryActionUsed', this.handlePrimaryActionUsed, this);
        this.game.events.on('offHandActionUsed', this.handleOffHandActionUsed, this);

        // Listen for dialogue control events
        this.game.events.on('showDialogue', this.showDialogue, this);
        this.game.events.on('hideDialogue', this.hideDialogue, this);

        // Ensure listeners are removed when the scene shuts down to prevent memory leaks
        this.events.on('shutdown', () => {
            console.log("UIScene shutting down, removing listeners.");
            this.game.events.off('statsChanged', this.handleStatsChanged, this);
            this.game.events.off('inventoryChanged', this.handleInventoryChanged, this);
            this.game.events.off('equipmentChanged', this.handleEquipmentChanged, this);
            this.game.events.off('statLeveledUp', this.handleStatLeveledUp, this);
            this.game.events.off('primaryActionUsed', this.handlePrimaryActionUsed, this);
            this.game.events.off('offHandActionUsed', this.handleOffHandActionUsed, this);
            this.game.events.off('showDialogue', this.showDialogue, this);
            this.game.events.off('hideDialogue', this.hideDialogue, this);
            // Clean up dialogue key listener specifically
            this.removeDialogueListeners(true);
        });
    }

    /**
     * Emits events to request the initial state data from GameScene.
     */
    requestInitialData() {
        // Use a small delay to increase likelihood GameScene is ready
        this.time.delayedCall(100, () => {
            console.log("UIScene: Requesting initial data from GameScene...");
            this.game.events.emit('requestInitialStats');
            this.game.events.emit('requestInitialInventory');
            this.game.events.emit('requestInitialEquipment');
        });
    }

    // =========================================================================
    // Event Handlers (Called by Game Events)
    // =========================================================================

    /**
     * Updates the UI's player data store and refreshes relevant UI elements.
     * @param {object} data Player stats data from GameScene (health, maxHealth, gold, stats object).
     */
    handleStatsChanged(data) {
        if (!data) return;
        // Merge received data with existing data
        this.playerData = {
            ...this.playerData, // Keep existing fields if not provided in data
            ...data,            // Overwrite with new data (health, maxHealth, gold)
            stats: {
                ...this.playerData.stats, // Keep existing stats
                ...(data.stats || {})     // Overwrite with new stats data
            }
        };
        // Update UI components that use this data
        this.updateStatusUI();
        this.updateStatsPanel(); // Update stats panel even if hidden, so it's correct when opened
    }

    /**
     * Updates the UI's inventory data store and refreshes the inventory panel UI.
     * @param {Array} inventoryData The player's inventory grid array from GameScene.
     */
    handleInventoryChanged(inventoryData) {
        if (!inventoryData || !Array.isArray(inventoryData)) return;
        this.inventoryData = inventoryData; // Replace local data with the new array
        this.updateInventoryUI(); // Update the visual display
    }

    /**
     * Updates the UI's equipped item data store and refreshes relevant UI elements.
     * @param {object} equipmentData Equipment data (primary, offHand, armor object) from GameScene.
     */
    handleEquipmentChanged(equipmentData) {
        if (!equipmentData) return;
        // Update local store
        this.equippedData.primary = equipmentData.primary;
        this.equippedData.offHand = equipmentData.offHand;
        if (equipmentData.armor) {
            // Ensure all armor slots are updated (or cleared if not present in new data)
            ARMOR_SLOT_KEYS.forEach(key => {
                this.equippedData.armor[key] = equipmentData.armor[key] || null;
            });
        } else {
             // If armor data is missing entirely, clear all local slots
             ARMOR_SLOT_KEYS.forEach(key => {
                 this.equippedData.armor[key] = null;
            });
        }
        // Update UI components
        this.updateHotbarUI();
        this.updateEquipmentUI();
        this.updateCooldownOverlayInitialState(); // Reset cooldowns if equipment changed
    }

    /**
     * Triggers the level up notification display.
     * @param {object} data Contains stat (name) and level.
     */
    handleStatLeveledUp({ stat, level }) {
        this.showLevelUpNotification(stat, level);
    }

    /**
     * Starts the cooldown overlay animation for the primary action slot.
     * @param {object} data Contains cooldown duration.
     */
    handlePrimaryActionUsed(data) {
        if (!data?.cooldown) return;
        this.primaryCooldown = { startTime: this.time.now, duration: data.cooldown, active: true };
        if (this.primaryCooldownOverlay) this.primaryCooldownOverlay.setVisible(true); // Make overlay visible
    }

    /**
     * Starts the cooldown overlay animation for the off-hand action slot.
     * @param {object} data Contains cooldown duration.
     */
    handleOffHandActionUsed(data) {
        if (!data?.cooldown) return;
        this.offHandCooldown = { startTime: this.time.now, duration: data.cooldown, active: true };
        if (this.offHandCooldownOverlay) this.offHandCooldownOverlay.setVisible(true); // Make overlay visible
    }

    // =========================================================================
    // UI Element Creation Functions
    // =========================================================================

    /**
     * Creates the static status UI elements (Health Bar, Gold Text).
     */
    createStatusUI() {
        try {
            // Apply scaling factors
            const barWidth = BASE_STATUS_BAR_W * STATUS_SCALE;
            const barHeight = BASE_STATUS_BAR_H * STATUS_SCALE;
            const margin = BASE_STATUS_MARGIN * STATUS_SCALE;
            const fontSize = BASE_STATUS_FONT_SIZE * STATUS_SCALE;
            const goldOffsetX = BASE_STATUS_GOLD_OFFSET_X * STATUS_SCALE;
            const strokeThickness = BASE_STATUS_STROKE;

            // Position relative to bottom-left corner
            const uiX = margin;
            const healthBarY = this.scale.height - margin - barHeight;
            const depth = 200; // Render above game, below panels

            // Health Bar Background
            this.healthBg = this.add.rectangle(uiX, healthBarY, barWidth, barHeight, 0x550000) // Dark red BG
                .setOrigin(0, 0) // Position from top-left
                .setDepth(depth)
                .setStrokeStyle(strokeThickness, 0xeeeeee); // Light border

            // Health Bar Foreground (represents current health)
            this.healthFg = this.add.rectangle(uiX, healthBarY, barWidth, barHeight, 0x00ff00) // Bright green FG
                .setOrigin(0, 0)
                .setDepth(depth + 1); // Render FG above BG
            // Store original dimensions for percentage calculation later
            this.healthFg.originalWidth = barWidth;
            this.healthFg.originalHeight = barHeight;

            // Gold Text
            const textStyle = { fontFamily: DEFAULT_FONT_FAMILY, fontSize: `${fontSize}px`, fill: '#ffffff' };
            const goldX = uiX + barWidth + goldOffsetX; // Position to the right of health bar
            this.goldText = this.add.text(goldX, healthBarY + barHeight / 2, 'Gold: 0', textStyle) // Initial text
                .setOrigin(0, 0.5) // Align text vertically centered next to the bar
                .setDepth(depth);

            this.updateStatusUI(); // Initialize display with current data
        } catch (e) {
            console.error("Status UI Creation Error:", e);
        }
    }

    /**
     * Creates the static hotbar UI elements (Primary/Off-Hand Slots).
     */
    createHotbarUI() {
        try {
            // Apply scaling factors
            const slotSize = BASE_HOTBAR_SLOT_SIZE * HOTBAR_SCALE;
            const spacing = BASE_HOTBAR_SPACING * HOTBAR_SCALE;
            const bottomMargin = BASE_HOTBAR_BOT_MARGIN * HOTBAR_SCALE;
            const labelFontSize = BASE_HOTBAR_LABEL_FONT_SIZE * HOTBAR_SCALE;
            const labelOffsetY = BASE_HOTBAR_LABEL_OFFSET_Y * HOTBAR_SCALE;
            const strokeThickness = BASE_HOTBAR_STROKE;

            const numSlots = 2; // Primary and Off-Hand
            const totalWidth = (slotSize * numSlots) + (spacing * (numSlots - 1));
            const screenWidth = this.scale.width;
            const screenHeight = this.scale.height;

            // Calculate position to center the hotbar horizontally near the bottom
            const hotbarY = screenHeight - bottomMargin - slotSize;
            const startX = (screenWidth - totalWidth) / 2;
            const depth = 200; // Same level as status bar

            // Cooldown overlay style
            const overlayColor = 0x000000;
            const overlayAlpha = 0.6;
            const overlayDepth = depth + 2; // Render overlay above item icon

            // Text style for "LMB" / "RMB" labels
            const labelStyle = { fontFamily: DEFAULT_FONT_FAMILY, fontSize: `${labelFontSize}px`, fill: '#fff' };

            // Primary Slot (LMB)
            const primaryX = startX;
            this.primarySlotGraphics = this.add.graphics()
                .fillStyle(0x666666, 0.9) // Semi-transparent grey background
                .fillRect(primaryX, hotbarY, slotSize, slotSize)
                .lineStyle(strokeThickness, 0xffffff, 1) // White border
                .strokeRect(primaryX, hotbarY, slotSize, slotSize)
                .setDepth(depth);
            // Add "LMB" label above the slot
            this.add.text(primaryX + slotSize / 2, hotbarY - labelOffsetY, 'LMB', labelStyle)
                .setOrigin(0.5, 1) // Center horizontally, align bottom edge above slot
                .setDepth(depth);
            // Create cooldown overlay (hidden initially)
            this.primaryCooldownOverlay = this.add.rectangle(primaryX, hotbarY, slotSize, slotSize, overlayColor, overlayAlpha)
                .setOrigin(0, 0) // Align with slot background
                .setDepth(overlayDepth)
                .setVisible(false);
            this.primarySlotPos = { x: primaryX, y: hotbarY, width: slotSize, height: slotSize }; // Store position

            // Off-Hand Slot (RMB)
            const offHandX = startX + slotSize + spacing;
            this.offHandSlotGraphics = this.add.graphics()
                .fillStyle(0x666666, 0.9)
                .fillRect(offHandX, hotbarY, slotSize, slotSize)
                .lineStyle(strokeThickness, 0xffffff, 1)
                .strokeRect(offHandX, hotbarY, slotSize, slotSize)
                .setDepth(depth);
            // Add "RMB" label
            this.add.text(offHandX + slotSize / 2, hotbarY - labelOffsetY, 'RMB', labelStyle)
                .setOrigin(0.5, 1)
                .setDepth(depth);
            // Create cooldown overlay
            this.offHandCooldownOverlay = this.add.rectangle(offHandX, hotbarY, slotSize, slotSize, overlayColor, overlayAlpha)
                .setOrigin(0, 0)
                .setDepth(overlayDepth)
                .setVisible(false);
            this.offHandSlotPos = { x: offHandX, y: hotbarY, width: slotSize, height: slotSize }; // Store position

        } catch (e) {
            console.error("Hotbar UI Creation Error:", e);
        }
    }

    /**
     * Creates the level up notification container and its elements (hidden initially).
     * Uses larger base sizes for better visibility.
     */
    createLevelUpNotification() {
        try {
            // Use base sizes directly (no scaling factor applied here, but defined above)
            const iconSize = BASE_LEVELUP_ICON_SIZE;
            const fontSize = BASE_LEVELUP_FONT_SIZE;
            const spacing = BASE_LEVELUP_SPACING;
            const strokeThickness = BASE_LEVELUP_STROKE;

            const centerX = this.scale.width / 2;
            const centerY = this.scale.height / 2;
            const depth = 1000; // Render above everything else

            // Create container, initially invisible and transparent
            this.lvlUpContainer = this.add.container(centerX, centerY)
                .setDepth(depth)
                .setVisible(false)
                .setAlpha(0);

            // Create icon (placeholder initially)
            this.lvlUpIcon = this.add.image(0, 0, 'icon_placeholder')
                .setOrigin(0.5, 0.5) // Center icon
                .setDisplaySize(iconSize, iconSize); // Use defined base size

            // Create text element
            const textStyle = {
                fontFamily: DEFAULT_FONT_FAMILY,
                fontSize: `${fontSize}px`,
                align: 'center',
                stroke: '#000000', // Black stroke
                strokeThickness: strokeThickness,
                fontStyle: 'bold'
            };
            this.lvlUpText = this.add.text(0, 0, '', textStyle) // Empty text initially
                .setOrigin(0.5, 0.5); // Center text

            // Add elements to the container
            this.lvlUpContainer.add([this.lvlUpIcon, this.lvlUpText]);

            // Position elements vertically within the container (icon above text)
            const textBounds = this.lvlUpText.getBounds(); // Get bounds after setting style
            this.lvlUpIcon.y = -(textBounds.height / 2 + spacing / 2); // Position icon above center
            this.lvlUpText.y = (this.lvlUpIcon.displayHeight / 2 + spacing / 2); // Position text below center

        } catch (e) {
            console.error("Level Up Notification UI Error:", e);
        }
    }

    /**
     * Shows the level up notification animation.
     * Updates icon, text, color based on the leveled-up stat.
     * Positions the notification above the center and animates it floating up and fading out.
     * @param {string} statName The internal name of the stat (e.g., 'might').
     * @param {number} level The new level reached.
     */
    showLevelUpNotification(statName, level) {
        if (!this.lvlUpContainer || !this.lvlUpIcon || !this.lvlUpText) return; // Ensure elements exist

        const displayName = STAT_NAME_MAP[statName] || statName.toUpperCase(); // Get display name
        let iconKey = `icon_${statName}`; // Construct icon key
        if (!this.textures.exists(iconKey)) {
            iconKey = 'icon_placeholder'; // Fallback if specific icon is missing
        }
        const statColor = STAT_COLORS[statName] || STAT_COLORS.default; // Get color for the stat

        // Update Icon
        this.lvlUpIcon.setTexture(iconKey);
        if (iconKey === 'icon_placeholder') this.lvlUpIcon.setTint(0xffaaaa); // Tint placeholder slightly
        else this.lvlUpIcon.clearTint(); // Remove tint for specific icons

        // Update Text and Color
        this.lvlUpText.setText(`${displayName} ${level}`); // Set text (e.g., "Might 5")
        this.lvlUpText.setColor(Phaser.Display.Color.ValueToColor(statColor).rgba); // Set text color

        // Recalculate vertical positions within the container (in case text height changed)
        const spacing = BASE_LEVELUP_SPACING;
        const textBounds = this.lvlUpText.getBounds();
        this.lvlUpIcon.y = -(textBounds.height / 2 + spacing / 2);
        this.lvlUpText.y = (this.lvlUpIcon.displayHeight / 2 + spacing / 2);

        // --- Animation Setup ---
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const yPositionOffset = 128; // Initial vertical offset above center
        const startY = centerY - yPositionOffset;
        const floatUpAmount = 60;   // How far the notification floats up during animation
        const endY = startY - floatUpAmount;
        const duration = 2000;      // Duration of the animation (ms)

        // Stop any previous level up animation on this container
        this.tweens.killTweensOf(this.lvlUpContainer);

        // Reset position, make visible, and start animation
        this.lvlUpContainer.setPosition(centerX, startY).setAlpha(1).setVisible(true);
        this.tweens.add({
            targets: this.lvlUpContainer,
            y: endY,        // Target Y position (float up)
            alpha: 0,       // Target alpha (fade out)
            duration: duration,
            ease: 'Power1', // Simple linear fade/move
            onComplete: () => {
                // Hide the container when animation finishes
                if (this.lvlUpContainer) this.lvlUpContainer.setVisible(false);
            }
        });
    }

     /**
     * Creates the dialogue box container and its text elements (hidden initially).
     * Positions it above the hotbar.
     */
    createDialogueBox() {
         try{
            const padding = BASE_DIALOGUE_PADDING;
            const namePaddingY = BASE_DIALOGUE_NAME_PAD_Y;
            const nameFontSize = BASE_DIALOGUE_NAME_FONT_SIZE;
            const textFontSize = BASE_DIALOGUE_TEXT_FONT_SIZE;
            const strokeThickness = BASE_DIALOGUE_STROKE;
            const boxWidthPercent = 0.7; // Percentage of screen width

            const screenWidth = this.scale.width;
            const screenHeight = this.scale.height;
            const boxWidth = screenWidth * boxWidthPercent;

            // Calculate position: Centered horizontally, vertically above the hotbar area
            const hotbarScaledHeight = (BASE_HOTBAR_SLOT_SIZE * HOTBAR_SCALE)
                                     + (BASE_HOTBAR_LABEL_OFFSET_Y * HOTBAR_SCALE) // Space for label
                                     + (BASE_HOTBAR_BOT_MARGIN * HOTBAR_SCALE); // Bottom margin
            const verticalMarginAboveHotbar = 15;
            const initialBoxHeight = 150; // Placeholder height, will be resized dynamically
            const boxBottomY = screenHeight - hotbarScaledHeight - verticalMarginAboveHotbar;
            const initialBoxTopY = boxBottomY - initialBoxHeight;
            const boxLeftX = (screenWidth - boxWidth) / 2;
            const depth = 900; // Render above most UI, below level up

            // Create the main container, positioned at the top-left of the dialogue area
            this.dialogueContainer = this.add.container(boxLeftX, initialBoxTopY)
                .setDepth(depth)
                .setVisible(false); // Start hidden

            // Graphics object for drawing the background box
            this.dialogueBox = this.add.graphics();
            this.dialogueContainer.add(this.dialogueBox); // Add graphics to container

            // Text styles - ensuring left alignment
            const nameStyle = {
                fontFamily: DEFAULT_FONT_FAMILY, fontSize: `${nameFontSize}px`,
                fontWeight: 'bold', fill: '#ffffff', align: 'left'
            };
            const textStyle = {
                fontFamily: DEFAULT_FONT_FAMILY, fontSize: `${textFontSize}px`,
                fill: '#ffffff', align: 'left'
                // Word wrap width is set dynamically in displayCurrentLine
            };

            // Create text objects, positioned relative to container's top-left (0,0) + padding
            this.speakerNameText = this.add.text(padding, padding, '', nameStyle)
                .setOrigin(0, 0); // Top-left origin
            this.dialogueText = this.add.text(padding, 0, '', textStyle) // Y position set later based on name height
                .setOrigin(0, 0); // Top-left origin

            // Explicitly set alignment again (belt-and-suspenders)
            this.speakerNameText.setAlign('left');
            this.dialogueText.setAlign('left');

            // Add text objects to the container
            this.dialogueContainer.add([this.speakerNameText, this.dialogueText]);

         } catch(e) {
            console.error("Dialogue Box Creation Error:", e);
         }
     }

    /**
     * Updates the dialogue box content with the current line and speaker name.
     * Resizes the background box and repositions the container vertically to fit the text.
     * Ensures text is left-aligned.
     */
    displayCurrentLine() {
        // Check prerequisites
        if (!this.isDialogueActive || this.currentLineIndex >= this.dialogueLines.length) {
            if (this.isDialogueActive) this.hideDialogue(); // Auto-hide if index is out of bounds
            return;
        }
        if (!this.dialogueContainer || !this.dialogueBox || !this.speakerNameText || !this.dialogueText) {
            console.error("Dialogue elements missing in displayCurrentLine.");
            return;
        }

        const lineText = this.dialogueLines[this.currentLineIndex];
        const speaker = this.speakerName || "???"; // Use speaker name or fallback

        // Get layout constants
        const boxWidthPercent = 0.7;
        const boxWidth = this.scale.width * boxWidthPercent;
        const padding = BASE_DIALOGUE_PADDING;
        const namePaddingY = BASE_DIALOGUE_NAME_PAD_Y;
        const strokeThickness = BASE_DIALOGUE_STROKE;

        // --- Update Text Content ---
        this.speakerNameText.setText(speaker); // Set speaker name (no colon needed)
        this.dialogueText.setText(lineText);   // Set the main dialogue line

        // --- Apply Word Wrap and Alignment ---
        const wrapWidth = boxWidth - (padding * 2); // Available width for text inside padding
        // Set style with word wrap and ensure left alignment
        this.dialogueText.setStyle({
            wordWrap: { width: wrapWidth, useAdvancedWrap: true },
            align: 'left' // Ensure main text is left-aligned
        });
        // Ensure speaker name alignment (important if names get long)
        this.speakerNameText.setStyle({ align: 'left' });

        // --- Recalculate Size and Redraw Box ---
        // Use a small delay to allow text objects to update their bounds after style changes
        this.time.delayedCall(5, () => {
            // Re-check elements existence in case scene changed during delay
             if (!this.dialogueContainer || !this.dialogueBox || !this.speakerNameText || !this.dialogueText) return;

            // Get the actual height of the text elements after wrapping
            const nameHeight = this.speakerNameText.height;
            const textHeight = this.dialogueText.height;

            // Calculate the required height for the dialogue box background
            const requiredBoxHeight = padding + nameHeight + namePaddingY + textHeight + padding;

            // Redraw the background graphics object
            this.dialogueBox.clear(); // Clear previous drawing
            this.dialogueBox.fillStyle(0x111111, 0.85); // Dark semi-transparent background
            this.dialogueBox.fillRect(0, 0, boxWidth, requiredBoxHeight); // Fill relative to container (0,0)
            this.dialogueBox.lineStyle(strokeThickness, 0xaaaaaa, 1); // Light border
            this.dialogueBox.strokeRect(0, 0, boxWidth, requiredBoxHeight); // Draw border

            // --- Position Text Elements within Container ---
            // Ensure origin is top-left before setting position relative to container's (0,0)
            this.speakerNameText.setOrigin(0, 0).setPosition(padding, padding);
            // Position main text below the speaker name, accounting for padding
            this.dialogueText.setOrigin(0, 0).setPosition(padding, padding + nameHeight + namePaddingY);

            // --- Reposition the Entire Container Vertically ---
            // Calculate where the bottom of the box should be (above hotbar)
             const hotbarScaledHeight = (BASE_HOTBAR_SLOT_SIZE * HOTBAR_SCALE) + (BASE_HOTBAR_LABEL_OFFSET_Y * HOTBAR_SCALE) + (BASE_HOTBAR_BOT_MARGIN * HOTBAR_SCALE);
             const verticalMarginAboveHotbar = 15;
             const boxBottomY = this.scale.height - hotbarScaledHeight - verticalMarginAboveHotbar;
            // Calculate the new top Y position for the container based on the required height
            const newBoxTopY = boxBottomY - requiredBoxHeight;
            // Set the container's position (X remains centered)
            this.dialogueContainer.setPosition((this.scale.width - boxWidth) / 2, newBoxTopY);

        }, [], this); // End delayedCall
    }

    /**
     * Creates the side buttons used to toggle the Inventory, Stats, and Equipment panels.
     */
    createSideButtons() {
        try {
            // Apply scaling
            const buttonSize = BASE_SIDE_BTN_SIZE * SIDE_BTN_SCALE;
            const margin = BASE_SIDE_BTN_MARGIN * SIDE_BTN_SCALE;
            const spacing = BASE_SIDE_BTN_SPACING * SIDE_BTN_SCALE;
            const labelFontSize = BASE_SIDE_BTN_FONT_SIZE * SIDE_BTN_SCALE;
            const labelOffsetY = BASE_SIDE_BTN_LABEL_OFFSET * SIDE_BTN_SCALE;
            const strokeThickness = BASE_SIDE_BTN_STROKE;

            const screenWidth = this.scale.width;
            const depth = 400; // Render above status/hotbar, below panels

            // Position buttons vertically along the right edge
            const buttonX = screenWidth - margin - buttonSize / 2; // Center X of buttons
            let currentY = margin + buttonSize / 2; // Center Y of the first button

            // Create container for buttons
            this.sideButtonContainer = this.add.container(0, 0).setDepth(depth);

            // Text style for labels
            const buttonLabelStyle = {
                fontFamily: DEFAULT_FONT_FAMILY, fontSize: `${labelFontSize}px`,
                fill: '#fff', stroke: '#000', strokeThickness: strokeThickness, align: 'center'
            };

            // Inventory Button
            const invButton = this.add.image(buttonX, currentY, 'icon_inventory')
                .setDisplaySize(buttonSize, buttonSize)
                .setInteractive({ useHandCursor: true })
                .setTint(0xDDDDDD); // Slight tint to indicate interactiveness
            invButton.on('pointerdown', () => this.togglePanel('inventory')); // Click handler
            const invLabel = this.add.text(buttonX, currentY + buttonSize / 2 + labelOffsetY, 'Inv', buttonLabelStyle)
                .setOrigin(0.5, 0); // Center below button
            this.sideButtonContainer.add([invButton, invLabel]); // Add to container

            // Stats Button
            currentY += buttonSize + spacing; // Move down for next button
            const statsButton = this.add.image(buttonX, currentY, 'icon_stats')
                .setDisplaySize(buttonSize, buttonSize)
                .setInteractive({ useHandCursor: true })
                .setTint(0xDDDDDD);
            statsButton.on('pointerdown', () => this.togglePanel('stats'));
            const statsLabel = this.add.text(buttonX, currentY + buttonSize / 2 + labelOffsetY, 'Stats', buttonLabelStyle)
                .setOrigin(0.5, 0);
            this.sideButtonContainer.add([statsButton, statsLabel]);

            // Equipment Button
            currentY += buttonSize + spacing;
            const equipButton = this.add.image(buttonX, currentY, 'icon_equipment')
                .setDisplaySize(buttonSize, buttonSize)
                .setInteractive({ useHandCursor: true })
                .setTint(0xDDDDDD);
            equipButton.on('pointerdown', () => this.togglePanel('equipment'));
            const equipLabel = this.add.text(buttonX, currentY + buttonSize / 2 + labelOffsetY, 'Equip', buttonLabelStyle)
                .setOrigin(0.5, 0);
            this.sideButtonContainer.add([equipButton, equipLabel]);

        } catch (e) {
            console.error("Side Button Creation Error:", e);
        }
    }

    /**
     * Toggles the visibility of the specified panel (Inventory, Stats, or Equipment).
     * Ensures only one panel is visible at a time.
     * @param {string} panelName 'inventory', 'stats', or 'equipment'.
     */
    togglePanel(panelName) {
        const panelMap = {
            inventory: this.inventoryPanel,
            stats: this.statsPanel,
            equipment: this.equipmentPanel
        };

        const panelToToggle = panelMap[panelName];
        if (!panelToToggle) return; // Invalid panel name

        const isOpeningNewPanel = (this.activePanel !== panelName);

        // Hide the currently active panel (if any)
        if (this.activePanel && panelMap[this.activePanel]) {
            panelMap[this.activePanel].setVisible(false);
        }

        // Reset active panel tracker
        this.activePanel = null;

        // If we are opening a new panel (not just closing the current one)
        if (isOpeningNewPanel) {
            panelToToggle.setVisible(true); // Show the requested panel
            this.children.bringToTop(panelToToggle); // Ensure it renders above other panels/buttons
            this.activePanel = panelName; // Track the newly opened panel

            // Refresh panel content when opened
            if (panelName === 'stats') this.updateStatsPanel();
            if (panelName === 'inventory') this.updateInventoryUI();
            if (panelName === 'equipment') this.updateEquipmentUI();
        }
        // If isOpeningNewPanel is false, it means we just closed the active panel, and the work is done.
    }

    /**
     * Creates the inventory panel container and its grid slots (hidden initially).
     */
    createInventoryPanel() {
        try {
            // Apply scaling
            const slotSize = BASE_INV_SLOT_SIZE * PANEL_SCALE;
            const padding = BASE_PANEL_PADDING * PANEL_SCALE;
            const border = BASE_PANEL_BORDER * PANEL_SCALE;
            const qtyFontSize = BASE_INV_QTY_FONT_SIZE * PANEL_SCALE;
            const qtyOffset = BASE_INV_QTY_OFFSET * PANEL_SCALE; // Offset from bottom-right
            const strokeThickness = BASE_INV_STROKE;
            const iconScaleFactor = BASE_INV_ICON_SCALE; // Icon size relative to slot size

            // Calculate panel dimensions based on grid and padding/border
            const panelWidth = (slotSize * BASE_INV_COLS) + (padding * (BASE_INV_COLS - 1)) + (border * 2);
            const panelHeight = (slotSize * BASE_INV_ROWS) + (padding * (BASE_INV_ROWS - 1)) + (border * 2);

            // Position panel to the left of the side buttons
            const sideButtonTotalWidth = (BASE_SIDE_BTN_MARGIN * SIDE_BTN_SCALE) // Left margin
                                       + (BASE_SIDE_BTN_SIZE * SIDE_BTN_SCALE)   // Button width
                                       + (BASE_SIDE_BTN_MARGIN * SIDE_BTN_SCALE); // Right margin (space before panel)
            const panelX = this.scale.width - sideButtonTotalWidth - panelWidth - 10; // Position X (10px buffer)
            const panelY = 10 + border; // Position Y (near top, accounting for border)
            const depth = 500; // Render above buttons/hotbar

            // Create the container
            this.inventoryPanel = this.add.container(panelX, panelY)
                .setDepth(depth)
                .setVisible(false); // Start hidden

            // Add background rectangle
            const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.7) // Semi-transparent black
                .setOrigin(0, 0)
                .setStrokeStyle(strokeThickness, 0xaaaaaa); // Light grey border
            this.inventoryPanel.add(bg);

            // Create grid slots
            this.inventorySlots = []; // Reset slot array
            const startX = border; // Starting position inside the border
            const startY = border;
            const qtyStyle = {
                fontFamily: DEFAULT_FONT_FAMILY, fontSize: `${qtyFontSize}px`,
                fill: '#FFFFFF', stroke: '#000000', strokeThickness: 3 // Stroke for readability
            };

            for (let i = 0; i < BASE_INV_ROWS; i++) {
                for (let j = 0; j < BASE_INV_COLS; j++) {
                    const index = i * BASE_INV_COLS + j; // Calculate linear index
                    const x = startX + j * (slotSize + padding); // Calculate slot X position
                    const y = startY + i * (slotSize + padding); // Calculate slot Y position

                    // Slot Background Rectangle (interactive)
                    const slotBg = this.add.rectangle(x, y, slotSize, slotSize, 0x333333, 0.8) // Dark grey slot BG
                        .setOrigin(0, 0)
                        .setStrokeStyle(strokeThickness, 0x666666); // Darker border for slot
                    this.inventoryPanel.add(slotBg);
                    // Make slot interactive and store its index
                    slotBg.setInteractive({ useHandCursor: true })
                          .setData('slotIndex', index);
                    // Add click listener
                    slotBg.on('pointerdown', (pointer) => {
                        const idx = slotBg.getData('slotIndex');
                        this.handleInventoryClick(idx, pointer.rightButtonDown()); // Pass index and if right-clicked
                    });

                    // Item Icon Image (placeholder, hidden initially)
                    const itemImage = this.add.image(x + slotSize / 2, y + slotSize / 2, '') // Centered in slot
                        .setVisible(false)
                        .setDisplaySize(slotSize * iconScaleFactor, slotSize * iconScaleFactor); // Scale icon within slot

                    // Quantity Text (placeholder, hidden initially)
                    const qtyText = this.add.text(x + slotSize - qtyOffset, y + slotSize - qtyOffset, '', qtyStyle)
                        .setOrigin(1, 1) // Align to bottom-right corner (adjusting for offset)
                        .setVisible(false);

                    // Add image and text to the panel container
                    this.inventoryPanel.add([itemImage, qtyText]);

                    // Store references to the UI elements for this slot
                    this.inventorySlots.push({
                        bg: slotBg,
                        itemImage: itemImage,
                        qtyText: qtyText,
                        slotSize: slotSize // Store size for potential future use
                    });
                }
            }
        } catch (e) {
            console.error("Inventory Panel Creation Error:", e);
        }
    }

    /**
     * Creates the stats panel container and its elements (hidden initially).
     */
    createStatsPanel() {
        try {
            // Apply scaling
            const border = BASE_PANEL_BORDER * PANEL_SCALE;
            const iconSize = BASE_STATS_ICON_SIZE * PANEL_SCALE;
            const barWidth = BASE_STATS_BAR_WIDTH * PANEL_SCALE;
            const barOffsetY = BASE_STATS_BAR_OFFSET_Y * PANEL_SCALE;
            const spacing = BASE_STATS_SPACING * PANEL_SCALE; // Vertical space between entries
            const statBarHeight = BASE_STATS_BAR_HEIGHT * PANEL_SCALE; // Store scaled height
            this.statXpBarHeight = statBarHeight; // Update internal reference
            const nameFontSize = BASE_STATS_NAME_FONT_SIZE * PANEL_SCALE;
            const levelFontSize = BASE_STATS_LEVEL_FONT_SIZE * PANEL_SCALE;
            const textOffsetX = BASE_STATS_TEXT_OFFSET_X * PANEL_SCALE; // Horizontal position for text (relative to border)
            const levelOffsetX = BASE_STATS_LEVEL_OFFSET_X * PANEL_SCALE; // Horizontal position for level (relative to text start)
            const strokeThickness = BASE_STATS_STROKE;

            // Calculate dimensions
            const entryHeight = iconSize + statBarHeight + barOffsetY + spacing; // Total vertical space per stat entry
            const startX = border; // Inner starting X position
            const barStartX = startX + textOffsetX; // X position where XP bar starts
            const panelWidth = barStartX + barWidth + border; // Total panel width
            const panelHeight = (CORE_STAT_NAMES_DISPLAY.length * entryHeight) + (2 * border) - spacing; // Total panel height

            // Position panel to the left of side buttons
             const sideButtonTotalWidth = (BASE_SIDE_BTN_MARGIN * SIDE_BTN_SCALE)+(BASE_SIDE_BTN_SIZE * SIDE_BTN_SCALE)+(BASE_SIDE_BTN_MARGIN * SIDE_BTN_SCALE);
             const panelX = this.scale.width - sideButtonTotalWidth - panelWidth - 10;
             const panelY = 10 + border; // Align near top
             const depth = 500;

            // Create container
            this.statsPanel = this.add.container(panelX, panelY)
                .setDepth(depth)
                .setVisible(false);

            // Add background
            const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.7)
                .setOrigin(0, 0)
                .setStrokeStyle(strokeThickness, 0xaaaaaa);
            this.statsPanel.add(bg);

            // Text styles
            const nameStyle = { fontFamily: DEFAULT_FONT_FAMILY, fontSize: `${nameFontSize}px`, fill: '#ffffff' };
            const levelStyle = { fontFamily: DEFAULT_FONT_FAMILY, fontSize: `${levelFontSize}px`, fill: '#ffff00' }; // Yellow for level

            let currentY = border; // Starting Y position for the first entry
            this.statDisplayObjects = {}; // Reset display object map

            // Create elements for each core stat
            CORE_STAT_NAMES_DISPLAY.forEach(displayName => {
                const statName = displayName.toLowerCase(); // Internal stat name
                let iconKey = `icon_${statName}`; // Construct icon asset key
                if (!this.textures.exists(iconKey)) {
                    iconKey = 'icon_placeholder'; // Fallback icon
                }
                let statColor = STAT_COLORS[statName] || STAT_COLORS.default; // Get color for XP bar

                // Stat Icon
                const icon = this.add.image(startX + iconSize / 2, currentY + iconSize / 2, iconKey)
                    .setDisplaySize(iconSize, iconSize);

                // Stat Name Label
                const label = this.add.text(startX + textOffsetX, currentY + iconSize / 2, `${displayName}:`, nameStyle)
                    .setOrigin(0, 0.5); // Align text vertically centered with icon

                // Stat Level Text
                const levelText = this.add.text(startX + textOffsetX + levelOffsetX, currentY + iconSize / 2, '1', levelStyle)
                    .setOrigin(0, 0.5); // Align left, vertically centered

                // XP Bar Background
                const currentBarX = startX + textOffsetX; // Align XP bar with text start
                const barY = currentY + iconSize + barOffsetY; // Position below icon/text
                const xpBg = this.add.rectangle(currentBarX, barY, barWidth, statBarHeight, 0x444444) // Dark grey BG
                    .setOrigin(0, 0)
                    .setDepth(1); // Render BG behind FG

                // XP Bar Foreground (represents current XP progress)
                const xpFg = this.add.rectangle(currentBarX, barY, 1, statBarHeight, statColor) // Start with width 1
                    .setOrigin(0, 0)
                    .setDepth(2); // Render FG above BG

                // Add elements to the panel container
                this.statsPanel.add([icon, label, levelText, xpBg, xpFg]);

                // Store references to dynamic elements for this stat
                this.statDisplayObjects[statName] = {
                    levelText: levelText,
                    xpBar: xpFg,
                    xpBarWidth: barWidth, // Store max width for percentage calculation
                    statBarHeight: statBarHeight // Store height for updates
                };

                currentY += entryHeight; // Move Y position down for the next stat entry
            });
        } catch (e) {
            console.error("Stats Panel Creation Error:", e);
        }
    }

    /**
     * Creates the equipment panel container and its slots (hidden initially).
     */
    createEquipmentPanel() {
        try {
            // Apply scaling
            const slotSize = BASE_EQUIP_SLOT_SIZE * PANEL_SCALE;
            const padding = BASE_PANEL_PADDING * PANEL_SCALE;
            const border = BASE_PANEL_BORDER * PANEL_SCALE;
            const labelFontSize = BASE_EQUIP_LABEL_FONT_SIZE * PANEL_SCALE;
            const labelOffsetY = BASE_EQUIP_LABEL_OFFSET_Y * PANEL_SCALE;
            const strokeThickness = BASE_EQUIP_STROKE;
            const iconScaleFactor = BASE_EQUIP_ICON_SCALE;

            // Calculate dimensions based on layout grid (3 columns, 4 rows defined in constants)
            const panelWidth = (slotSize * BASE_EQUIP_COLS) + (padding * (BASE_EQUIP_COLS - 1)) + (border * 2);
            const panelHeight = (slotSize * BASE_EQUIP_ROWS) + (padding * (BASE_EQUIP_ROWS - 1)) + (border * 2);

            // Position panel
             const sideButtonTotalWidth = (BASE_SIDE_BTN_MARGIN * SIDE_BTN_SCALE)+(BASE_SIDE_BTN_SIZE * SIDE_BTN_SCALE)+(BASE_SIDE_BTN_MARGIN * SIDE_BTN_SCALE);
             const panelX = this.scale.width - sideButtonTotalWidth - panelWidth - 10;
             const panelY = 10 + border; // Align near top
             const depth = 500;

            // Create container
            this.equipmentPanel = this.add.container(panelX, panelY)
                .setDepth(depth)
                .setVisible(false);

            // Add background
            const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.7)
                .setOrigin(0, 0)
                .setStrokeStyle(strokeThickness, 0xaaaaaa);
            this.equipmentPanel.add(bg);

            // Define slot positions within the grid (relative to panel top-left + border)
            // Using center coordinates for easier placement calculation
            const centerX = border + slotSize + padding + (slotSize / 2); // Center of middle column
            const leftX = border + (slotSize / 2);                       // Center of left column
            const rightX = border + (slotSize * 2) + (padding * 2) + (slotSize / 2); // Center of right column
            const row1Y = border + (slotSize / 2);                       // Center Y of row 1
            const row2Y = border + slotSize + padding + (slotSize / 2);  // Center Y of row 2
            const row3Y = border + (slotSize * 2) + (padding * 2) + (slotSize / 2); // Center Y of row 3
            const row4Y = border + (slotSize * 3) + (padding * 3) + (slotSize / 2); // Center Y of row 4

            // Map slot types to their grid positions (adjust as needed for desired layout)
            const slotPositions = {
                head: { x: centerX, y: row1Y },
                hands: { x: leftX, y: row2Y },
                upperBody: { x: centerX, y: row2Y },
                accessory: { x: rightX, y: row2Y },
                lowerBody: { x: centerX, y: row3Y },
                feet: { x: centerX, y: row4Y }
                // Add other slots here if needed
            };

            const labelStyle = { fontFamily: DEFAULT_FONT_FAMILY, fontSize: `${labelFontSize}px`, fill: '#aaa' }; // Grey label text

            this.equipmentSlotsUI = {}; // Reset UI object map

            // Create UI elements for each defined armor slot
            ARMOR_SLOT_KEYS.forEach(slotKey => {
                const pos = slotPositions[slotKey];
                if (!pos) {
                    console.warn(`No position defined for equipment slot: ${slotKey}`);
                    return; // Skip if no position is defined
                }

                // Calculate top-left corner for the rectangle background from center position
                const slotX = pos.x - slotSize / 2;
                const slotY = pos.y - slotSize / 2;

                // Slot Background (interactive)
                const slotBg = this.add.rectangle(slotX, slotY, slotSize, slotSize, 0x333333, 0.8)
                    .setOrigin(0, 0)
                    .setStrokeStyle(strokeThickness, 0x666666);
                this.equipmentPanel.add(slotBg);
                slotBg.setInteractive({ useHandCursor: true })
                      .setData('slotType', slotKey); // Store slot type for click handler
                // Add click listener to unequip
                slotBg.on('pointerdown', (pointer) => {
                    const type = slotBg.getData('slotType');
                    this.handleEquipmentClick(type);
                });

                // Slot Label (e.g., "head") above the slot
                const label = this.add.text(pos.x, pos.y - slotSize / 2 - labelOffsetY, slotKey, labelStyle)
                    .setOrigin(0.5, 1); // Center horizontally, align bottom edge above slot
                this.equipmentPanel.add(label);

                // Item Icon Image (placeholder, hidden initially)
                const itemImage = this.add.image(pos.x, pos.y, '') // Centered in slot
                    .setVisible(false)
                    .setDisplaySize(slotSize * iconScaleFactor, slotSize * iconScaleFactor);
                this.equipmentPanel.add(itemImage);

                // Store references
                this.equipmentSlotsUI[slotKey] = {
                    bg: slotBg,
                    itemImage: itemImage,
                    slotSize: slotSize
                };
            });

        } catch (e) {
            console.error("Equipment Panel Creation Error:", e);
        }
    }


    // =========================================================================
    // UI Interaction Handlers
    // =========================================================================

    /**
     * Handles clicking on an inventory slot.
     * Emits event to GameScene to request equipping the item.
     * Determines target slot based on item type and whether right-click was used.
     * @param {number} index The index of the clicked inventory slot.
     * @param {boolean} isRightClick Was the right mouse button used?
     */
    handleInventoryClick(index, isRightClick) {
        // Validate index
        if (index < 0 || index >= this.inventoryData.length) return;

        const item = this.inventoryData[index];
        if (!item || !item.id) return; // Slot is empty or item invalid

        const itemDefinition = ITEMS[item.id];
        if (!itemDefinition) {
            console.warn(`Clicked item with unknown definition: ${item.id}`);
            return;
        }

        // --- Determine Action Based on Item Type ---
        // Equip Armor: Always goes to its designated slot type
        if (itemDefinition.type === 'armor' && itemDefinition.slotType && ARMOR_SLOT_KEYS.includes(itemDefinition.slotType)) {
            this.game.events.emit('equipArmorRequest', {
                itemData: item,
                inventoryIndex: index,
                targetSlotType: itemDefinition.slotType
            });
        }
        // Equip Weapon/Tool/Shield: LMB for Primary, RMB for Off-Hand
        else if ((itemDefinition.type === 'weapon' || itemDefinition.type === 'tool' || itemDefinition.type === 'shield')) {
            const targetSlot = isRightClick ? 'offHand' : 'primary';
             // Check item definition 'hand' property before emitting? (GameScene already does this check)
            this.game.events.emit('equipItemRequest', {
                itemData: item, // Send item data from inventory
                targetSlot: targetSlot
            });
        }
        // Future: Handle consumables? (Maybe 'Use' option on right-click?)
        // Currently consumables use 'Q' key via GameScene.handleUseItem
    }

    /**
     * Handles clicking on an equipment slot.
     * Emits event to GameScene to request unequipping the item in that slot.
     * @param {string} slotType The type of the clicked equipment slot (e.g., 'head').
     */
    handleEquipmentClick(slotType) {
        if (!slotType || !ARMOR_SLOT_KEYS.includes(slotType)) return; // Validate slot type

        const equippedItem = this.equippedData.armor[slotType];
        // Only proceed if there is an item equipped in the clicked slot
        if (!equippedItem) return;

        // Emit request to GameScene to handle the unequip logic
        this.game.events.emit('unequipArmorRequest', { targetSlotType: slotType });
    }


    // =========================================================================
    // Dialogue Handling
    // =========================================================================

    /**
     * Initiates the dialogue display. Called by 'showDialogue' event from GameScene.
     * Stores dialogue lines/speaker, displays the first line, and adds input listeners.
     * @param {object} data Contains lines (array of strings) and speaker (string).
     */
    showDialogue({ lines, speaker }) {
        // --- Validate Input and State ---
        if (!this.dialogueContainer || !this.dialogueText || !this.speakerNameText) {
            console.error("UIScene.showDialogue: Dialogue UI elements not initialized.");
            return;
        }
        if (!Array.isArray(lines) || lines.length === 0) {
            console.warn("UIScene.showDialogue: Received empty or invalid lines array.");
            return;
        }
        // Prevent starting new dialogue if one is already active
        if (this.isDialogueActive) {
            console.warn("UIScene.showDialogue: Dialogue already active, ignoring new request.");
            return;
        }

        console.log(`[UIScene] Received showDialogue for ${speaker}.`);

        // --- Set Dialogue State ---
        this.dialogueLines = lines;
        this.speakerName = speaker || "???"; // Use provided name or fallback
        this.currentLineIndex = 0;
        this.isDialogueActive = true;

        // --- Display First Line ---
        this.displayCurrentLine(); // Updates text and resizes/repositions box

        // --- Make Container Visible (after a tiny delay) ---
        // Delay helps ensure displayCurrentLine's resize calculation completes first
        this.time.delayedCall(10, () => {
            if (this.dialogueContainer && this.isDialogueActive) { // Re-check state
                this.dialogueContainer.setVisible(true);
            } else {
                console.warn("[UIScene] Dialogue container/state invalid when trying to set visible.");
            }
        });

        // --- Add Input Listener ---
        // Listen for 'E' key to advance dialogue
        this.addDialogueListeners();
    }

    /**
     * Advances to the next dialogue line or hides the dialogue if it's the last line.
     * Called when the dialogue advance key ('E') is pressed.
     */
    advanceDialogue() {
        if (!this.isDialogueActive) return; // Do nothing if dialogue isn't active

        // Temporarily remove listener to prevent double-advancing on rapid presses
        this.removeDialogueListeners(false); // false = don't destroy the key object yet

        this.currentLineIndex++; // Move to the next line index

        if (this.currentLineIndex < this.dialogueLines.length) {
            // If more lines exist, display the next one
            this.displayCurrentLine();
            // Re-add the listener after a short delay
            this.time.delayedCall(50, () => { this.addDialogueListeners(); });
        } else {
            // If no more lines, hide the dialogue
            this.hideDialogue();
            // hideDialogue also emits 'dialogueCompleted'
        }
    }

    /**
     * Hides the dialogue container, resets dialogue state, and removes listeners.
     * Emits 'dialogueCompleted' event for GameScene.
     */
    hideDialogue() {
        if (!this.dialogueContainer || !this.isDialogueActive) return; // Already hidden or not initialized

        console.log("[UIScene] Hiding dialogue.");
        this.dialogueContainer.setVisible(false);
        this.isDialogueActive = false;
        this.dialogueLines = []; // Clear data
        this.currentLineIndex = 0;
        this.speakerName = '';
        this.removeDialogueListeners(true); // true = destroy the key listener fully

        // Notify GameScene that dialogue has ended
        this.game.events.emit('dialogueCompleted');
    }

    /**
     * Adds the keyboard listener for advancing dialogue ('E' key).
     * Creates the key object if it doesn't exist.
     */
    addDialogueListeners() {
        // Remove any existing listener first to be safe
        this.removeDialogueListeners(false);

        // Create the key object if it's not already created
        if (!this.dialogueAdvanceKeyListener) {
            this.dialogueAdvanceKeyListener = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        }
        // Add the 'down' event listener to call advanceDialogue
        this.dialogueAdvanceKeyListener.on('down', this.advanceDialogue, this);
    }

    /**
     * Removes the keyboard listener for advancing dialogue.
     * @param {boolean} destroyKey If true, also destroys the key object itself.
     */
    removeDialogueListeners(destroyKey = true) {
        if (this.dialogueAdvanceKeyListener) {
            // Remove the specific listener function
            this.dialogueAdvanceKeyListener.off('down', this.advanceDialogue, this);
            // Optionally destroy the Phaser Key object entirely
            if (destroyKey) {
                this.dialogueAdvanceKeyListener.destroy();
                this.dialogueAdvanceKeyListener = null;
            }
        }
    }


    // =========================================================================
    // UI Update Functions (Called Internally or by Handlers)
    // =========================================================================

    /**
     * Updates the health bar foreground width and gold text based on current playerData.
     */
    updateStatusUI() {
        // Update Health Bar
        if (this.healthFg?.originalWidth) { // Check if FG bar exists and has stored width
            const healthPercent = (this.playerData.maxHealth > 0)
                ? Phaser.Math.Clamp(this.playerData.health / this.playerData.maxHealth, 0, 1)
                : 0; // Avoid division by zero
            // Set the display width based on percentage of original width
            this.healthFg.displayWidth = this.healthFg.originalWidth * healthPercent;
             // Ensure height doesn't distort if width becomes very small
             this.healthFg.displayHeight = this.healthFg.originalHeight;
        }
        // Update Gold Text
        if (this.goldText) {
            this.goldText.setText(`Gold: ${this.playerData.gold || 0}`);
        }
    }

    /**
     * Resets cooldown overlay visibility, typically called when equipment changes.
     */
    updateCooldownOverlayInitialState() {
        if (this.primaryCooldownOverlay) this.primaryCooldownOverlay.setVisible(false);
        if (this.offHandCooldownOverlay) this.offHandCooldownOverlay.setVisible(false);
        this.primaryCooldown.active = false; // Reset internal cooldown state
        this.offHandCooldown.active = false;
    }

    /**
     * Updates the item icons displayed in the hotbar slots based on equippedData.
     */
    updateHotbarUI() {
        const iconScaleFactor = BASE_HOTBAR_ICON_SCALE;
        // Determine depth for icons (slightly above slot background)
        const primaryDepth = this.primarySlotGraphics ? this.primarySlotGraphics.depth + 1 : 201;
        const offHandDepth = this.offHandSlotGraphics ? this.offHandSlotGraphics.depth + 1 : 201;

        // --- Update Primary Slot Icon ---
        // Destroy existing icon first
        if (this.primaryItemIcon) this.primaryItemIcon.destroy();
        this.primaryItemIcon = null;
        // Get equipped primary item data
        const primaryItem = this.equippedData.primary;
        // If item exists, has an icon, texture is loaded, and slot position is known...
        if (primaryItem?.iconKey && this.textures.exists(primaryItem.iconKey) && this.primarySlotPos) {
            const { x, y, width, height } = this.primarySlotPos;
            // Create new icon image centered in the slot
            this.primaryItemIcon = this.add.image(x + width / 2, y + height / 2, primaryItem.iconKey)
                .setDisplaySize(width * iconScaleFactor, height * iconScaleFactor) // Scale icon within slot
                .setDepth(primaryDepth); // Set depth
        }

        // --- Update Off-Hand Slot Icon ---
        if (this.offHandItemIcon) this.offHandItemIcon.destroy();
        this.offHandItemIcon = null;
        const offHandItem = this.equippedData.offHand;
        if (offHandItem?.iconKey && this.textures.exists(offHandItem.iconKey) && this.offHandSlotPos) {
            const { x, y, width, height } = this.offHandSlotPos;
            this.offHandItemIcon = this.add.image(x + width / 2, y + height / 2, offHandItem.iconKey)
                .setDisplaySize(width * iconScaleFactor, height * iconScaleFactor)
                .setDepth(offHandDepth);
        }
    }

    /**
     * Updates the visual display of the inventory panel based on inventoryData.
     * Only updates if the panel is currently visible.
     */
    updateInventoryUI() {
        // Don't update if the panel is hidden
        if (!this.inventoryPanel?.visible) return;

        const iconScaleFactor = BASE_INV_ICON_SCALE;
        // Loop through each UI slot representation
        for (let i = 0; i < this.inventorySlots.length; i++) {
            // Get the item data for this inventory index (or null if out of bounds/empty)
            const itemData = (i < this.inventoryData.length) ? this.inventoryData[i] : null;
            const slotUI = this.inventorySlots[i]; // Get the UI elements for this slot
            if (!slotUI) continue; // Skip if UI elements don't exist

            // --- Reset Slot Visuals ---
            if (slotUI.itemImage) slotUI.itemImage.setVisible(false).setTexture(''); // Hide icon
            if (slotUI.qtyText) slotUI.qtyText.setVisible(false); // Hide quantity text

            // --- Populate Slot if Item Exists ---
            if (itemData?.id) { // Check if there's an item with an ID in this slot
                const iconKey = itemData.iconKey || 'icon_placeholder'; // Use item icon or fallback
                const slotWidth = slotUI.slotSize;
                const slotHeight = slotUI.slotSize;

                // Set and show item icon
                if (this.textures.exists(iconKey)) { // Check if texture is loaded
                    slotUI.itemImage.setTexture(iconKey)
                        .setDisplaySize(slotWidth * iconScaleFactor, slotHeight * iconScaleFactor)
                        .setVisible(true)
                        .clearTint(); // Remove any previous tint
                     // Apply specific tint if using the generic placeholder icon
                     if (iconKey === 'icon_placeholder') slotUI.itemImage.setTint(0xff00ff); // Magenta tint for placeholder
                } else {
                    // Fallback if texture is somehow missing (use placeholder)
                     slotUI.itemImage.setTexture('icon_placeholder')
                        .setDisplaySize(slotWidth * iconScaleFactor, slotHeight * iconScaleFactor)
                        .setVisible(true)
                        .setTint(0xff00ff);
                }

                // Set and show quantity text if stack size > 1
                if (itemData.quantity > 1) {
                    slotUI.qtyText.setText(itemData.quantity.toString()).setVisible(true);
                }
            }
        }
    }

    /**
     * Updates the visual display of the stats panel (levels and XP bars).
     * Only updates if the panel is currently visible.
     */
    updateStatsPanel() {
        // Don't update if panel is hidden or player data is missing
        if (!this.statsPanel?.visible || !this.playerData.stats) return;

        // Iterate through the stats UI elements we stored during creation
        for (const statName in this.statDisplayObjects) {
            const statData = this.playerData.stats[statName]; // Get current data for this stat
            const statUI = this.statDisplayObjects[statName]; // Get UI elements for this stat

            if (statData && statUI?.xpBar) { // Check if data and UI elements exist
                // Update Level Text
                statUI.levelText.setText(statData.level);

                // Update XP Bar Width
                let xpPercent = 0;
                if (statData.level >= MAX_STAT_LEVEL) {
                     // If max level, show full bar
                    xpPercent = 1.0;
                } else if (statData.next > 0 && statData.xp >= 0) {
                    // Calculate percentage of XP towards next level
                    xpPercent = Phaser.Math.Clamp(statData.xp / statData.next, 0, 1);
                }
                // Calculate target width for the foreground bar
                const targetWidth = (xpPercent > 0) ? Math.max(1, statUI.xpBarWidth * xpPercent) : 0; // Ensure width is at least 1 if > 0%
                statUI.xpBar.displayWidth = targetWidth;
                // Ensure height stays consistent
                statUI.xpBar.displayHeight = statUI.statBarHeight;

            } else if (statUI) {
                // Fallback if data is missing for some reason
                statUI.levelText.setText('?');
                if (statUI.xpBar) statUI.xpBar.displayWidth = 0; // Show empty bar
            }
        }
    }

    /**
     * Updates the item icons displayed in the equipment panel slots.
     * Only updates if the panel is currently visible.
     */
    updateEquipmentUI() {
        // Don't update if panel is hidden
        if (!this.equipmentPanel?.visible) return;

        const iconScaleFactor = BASE_EQUIP_ICON_SCALE;
        // Iterate through each defined armor slot type
        ARMOR_SLOT_KEYS.forEach(slotKey => {
            const slotUI = this.equipmentSlotsUI[slotKey]; // Get UI elements for this slot
            const equippedItem = this.equippedData.armor[slotKey]; // Get equipped item data

            if (slotUI && slotUI.itemImage) { // Check if UI elements exist
                const slotWidth = slotUI.slotSize;
                const slotHeight = slotUI.slotSize;

                // If an item is equipped in this slot
                if (equippedItem && equippedItem.id) {
                    const iconKey = equippedItem.iconKey || 'icon_placeholder'; // Use item icon or fallback

                    // Set and show icon
                    if (this.textures.exists(iconKey)) {
                        slotUI.itemImage.setTexture(iconKey)
                            .setDisplaySize(slotWidth * iconScaleFactor, slotHeight * iconScaleFactor)
                            .setVisible(true)
                            .clearTint();
                        if (iconKey === 'icon_placeholder') slotUI.itemImage.setTint(0xff00ff); // Tint placeholder
                    } else {
                        // Fallback if texture missing
                         slotUI.itemImage.setTexture('icon_placeholder')
                            .setDisplaySize(slotWidth * iconScaleFactor, slotHeight * iconScaleFactor)
                            .setVisible(true)
                            .setTint(0xff00ff);
                    }
                } else {
                    // No item equipped, hide the icon
                    slotUI.itemImage.setVisible(false).setTexture('');
                }
            }
        });
    }

    /**
     * Updates the height/fill of the cooldown overlays based on elapsed time.
     * Called every frame in the update loop.
     * @param {number} time The current game time.
     */
    updateCooldownOverlays(time) {
        // --- Primary Cooldown ---
        if (this.primaryCooldown.active && this.primaryCooldownOverlay && this.primarySlotPos) {
            const elapsedTime = time - this.primaryCooldown.startTime;
            const duration = this.primaryCooldown.duration;

            if (elapsedTime >= duration) {
                // Cooldown finished
                this.primaryCooldown.active = false;
                this.primaryCooldownOverlay.setVisible(false);
                this.primaryCooldownOverlay.displayHeight = this.primarySlotPos.height; // Reset height
            } else {
                // Cooldown in progress, update overlay height
                const remainingPercent = 1 - (elapsedTime / duration);
                const overlayHeight = this.primarySlotPos.height * remainingPercent;
                this.primaryCooldownOverlay.displayHeight = Math.max(0, overlayHeight); // Ensure height not negative
                // Ensure visibility (might have been hidden momentarily)
                if (!this.primaryCooldownOverlay.visible) this.primaryCooldownOverlay.setVisible(true);
            }
        }

        // --- Off-Hand Cooldown ---
        if (this.offHandCooldown.active && this.offHandCooldownOverlay && this.offHandSlotPos) {
            const elapsedTime = time - this.offHandCooldown.startTime;
            const duration = this.offHandCooldown.duration;

            if (elapsedTime >= duration) {
                this.offHandCooldown.active = false;
                this.offHandCooldownOverlay.setVisible(false);
                this.offHandCooldownOverlay.displayHeight = this.offHandSlotPos.height;
            } else {
                const remainingPercent = 1 - (elapsedTime / duration);
                const overlayHeight = this.offHandSlotPos.height * remainingPercent;
                this.offHandCooldownOverlay.displayHeight = Math.max(0, overlayHeight);
                if (!this.offHandCooldownOverlay.visible) this.offHandCooldownOverlay.setVisible(true);
            }
        }
    }


    // =========================================================================
    // Scene Lifecycle Methods: update()
    // =========================================================================

    /**
     * Main UI scene update loop. Called every frame.
     * Primarily used here to update cooldown overlays.
     * @param {number} time The current game time.
     * @param {number} delta The time elapsed since the last frame (in ms).
     */
    update(time, delta) {
        // Update the visual fill of the cooldown overlays
        this.updateCooldownOverlays(time);

        // Optional: Frame counter for periodic logging/debugging
        // this.logFrameCounter = (this.logFrameCounter + 1) % this.logFrequency;
        // if (this.logFrameCounter === 0) {
        //     // console.log("UIScene update tick...");
        // }
    }

} // End of class UIScene