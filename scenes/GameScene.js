// scenes/GameScene.js
// This scene handles the main gameplay logic, including world generation,
// player control, NPC behavior, combat, interactions, and physics.

// =============================================================================
// Global Constants & Definitions
// =============================================================================

/**
 * Defines all usable items in the game.
 * Each key is the item's unique ID.
 */
const ITEMS = {
    'iron_sword': {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: 'weapon',
        hand: 'primary', // Can only be equipped in the primary hand
        damage: 15,      // Base damage value
        range: 80,       // Base attack range (pixels)
        cooldown: 500,   // Time between uses (ms)
        knockback: 8,    // Amount target is pushed back on hit
        swingVisual: { type: 'sprite', scale: 0.6 }, // Visual effect on use
        iconKey: 'icon_iron_sword' // Asset key for the inventory/hotbar icon
    },
    'iron_axe': {
        id: 'iron_axe',
        name: 'Iron Axe',
        type: 'tool',
        hand: 'primary',
        damage: 5,        // Damage when used as a weapon
        range: 75,
        cooldown: 700,
        toolType: 'axe',  // Specific type of tool
        toolPower: 10,    // Effectiveness against corresponding resources (e.g., trees)
        knockback: 10,
        swingVisual: { type: 'sprite', scale: 0.5 },
        iconKey: 'icon_iron_axe'
    },
    'iron_spear': {
        id: 'iron_spear',
        name: 'Iron Spear',
        type: 'weapon',
        hand: 'primary',
        damage: 12,
        range: 110,      // Longer range than sword/axe
        cooldown: 600,
        knockback: 6,
        swingVisual: { type: 'sprite', scale: 0.7 },
        iconKey: 'icon_iron_spear'
    },
    'log': {
        id: 'log',
        name: 'Oak Log',
        type: 'resource',
        iconKey: 'icon_oak_logs',
        stackable: true, // Can multiple instances stack in one inventory slot?
        maxStack: 50      // Maximum number per stack
    },
    'health_potion': {
        id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        iconKey: 'icon_health_potion',
        stackable: true,
        maxStack: 10,
        healAmount: 50 // Amount of health restored on use
    },
    'crude_shield': {
        id: 'crude_shield',
        name: 'Crude Shield',
        type: 'shield',
        hand: 'offHand',   // Can only be equipped in the off-hand
        defenseBonus: 3,   // Bonus defense when actively blocking successfully
        blockDuration: 800,// How long the block state lasts (ms)
        cooldown: 2000,  // Time between block attempts (ms)
        iconKey: 'icon_crude_shield',
        combatIconKey: 'icon_crude_shield_combat', // Icon shown during block animation
        swingVisual: { type: 'sprite', scale: 0.5, range: 30 } // Visual for the block action
    },
    'leather_coif': {
        id: 'leather_coif',
        name: 'Leather Coif',
        type: 'armor',
        slotType: 'head', // Which equipment slot this fits into
        defenseBonus: 1,
        iconKey: 'icon_leather_coif'
    },
    'leather_tunic': {
        id: 'leather_tunic',
        name: 'Leather Tunic',
        type: 'armor',
        slotType: 'upperBody',
        defenseBonus: 2,
        iconKey: 'icon_leather_tunic'
    },
    'leather_pants': {
        id: 'leather_pants',
        name: 'Leather Pants',
        type: 'armor',
        slotType: 'lowerBody',
        defenseBonus: 1,
        iconKey: 'icon_leather_pants'
    },
    'leather_boots': {
        id: 'leather_boots',
        name: 'Leather Boots',
        type: 'armor',
        slotType: 'feet',
        defenseBonus: 1,
        iconKey: 'icon_placeholder' // Using a placeholder icon
    },
    'leather_gloves': {
        id: 'leather_gloves',
        name: 'Leather Gloves',
        type: 'armor',
        slotType: 'hands',
        defenseBonus: 1,
        iconKey: 'icon_placeholder'
    },
    'basic_amulet': {
        id: 'basic_amulet',
        name: 'Basic Amulet',
        type: 'armor',
        slotType: 'accessory',
        defenseBonus: 0,
        iconKey: 'icon_placeholder'
    }
    // Add more items here following the same structure
};

// Core character stats
const CORE_STAT_NAMES = ['might', 'endurance', 'agility', 'stealth', 'persuasion', 'fraud', 'logic', 'observation'];

// Combat & Interaction Constants
const DAMAGE_RANGE_BONUS = 54; // Extra distance added to weapon range for easier hit detection
const BLOCK_ARC_DEGREES = 90; // The angle (in degrees) within which a block is effective
const BLOCK_ARC_RADIANS = Phaser.Math.DegToRad(BLOCK_ARC_DEGREES); // Block arc converted to radians for calculations
const ENDURANCE_XP_PER_DAMAGE = 1; // XP gained for endurance per point of health lost
const ENDURANCE_XP_PER_BLOCK_MITIGATION = 5; // Bonus XP for endurance per point of damage *prevented* by a successful block
const ZERO_DAMAGE_COLOR = '#88ccff'; // Color for the '0' damage indicator text

// Progression Constants
const MAX_STAT_LEVEL = 100; // Maximum level for any core stat
const OSRS_XP_TABLE = (function() {
    // Pre-calculates the total XP required to reach each level (1 to MAX_STAT_LEVEL).
    // Inspired by Old School RuneScape's exponential XP curve.
    const table = [null, 0]; // Index 0 is unused, Level 1 requires 0 total XP
    let totalXp = 0;
    for (let level = 1; level < MAX_STAT_LEVEL; level++) {
        // Formula adapted from OSRS wiki for XP needed *for* a specific level
        let levelXp = Math.floor(level + 300 * Math.pow(2, level / 7));
        totalXp += levelXp;
        table.push(Math.floor(totalXp / 4)); // OSRS formula involves a floor(total/4) step
    }
    // Ensure the final level has an entry
    let finalLevelXp = Math.floor((MAX_STAT_LEVEL - 1) + 300 * Math.pow(2, (MAX_STAT_LEVEL - 1) / 7));
    totalXp += finalLevelXp;
    table.push(Math.floor(totalXp / 4));
    return table;
})();

// Character Base Values
const BASE_CHARACTER_HEALTH = 50;
const HEALTH_PER_ENDURANCE = 5; // Each point of Endurance adds this much max health

// Tree Constants
const BASE_TREE_HEALTH = 20;
const TREE_HEALTH_PER_ENDURANCE = 3; // Trees have an implicit endurance level affecting their health

// Equipment Slot Types
const ARMOR_SLOT_TYPES = ['head', 'upperBody', 'lowerBody', 'feet', 'hands', 'accessory'];

// NPC Data
const VILLAGER_NAMES = ["Alden", "Berta", "Cedric", "Daria", "Elwin"]; // Add more names as needed
const VILLAGER_DIALOGUE_POOL = [
    // Each sub-array is a potential set of dialogue lines for a villager
    [
        "",
        "You should level your ENDURANCE!",
        "The best way to level your endurance is by using your shield, with right-click. You get a lot more XP when you successfully block an attack.",
        "Shielding is directional. This means you'll only be covered in a 90 degree arc where your shield is located.",
        "If you successfully block an attack with a shield, not only will you gain a lot more ENDURANCE xp, but you'll deflect a lot of damage too!"
    ],
    [
        "",
        "You should level your MIGHT!",
        "The obvious way to level MIGHT is by poking your enemies with pointy objects. But did you know that not everyone is violent?",
        "That's right, get your axe out and fell some trees! You gain MIGHT experience by chopping lumber!"
    ],
    [
        "",
        "Did you know? Different weapons have different advantages.",
        "Swords are great at dealing damage. They swing quickly, and pack a punch.",
        "Spears are a little slower and weaker, but have quite a range. Keeping distance is invaluable."
    ],
    [
        "",
        "Hello, alpha tester! I have insider knowledge!",
        "This world is randomly generated. Press F5 to reload the world. You'll get a fresh start, with new people and new terrain.",
        "You can also press P on your keyboard to enable debug mode. At the moment, this just renders hitboxes."
    ]
    // Add more dialogue sets
];
const BANDIT_NAMES = ["Grak", "Rizzo", "Snag", "Twitch"]; // Add more names

// Difficulty Settings
const DIFFICULTY_SETTINGS = {
    EASY: {
        enemyHealthMult: 0.75, // Multiplier for enemy base health
        enemyDamageMult: 0.75, // Multiplier for enemy base damage
        playerDamageMult: 1.25, // Multiplier for player base damage
        xpMult: 1.2          // Multiplier for all XP gains
    },
    NORMAL: {
        enemyHealthMult: 1.0,
        enemyDamageMult: 1.0,
        playerDamageMult: 1.0,
        xpMult: 1.0
    },
    HARD: {
        enemyHealthMult: 1.5,
        enemyDamageMult: 1.25,
        playerDamageMult: 0.85,
        xpMult: 0.9
    },
};
let currentDifficulty = 'NORMAL'; // The currently active difficulty setting

// =============================================================================
// GameScene Class
// =============================================================================

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        // Scene Properties
        this.playerContainer = null; // Reference to the player's container GameObject
        this.cursors = null;         // Keyboard input helper (WASD)
        this.trees = null;           // Physics group for tree obstacles/resources
        this.waterPools = null;      // Physics group for water slowing zones
        this.bandits = null;         // Physics group for bandit NPCs
        this.villagers = null;       // Physics group for villager NPCs
        this.lootItems = null;       // Physics group for dropped items/gold
        this.grassBackground = null; // Tiling sprite for the background

        this.interactionKey = null;  // Keyboard key for interacting (E)
        this.useItemKey = null;      // Keyboard key for using consumables (Q)

        // World Configuration
        this.worldWidth = 3000;
        this.worldHeight = 2000;

        // Player Configuration
        this.playerSpeed = 200;      // Pixels per second
        this.playerSlowSpeed = 60;   // Speed when in water
        this.playerLastPrimaryActionTime = 0; // Timestamp of last LMB action
        this.playerLastOffHandActionTime = 0; // Timestamp of last RMB action
        this.lastPlayerFootstepTime = 0; // Timestamp for throttling footstep sounds
        this.footstepDelay = 350;    // Delay between footstep sounds (ms)

        // Dialogue State
        this.isDialogueVisible = false; // Is the dialogue UI currently active?
        this.conversantNPC = null;    // Reference to the NPC the player is talking to
        this.dialogueBreakDistanceSq = 120 * 120; // Max squared distance before dialogue auto-closes

        // NPC Configuration
        this.banditAttackCooldown = 1500; // Base cooldown for bandit attacks (ms)
        this.npcFootstepHearingRadiusSq = 400 * 400; // Squared distance player needs to be within to hear NPC footsteps
        this.characterBodyRadius = 20; // Physics body radius for player and NPCs

        // Tree Configuration
        this.treeTrunkWidth = 25;    // Physics body width for tree trunk collision
        this.treeTrunkHeight = 60;   // Physics body height for tree trunk collision

        // Audio
        this.backgroundMusic = null; // Reference to the background music object
    }

    /**
     * Preload assets required for the GameScene.
     */
    preload() {
        console.log("GameScene: Preloading assets...");

        // Audio Files (using .ogg format)
        this.load.audio('fx_swing', 'assets/audio/Swoosh.ogg');
        this.load.audio('fx_hit_flesh', 'assets/audio/FleshHit.ogg');
        this.load.audio('fx_pickup_coin', 'assets/audio/Coin.ogg');
        this.load.audio('fx_pickup_item', 'assets/audio/Clink2.ogg');
        this.load.audio('fx_pickup_wood', 'assets/audio/Clink2.ogg'); // Can use same sound for wood
        this.load.audio('fx_slurp', 'assets/audio/Slurp.ogg');
        this.load.audio('fx_death_thump', 'assets/audio/Thump.ogg');
        this.load.audio('fx_step', 'assets/audio/Step.ogg');
        this.load.audio('fx_level_up', 'assets/audio/Coin.ogg'); // Re-using coin sound
        this.load.audio('fx_chop', 'assets/audio/FleshHit.ogg'); // Re-using hit sound
        this.load.audio('fx_clink_armor', 'assets/audio/Clink1.ogg'); // Sound for hitting armor (0 damage)
        this.load.audio('fx_equip_brush', 'assets/audio/Brush.ogg'); // Sound for equipping items
        this.load.audio('music_background', 'assets/audio/Sunflower_Slow_Drag.ogg'); // Background music track

        // Character Spritesheets (assuming 128x128 frames)
        this.load.spritesheet('player_sheet', 'assets/images/player_sheet.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('villager_sheet', 'assets/images/villager_sheet.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('bandit_sheet', 'assets/images/bandit_sheet.png', { frameWidth: 128, frameHeight: 128 });

        // Environment Spritesheets & Images
        this.load.spritesheet('tree_sheet', 'assets/images/tree_sheet.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('grass_textures', 'assets/images/grass_sheet.png', { frameWidth: 128, frameHeight: 128 });

        // Item Icons & UI Graphics
        this.load.image('icon_iron_sword', 'assets/images/iron_sword.png');
        this.load.image('icon_iron_axe', 'assets/images/iron_axe.png');
        this.load.image('icon_iron_spear', 'assets/images/iron_spear.png');
        this.load.image('icon_health_potion', 'assets/images/health_potion.png');
        this.load.image('icon_oak_logs', 'assets/images/oak_logs.png');
        this.load.image('icon_crude_shield', 'assets/images/crude_shield.png');
        this.load.image('icon_crude_shield_combat', 'assets/images/crude_shield_combat.png'); // Shield icon for block animation
        this.load.image('icon_leather_coif', 'assets/images/leather_coif.png');
        this.load.image('icon_leather_tunic', 'assets/images/leather_tunic.png');
        this.load.image('icon_leather_pants', 'assets/images/leather_pants.png');
        this.load.image('icon_placeholder', 'assets/images/placeholder.png'); // Generic icon
    }

    // =========================================================================
    // Calculation Helper Functions
    // =========================================================================

    /**
     * Gets the total XP needed to *reach* a specific level from level 1.
     * Uses the precomputed OSRS_XP_TABLE.
     * @param {number} level The target level.
     * @returns {number} The total XP required, or 0 if invalid level.
     */
    calculateTotalXpForLevel(level) {
        const clampedLevel = Phaser.Math.Clamp(level, 1, MAX_STAT_LEVEL);
        return OSRS_XP_TABLE[clampedLevel] !== undefined ? OSRS_XP_TABLE[clampedLevel] : 0;
    }

    /**
     * Calculates the amount of XP needed to get *from* the previous level *to* the target level.
     * @param {number} targetLevel The level you are trying to reach (e.g., 2 means XP for level 1 -> 2).
     * @returns {number} The XP needed for that specific level-up, or 0 if invalid.
     */
    calculateStatXpForLevel(targetLevel) {
        if (targetLevel <= 1 || targetLevel > MAX_STAT_LEVEL) return 0;

        const xpForTargetLevel = this.calculateTotalXpForLevel(targetLevel);
        const xpForPreviousLevel = this.calculateTotalXpForLevel(targetLevel - 1);
        const difference = xpForTargetLevel - xpForPreviousLevel;

        // Ensure non-negative result
        return difference > 0 ? difference : 0;
    }

    /**
     * Calculates a character's maximum health based on their Endurance level.
     * @param {number} enduranceLevel The character's current Endurance level.
     * @returns {number} The calculated maximum health.
     */
    calculateMaxHealth(enduranceLevel) {
        const level = Math.max(1, enduranceLevel || 1); // Ensure level is at least 1
        return BASE_CHARACTER_HEALTH + (level * HEALTH_PER_ENDURANCE);
    }

    /**
     * Calculates a character's base Attack Power (AP).
     * In this version, it's Might level + Weapon Damage.
     * @param {Phaser.GameObjects.Container} characterContainer The character container.
     * @returns {number} The calculated base Attack Power.
     */
    calculateAttackPower(characterContainer) {
        if (!characterContainer?.stats) return 0;
        const mightLevel = characterContainer.stats.might?.level || 1;
        const weaponDamage = characterContainer.equippedPrimary?.damage || 0;
        // Base AP = Might Level + Weapon Damage (simple formula for now)
        return mightLevel + weaponDamage;
    }

    /**
     * Calculates a character's effective Defense.
     * In this version, it's Endurance Level + Equipped Armor Bonuses.
     * Shield bonus is handled separately during damage calculation if blocking.
     * @param {Phaser.GameObjects.Container} characterContainer The character container.
     * @returns {number} The calculated effective Defense value.
     */
    calculateEffectiveDefense(characterContainer) {
        if (!characterContainer?.stats) return 1; // Minimum defense of 1

        const enduranceLevel = characterContainer.stats.endurance?.level || 1;
        let totalEquipDefense = 0;

        // Check primary hand (some weapons might offer defense)
        if (characterContainer.equippedPrimary?.defenseBonus) {
            totalEquipDefense += characterContainer.equippedPrimary.defenseBonus;
        }
        // Check off-hand (passive defense from shields, even when not blocking)
        if (characterContainer.equippedOffHand?.defenseBonus && characterContainer.equippedOffHand.type !== 'shield') {
            // Note: Shield defenseBonus is applied only during active block calculation later
            totalEquipDefense += characterContainer.equippedOffHand.defenseBonus;
        }
        // Sum defense from all equipped armor pieces
        if (characterContainer.equippedArmor) {
            ARMOR_SLOT_TYPES.forEach(slotKey => {
                if (characterContainer.equippedArmor[slotKey]?.defenseBonus) {
                    totalEquipDefense += characterContainer.equippedArmor[slotKey].defenseBonus;
                }
            });
        }

        // Effective Defense = Base Defense (from Endurance) + Equipment Defense
        // Using Endurance level directly as base defense for now.
        return enduranceLevel + totalEquipDefense;
    }

    // =========================================================================
    // Character & Object Creation / Placement
    // =========================================================================

    /**
     * Creates a character container (Player or NPC) with sprite, physics, stats, and basic AI state.
     * @param {string} npcType 'player', 'bandit', or 'villager'.
     * @param {number} x The initial x position.
     * @param {number} y The initial y position.
     * @returns {Phaser.GameObjects.Container | null} The created container, or null on error.
     */
    createCharacter(npcType, x, y) {
        if (isNaN(x) || isNaN(y)) {
            console.error("createCharacter: Invalid coordinates", x, y);
            return null;
        }

        const container = this.add.container(x, y);
        this.physics.add.existing(container); // Enable physics for the container

        // Basic properties
        container.setDepth(y); // Initial depth based on y for pseudo-3D sorting
        container.npcType = npcType;
        container.speed = (npcType === 'bandit') ? 80 : (npcType === 'villager') ? 70 : this.playerSpeed;
        container.slowSpeed = (npcType === 'bandit') ? 30 : (npcType === 'villager') ? 25 : this.playerSlowSpeed;
        container.isInWater = false; // Flag set by overlap checks
        container.wasInWater = false; // Previous frame's water state
        container.active = true; // General flag for active status
        container.lastFootstepTime = 0; // For footstep sound timing
        container.sprite = null; // Reference to the visual sprite
        container.equippedPrimary = null;
        container.equippedOffHand = null;
        container.equippedArmor = {}; // Object to hold equipped armor items by slotType
        ARMOR_SLOT_TYPES.forEach(slot => { container.equippedArmor[slot] = null; });

        // AI State (for NPCs)
        container.aiState = 'idle'; // Initial state: 'idle', 'moving', 'chasing', 'attacking', 'dialoguing'
        container.aiMoveTimer = Phaser.Math.Between(1000, 3000); // Timer for idle/moving state duration
        container.currentMoveDir = new Phaser.Math.Vector2(0, -1); // Last intended move direction (for idle facing)

        // Dialogue & Naming
        container.dialogue = []; // Array of strings for villager dialogue
        container.name = "Unknown";

        // Stats Initialization
        container.stats = {};
        const startingNextXp = this.calculateStatXpForLevel(2); // XP needed for level 2
        CORE_STAT_NAMES.forEach(statName => {
            let startLevel = 1;
            // Bandits start with slightly higher combat stats
            if (npcType === 'bandit') {
                if (statName === 'might') startLevel = 3;
                else if (statName === 'endurance') startLevel = 3;
                else if (statName === 'agility') startLevel = 2; // Future use
                else if (statName === 'stealth') startLevel = 2; // Future use
            }
            container.stats[statName] = {
                level: startLevel,
                xp: 0,
                next: this.calculateStatXpForLevel(startLevel + 1) // XP needed for the *next* level
            };
        });
        // Ensure all level 1 stats show the correct 'next' XP amount
        if (container.stats.might.level === 1) { // Check one stat, assume others are level 1 too if this is
             Object.values(container.stats).forEach(s => {
                if(s.level === 1) s.next = startingNextXp;
            });
        }


        // Health Initialization
        container.maxHealth = this.calculateMaxHealth(container.stats.endurance.level);
        if (npcType === 'bandit') {
            // Apply difficulty multiplier to bandit health
            container.maxHealth = Math.max(1, Math.floor(container.maxHealth * DIFFICULTY_SETTINGS[currentDifficulty].enemyHealthMult));
        }
        container.health = container.maxHealth;

        // Specific NPC Type Setup
        if (npcType === 'bandit') {
            container.aiAttackTimer = 0; // Timer for attack cooldown
            container.name = Phaser.Utils.Array.GetRandom(BANDIT_NAMES);
            // Give bandits random starting weapon and basic armor
            let weaponToEquip = null;
            if (Math.random() < 0.5 && ITEMS.iron_sword) weaponToEquip = { ...ITEMS.iron_sword };
            else if (ITEMS.iron_axe) weaponToEquip = { ...ITEMS.iron_axe };
            else if (ITEMS.iron_sword) weaponToEquip = { ...ITEMS.iron_sword }; // Fallback to sword

            if (weaponToEquip) container.equippedPrimary = weaponToEquip;
            if (ITEMS.leather_coif) container.equippedArmor.head = { ...ITEMS.leather_coif };
            if (ITEMS.leather_tunic) container.equippedArmor.upperBody = { ...ITEMS.leather_tunic };
            if (ITEMS.leather_pants) container.equippedArmor.lowerBody = { ...ITEMS.leather_pants };

        } else if (npcType === 'villager') {
            container.name = Phaser.Utils.Array.GetRandom(VILLAGER_NAMES);
            container.dialogue = Phaser.Utils.Array.GetRandom(VILLAGER_DIALOGUE_POOL); // Assign random dialogue set

        } else if (npcType === 'player') {
            container.name = "Player";
            container.gold = 0;
            container.inventoryGrid = Array(28).fill(null); // 7x4 grid
            // Player-specific combat state
            container.isBlocking = false; // Is the player currently holding the block action?
            container.blockEndTime = 0;   // Timestamp when the current block action ends
            container.blockVisualSprite = null; // Reference to the shield sprite shown during block
            container.blockDirectionAngle = 0; // The angle the player is blocking towards
        }

        // Physics Body Setup
        if (container.body) {
            container.body.setCircle(this.characterBodyRadius) // Use a circular body
                .setOffset(-this.characterBodyRadius, -this.characterBodyRadius) // Center the circle on the container origin
                .setCollideWorldBounds(true)
                .setAllowGravity(false); // Top-down game
             // container.body.setMass(100); // Optional: Set mass if using complex physics/collisions
        } else {
            console.error("createCharacter: Failed to get physics body for", npcType);
            container.destroy();
            return null;
        }

        // Add Sprite visual to the container
        try {
            let sheetKey = `${npcType}_sheet`;
            const sprite = this.add.sprite(0, 0, sheetKey, 0).setScale(0.5); // Add sprite at container's origin (0,0)
            container.add(sprite); // Add the sprite as a child of the container
            container.sprite = sprite; // Store reference
        } catch (e) {
            console.error("createCharacter: Failed to add sprite", npcType, e);
            container.destroy();
            return null;
        }

        return container;
    }

    /**
     * Handles the overlap event between a character and a water pool.
     * Sets the character's isInWater flag.
     * @param {Phaser.GameObjects.Container} character The character container.
     * @param {Phaser.GameObjects.Ellipse} water The water pool object.
     */
    handleCharacterWaterOverlap(character, water) {
        // Check if character is valid and active before modifying
        if (character?.active) {
            character.isInWater = true;
        }
    }

    /**
     * Attempts to find a random, valid spawn position within the world bounds.
     * Avoids spawning too close to the player or existing obstacles.
     * @param {number} minDistance Minimum distance from the player and other entities.
     * @param {number} margin Distance from the world edges.
     * @returns {{x: number, y: number} | null} The spawn position or null if no valid spot found.
     */
    findRandomSpawnPosition(minDistance = 100, margin = 50) {
        if (typeof this.worldWidth !== 'number' || typeof this.worldHeight !== 'number') {
            console.error("findRandomSpawnPosition: World dimensions not set.");
            return null;
        }

        const playerX = this.playerContainer?.x || this.worldWidth / 2;
        const playerY = this.playerContainer?.y || this.worldHeight / 2;
        const playerMinDistSq = (minDistance * 2) ** 2; // Check a larger radius around the player

        // Groups of objects to avoid spawning too close to
        const checkGroups = [this.trees, this.waterPools, this.bandits, this.villagers].filter(group => group !== null);
        const selfRadius = this.characterBodyRadius + 5; // Radius buffer for the object being spawned

        let spawnX, spawnY, isValidPosition = false, attempts = 0;
        const maxAttempts = 50; // Prevent infinite loops

        do {
            isValidPosition = true;
            // Pick random coordinates within margins
            spawnX = Phaser.Math.Between(margin, this.worldWidth - margin);
            spawnY = Phaser.Math.Between(margin, this.worldHeight - margin);

            // 1. Check distance to player
            if (Phaser.Math.Distance.Squared(spawnX, spawnY, playerX, playerY) < playerMinDistSq) {
                isValidPosition = false;
                attempts++;
                continue;
            }

            // 2. Check distance to other entities (trees, water, NPCs)
            let isTooClose = false;
            for (const group of checkGroups) {
                // Use iterate to check children efficiently
                group.children.iterate((item) => {
                    if (!item?.active || isNaN(item.x) || isNaN(item.y)) return true; // Skip inactive or invalid items

                    // Estimate item radius for collision check
                    let itemRadius = 16; // Default small radius
                    if (item.npcType) itemRadius = this.characterBodyRadius; // NPC radius
                    else if (item.texture?.key === 'tree_sheet') itemRadius = this.treeTrunkWidth / 2; // Tree trunk radius
                    else if (item.body?.isCircle) itemRadius = item.body.radius; // Use physics body radius if available
                    else if (item.body) itemRadius = Math.max(item.body.halfWidth, item.body.halfHeight); // Use body half-size
                    else if (item.width) itemRadius = Math.max(item.width, item.height) / 2; // Estimate from display size
                    itemRadius += 5; // Add a small buffer

                    // Check squared distance for efficiency
                    if (Phaser.Math.Distance.Squared(spawnX, spawnY, item.x, item.y) < (itemRadius + selfRadius) ** 2) {
                        isTooClose = true;
                        return false; // Stop iteration for this group
                    }
                    return true; // Continue iteration
                });

                if (isTooClose) {
                    isValidPosition = false;
                    break; // Stop checking other groups
                }
            }

            if (!isValidPosition) {
                attempts++;
            }

        } while (!isValidPosition && attempts < maxAttempts);

        if (isValidPosition) {
            return { x: spawnX, y: spawnY };
        } else {
            console.warn("findRandomSpawnPosition: Failed to find a valid position after", maxAttempts, "attempts.");
            return null; // Could not find a suitable spot
        }
    }

    /**
     * Generates and places obstacles (like trees or water pools) into a specified group.
     * Attempts to avoid clustering too closely based on minDistance.
     * Can use 'random' or 'cluster' placement strategies.
     * @param {Phaser.Physics.Arcade.Group} group The physics group to add obstacles to.
     * @param {number} count The number of obstacles to attempt to generate.
     * @param {number} width The width of the obstacle (or diameter for circles).
     * @param {number} height The height of the obstacle.
     * @param {number} color Hex color code (used for non-sprite obstacles).
     * @param {number} minDistance Minimum distance between obstacles of the same group (for 'random' placement).
     * @param {number} margin Distance from world edges.
     * @param {boolean} isStatic Should the obstacle be immovable?
     * @param {string} placement 'random' or 'cluster'. Cluster tries to place near existing obstacles.
     */
    generateObstacles( group, count, width, height, color, minDistance, margin, isStatic, placement = 'random') {
        if (!group?.add) {
            console.error("generateObstacles: Invalid group provided.");
            return;
        }

        const playerX = this.playerContainer?.x || this.worldWidth / 2;
        const playerY = this.playerContainer?.y || this.worldHeight / 2;
        const playerMinDistSq = (minDistance * 1.5) ** 2; // Avoid spawning too close to player start

        // Other groups to check for proximity
        const checkGroups = [this.trees, this.waterPools, this.bandits, this.villagers].filter(g => g !== null && g !== group);
        const isTreeGroup = (group === this.trees); // Special handling for tree sprites/physics

        // Estimate radius for the object being placed
        const selfRadius = (isTreeGroup ? this.treeTrunkWidth / 2 : Math.max(width, height) / 2) + 5;
        const clusterRadius = Math.max(width, height) * 1.5; // Radius for placing clustered objects
        const minDistanceSq = minDistance ** 2; // Squared distance for faster checks

        const maxPlacementAttempts = 30; // Attempts per obstacle
        let placedCount = 0;

        for (let i = 0; i < count; i++) {
            let spawnX, spawnY, isValidPosition = false;
            let currentPlacementMode = placement;

            // If clustering, but no obstacles exist yet, default to random
            if (placement === 'cluster' && i > 0 && group.getLength() > 0) {
                currentPlacementMode = 'cluster';
            } else {
                currentPlacementMode = 'random';
            }

            // Try finding a valid position
            for (let attempt = 0; attempt < maxPlacementAttempts; attempt++) {
                isValidPosition = true;

                // Determine candidate position based on placement mode
                if (currentPlacementMode === 'cluster') {
                    const existingObstacles = group.getChildren();
                    if (existingObstacles.length > 0) {
                        // Pick a random existing obstacle as an anchor
                        const targetObstacle = Phaser.Utils.Array.GetRandom(existingObstacles);
                        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                        const radiusOffset = Phaser.Math.FloatBetween(width * 0.2, clusterRadius); // Place within cluster radius
                        spawnX = targetObstacle.x + Math.cos(angle) * radiusOffset;
                        spawnY = targetObstacle.y + Math.sin(angle) * radiusOffset;
                        // Clamp within world bounds
                        spawnX = Phaser.Math.Clamp(spawnX, margin, this.worldWidth - margin);
                        spawnY = Phaser.Math.Clamp(spawnY, margin, this.worldHeight - margin);
                    } else {
                        // Cannot cluster if none exist, switch to random for this attempt
                        currentPlacementMode = 'random';
                    }
                }
                // If mode is random (or fell back from cluster)
                if (currentPlacementMode === 'random') {
                    spawnX = Phaser.Math.Between(margin, this.worldWidth - margin);
                    spawnY = Phaser.Math.Between(margin, this.worldHeight - margin);
                }

                // --- Validation Checks ---

                // 1. Check distance to player
                if (Phaser.Math.Distance.Squared(spawnX, spawnY, playerX, playerY) < playerMinDistSq) {
                    isValidPosition = false; continue;
                }

                // 2. Check distance to objects in OTHER groups
                let isTooCloseToOther = false;
                for (const otherGroup of checkGroups) {
                    otherGroup.children.iterate((item) => {
                        if (!item?.active || isNaN(item.x) || isNaN(item.y)) return true;
                         // Estimate radius (same logic as findRandomSpawnPosition)
                        let itemRadius = 16;
                        if (item.npcType) itemRadius = this.characterBodyRadius;
                        else if (item.texture?.key === 'tree_sheet') itemRadius = this.treeTrunkWidth / 2;
                        else if (item.body?.isCircle) itemRadius = item.body.radius;
                        else if (item.body) itemRadius = Math.max(item.body.halfWidth, item.body.halfHeight);
                        else if (item.width) itemRadius = Math.max(item.width, item.height) / 2;
                        itemRadius += 5;

                        if (Phaser.Math.Distance.Squared(spawnX, spawnY, item.x, item.y) < (itemRadius + selfRadius) ** 2) {
                            isTooCloseToOther = true;
                            return false; // Stop iteration
                        }
                        return true;
                    });
                    if (isTooCloseToOther) break; // Stop checking other groups
                }
                 if (isTooCloseToOther) {
                    isValidPosition = false; continue;
                }


                // 3. Check distance to objects in the SAME group (only for random placement to prevent overlap)
                if (isValidPosition && currentPlacementMode === 'random') {
                    let isTooCloseToSelf = false;
                    if (group.children.size > 0) {
                        group.children.iterate((item) => {
                            if (!item?.active || isNaN(item.x) || isNaN(item.y)) return true;
                            // Simple check using minDistanceSq for spacing within the same group
                            if (Phaser.Math.Distance.Squared(spawnX, spawnY, item.x, item.y) < minDistanceSq) {
                                isTooCloseToSelf = true;
                                return false; // Stop iteration
                            }
                            return true;
                        });
                    }
                    if (isTooCloseToSelf) {
                        isValidPosition = false; continue;
                    }
                }

                // If all checks passed, break the attempt loop
                if (isValidPosition) {
                    break;
                }
            } // End placement attempts

            // --- Create Obstacle ---
            if (isValidPosition) {
                try {
                    let obstacle;
                    if (isTreeGroup) {
                        // Create Tree Sprite with specific physics body for trunk
                        obstacle = this.add.sprite(spawnX, spawnY, 'tree_sheet', 0).setScale(0.8);
                        group.add(obstacle);
                        this.physics.world.enable(obstacle);
                        if (obstacle.body) {
                            obstacle.body.setImmovable(true).setAllowGravity(false);
                            // Set origin near the base for better depth sorting and collision
                            obstacle.setOrigin(0.5, 0.85);
                            // Set physics body size and offset to match the trunk approximately
                            obstacle.body.setSize(this.treeTrunkWidth, this.treeTrunkHeight, false);
                            // Calculate offset based on origin and desired body size
                            const offsetX = (obstacle.displayWidth * obstacle.originX) - (this.treeTrunkWidth / 2);
                            const offsetY = (obstacle.displayHeight * obstacle.originY) - (this.treeTrunkHeight); // Align bottom
                            obstacle.body.setOffset(offsetX + 12, offsetY); // Fine-tune offset visually

                            // Store tree-specific data
                            obstacle.setData('isTree', true);
                            obstacle.setData('stats', {}); // Trees have basic stats (like Endurance for health)
                            let treeEnduranceLevel = 5; // Example: Trees have Endurance 5
                            CORE_STAT_NAMES.forEach(statName => {
                                let level = (statName === 'endurance') ? treeEnduranceLevel : 1;
                                obstacle.data.values.stats[statName] = { level: level, xp: 0, next: 0 };
                            });
                            const treeHealth = BASE_TREE_HEALTH + (treeEnduranceLevel * TREE_HEALTH_PER_ENDURANCE);
                            obstacle.setData('health', treeHealth);
                            obstacle.setDepth(obstacle.y); // Set initial depth
                        }
                    } else if (group === this.waterPools) {
                        // Create Water Pool Ellipse
                        obstacle = this.add.ellipse(spawnX, spawnY, width, width, color); // Use width for diameter
                        group.add(obstacle);
                        this.physics.world.enable(obstacle);
                        if (obstacle.body) {
                            obstacle.body.setCircle(width / 2).setImmovable(true).setAllowGravity(false);
                        }
                        obstacle.setDepth(5); // Water is usually below characters/trees
                    } else {
                        // Create Generic Rectangle Obstacle (if needed in future)
                        obstacle = this.add.rectangle(spawnX, spawnY, width, height, color);
                        group.add(obstacle);
                        this.physics.world.enable(obstacle);
                        if (obstacle.body && isStatic) {
                            obstacle.body.setImmovable(true).setAllowGravity(false);
                        }
                        obstacle.setDepth(obstacle.y); // Default depth sorting
                    }
                    placedCount++;
                } catch (e) {
                    console.error("generateObstacles: Error creating obstacle instance:", e);
                }
            }
        } // End obstacle count loop

        console.log(`generateObstacles: Placed ${placedCount}/${count} obstacles for group.`);
    }


    // =========================================================================
    // Stat & XP Handling
    // =========================================================================

    /**
     * Emits the 'statsChanged' event with the player's current health, gold, and stats.
     * Triggered whenever these values change, so the UI can update.
     */
    emitStatsChanged() {
        if (this.playerContainer?.stats) {
            // Create a deep copy of stats to avoid mutation issues if the listener holds onto the object
            const statsData = {};
            for (const key in this.playerContainer.stats) {
                if (Object.hasOwnProperty.call(this.playerContainer.stats, key)) {
                    statsData[key] = { ...this.playerContainer.stats[key] }; // Shallow copy of each stat object
                }
            }
            const dataToSend = {
                health: this.playerContainer.health,
                maxHealth: this.playerContainer.maxHealth,
                gold: this.playerContainer.gold || 0,
                stats: statsData
            };
            this.game.events.emit('statsChanged', dataToSend);
        }
    }

    /**
     * Grants XP to a specific stat for the player character.
     * Handles leveling up, calculating next XP requirement, and emitting events.
     * Applies the current difficulty's XP multiplier.
     * @param {Phaser.GameObjects.Container} playerContainer The player's container.
     * @param {string} statName The name of the stat to grant XP to (e.g., 'might').
     * @param {number} amount The base amount of XP to grant.
     */
    grantStatXp(playerContainer, statName, amount) {
        if (!playerContainer?.stats?.[statName] || amount <= 0 || isNaN(amount)) {
            return; // Invalid input or stat doesn't exist
        }

        // Apply difficulty multiplier
        let modifiedAmount = Math.floor(amount * DIFFICULTY_SETTINGS[currentDifficulty].xpMult);
        // Ensure at least 1 XP is granted if the base amount was >= 1, even after unfavorable multiplier
        if (amount >= 1 && modifiedAmount < 1) {
            modifiedAmount = 1;
        }
        if (modifiedAmount <= 0) return; // Don't grant 0 or negative XP

        amount = modifiedAmount; // Use the modified amount going forward

        const stat = playerContainer.stats[statName];
        let previousLevel = stat.level;

        // Handle max level - still allow XP gain up to the cap for that level
        if (stat.level >= MAX_STAT_LEVEL) {
            const maxXpForCap = this.calculateStatXpForLevel(MAX_STAT_LEVEL); // XP required *for* the final level
            // Only add XP if the player hasn't already filled the XP bar for the final level
            if (stat.xp < maxXpForCap || maxXpForCap === 0) {
                stat.xp = Math.min(stat.xp + amount, maxXpForCap);
            } else {
                stat.xp = maxXpForCap; // Keep it at the cap
            }
            stat.next = maxXpForCap; // 'next' requirement remains the final level's requirement
            this.emitStatsChanged(); // Update UI even if no level up
            return;
        }

        // Grant XP
        stat.xp += amount;
        let leveledUp = false;

        // Check for level ups (can happen multiple times with large XP grants)
        while (stat.level < MAX_STAT_LEVEL && stat.xp >= stat.next && stat.next > 0) {
            const costForLevel = stat.next;
            stat.level++;
            stat.xp -= costForLevel; // Subtract the cost for the level gained
            if (stat.xp < 0) stat.xp = 0; // Prevent negative XP due to rounding

            // Calculate XP needed for the *new* next level
            if (stat.level < MAX_STAT_LEVEL) {
                stat.next = this.calculateStatXpForLevel(stat.level + 1);
            } else {
                // Reached max level this iteration
                stat.next = this.calculateStatXpForLevel(MAX_STAT_LEVEL); // XP *for* the last level
                stat.xp = Math.min(stat.xp, stat.next); // Cap XP at the amount needed for the last level
                if (stat.xp < 0) stat.xp = 0;
            }

            leveledUp = true;
            // Emit event specifically for level up notification
            this.game.events.emit('statLeveledUp', { stat: statName, level: stat.level });

            // Handle specific stat level-up effects (e.g., Endurance increasing health)
            if (statName === 'endurance' && playerContainer.npcType === 'player') {
                const oldMaxHealth = playerContainer.maxHealth;
                playerContainer.maxHealth = this.calculateMaxHealth(stat.level);
                const healthIncrease = playerContainer.maxHealth - oldMaxHealth;
                // Heal the player by the amount their max health increased
                if (healthIncrease > 0) {
                    playerContainer.health += healthIncrease;
                }
            }
            // Add other stat effects here (e.g., Might increasing base damage slightly)
        }

        // Play sound effect if a level up occurred
        if (leveledUp) {
            this.sound.play('fx_level_up', { volume: 0.8 });
        }

        // Always emit stats changed to update XP bar and level display
        this.emitStatsChanged();
    }

    // =========================================================================
    // Visual Effects
    // =========================================================================

    /**
     * Creates a temporary visual effect for an attack swing or block action.
     * Can create a sprite or a rectangle based on itemData.swingVisual.
     * @param {Phaser.GameObjects.Container} container The character container performing the action.
     * @param {object} itemData The data of the item being used (weapon, tool, shield).
     * @param {number} angle The angle (in radians) the action is directed towards.
     */
    animateSwingVisual(container, itemData, angle) {
        const swingData = itemData?.swingVisual;
        const isShieldBlock = itemData?.type === 'shield';
        const visualType = isShieldBlock ? (swingData?.type || 'sprite') : swingData?.type; // Default to sprite for shield if not specified

        // Don't show visuals for bandits without explicit swing data (or if type invalid)
        if (!visualType || (container.npcType === 'bandit' && !swingData)) return;

        const visualOffset = 15; // Distance from container origin to start the visual
        const visualDepth = container.depth + 1; // Render slightly above the character
        const startX = visualOffset * Math.cos(angle);
        const startY = visualOffset * Math.sin(angle);
        const visualRange = swingData?.range || itemData?.range || (isShieldBlock ? 30 : 50); // How far the visual extends

        // --- Sprite Visual ---
        if (visualType === 'sprite' && itemData && (itemData.iconKey || itemData.combatIconKey)) {
            // Determine which icon to use (combat icon for shield block, otherwise normal icon)
            let iconKeyToUse = (isShieldBlock && itemData.combatIconKey && this.textures.exists(itemData.combatIconKey))
                ? itemData.combatIconKey
                : itemData.iconKey;

            if (!iconKeyToUse || !this.textures.exists(iconKeyToUse)) {
                 console.warn("animateSwingVisual: Icon key not found:", iconKeyToUse);
                 return; // Cannot create visual without texture
            }

            const swingSprite = this.add.sprite(startX, startY, iconKeyToUse);
            container.add(swingSprite); // Add visual as child of the character container

            const scale = swingData?.scale ?? (isShieldBlock ? 0.5 : 0.6); // Default scales
            swingSprite.setOrigin(0.5, 0.5) // Rotate around center
                       .setRotation(angle + (3 * Math.PI / 4)) // Adjust rotation for typical top-down swing appearance
                       .setDepth(visualDepth)
                       .setScale(scale)
                       .setAlpha(0) // Start invisible
                       .setVisible(true);

            const targetX = visualRange * Math.cos(angle); // Target position relative to container
            const targetY = visualRange * Math.sin(angle);

            if (isShieldBlock && container.npcType === 'player') {
                // Shield block visual: Move out and stay visible until block ends
                this.tweens.add({
                    targets: swingSprite,
                    x: targetX,
                    y: targetY,
                    alpha: 1,
                    duration: 100,
                    ease: 'Quad.easeOut'
                });
                // Store reference on player to destroy it when block ends
                if (container.blockVisualSprite?.scene) container.blockVisualSprite.destroy(); // Clean up old one
                container.blockVisualSprite = swingSprite;
            } else {
                // Normal attack/tool visual: Swing out and back, then destroy
                this.tweens.add({
                    targets: swingSprite,
                    x: targetX,
                    y: targetY,
                    alpha: 1,
                    duration: 100,
                    ease: 'Quad.easeOut',
                    yoyo: true, // Move back to start position
                    hold: 30, // Pause briefly at the apex
                    onComplete: () => {
                        // Safely destroy the sprite if it still exists
                        if (swingSprite?.scene) swingSprite.destroy();
                    }
                });
            }
        }
        // --- Rectangle Visual (Alternative) ---
        else if (visualType === 'rectangle') {
            const rectHeight = visualRange; // Length of the rectangle represents range
            const rectWidth = swingData.width || 5; // Width of the swing arc visual
            const rectColor = swingData.color || 0xffffff; // Color of the rectangle

            const swingRect = this.add.rectangle(startX, startY, rectWidth, 1, rectColor); // Start with height 1
            container.add(swingRect);

            swingRect.setOrigin(0.5, 1) // Rotate around the base (closer to player)
                     .setRotation(angle + Math.PI / 2) // Align with the swing direction
                     .setDepth(visualDepth)
                     .setVisible(true);

            // Animate the height (length) of the rectangle
            this.tweens.add({
                targets: swingRect,
                displayHeight: rectHeight, // Grow to full length
                duration: 100,
                ease: 'Quad.easeOut',
                yoyo: true, // Shrink back down
                hold: 50,
                onComplete: () => {
                    if (swingRect?.scene) swingRect.destroy();
                }
            });
        }
    }

    /**
     * Displays a floating damage number above a target.
     * @param {Phaser.GameObjects.GameObject} target The target receiving damage.
     * @param {number} damageAmount The amount of damage (use 0 for misses/blocks).
     * @param {string} color Hex color string (e.g., '#ff0000' for damage, '#88ccff' for zero).
     */
    showDamageIndicator(target, damageAmount, color = '#ff0000') {
        if (!target || damageAmount < 0 || !target.scene) {
            // Don't show indicator if target is gone or damage is negative
            return;
        }

        const amountString = Math.floor(damageAmount).toString();
        const textStyle = {
            font: 'bold 24px monospace', // Monospace for consistent number width
            fill: color,
            stroke: '#000000', // Black stroke for readability
            strokeThickness: 2
        };

        // --- Determine starting position ---
        const yOffset = 30; // Base vertical offset above character center/top
        const yOffsetTree = 15; // Smaller offset for trees
        let startX = target.x;
        let startY = target.y - yOffset; // Default Y position

        // Try to get a more precise position based on body/origin/size
        if (target.body?.center?.x) {
             // Use body center if available (more accurate for physics objects)
            startX = target.body.center.x;
        }
        if (target.getData?.('isTree')) {
            // Position above the visual top of the tree sprite, considering origin
            startY = target.y - (target.displayHeight * target.originY) - yOffsetTree;
        } else if (target.body?.top) {
            // Use the top of the physics body if available
             startY = target.body.top - yOffsetTree;
        } else if (target.displayHeight) {
             // Estimate top based on display height and origin (fallback)
             startY = target.y - (target.displayHeight * (target.originY ?? 0.5)) - yOffset;
        }

        // Add slight random jitter to position
        startX += Phaser.Math.Between(-5, 5);
        startY += Phaser.Math.Between(-3, 3);

        // Create the text object
        const damageText = this.add.text(startX, startY, amountString, textStyle)
            .setOrigin(0.5, 0.5) // Center the text
            .setDepth(target.depth + 10); // Ensure text is drawn on top

        // Animate the text floating up and fading out
        const floatDuration = 800;
        this.tweens.add({
            targets: damageText,
            y: startY - 40, // Float upwards
            alpha: 0,       // Fade out
            duration: floatDuration,
            ease: 'Power1', // Simple easing
            onComplete: () => {
                damageText.destroy(); // Clean up the text object
            }
        });
    }


    // =========================================================================
    // Scene Lifecycle Methods: create()
    // =========================================================================

    /**
     * Create game objects, set up physics, camera, inputs, and event listeners.
     * Runs once when the scene starts.
     */
    create() {
        console.log("GameScene: Creating game world...");

        // 1. Setup Background & World Bounds
        this.grassBackground = this.add.tileSprite(0, 0, this.worldWidth, this.worldHeight, 'grass_textures', 0)
            .setOrigin(0, 0)
            .setScrollFactor(1) // Make sure it scrolls with the camera
            .setDepth(0);      // Draw behind everything else
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // 2. Create Player
        this.playerContainer = this.createCharacter('player', this.worldWidth / 2, this.worldHeight / 2);
        if (!this.playerContainer) {
            console.error("FATAL: Failed to create player container!");
            return; // Stop scene creation if player fails
        }
        // Give player starting items (example)
        this.playerContainer.inventoryGrid[0] = { ...ITEMS.iron_sword };
        this.playerContainer.inventoryGrid[1] = { ...ITEMS.iron_axe };
        this.playerContainer.inventoryGrid[2] = { ...ITEMS.crude_shield };
        this.playerContainer.inventoryGrid[3] = { ...ITEMS.iron_spear };
        this.playerContainer.inventoryGrid[4] = { ...ITEMS.leather_coif };
        this.playerContainer.inventoryGrid[5] = { ...ITEMS.leather_tunic };
        this.playerContainer.inventoryGrid[6] = { ...ITEMS.leather_pants };
        // Equip starting items
        this.playerContainer.equippedPrimary = this.playerContainer.inventoryGrid[0];
        this.playerContainer.equippedOffHand = this.playerContainer.inventoryGrid[2];
        // Note: Armor equipping requires emitting events handled by UI/GameScene logic


        // 3. Create Physics Groups for Entities
        // Using groups optimizes collision checks
        this.trees = this.physics.add.group({ immovable: true }); // Trees don't get pushed
        this.waterPools = this.physics.add.group({ allowGravity: false, immovable: true });
        this.bandits = this.physics.add.group({ collideWorldBounds: true }); // Bandits stay in world
        this.villagers = this.physics.add.group({ collideWorldBounds: true }); // Villagers stay in world
        this.lootItems = this.physics.add.group({ allowGravity: false }); // Loot doesn't fall

        // 4. Generate World Features
        // Trees
        const treeScale = 0.8;
        const treeW = 128 * treeScale;
        const treeH = 128 * treeScale;
        const treeSpacing = treeW * 1.1; // Minimum distance between trees
        const treeMargin = treeW; // Margin from world edge
        this.generateObstacles(this.trees, 100, treeW, treeH, 0, treeSpacing, treeMargin, true, 'random');
        // Re-sort trees by depth after placement (optional but looks better)
        if (this.trees) this.trees.children.iterate(tree => tree.setDepth(tree.y));

        // Water Pools
        const waterSize = 180;
        const waterSpacing = waterSize * 1.1;
        const waterMargin = waterSize / 2;
        this.generateObstacles(this.waterPools, 25, waterSize, waterSize, 0x3399FF, waterSpacing, waterMargin, false, 'cluster');
        // Ensure water pools render below most things
        if (this.waterPools) this.waterPools.children.iterate(pool => pool.setDepth(5));

        // 5. Spawn NPCs
        const npcMinSpawnDist = this.characterBodyRadius * 2.5; // Min distance between NPCs at spawn
        const npcMargin = 50; // Margin from world edge for NPC spawn
        for (let i = 0; i < 5; i++) { // Spawn Bandits
            const pos = this.findRandomSpawnPosition(npcMinSpawnDist, npcMargin);
            if (pos) {
                const b = this.createCharacter('bandit', pos.x, pos.y);
                if (b && this.bandits) this.bandits.add(b); // Add to the physics group
            }
        }
        for (let i = 0; i < 4; i++) { // Spawn Villagers
            const pos = this.findRandomSpawnPosition(npcMinSpawnDist, npcMargin);
            if (pos) {
                const v = this.createCharacter('villager', pos.x, pos.y);
                if (v && this.villagers) this.villagers.add(v);
            }
        }

        // 6. Create Animations
        const animRate = 10; // Frames per second for walking animations
        ['player', 'villager', 'bandit'].forEach(p => {
            const sheet = `${p}_sheet`;
            this.anims.create({ key: `${p}_walk_down`, frames: this.anims.generateFrameNumbers(sheet, { start: 0, end: 2 }), frameRate: animRate, repeat: -1 });
            this.anims.create({ key: `${p}_walk_left`, frames: this.anims.generateFrameNumbers(sheet, { start: 3, end: 5 }), frameRate: animRate, repeat: -1 });
            this.anims.create({ key: `${p}_walk_right`, frames: this.anims.generateFrameNumbers(sheet, { start: 6, end: 8 }), frameRate: animRate, repeat: -1 });
            this.anims.create({ key: `${p}_walk_up`, frames: this.anims.generateFrameNumbers(sheet, { start: 9, end: 11 }), frameRate: animRate, repeat: -1 });
        });

        // 7. Setup Camera
        if (this.playerContainer) {
            this.cameras.main.startFollow(this.playerContainer, true, 0.1, 0.1) // Follow player smoothly
                           .setZoom(1.5); // Zoom in slightly
        }

        // 8. Setup Input Handling
        try {
            // WASD for movement
            this.cursors = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            });

            // Toggle physics debug overlay
            this.input.keyboard.on('keydown-P', this.toggleDebugGraphics, this);

            // Interaction key (E)
            this.interactionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
            this.interactionKey.on('down', this.handleInteraction, this); // Use handleInteraction on key down

            // Use item key (Q)
            this.useItemKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
            this.useItemKey.on('down', this.handleUseItem, this);

            // Primary (LMB) and Off-Hand (RMB) actions via pointer input
            this.input.on('pointerdown', (pointer) => {
                // Attempt to resume Audio Context on first user interaction (required by browsers)
                if (this.sound.context.state === 'suspended') {
                    this.sound.context.resume().then(() => {
                        console.log("Audio Context Resumed.");
                        // Try to play music again if it failed initially due to suspended context
                        if (this.backgroundMusic && !this.backgroundMusic.isPlaying && !this.backgroundMusic.isPaused) {
                            console.log("Attempting to play music after context resume.");
                            this.backgroundMusic.play();
                        }
                    });
                }

                 // Don't process clicks if dialogue is active
                if (this.isDialogueVisible) return;

                // Trigger actions based on button pressed
                if (pointer.leftButtonDown()) {
                    this.handlePlayerPrimaryAction(pointer);
                } else if (pointer.rightButtonDown()) {
                    // Note: Right-click prevention is handled in game.js
                    this.handlePlayerOffHandAction(pointer);
                }
            }, this);

        } catch (e) {
            console.error("Input setup failed:", e);
        }

        // 9. Setup Physics Collisions & Overlaps
        // Player vs Obstacles/NPCs
        if (this.playerContainer && this.trees) this.physics.add.collider(this.playerContainer, this.trees);
        if (this.playerContainer && this.bandits) this.physics.add.collider(this.playerContainer, this.bandits);
        if (this.playerContainer && this.villagers) this.physics.add.collider(this.playerContainer, this.villagers);

        // NPCs vs Obstacles/Each Other
        if (this.bandits && this.trees) this.physics.add.collider(this.bandits, this.trees);
        if (this.bandits && this.villagers) this.physics.add.collider(this.bandits, this.villagers);
        if (this.villagers && this.trees) this.physics.add.collider(this.villagers, this.trees);
        if (this.villagers) this.physics.add.collider(this.villagers, this.villagers); // Villagers collide with each other
        // Note: Bandit vs Bandit collision currently disabled for simplicity during testing. Add if needed:
        // if (this.bandits) this.physics.add.collider(this.bandits, this.bandits);

        // Overlaps (trigger effects without collision physics)
        // Characters vs Water
        if (this.playerContainer && this.waterPools) this.physics.add.overlap(this.playerContainer, this.waterPools, this.handleCharacterWaterOverlap, null, this);
        if (this.bandits && this.waterPools) this.physics.add.overlap(this.bandits, this.waterPools, this.handleCharacterWaterOverlap, null, this);
        if (this.villagers && this.waterPools) this.physics.add.overlap(this.villagers, this.waterPools, this.handleCharacterWaterOverlap, null, this);

        // Player vs Loot
        if (this.playerContainer && this.lootItems) {
            this.physics.add.overlap(this.playerContainer, this.lootItems, this.handlePlayerLootPickup, null, this);
        }

        // 10. Setup Event Listeners for UI Communication
        // Listen for requests from UIScene to equip items/armor
        this.game.events.on('equipItemRequest', this.handleEquipItemRequest, this);
        this.game.events.on('equipArmorRequest', this.handleEquipArmorRequest, this);
        this.game.events.on('unequipArmorRequest', this.handleUnequipArmorRequest, this);

        // Listen for requests from UIScene for initial data load
        this.game.events.on('requestInitialEquipment', () => {
            if (this.playerContainer) { this.emitEquipmentChanged(); }
        }, this);
        this.game.events.on('requestInitialStats', () => {
            if (this.playerContainer) { this.emitStatsChanged(); }
        }, this);
        this.game.events.on('requestInitialInventory', () => {
            if (this.playerContainer) {
                 // Directly emit inventory data when requested
                 this.game.events.emit('inventoryChanged', this.playerContainer.inventoryGrid);
            }
        }, this);

        // Listen for dialogue completion from UIScene to reset NPC state
        this.game.events.on('dialogueCompleted', () => {
            // If the player was talking to an NPC, reset its state
            if (this.conversantNPC && this.conversantNPC.active && this.conversantNPC.aiState === 'dialoguing') {
                this.conversantNPC.aiState = 'idle'; // Go back to wandering
                this.conversantNPC.aiMoveTimer = Phaser.Math.Between(1000, 2500); // Set timer for next action
            }
            this.isDialogueVisible = false;
            this.conversantNPC = null;
        }, this);


        // 11. Start Background Music
        try {
            this.backgroundMusic = this.sound.add('music_background', {
                loop: true,
                volume: 0.4 // Start at a moderate volume
            });
            this.backgroundMusic.play();

            // Check if playback started or needs resuming after interaction
            if (this.sound.context.state === 'suspended') {
                console.warn("AudioContext suspended. Music will attempt to start after user interaction.");
            } else {
                console.log("Background music started.");
            }
        } catch(e) {
            console.error("Error playing background music:", e);
        }

        // 12. Launch the UI Scene to run concurrently
        this.scene.launch('UIScene');

        console.log("GameScene: Create complete.");
    }


    // =========================================================================
    // Event Handlers (from UI Scene)
    // =========================================================================

    /**
     * Handles request from UI to equip a primary or off-hand item.
     * @param {object} data Contains itemData and targetSlot ('primary' or 'offHand').
     */
    handleEquipItemRequest({ itemData, targetSlot }) {
        if (!this.playerContainer || !itemData?.id || !ITEMS[itemData.id]) return; // Validate input

        const itemDefinition = ITEMS[itemData.id];
        let changed = false;

        // Check if item can be equipped in the target slot based on its 'hand' property
        if (targetSlot === 'primary' && (itemDefinition.hand === 'primary' || itemDefinition.hand === 'any')) {
            this.playerContainer.equippedPrimary = { ...itemData }; // Equip a copy
            changed = true;
        } else if (targetSlot === 'offHand' && (itemDefinition.hand === 'offHand' || itemDefinition.hand === 'any')) {
            this.playerContainer.equippedOffHand = { ...itemData }; // Equip a copy
            changed = true;
        } else {
            console.warn(`Cannot equip ${itemData.id} in ${targetSlot} slot.`);
            return; // Invalid slot for this item
        }

        if (changed) {
            this.sound.play('fx_equip_brush', { volume: 0.6 });
            this.emitEquipmentChanged(); // Notify UI of the change
        }
    }

    /**
     * Handles request from UI to equip an armor item from inventory.
     * Swaps the item with any currently equipped item in that slot.
     * @param {object} data Contains itemData, inventoryIndex, and targetSlotType.
     */
    handleEquipArmorRequest({ itemData, inventoryIndex, targetSlotType }) {
         if (!this.playerContainer || !itemData?.id || !ITEMS[itemData.id] || inventoryIndex < 0) return;
         if (!this.playerContainer.equippedArmor || !ARMOR_SLOT_TYPES.includes(targetSlotType)) return;

         const itemDefinition = ITEMS[itemData.id];
         // Validate item type and target slot
         if (itemDefinition.type !== 'armor' || itemDefinition.slotType !== targetSlotType) {
             console.warn(`Item ${itemData.id} is not armor for slot ${targetSlotType}.`);
             return;
         }

         const currentlyEquipped = this.playerContainer.equippedArmor[targetSlotType];
         const itemFromInventory = this.playerContainer.inventoryGrid[inventoryIndex];

         // Ensure the item actually exists at that inventory index
         if (!itemFromInventory || itemFromInventory.id !== itemData.id) {
             console.warn(`Item mismatch or empty slot at inventory index ${inventoryIndex}.`);
             return;
         }

         // Perform the swap
         this.playerContainer.equippedArmor[targetSlotType] = { ...itemFromInventory }; // Equip a copy
         // Place the previously equipped item (or null) back into the inventory slot
         this.playerContainer.inventoryGrid[inventoryIndex] = currentlyEquipped ? { ...currentlyEquipped } : null;

         this.sound.play('fx_equip_brush', { volume: 0.6 });
         this.emitEquipmentChanged(); // Notify UI of equipment change
         this.game.events.emit('inventoryChanged', this.playerContainer.inventoryGrid); // Notify UI of inventory change
    }

    /**
     * Handles request from UI to unequip an armor item.
     * Moves the item to the first available inventory slot.
     * @param {object} data Contains targetSlotType.
     */
     handleUnequipArmorRequest({ targetSlotType }) {
        if (!this.playerContainer || !this.playerContainer.equippedArmor || !ARMOR_SLOT_TYPES.includes(targetSlotType)) return;

        const itemToUnequip = this.playerContainer.equippedArmor[targetSlotType];
        if (!itemToUnequip) return; // Nothing to unequip

        // Find the first empty slot in the inventory
        const emptyInvIndex = this.playerContainer.inventoryGrid.findIndex(slot => slot === null);

        if (emptyInvIndex !== -1) {
            // Move item to inventory and clear equipment slot
            this.playerContainer.inventoryGrid[emptyInvIndex] = { ...itemToUnequip };
            this.playerContainer.equippedArmor[targetSlotType] = null;

            this.sound.play('fx_equip_brush', { volume: 0.6 });
            this.emitEquipmentChanged(); // Notify UI of equipment change
            this.game.events.emit('inventoryChanged', this.playerContainer.inventoryGrid); // Notify UI of inventory change
        } else {
            console.log("Cannot unequip: Inventory is full.");
            // Optionally provide user feedback here (e.g., a sound or message)
        }
    }

    /**
     * Emits the 'equipmentChanged' event with the player's current equipped items.
     */
    emitEquipmentChanged() {
        if (!this.playerContainer) return;
        this.game.events.emit('equipmentChanged', {
            primary: this.playerContainer.equippedPrimary,
            offHand: this.playerContainer.equippedOffHand,
            armor: { ...this.playerContainer.equippedArmor } // Send a copy of the armor object
        });
    }

    // =========================================================================
    // Player Action Handlers
    // =========================================================================

    /**
     * Handles the 'E' key press for interaction. Finds the nearest interactable NPC.
     * Initiates dialogue if a Villager is found in range.
     * Sets the NPC's AI state to 'dialoguing'.
     */
    handleInteraction() {
        const uiScene = this.scene.get('UIScene');
        // Don't interact if UI scene reports dialogue is already active, player is inactive, or game scene thinks dialogue is visible
        if ((uiScene && uiScene.isDialogueActive) || !this.playerContainer?.active || this.isDialogueVisible) return;

        const interactionRangeSq = 60 * 60; // Squared interaction range
        const pX = this.playerContainer.x;
        const pY = this.playerContainer.y;
        if (isNaN(pX + pY)) return; // Player position invalid

        let closestNPC = null;
        let minDistanceSq = interactionRangeSq; // Start with max range

        // Check Villagers first (currently only interactable NPCs)
        if (this.villagers) {
            this.villagers.children.iterate((villager) => {
                if (!villager?.active || isNaN(villager.x + villager.y)) return; // Skip inactive/invalid

                const dSq = Phaser.Math.Distance.Squared(pX, pY, villager.x, villager.y);
                if (dSq < minDistanceSq) {
                    minDistanceSq = dSq;
                    closestNPC = villager;
                }
            });
        }
        // Future: Check other interactable objects/NPCs here (e.g., Merchants, Quest Givers, objects)

        // If an interactable NPC was found in range
        if (closestNPC) {
            // Prepare dialogue data
            const lines = closestNPC.dialogue?.length > 0 ? closestNPC.dialogue : ["..."]; // Default dialogue
            const speaker = closestNPC.name || "???";

            // Emit event to UIScene to show the dialogue box
            this.game.events.emit('showDialogue', { lines: lines, speaker: speaker });
            this.isDialogueVisible = true; // Set flag in GameScene
            this.conversantNPC = closestNPC; // Store reference to the NPC being talked to

            // Set NPC state to stop AI movement/actions
            this.conversantNPC.aiState = 'dialoguing';
            if (this.conversantNPC.body) this.conversantNPC.body.setVelocity(0, 0); // Stop movement immediately
        }
    }

     /**
     * Handles Left Mouse Button click for primary actions (attack/tool use).
     * Checks for cooldowns, calculates direction, plays sounds/visuals.
     * Prioritizes chopping trees if an axe is equipped and a tree is targeted.
     * Otherwise, performs a general attack check.
     * @param {Phaser.Input.Pointer} pointer The pointer object from the input event.
     */
    handlePlayerPrimaryAction(pointer) {
        if (!this.playerContainer?.active || this.playerContainer.health <= 0 || !pointer.active || this.isDialogueVisible) {
            return; // Cannot act if dead, inactive, or in dialogue
        }

        const item = this.playerContainer.equippedPrimary;
        if (!item) return; // No primary item equipped

        const time = this.time.now; // Current game time
        const cooldown = item.cooldown || 500; // Get item cooldown (default 500ms)

        // Check if cooldown has elapsed
        if (time < this.playerLastPrimaryActionTime + cooldown) {
            return; // Action is on cooldown
        }
        this.playerLastPrimaryActionTime = time; // Reset cooldown timer

        // Notify UI that action was used (for cooldown visual)
        this.game.events.emit('primaryActionUsed', { cooldown: cooldown });

        // Calculate action direction based on mouse position
        const pX = this.playerContainer.x;
        const pY = this.playerContainer.y;
        const worldX = pointer.worldX; // Get pointer coordinates in world space
        const worldY = pointer.worldY;
        if (isNaN(pX + pY + worldX + worldY)) return; // Invalid coordinates
        const angle = Phaser.Math.Angle.Between(pX, pY, worldX, worldY); // Angle from player to pointer

        // Play sound and visual effect
        this.sound.play('fx_swing', { volume: 0.7 });
        this.animateSwingVisual(this.playerContainer, item, angle);

        // --- Action Logic ---
        // 1. Check for Tree Chopping (priority if axe equipped)
        if (item.type === 'tool' && item.toolType === 'axe') {
            const effectiveRangeSq = (item.range + DAMAGE_RANGE_BONUS) ** 2; // Use effective range
            const attackArc = Math.PI / 2; // 90-degree arc in front of player
            let closestTree = null;
            let minTreeDistSq = Infinity;

            if (this.trees) {
                this.trees.children.iterate((tree) => {
                    // Check if tree is active, actually a tree, and has valid coordinates
                    if (!tree?.active || !tree.getData('isTree') || isNaN(tree.x + tree.y)) return;

                    const distSq = Phaser.Math.Distance.Squared(pX, pY, tree.x, tree.y);
                    // Check if within effective range
                    if (distSq <= effectiveRangeSq) {
                        const angleToTree = Phaser.Math.Angle.Between(pX, pY, tree.x, tree.y);
                        // Check if within the attack arc relative to the player's aim
                        const angleDifference = Phaser.Math.Angle.ShortestBetween(angle, angleToTree);
                        if (Math.abs(angleDifference) <= attackArc / 2 && distSq < minTreeDistSq) {
                            // Found a closer tree within range and arc
                            minTreeDistSq = distSq;
                            closestTree = tree;
                        }
                    }
                });
            }
            // If a valid tree target was found, chop it and stop further action checks
            if (closestTree) {
                this.handleChopTree(closestTree, item);
                return; // Don't also perform an attack check
            }
        }

        // 2. Perform Combat Attack Check (if not chopping or item is a weapon)
        if (item.type === 'weapon' || item.type === 'tool') { // Tools can also be used as weapons
            this.performAttackCheck(item, angle);
        }
    }

    /**
     * Checks for and applies damage to bandits within the weapon's range and attack arc.
     * Called by handlePlayerPrimaryAction.
     * @param {object} weaponItemData Data of the equipped weapon/tool being used.
     * @param {number} attackAngle Angle (radians) of the attack direction.
     */
    performAttackCheck(weaponItemData, attackAngle) {
        if (!this.playerContainer || !weaponItemData) return;

        const pX = this.playerContainer.x;
        const pY = this.playerContainer.y;
        const effectiveRange = (weaponItemData.range + DAMAGE_RANGE_BONUS);
        const effectiveRangeSq = effectiveRange ** 2;
        const attackArc = Math.PI / 2; // 90-degree arc
        const playerRadius = this.characterBodyRadius;

        // Calculate player's attack power for this hit
        const playerBaseAP = this.calculateAttackPower(this.playerContainer);
        const playerTotalAP = Math.floor(playerBaseAP * DIFFICULTY_SETTINGS[currentDifficulty].playerDamageMult); // Apply difficulty mod

        // Iterate through active bandits
        if (this.bandits) {
            this.bandits.children.iterate((bandit) => {
                // Check if bandit is valid and active
                if (!bandit?.active || !bandit.body?.enable || isNaN(bandit.x + bandit.y)) return;

                const bX = bandit.x;
                const bY = bandit.y;
                const banditRadius = this.characterBodyRadius;

                // Broad phase check: distance between centers + radii
                const distSq = Phaser.Math.Distance.Squared(pX, pY, bX, bY);
                if (distSq <= (effectiveRange + playerRadius + banditRadius) ** 2) { // Generous check initially
                    // Narrow phase check: angle and precise range
                    const angleToBandit = Phaser.Math.Angle.Between(pX, pY, bX, bY);
                    if (isNaN(angleToBandit)) return; // Avoid NaN issues

                    const angleDifference = Phaser.Math.Angle.ShortestBetween(attackAngle, angleToBandit);
                    // Check if within arc and strict effective range
                    if (Math.abs(angleDifference) <= attackArc / 2 && distSq <= effectiveRangeSq) {
                        // --- Hit Detected ---
                        const banditDefense = this.calculateEffectiveDefense(bandit);
                        const damage = Math.max(0, playerTotalAP - banditDefense); // Ensure damage isn't negative

                        bandit.health -= damage;

                        if (damage > 0) {
                            // Apply damage effects
                            this.showDamageIndicator(bandit, damage, '#ffcc00'); // Yellow for player damage dealt
                            this.sound.play('fx_hit_flesh', { volume: 0.6 });
                            this.grantStatXp(this.playerContainer, 'might', damage); // Grant Might XP based on damage dealt

                            // Visual feedback on bandit sprite
                            const banditSprite = bandit.sprite;
                            if (banditSprite) {
                                banditSprite.setTint(0xff0000); // Flash red
                                this.time.delayedCall(100, () => {
                                    if (banditSprite?.active) banditSprite.clearTint(); // Remove tint after delay
                                });
                            }
                        } else {
                            // Zero damage hit (blocked by armor)
                            this.showDamageIndicator(bandit, 0, ZERO_DAMAGE_COLOR); // Blue '0'
                            this.sound.play('fx_clink_armor', { volume: 0.5 });
                        }

                        // Apply knockback if weapon has it and damage was dealt
                        const knock = weaponItemData.knockback || 0;
                        if (knock > 0 && damage > 0) {
                            // Push bandit away from player
                             this.tweens.add({
                                targets: bandit,
                                x: bX + Math.cos(angleToBandit) * knock,
                                y: bY + Math.sin(angleToBandit) * knock,
                                duration: 60, // Short duration for knockback effect
                                ease: 'Sine.easeInOut'
                            });
                        }

                        // Check if bandit was defeated
                        if (bandit.health <= 0 && bandit.active) {
                            this.handleBanditDefeat(bandit);
                        }
                    }
                }
            }); // End bandit iteration
        }
    }

    /**
     * Handles the player hitting a tree with an axe.
     * Deals damage to the tree, grants XP, and potentially fells the tree.
     * @param {Phaser.GameObjects.Sprite} tree The tree sprite being chopped.
     * @param {object} toolData Data of the axe being used.
     */
    handleChopTree(tree, toolData) {
        if (!tree?.active || !tree.getData('isTree') || !toolData) return; // Validate input

        let health = tree.getData('health');
        if (health <= 0) return; // Tree already felled

        // Deal damage based on tool power
        const damage = toolData.toolPower || 1; // Default power if not specified
        health -= damage;
        tree.setData('health', health);

        // Show feedback
        this.showDamageIndicator(tree, damage, '#ffffff'); // White indicator for tool damage
        this.sound.play('fx_chop', { volume: 0.5 });
        // Slight shake effect on the tree
        this.tweens.add({
            targets: tree,
            x: tree.x + Phaser.Math.Between(-2, 2),
            y: tree.y + Phaser.Math.Between(-1, 1),
            duration: 50,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        // Grant Woodcutting XP (currently tied to Might stat)
        this.grantStatXp(this.playerContainer, 'might', 5); // Example: 5 Might XP per chop

        // Check if tree is felled
        if (health <= 0) {
            this.handleTreeFelled(tree);
        }
    }

    /**
     * Handles the felling of a tree.
     * Plays animation/sound, destroys the tree object, and drops logs.
     * @param {Phaser.GameObjects.Sprite} tree The tree that was felled.
     */
    handleTreeFelled(tree) {
        if (!tree?.active) return;

        tree.active = false; // Mark as inactive
        if (tree.body) tree.body.enable = false; // Disable physics

        // Fade out and destroy the tree sprite
        this.tweens.add({
            targets: tree,
            alpha: 0,
            duration: 300,
            ease: 'Power1',
            onComplete: () => {
                tree.destroy();
            }
        });

        // --- Drop Logs ---
        const numLogs = Phaser.Math.Between(1, 3); // Random number of logs
        const dropX = tree.x;
        // Drop slightly below the tree's base
        const dropY = tree.y + (tree.displayHeight * (1 - tree.originY)) / 2;
        const logItemDef = ITEMS['log'];
        const iconKey = logItemDef?.iconKey;
        const itemType = 'log';
        const itemValue = 1; // Each log sprite represents 1 log item

        if (!iconKey) {
            console.error("handleTreeFelled: Log item definition or iconKey missing.");
            return;
        }

        const spread = 25; // How far logs can scatter from the drop point
        const logScale = 0.4; // Scale for the dropped log sprites

        // Create multiple log sprites
        for (let i = 0; i < numLogs; i++) {
            const dX = dropX + Phaser.Math.Between(-spread, spread);
            const dY = dropY + Phaser.Math.Between(-spread, spread);
            const drop = this.add.sprite(dX, dY, iconKey).setScale(logScale).setDepth(dY); // Depth sort based on Y

            // Add physics body for pickup overlap
            this.physics.add.existing(drop, false); // Static body (false)
            if (drop.body) {
                const radius = 80 * logScale; // Approximate radius based on visual size
                const centerX = drop.displayWidth / 2;
                const centerY = drop.displayHeight / 2;
                const offsetX = centerX - radius; // Offset to center the circle body
                const offsetY = centerY - radius;
                const horizontalShift = 39;  // Example: Move hitbox 5 pixels right (5)
                const verticalShift = 34; // Example: Move hitbox 3 pixels up (-3)

                // --- Apply the shift when setting the circle ---
                drop.body.setCircle(radius, offsetX + horizontalShift, offsetY + verticalShift)
                         .setCollideWorldBounds(true) // Prevent logs flying out of bounds
                         .setAllowGravity(false);
            }
            // Store item data on the sprite for pickup
            drop.setData('itemType', itemType);
            drop.setData('value', itemValue); // How many items this drop represents (usually 1)
            this.lootItems.add(drop); // Add to the loot group
        }
    }

    /**
     * Handles Right Mouse Button click for off-hand actions (currently only shield block).
     * Checks cooldowns, sets blocking state, plays sounds/visuals.
     * @param {Phaser.Input.Pointer} pointer The pointer object from the input event.
     */
    handlePlayerOffHandAction(pointer) {
        if (!this.playerContainer?.active || this.playerContainer.health <= 0 || !pointer.active || this.isDialogueVisible) {
            return; // Cannot act
        }

        const item = this.playerContainer.equippedOffHand;
        if (!item || item.type !== 'shield') return; // Only shields have RMB action currently

        const time = this.time.now;
        const cooldown = item.cooldown || 1000; // Shield cooldown
        const duration = item.blockDuration || 800; // How long block lasts

        // Check cooldown and if already blocking
        if (time < this.playerLastOffHandActionTime + cooldown || this.playerContainer.isBlocking) {
            return;
        }

        // Start block
        this.playerLastOffHandActionTime = time; // Reset cooldown timer
        this.playerContainer.isBlocking = true;
        this.playerContainer.blockEndTime = time + duration; // Set when block naturally ends

        // Determine block direction (towards mouse pointer)
        const pX = this.playerContainer.x;
        const pY = this.playerContainer.y;
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        let blockAngle = 0;
        if (!isNaN(pX + pY + worldX + worldY)) {
             blockAngle = Phaser.Math.Angle.Between(pX, pY, worldX, worldY);
             this.playerContainer.blockDirectionAngle = blockAngle; // Store the angle
        } else {
             this.playerContainer.blockDirectionAngle = 0; // Default if coordinates invalid
        }


        // Notify UI for cooldown visual
        this.game.events.emit('offHandActionUsed', { cooldown: cooldown });

        // Play sound and visual feedback
        this.sound.play('fx_swing', { volume: 0.6 }); // Generic swing sound for now
        const playerSprite = this.playerContainer.sprite;
        if (playerSprite) {
            playerSprite.setTintFill(0xaaaaaa); // Tint player grey while blocking
        }

        // Destroy previous block visual if it exists
        if (this.playerContainer.blockVisualSprite?.scene) {
             this.playerContainer.blockVisualSprite.destroy();
             this.playerContainer.blockVisualSprite = null;
        }
        // Create the new shield block visual
        this.animateSwingVisual(this.playerContainer, item, blockAngle);
    }

    /**
     * Handles the defeat of a bandit.
     * Marks bandit inactive, plays sound/visuals, drops loot, and schedules destruction.
     * @param {Phaser.GameObjects.Container} bandit The bandit container that was defeated.
     */
    handleBanditDefeat(bandit) {
        if (!bandit) return;

        bandit.active = false; // Mark as inactive immediately
        if (bandit.body) bandit.body.enable = false; // Disable physics collision

        // Visual feedback for death
        const sprite = bandit.sprite;
        if (sprite) {
             // Fade slightly (or play death animation later)
             this.tweens.add({ targets: sprite, alpha: 0.4, duration: 150 });
        } else {
            bandit.setAlpha(0.4); // Fallback if no sprite ref
        }
        this.tweens.killTweensOf(bandit); // Stop any existing movement/attack tweens
        this.sound.play('fx_death_thump', { volume: 0.8 });

        // --- Drop Loot ---
        const dropX = bandit.x;
        const dropY = bandit.y;
        const dropChanceGold = 0.9; // 90% chance to drop gold
        const dropChancePotion = 0.3; // 30% chance *if* gold drops, to drop a potion instead
        const lootScale = 0.4; // Scale for dropped item sprites
        const lootRadius = 64 * lootScale; // Physics radius for item sprites

        if (Math.random() < dropChanceGold) {
            let itemType = 'gold';
            let itemValue = 1;
            let iconKey = null;

            // Decide between gold or potion
            if (Math.random() < dropChancePotion && ITEMS['health_potion']) {
                itemType = 'health_potion';
                itemValue = 1; // Drop one potion
                iconKey = ITEMS[itemType]?.iconKey;
            } else {
                itemType = 'gold';
                itemValue = Phaser.Math.Between(5, 20); // Drop random amount of gold
            }

            let dropObject = null;
            // Create visual/physics object for the drop
            if (itemType === 'gold') {
                // Use a simple circle for gold drops
                dropObject = this.add.circle(dropX, dropY, 6, 0xFFD700, 1).setStrokeStyle(1, 0xccab00);
                this.physics.add.existing(dropObject, false);
                if (dropObject.body) dropObject.body.setCircle(6);
            } else if (iconKey) {
                // --- Item Drop Handling (e.g., Potions) ---
                dropObject = this.add.sprite(dropX, dropY, iconKey).setScale(lootScale);
                this.physics.add.existing(dropObject, false);
                if (dropObject.body) {
                    // Calculate the base offset required to center the circle's bounding box
                    const spriteWidth = dropObject.displayWidth;
                    const spriteHeight = dropObject.displayHeight;
                    const baseOffsetX = spriteWidth / 2 - lootRadius;
                    const baseOffsetY = spriteHeight / 2 - lootRadius;

                    // --- Define your desired pixel shifts here ---
                    const horizontalShift = 34;  // Example: No horizontal shift (0)
                    const verticalShift = 36;  // Example: Move hitbox 5 pixels down (5)

                    // Apply the base offset + your shift when setting the circle
                    dropObject.body.setCircle(lootRadius, baseOffsetX + horizontalShift, baseOffsetY + verticalShift)
                                   .setCollideWorldBounds(true)
                                   .setAllowGravity(false);
                }
            }

            // If drop was created, set data and add to group
            if (dropObject) {
                dropObject.setDepth(dropObject.y) // Depth sort
                          .setData('itemType', itemType)
                          .setData('value', itemValue);
                if (this.lootItems) this.lootItems.add(dropObject);
            }
        }

        // Schedule the final destruction of the bandit container after a delay
        this.time.delayedCall(2000, () => {
            // Check if bandit still exists and is inactive before destroying
            if (bandit && !bandit.active) {
                bandit.destroy();
            }
        });
    }

    /**
     * Handles the player overlapping with a loot item.
     * Adds the item/gold to the player's inventory/stats and destroys the loot object.
     * @param {Phaser.GameObjects.Container} playerContainer The player container.
     * @param {Phaser.GameObjects.Sprite | Phaser.GameObjects.Shape} lootItem The loot item sprite/shape.
     */
    handlePlayerLootPickup(playerContainer, lootItem) {
        if (!lootItem?.active || !playerContainer?.active) return; // Ensure both are valid

        const itemType = lootItem.getData('itemType');
        const itemValue = lootItem.getData('value') || 1; // Amount (e.g., gold amount, stack size)
        let pickupSuccess = false;
        let pickupSound = null;

        const itemDefinition = ITEMS[itemType]; // Get definition if it's a known item ID

        // Handle Gold Pickup
        if (itemType === 'gold') {
            playerContainer.gold += itemValue;
            pickupSuccess = true;
            pickupSound = 'fx_pickup_coin';
            this.emitStatsChanged(); // Update UI for gold change
        }
        // Handle Item Pickup
        else if (itemDefinition) {
            let addedToInventory = false;
            // Try stacking first if applicable
            if (itemDefinition.stackable) {
                const maxStackSize = itemDefinition.maxStack || 999; // Default max stack if not defined
                // Find an existing stack of the same item with space
                let existingStackIndex = playerContainer.inventoryGrid.findIndex(
                    slot => slot?.id === itemDefinition.id && slot.quantity < maxStackSize
                );
                if (existingStackIndex !== -1) {
                    const currentStack = playerContainer.inventoryGrid[existingStackIndex];
                    const spaceAvailable = maxStackSize - currentStack.quantity;
                    const amountToAdd = Math.min(itemValue, spaceAvailable); // Add up to available space

                    currentStack.quantity += amountToAdd;
                    // Note: If itemValue > spaceAvailable, the remainder isn't handled here.
                    // Assumes lootItem value is usually 1 for stackable items. Needs adjustment for larger drops.
                    addedToInventory = true;
                    pickupSuccess = true; // Assume pickup succeeded even if only partial stack added
                }
            }

            // If not stacked, try finding an empty slot
            if (!addedToInventory) {
                let emptySlotIndex = playerContainer.inventoryGrid.findIndex(slot => slot === null);
                if (emptySlotIndex !== -1) {
                    // Add item to the empty slot (create a copy of the definition)
                    playerContainer.inventoryGrid[emptySlotIndex] = {
                        ...itemDefinition,
                        quantity: itemValue // Set initial quantity from the loot drop
                    };
                    addedToInventory = true;
                    pickupSuccess = true;
                } else {
                    // Inventory full, cannot pick up
                    pickupSuccess = false;
                    console.log("Inventory full, cannot pick up", itemType);
                     // Optional: Add feedback like a sound or message for full inventory
                }
            }

            // If successfully added (stacked or new slot), play sound and update UI
            if (pickupSuccess) {
                pickupSound = (itemType === 'log') ? 'fx_pickup_wood' : 'fx_pickup_item'; // Specific sound for logs
                this.game.events.emit('inventoryChanged', playerContainer.inventoryGrid); // Update inventory UI
            }
        } else {
            // Item type not recognized (and not gold)
            console.warn("handlePlayerLootPickup: Unknown itemType:", itemType);
            return; // Don't destroy the unknown item
        }


        // If pickup was successful, play sound and destroy the loot object
        if (pickupSuccess) {
            if (pickupSound) {
                this.sound.play(pickupSound, { volume: 0.5 });
            }
            lootItem.active = false;
            if (lootItem.body) lootItem.body.enable = false;
            lootItem.destroy();
        }
    }

    /**
     * Toggles the visibility of the physics debug graphics overlay.
     * Bound to the 'P' key.
     */
    toggleDebugGraphics() {
        try {
            const currentDebugState = this.physics.world.drawDebug;
            this.physics.world.drawDebug = !currentDebugState; // Toggle the flag

            // Ensure the debug graphic exists and set its visibility
            if (this.physics.world.drawDebug) {
                // If enabling debug draw, create the graphic if it doesn't exist
                if (!this.physics.world.debugGraphic) {
                    this.physics.world.createDebugGraphic();
                }
                 // Make sure it's visible
                 if (this.physics.world.debugGraphic) this.physics.world.debugGraphic.visible = true;
            } else {
                // If disabling, just hide the graphic if it exists
                 if (this.physics.world.debugGraphic) this.physics.world.debugGraphic.visible = false;
            }
            console.log("Physics Debug Toggled:", this.physics.world.drawDebug);
        } catch (e) {
            console.error("Error toggling debug graphics:", e);
        }
    }

    /**
     * Handles the 'Q' key press to use the first available health potion from inventory.
     */
    handleUseItem() {
        if (!this.playerContainer?.active || this.playerContainer.health <= 0 || this.isDialogueVisible) {
            return; // Cannot use items if dead or in dialogue
        }

        const inventory = this.playerContainer.inventoryGrid;
        if (!inventory) return;

        // Find the index of the first health potion
        const potionIndex = inventory.findIndex(slot => slot?.id === 'health_potion');

        if (potionIndex !== -1) {
            const potionItemDef = ITEMS['health_potion'];
            const healAmount = potionItemDef?.healAmount || 50; // Get heal amount from definition
            const currentHealth = this.playerContainer.health;
            const maxHealth = this.playerContainer.maxHealth;

            // Don't use if already at max health
            if (currentHealth >= maxHealth) return;

            // Apply healing
            const newHealth = Math.min(maxHealth, currentHealth + healAmount); // Heal up to max health
            const restoredAmount = newHealth - currentHealth; // Calculate actual health restored
            this.playerContainer.health = newHealth;

            // Decrement potion quantity or remove from inventory
            const potionSlot = inventory[potionIndex];
            if (potionSlot.quantity > 1) {
                potionSlot.quantity--;
            } else {
                inventory[potionIndex] = null; // Remove the item if quantity was 1
            }

            // Provide feedback
            this.sound.play('fx_slurp', { volume: 0.8 });
            this.emitStatsChanged(); // Update health bar
            this.game.events.emit('inventoryChanged', inventory); // Update inventory UI

            // Optional: Visual effect on player (e.g., brief green tint)
            let sprite = this.playerContainer.sprite;
            if (sprite) {
                sprite.setTintFill(0x00ff00); // Green tint
                this.time.delayedCall(150, () => {
                    // Ensure sprite still exists and is active before clearing tint
                    if (sprite?.active) sprite.clearTint();
                });
            }
            // Optional: Show floating "+HP" text
            // this.showDamageIndicator(this.playerContainer, restoredAmount, '#00ff00'); // Can reuse damage indicator
        }
        // else: No potion found, optionally play an 'error' sound
    }


    // =========================================================================
    // Scene Lifecycle Methods: update() & AI
    // =========================================================================

    /**
     * Updates the state of a single NPC (bandit or villager).
     * Handles AI state transitions, movement, attacking (for bandits), and animation.
     * Excludes player logic.
     * @param {Phaser.GameObjects.Container} character The NPC container to update.
     * @param {number} time The current game time.
     * @param {number} delta The time elapsed since the last frame (in ms).
     */
    updateCharacterAI(character, time, delta) {
        // Basic validation
        if (!character?.active || !character.body || !character.currentMoveDir || !character.sprite) {
            return;
        }

        // --- State: Dialoguing ---
        // Handle separately - NPC should stop and face the player.
        if (character.aiState === 'dialoguing') {
            character.body.setVelocity(0, 0); // Ensure stopped

            const sprite = character.sprite;
            // Attempt to face the player if the player exists and is active
            if (this.playerContainer?.active) {
                const playerX = this.playerContainer.x;
                const playerY = this.playerContainer.y;
                const npcX = character.x;
                const npcY = character.y;
                const vecToPlayer = new Phaser.Math.Vector2(playerX - npcX, playerY - npcY);

                // Store facing direction (even if not animating)
                character.currentMoveDir.set(vecToPlayer.x, vecToPlayer.y);

                // Stop animation and set idle frame based on facing direction
                if (sprite?.anims) {
                    if (sprite.anims.isPlaying) sprite.anims.stop();

                    // Determine idle frame based on which axis has larger magnitude
                    if (Math.abs(vecToPlayer.y) > Math.abs(vecToPlayer.x)) {
                        // More vertical distance: Face Up or Down
                        sprite.setFrame(vecToPlayer.y > 0 ? 1 : 10); // Frame 1 (Down), Frame 10 (Up)
                    } else {
                        // More horizontal distance: Face Left or Right
                        sprite.setFrame(vecToPlayer.x > 0 ? 7 : 4); // Frame 7 (Right), Frame 4 (Left)
                    }
                }
            } else if (sprite?.anims?.isPlaying) {
                 // If player is inactive, just stop animation and face default (down)
                 sprite.anims.stop();
                 sprite.setFrame(1);
            }
            return; // Skip rest of AI logic while dialoguing
        }

        // --- Standard AI Update ---
        let isPlayerActive = (this.playerContainer?.active && this.playerContainer.health > 0);
        const currentSpeed = character.wasInWater ? character.slowSpeed : character.speed; // Use appropriate speed
        character.wasInWater = character.isInWater; // Update water state history
        character.isInWater = false; // Reset flag for this frame (will be set by overlap if true)

        // Decrement AI timers
        character.aiMoveTimer -= delta;
        if (character.npcType === 'bandit') character.aiAttackTimer -= delta;

        let isChasingPlayer = false; // Flag if bandit is actively pursuing player this frame
        let targetVelocityX = 0;
        let targetVelocityY = 0;
        let desiredMoveDirection = character.currentMoveDir; // Start with current facing direction

        // --- Bandit Combat AI ---
        if (character.npcType === 'bandit' && isPlayerActive) {
            const weapon = character.equippedPrimary;
            const weaponRange = weapon?.range || 30; // Default range if no weapon
            const effectiveDamageRange = weaponRange + DAMAGE_RANGE_BONUS;
            const effectiveDamageRangeSq = effectiveDamageRange ** 2;
            // Activation range: slightly less than max range, to start attacking just before max reach
            const activationRangeSq = (effectiveDamageRange * 0.85) ** 2;
            const aggroRangeSq = 300 ** 2; // How far bandits can detect the player

            const pX = this.playerContainer.x;
            const pY = this.playerContainer.y;
            const bX = character.x;
            const bY = character.y;

            if (!isNaN(pX + pY + bX + bY)) { // Ensure coordinates are valid
                const distSqToPlayer = Phaser.Math.Distance.Squared(pX, pY, bX, bY);

                // Check if player is within aggro range
                if (distSqToPlayer <= aggroRangeSq) {
                    const angleToPlayer = Phaser.Math.Angle.Between(bX, bY, pX, pY);
                    const dirToPlayer = new Phaser.Math.Vector2(pX - bX, pY - bY).normalize();
                    desiredMoveDirection.set(dirToPlayer.x, dirToPlayer.y); // Set desired direction towards player

                    // State: Attacking (Player within activation range)
                    if (distSqToPlayer <= activationRangeSq) {
                        character.aiState = 'attacking';
                        isChasingPlayer = true; // Still considered chasing visually
                        targetVelocityX = 0; // Stop moving to attack
                        targetVelocityY = 0;

                        // Check attack cooldown and if player is within actual damage range
                        if (character.aiAttackTimer <= 0 && distSqToPlayer <= effectiveDamageRangeSq) {
                             if (weapon) {
                                // --- Perform Attack ---
                                this.sound.play('fx_swing', { volume: 0.5 });
                                this.animateSwingVisual(character, weapon, angleToPlayer);

                                // Calculate Bandit Damage
                                const baseBanditAP = this.calculateAttackPower(character);
                                const banditTotalAP = Math.floor(baseBanditAP * DIFFICULTY_SETTINGS[currentDifficulty].enemyDamageMult); // Apply difficulty

                                // Calculate Player Defense (including active block)
                                const playerBaseDefense = this.calculateEffectiveDefense(this.playerContainer);
                                const isPlayerBlocking = this.playerContainer.isBlocking && time < this.playerContainer.blockEndTime;
                                let blockSuccessful = false;
                                let shieldDefenseBonus = 0;
                                let finalPlayerDefense = playerBaseDefense;

                                if (isPlayerBlocking) {
                                    // Check if block angle is effective against attack direction
                                    const angleFromPlayerToBandit = Phaser.Math.Angle.Between(pX, pY, bX, bY);
                                    const playerBlockAngle = this.playerContainer.blockDirectionAngle;
                                    const angleDifference = Phaser.Math.Angle.ShortestBetween(playerBlockAngle, angleFromPlayerToBandit);

                                    if (Math.abs(angleDifference) <= BLOCK_ARC_RADIANS / 2) {
                                        // Block direction is correct
                                        const shield = this.playerContainer.equippedOffHand;
                                        shieldDefenseBonus = shield?.defenseBonus || 0;
                                        if (shieldDefenseBonus > 0) {
                                            finalPlayerDefense += shieldDefenseBonus; // Add shield bonus only on successful block
                                            blockSuccessful = true;
                                        }
                                    }
                                }

                                // Calculate Damage Dealt to Player
                                const damageDealtToPlayer = Math.max(0, banditTotalAP - finalPlayerDefense);
                                let enduranceXpFromDamage = 0;
                                let enduranceXpFromBlock = 0;

                                // Apply damage and feedback
                                if (damageDealtToPlayer > 0) {
                                    this.playerContainer.health -= damageDealtToPlayer;
                                    this.showDamageIndicator(this.playerContainer, damageDealtToPlayer, '#ff0000'); // Red for damage taken
                                    this.sound.play('fx_hit_flesh', { volume: 0.8 });
                                    if (this.cameras.main) this.cameras.main.shake(100, 0.006); // Camera shake on hit

                                    // Tint player sprite red briefly
                                    const playerSprite = this.playerContainer.sprite;
                                    if (playerSprite) {
                                        playerSprite.setTint(0xff0000);
                                        this.time.delayedCall(100, () => { if (playerSprite?.active) playerSprite.clearTint(); });
                                    }
                                    this.emitStatsChanged(); // Update health bar
                                    enduranceXpFromDamage = damageDealtToPlayer * ENDURANCE_XP_PER_DAMAGE;
                                } else {
                                    // Zero damage (hit blocked or armor too high)
                                    this.showDamageIndicator(this.playerContainer, 0, ZERO_DAMAGE_COLOR);
                                    this.sound.play('fx_clink_armor', { volume: blockSuccessful ? 0.7 : 0.5 }); // Louder clink if blocked
                                }

                                // Grant Endurance XP for blocking (if successful)
                                if (blockSuccessful) {
                                    // Calculate potential damage *without* the shield bonus
                                    const potentialDamage = Math.max(0, banditTotalAP - playerBaseDefense);
                                    const mitigatedDamage = Math.max(0, potentialDamage - damageDealtToPlayer); // Damage actually stopped by the block
                                    if (mitigatedDamage > 0) {
                                        enduranceXpFromBlock = mitigatedDamage * ENDURANCE_XP_PER_BLOCK_MITIGATION;
                                    }
                                }

                                // Grant total Endurance XP gained
                                if (enduranceXpFromDamage > 0 || enduranceXpFromBlock > 0) {
                                    this.grantStatXp(this.playerContainer, 'endurance', enduranceXpFromDamage + enduranceXpFromBlock);
                                }

                                // Reset attack timer
                                character.aiAttackTimer = weapon.cooldown || this.banditAttackCooldown;
                             }
                        } else if (character.aiAttackTimer <= 0) {
                            // If attack is off cooldown but player isn't in range, reset timer slightly
                            // so bandit doesn't immediately attack if player steps back in range.
                             character.aiAttackTimer = (weapon?.cooldown || this.banditAttackCooldown) / 4;
                        }

                    }
                    // State: Chasing (Player in aggro range but not attack range)
                    else {
                        character.aiState = 'chasing';
                        isChasingPlayer = true;
                        // Move towards player
                        targetVelocityX = desiredMoveDirection.x * currentSpeed;
                        targetVelocityY = desiredMoveDirection.y * currentSpeed;
                    }
                }
                // Player outside aggro range
                else {
                    // If bandit *was* chasing/attacking, transition back to idle
                    if (character.aiState === 'chasing' || character.aiState === 'attacking') {
                        character.aiState = 'idle';
                        character.aiMoveTimer = Phaser.Math.Between(500, 1500); // Short idle after losing target
                    }
                    isChasingPlayer = false;
                }
            } // End coordinate validity check
        } // End Bandit AI section

        // --- Wandering AI (Villagers, or Bandits not chasing) ---
        if (!isChasingPlayer) {
            // State: Idle
            if (character.aiState === 'idle') {
                targetVelocityX = 0;
                targetVelocityY = 0;
                // If idle timer expires, choose a random direction and switch to moving state
                if (character.aiMoveTimer <= 0) {
                    const randomDirection = Phaser.Math.Between(0, 3); // 0:Up, 1:Right, 2:Down, 3:Left
                    let dx = 0, dy = 0;
                    switch (randomDirection) {
                        case 0: dy = -1; break;
                        case 1: dx = 1; break;
                        case 2: dy = 1; break;
                        case 3: dx = -1; break;
                    }
                    desiredMoveDirection.set(dx, dy); // Set direction for movement
                    character.currentMoveDir.set(dx, dy); // Store intended direction
                    character.aiState = 'moving';
                    character.aiMoveTimer = Phaser.Math.Between(2000, 4500); // Set duration for movement
                    targetVelocityX = dx * currentSpeed; // Start moving
                    targetVelocityY = dy * currentSpeed;
                }
            }
            // State: Moving
            else if (character.aiState === 'moving') {
                // If move timer expires, switch back to idle state
                if (character.aiMoveTimer <= 0) {
                    character.aiState = 'idle';
                    character.aiMoveTimer = Phaser.Math.Between(1500, 4000); // Set duration for idle
                    targetVelocityX = 0;
                    targetVelocityY = 0;
                } else {
                    // Continue moving in the current direction
                    targetVelocityX = character.currentMoveDir.x * currentSpeed;
                    targetVelocityY = character.currentMoveDir.y * currentSpeed;
                    desiredMoveDirection.set(character.currentMoveDir.x, character.currentMoveDir.y); // Maintain direction
                }
            }
        } // End Wandering AI

        // --- Apply Final Velocity ---
        if (character.body) {
            character.body.setVelocity(targetVelocityX, targetVelocityY);
        } else return; // Should not happen if character is valid

        // Update stored facing direction if intending to move or chasing
        if (targetVelocityX !== 0 || targetVelocityY !== 0 || isChasingPlayer) {
            character.currentMoveDir.set(desiredMoveDirection.x, desiredMoveDirection.y);
        }

        // --- Animation Control ---
        const sprite = character.sprite;
        const animPrefix = character.npcType; // e.g., 'bandit', 'villager'
        // Check if the body's velocity magnitude is significant enough to be considered moving
        let isActuallyMoving = (character.body && character.body.velocity.lengthSq() > 1); // Use lengthSq for efficiency

        if (sprite?.anims) {
            if (isActuallyMoving) {
                // --- Play Walking Animation based on Velocity ---
                const vel = character.body.velocity;
                // Determine direction based on largest component of velocity
                if (Math.abs(vel.y) > Math.abs(vel.x)) { // Moving vertically more
                    sprite.play(`${animPrefix}_walk_${vel.y > 0 ? 'down' : 'up'}`, true); // Play 'down' or 'up' animation
                } else { // Moving horizontally more (or equal)
                    sprite.play(`${animPrefix}_walk_${vel.x > 0 ? 'right' : 'left'}`, true); // Play 'right' or 'left' animation
                }

                // --- Play Footstep Sounds (if player is nearby) ---
                 if (isPlayerActive && character.npcType !== 'player') { // Don't play own footsteps here
                    if (time > character.lastFootstepTime + this.footstepDelay) {
                         // Check distance to player
                         const distSqToPlayer = Phaser.Math.Distance.Squared(character.x, character.y, this.playerContainer.x, this.playerContainer.y);
                         if (distSqToPlayer < this.npcFootstepHearingRadiusSq) {
                             this.sound.play('fx_step', { volume: 0.3 }); // Play sound at reduced volume
                             character.lastFootstepTime = time; // Reset timer
                         }
                    }
                 }
            } else {
                // --- Not Moving: Stop Animation and Set Idle Frame ---
                if (sprite.anims.isPlaying) {
                    sprite.anims.stop(); // Stop the current animation
                }
                // Set idle frame based on the last intended movement direction (currentMoveDir)
                const idleDir = character.currentMoveDir;
                if (Math.abs(idleDir.y) > Math.abs(idleDir.x)) { // Faced vertically last
                    sprite.setFrame(idleDir.y > 0 ? 1 : 10); // Down (1) or Up (10)
                } else { // Faced horizontally last
                    sprite.setFrame(idleDir.x > 0 ? 7 : 4); // Right (7) or Left (4)
                }
                 // Default frame if direction is somehow zero (e.g., initial state before any movement)
                 if (idleDir.x === 0 && idleDir.y === 0 && sprite.texture.key.includes('sheet')) {
                    sprite.setFrame(1); // Default to facing down
                 }
            }
        } // End Animation Control
    } // End updateCharacterAI


    /**
     * Main scene update loop. Called every frame.
     * Handles player input, movement, animation, block state, and updates NPCs.
     * Also manages dialogue closing based on distance.
     * @param {number} time The current game time.
     * @param {number} delta The time elapsed since the last frame (in ms).
     */
    update(time, delta) {
        // --- Player Update ---
        if (this.playerContainer?.active) {
            const currentSpeed = this.playerContainer.wasInWater ? this.playerSlowSpeed : this.playerSpeed;
            this.playerContainer.wasInWater = this.playerContainer.isInWater; // Update water state history
            this.playerContainer.isInWater = false; // Reset flag (will be set by overlap)

            // Check if block duration has expired
            if (this.playerContainer.isBlocking && time > this.playerContainer.blockEndTime) {
                const sprite = this.playerContainer.sprite;
                if (sprite?.tintFill) sprite.clearTint(); // Remove block tint
                this.playerContainer.isBlocking = false;

                // Fade out and destroy the block visual sprite
                const blockVisual = this.playerContainer.blockVisualSprite;
                if (blockVisual?.scene) { // Check if it exists and belongs to a scene
                    this.tweens.add({
                        targets: blockVisual,
                        x: 0, // Optional: Move back towards player center
                        y: 0,
                        alpha: 0,
                        duration: 150,
                        ease: 'Quad.easeIn',
                        onComplete: () => {
                            if (blockVisual?.scene) blockVisual.destroy();
                            // Clear reference only if it's the same visual we started fading
                            if (this.playerContainer.blockVisualSprite === blockVisual) {
                                this.playerContainer.blockVisualSprite = null;
                            }
                        }
                    });
                }
            }

            // Player Movement Input (WASD)
            let moveX = 0;
            let moveY = 0;
            if (this.cursors?.left.isDown) moveX = -1;
            else if (this.cursors?.right.isDown) moveX = 1;
            if (this.cursors?.up.isDown) moveY = -1;
            else if (this.cursors?.down.isDown) moveY = 1;

            // Apply velocity and animation based on input
            if (this.playerContainer.body) {
                let isMoving = (moveX !== 0 || moveY !== 0);

                if (isMoving) {
                    // Normalize vector for consistent speed diagonally
                    const direction = new Phaser.Math.Vector2(moveX, moveY).normalize();
                    this.playerContainer.body.setVelocity(direction.x * currentSpeed, direction.y * currentSpeed);

                    // Play walking animation based on direction
                    const sprite = this.playerContainer.sprite;
                    if (sprite?.anims) {
                        if (Math.abs(moveY) > Math.abs(moveX)) { // Moving more vertically
                            sprite.play(`player_walk_${moveY > 0 ? 'down' : 'up'}`, true);
                        } else { // Moving more horizontally
                            sprite.play(`player_walk_${moveX > 0 ? 'right' : 'left'}`, true);
                        }
                    }

                    // Play footstep sound (throttled)
                    if (time > this.lastPlayerFootstepTime + this.footstepDelay) {
                        this.sound.play('fx_step', { volume: 0.4 });
                        this.lastPlayerFootstepTime = time;
                    }
                } else {
                    // Stop movement and animation if no input
                    this.playerContainer.body.setVelocity(0);
                    const sprite = this.playerContainer.sprite;
                    if (sprite?.anims?.isPlaying) {
                        // Stop animation and set idle frame based on last animation key
                        const currentAnimKey = sprite.anims.currentAnim?.key || 'player_walk_down';
                        sprite.anims.stop();
                        if (currentAnimKey.includes('down')) sprite.setFrame(1);
                        else if (currentAnimKey.includes('left')) sprite.setFrame(4);
                        else if (currentAnimKey.includes('right')) sprite.setFrame(7);
                        else if (currentAnimKey.includes('up')) sprite.setFrame(10);
                        else sprite.setFrame(1); // Default idle frame
                    } else if (sprite?.texture.key === 'player_sheet' && sprite?.frame.name === '__BASE') {
                         // Handle case where sprite might be on the base frame initially
                         sprite.setFrame(1);
                    }
                }
            }

            // Update player depth based on Y position for pseudo-3D sorting
            this.playerContainer.setDepth(this.playerContainer.y);

            // Check for player death
            if (this.playerContainer.health <= 0 && this.playerContainer.active) {
                this.handlePlayerDeath();
            }

        } // End Player Update

        // --- NPC Updates ---
        try {
            // Update Bandits
            if (this.bandits) {
                this.bandits.children.iterate((bandit) => {
                    if (bandit?.active) {
                        this.updateCharacterAI(bandit, time, delta);
                        bandit.setDepth(bandit.y); // Update depth for sorting
                    }
                });
            }
            // Update Villagers
            if (this.villagers) {
                this.villagers.children.iterate((villager) => {
                    if (villager?.active) {
                        this.updateCharacterAI(villager, time, delta);
                        villager.setDepth(villager.y); // Update depth
                    }
                });
            }
        } catch(e) {
             console.error("Error during NPC update loop:", e);
        }


        // --- Dialogue Distance Check ---
        // If dialogue is active, check if player moved too far from the NPC
        if (this.isDialogueVisible && this.conversantNPC) {
            // Ensure both player and NPC are valid before checking distance
            if (!this.playerContainer || !this.conversantNPC.active ||
                isNaN(this.playerContainer.x) || isNaN(this.conversantNPC.x))
            {
                this.handleDialogueCloseDistance(); // Close dialogue if player/NPC invalid
            } else {
                const distanceSq = Phaser.Math.Distance.Squared(
                    this.playerContainer.x, this.playerContainer.y,
                    this.conversantNPC.x, this.conversantNPC.y
                );
                if (distanceSq > this.dialogueBreakDistanceSq) {
                    this.handleDialogueCloseDistance(); // Close dialogue if too far
                }
            }
        }

    } // End update()


    // =========================================================================
    // Game State Handlers
    // =========================================================================

    /**
     * Handles the player character's death.
     * Pauses physics, plays effects, marks player inactive, resets NPC dialogue state.
     */
    handlePlayerDeath() {
        console.error("--- GAME OVER ---"); // Log death
        this.sound.play('fx_death_thump', { volume: 1.0 });
        this.physics.pause(); // Stop all physics updates

        // Visual feedback
        const playerSprite = this.playerContainer.sprite;
        if (playerSprite) playerSprite.setTint(0xff0000); // Tint red

        // Mark player as inactive
        this.playerContainer.active = false;
        if (this.playerContainer.body) this.playerContainer.body.setVelocity(0); // Stop any residual movement

        // If player died during dialogue, reset the NPC's state and close the dialogue UI
        if (this.conversantNPC && this.conversantNPC.active && this.conversantNPC.aiState === 'dialoguing') {
            this.conversantNPC.aiState = 'idle';
            this.conversantNPC.aiMoveTimer = Phaser.Math.Between(1000, 2500);
            if (this.isDialogueVisible) {
                 this.game.events.emit('hideDialogue'); // Tell UI scene to close the box
            }
        }
        this.isDialogueVisible = false; // Ensure game scene flag is reset
        this.conversantNPC = null;

        // Future: Add respawn logic or game over screen transition here
    }

    /**
     * Handles closing the dialogue when the player moves too far away.
     * Emits event to hide the UI.
     */
    handleDialogueCloseDistance() {
        if (this.isDialogueVisible) {
            console.log("Player moved too far, closing dialogue.");
            // Event triggers dialogueCompleted listener which resets NPC state
            this.game.events.emit('hideDialogue');
        }
        // Note: isDialogueVisible and conversantNPC are reset by the dialogueCompleted listener
    }

} // End of class GameScene