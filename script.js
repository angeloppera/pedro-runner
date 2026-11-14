
/* ============================================
   CUSTOMIZATION AND ADJUSTMENT — JAVASCRIPT
   Modify the values below to customize
   images, positions, sizes, and gameplay.
   ============================================ */

const CONFIG = {

    // A. IMAGE ASSETS
    assets: {
        runner: "assets/runner.png",
        obstacle1: "assets/obstacle1.png",
        obstacle2: "assets/obstacle2.png",
        background: "assets/background.png",
        doodad1: "assets/doodad1.png",
        doodad2: "assets/doodad2.png"
    },

    // B. RUNNER
    runner: {
        x: 125,
        yOffset: 0,
        maxWidth: 96,
        maxHeight: 116,
        imageOffsetX: 0,
        imageOffsetY: 0,
        jumpStrength: -20,
        gravity: 0.75,
        hitboxPaddingX: 3,
        hitboxPaddingY: 3
    },

    // C. OBSTACLE 1
    obstacle1: {
        maxWidth: 90,
        maxHeight: 116,
        imageOffsetX: 0,
        imageOffsetY: 0,
        groundOffset: 0,
        hitboxPaddingX: 3,
        hitboxPaddingY: 3
    },

    // D. OBSTACLE 2
    obstacle2: {
        maxWidth: 90,
        maxHeight: 116,
        imageOffsetX: 0,
        imageOffsetY: 0,
        groundOffset: 0,
        hitboxPaddingX: 3,
        hitboxPaddingY: 3
    },

    // E. BACKGROUND
    background: {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        scrollSpeed: 0.12,
        fallbackColor: "#071020",
        alignment: "center"
    },

    // F. DOODAD 1
    doodad1: {
        x: 0,
        y: 205,
        maxWidth: 105,
        maxHeight: 125,
        imageOffsetX: 0,
        imageOffsetY: 0,
        repeat: true,
        spacing: 75,
        scrollSpeed: 0.20
    },

    // G. DOODAD 2
    doodad2: {
        x: 0,
        y: 65,
        maxWidth: 55,
        maxHeight: 38,
        imageOffsetX: 0,
        imageOffsetY: 0,
        repeat: true,
        spacing: 180,
        scrollSpeed: 0.85
    },

    // H. GAMEPLAY
    gameplay: {
        startingSpeed: 6,
        maxSpeed: 13,
        difficultyIncrease: 0.4,
        minObstacleSpacing: 400,
        maxObstacleSpacing: 650
    },

    // I. DEBUG — HITBOX VISUALIZATION
    debug: {
        showHitboxes: false,
        runnerHitboxColor: "#00FF00",
        obstacleHitboxColor: "#FF0000",
        hitboxLineWidth: 2
    }

};

/* ============================================
   END OF CUSTOMIZATION AND ADJUSTMENT
   GAME LOGIC BELOW
   ============================================ */


// ============================================
// 1. HTML ELEMENTS AND CANVAS
// ============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gameTitle = document.getElementById("gameTitle");
const gameDescription = document.getElementById("gameDescription");
const gameInstructions = document.getElementById("gameInstructions");

const scoreDisplay = document.getElementById("scoreDisplay");
const highScoreDisplay = document.getElementById("highScoreDisplay");

const gameOverlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");

const startButton = document.getElementById("startButton");
const assetStatus = document.getElementById("assetStatus");


// Check required HTML elements
const requiredElements = [
    canvas,
    scoreDisplay,
    highScoreDisplay,
    gameOverlay,
    overlayTitle,
    overlayMessage,
    startButton,
    assetStatus
];

if (requiredElements.some(element => !element)) {
    throw new Error(
        "A required HTML element is missing. Check the HTML element IDs."
    );
}

if (!ctx) {
    throw new Error("Your browser does not support HTML Canvas.");
}


// Preserve customizable HTML text
const initialOverlayTitle = overlayTitle.textContent.trim();
const initialOverlayMessage = overlayMessage.textContent.trim();


// Read button labels directly from HTML
const startButtonText = startButton.dataset.startText || "Start Game";
const restartButtonText = startButton.dataset.restartText || "Restart Game";


// Fixed logical Canvas resolution
const WIDTH = 960;
const HEIGHT = 450;

canvas.width = WIDTH;
canvas.height = HEIGHT;


// ============================================
// 2. GAME CONSTANTS
// ============================================

const GROUND_Y = 365;

const ASSET_NAMES = [
    "runner",
    "obstacle1",
    "obstacle2",
    "background",
    "doodad1",
    "doodad2"
];

const FALLBACK_SIZES = {
    runner: { width: 100, height: 140 },
    obstacle1: { width: 90, height: 110 },
    obstacle2: { width: 90, height: 110 },
    background: { width: WIDTH, height: HEIGHT },
    doodad1: { width: 110, height: 130 },
    doodad2: { width: 100, height: 70 }
};


// ============================================
// 3. GAME VARIABLES
// ============================================

let gameState = "ready";

let score = 0;
let highScore = loadHighScore();

let gameSpeed = CONFIG.gameplay.startingSpeed;

let distanceTravelled = 0;
let distanceSinceSpawn = 0;

let nextObstacleSpacing = 500;

let obstacles = [];

let runnerBaseline = GROUND_Y + CONFIG.runner.yOffset;
let runnerVelocityY = 0;
let runnerJumping = false;
let runnerAnimation = 0;

let elapsedTime = 0;
let lastTime = 0;

let animationFrameId = null;


// ============================================
// 4. IMAGE LOADING
// ============================================

// Each image has a corresponding Canvas fallback.
const images = {
    runner: null,
    obstacle1: null,
    obstacle2: null,
    background: null,
    doodad1: null,
    doodad2: null
};

const imageLoaded = {
    runner: false,
    obstacle1: false,
    obstacle2: false,
    background: false,
    doodad1: false,
    doodad2: false
};

let loadedAssetCount = 0;
let finishedAssetCount = 0;


function loadImages() {

    ASSET_NAMES.forEach(name => {

        const image = new Image();

        images[name] = image;

        image.onload = function () {

            imageLoaded[name] = true;

            loadedAssetCount++;

            finishImageLoading();
        };

        image.onerror = function () {

            imageLoaded[name] = false;

            finishImageLoading();
        };

        image.src = CONFIG.assets[name];

    });

}


function finishImageLoading() {

    finishedAssetCount++;

    if (finishedAssetCount === ASSET_NAMES.length) {

        const missing = ASSET_NAMES.length - loadedAssetCount;

        if (missing === 0) {

            assetStatus.textContent =
                "All PNG assets loaded successfully!";

        } else {

            assetStatus.textContent =
                `${missing} PNG asset(s) unavailable. Canvas graphics are being used.`;

        }
    }
}


// ============================================
// 5. IMAGE RESIZING
// ============================================

// Calculate image dimensions while preserving aspect ratio.

function getDisplaySize(name, maxWidth, maxHeight) {

    let sourceWidth;
    let sourceHeight;

    if (imageLoaded[name]) {

        sourceWidth = images[name].naturalWidth;
        sourceHeight = images[name].naturalHeight;

    } else {

        sourceWidth = FALLBACK_SIZES[name].width;
        sourceHeight = FALLBACK_SIZES[name].height;

    }

    const scale = Math.min(
        maxWidth / sourceWidth,
        maxHeight / sourceHeight
    );

    return {
        width: sourceWidth * scale,
        height: sourceHeight * scale
    };

}


// ============================================
// 6. OBJECT POSITIONING
// ============================================

// Runner and obstacles use bottom-center anchors.

function getObjectRect(name, centerX, baselineY, settings) {

    const size = getDisplaySize(
        name,
        settings.maxWidth,
        settings.maxHeight
    );

    const x = centerX - size.width / 2 + settings.imageOffsetX;

    const y = baselineY - size.height + settings.imageOffsetY;

    return {
        x: x,
        y: y,
        width: size.width,
        height: size.height
    };

}


// ============================================
// 7. COLLISION HITBOXES
// ============================================

// The same hitbox calculations are used for
// collision detection and debug visualization.

function getHitbox(rect, paddingX, paddingY) {

    return {
        x: rect.x + paddingX,
        y: rect.y + paddingY,
        width: Math.max(0, rect.width - paddingX * 2),
        height: Math.max(0, rect.height - paddingY * 2)
    };

}


function drawHitbox(rect, color) {

    if (!CONFIG.debug.showHitboxes) {
        return;
    }

    ctx.save();

    ctx.strokeStyle = color;
    ctx.lineWidth = CONFIG.debug.hitboxLineWidth;

    ctx.strokeRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height
    );

    ctx.restore();

}


// ============================================
// 8. FALLBACK GRAPHICS: BACKGROUND
// ============================================

function drawFallbackBackground() {

    const background = ctx.createLinearGradient(
        0, 0, 0, HEIGHT
    );

    background.addColorStop(0, CONFIG.background.fallbackColor);
    background.addColorStop(0.55, "#101d35");
    background.addColorStop(1, "#17251e");

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Stars
    for (let i = 0; i < 55; i++) {

        const x = (i * 137) % WIDTH;
        const y = (i * 71) % 235;

        ctx.fillStyle = "#dceaff";

        ctx.globalAlpha =
            0.35 + Math.sin(i + elapsedTime * 0.002) * 0.2;

        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fill();

    }

    ctx.globalAlpha = 1;

    // Full moon
    ctx.fillStyle = "#d8e5f2";

    ctx.beginPath();
    ctx.arc(755, 105, 45, 0, Math.PI * 2);
    ctx.fill();

    // Moon details
    ctx.fillStyle = "rgba(100,120,145,0.25)";

    ctx.beginPath();
    ctx.arc(738, 91, 8, 0, Math.PI * 2);
    ctx.arc(770, 120, 6, 0, Math.PI * 2);
    ctx.fill();

    // Distant mountains
    ctx.fillStyle = "#101a2a";

    ctx.beginPath();
    ctx.moveTo(0, 280);
    ctx.lineTo(150, 165);
    ctx.lineTo(270, 270);
    ctx.lineTo(410, 175);
    ctx.lineTo(570, 280);
    ctx.lineTo(700, 185);
    ctx.lineTo(870, 275);
    ctx.lineTo(960, 210);
    ctx.lineTo(960, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Ground
    const ground = ctx.createLinearGradient(
        0, GROUND_Y, 0, HEIGHT
    );

    ground.addColorStop(0, "#263d2b");
    ground.addColorStop(1, "#030a0a");

    ctx.fillStyle = ground;
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    // Ground line
    ctx.strokeStyle = "#536448";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(WIDTH, GROUND_Y);
    ctx.stroke();

}


// ============================================
// 9. BACKGROUND RENDERING
// ============================================


function drawBackground() {

    const hasImage = imageLoaded.background;

    const sourceWidth = hasImage
        ? images.background.naturalWidth
        : WIDTH;

    const sourceHeight = hasImage
        ? images.background.naturalHeight
        : HEIGHT;

    const coverScale = hasImage
        ? Math.max(
            WIDTH / sourceWidth,
            HEIGHT / sourceHeight
        )
        : 1;

    const scale = coverScale * CONFIG.background.scale;

    const tileWidth = sourceWidth * scale;
    const tileHeight = sourceHeight * scale;

    let verticalPosition = (HEIGHT - tileHeight) / 2;

    if (CONFIG.background.alignment === "top") {
        verticalPosition = 0;
    }

    if (CONFIG.background.alignment === "bottom") {
        verticalPosition = HEIGHT - tileHeight;
    }

    verticalPosition += CONFIG.background.offsetY;

    const movement =
        elapsedTime *
        CONFIG.background.scrollSpeed *
        gameSpeed / 1000;

    const offset = (
        (movement + CONFIG.background.offsetX) % tileWidth
        + tileWidth
    ) % tileWidth;

    ctx.save();

    ctx.beginPath();
    ctx.rect(0, 0, WIDTH, HEIGHT);
    ctx.clip();

    let x = -offset;

    while (x < WIDTH) {

        if (hasImage) {

            ctx.drawImage(
                images.background,
                x,
                verticalPosition,
                tileWidth,
                tileHeight
            );

        } else {

            ctx.save();

            ctx.translate(x, verticalPosition);

            ctx.scale(
                tileWidth / WIDTH,
                tileHeight / HEIGHT
            );

            drawFallbackBackground();

            ctx.restore();

        }

        x += tileWidth;
    }

    ctx.restore();
}



// ============================================
// 10. FALLBACK GRAPHICS: RUNNER
// ============================================

function drawFallbackRunner(width, height) {

    ctx.save();

    ctx.scale(width / 100, height / 140);

    const legMovement = runnerJumping
        ? 0
        : Math.sin(runnerAnimation) * 10;

    // Legs
    ctx.strokeStyle = "#202c3c";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(42, 105);
    ctx.lineTo(35 + legMovement, 130);

    ctx.moveTo(60, 105);
    ctx.lineTo(65 - legMovement, 130);

    ctx.stroke();

    // Shoes
    ctx.strokeStyle = "#090d14";
    ctx.lineWidth = 12;

    ctx.beginPath();

    ctx.moveTo(35 + legMovement, 130);
    ctx.lineTo(48 + legMovement, 130);

    ctx.moveTo(65 - legMovement, 130);
    ctx.lineTo(80 - legMovement, 130);

    ctx.stroke();

    // Body
    ctx.fillStyle = "#8e1b29";

    ctx.beginPath();
    ctx.moveTo(31, 48);
    ctx.lineTo(70, 48);
    ctx.lineTo(76, 105);
    ctx.lineTo(27, 105);
    ctx.closePath();
    ctx.fill();

    // Shirt highlight
    ctx.fillStyle = "#bd3440";
    ctx.fillRect(34, 52, 8, 45);

    // Diagonal sash
    ctx.strokeStyle = "#d7ad59";
    ctx.lineWidth = 7;

    ctx.beginPath();
    ctx.moveTo(31, 52);
    ctx.lineTo(70, 91);
    ctx.stroke();

    // Arms
    ctx.strokeStyle = "#d6a17d";
    ctx.lineWidth = 9;

    ctx.beginPath();

    ctx.moveTo(33, 57);
    ctx.lineTo(18, 88 + legMovement);

    ctx.moveTo(68, 57);
    ctx.lineTo(85, 82 - legMovement);

    ctx.stroke();

    // Neck
    ctx.fillStyle = "#bd8869";
    ctx.fillRect(43, 35, 16, 18);

    // Head
    ctx.fillStyle = "#d6a17d";

    ctx.beginPath();
    ctx.arc(51, 28, 21, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#17131a";

    ctx.beginPath();
    ctx.arc(51, 20, 22, Math.PI, Math.PI * 2);
    ctx.lineTo(73, 32);
    ctx.lineTo(66, 28);
    ctx.lineTo(30, 34);
    ctx.closePath();
    ctx.fill();

    // Headband
    ctx.strokeStyle = "#d8b36b";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(31, 25);
    ctx.lineTo(70, 25);
    ctx.stroke();

    // Eye
    ctx.fillStyle = "#16121a";

    ctx.beginPath();
    ctx.arc(62, 31, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

}


// ============================================
// 11. FALLBACK GRAPHICS: OBSTACLE 1
// ============================================

function drawFallbackObstacle1(width, height) {

    ctx.save();

    ctx.scale(width / 90, height / 110);

    // Body
    ctx.fillStyle = "#17271d";

    ctx.beginPath();
    ctx.moveTo(17, 40);
    ctx.lineTo(9, 105);
    ctx.lineTo(81, 105);
    ctx.lineTo(73, 40);
    ctx.closePath();
    ctx.fill();

    // Arms
    ctx.strokeStyle = "#263b2b";
    ctx.lineWidth = 11;

    ctx.beginPath();

    ctx.moveTo(19, 45);
    ctx.lineTo(4, 82);

    ctx.moveTo(71, 45);
    ctx.lineTo(86, 82);

    ctx.stroke();

    // Head
    ctx.fillStyle = "#68734b";

    ctx.beginPath();
    ctx.arc(45, 28, 25, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#090c0c";

    ctx.beginPath();
    ctx.moveTo(22, 20);
    ctx.lineTo(7, 95);
    ctx.lineTo(31, 70);
    ctx.lineTo(43, 25);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(68, 20);
    ctx.lineTo(84, 94);
    ctx.lineTo(61, 72);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#ff2929";

    ctx.beginPath();
    ctx.arc(35, 27, 4, 0, Math.PI * 2);
    ctx.arc(55, 27, 4, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.fillStyle = "#130507";

    ctx.beginPath();
    ctx.ellipse(45, 43, 8, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Teeth
    ctx.fillStyle = "#ffffff";

    ctx.fillRect(39, 39, 4, 7);
    ctx.fillRect(48, 39, 4, 7);

    ctx.restore();

}


// ============================================
// 12. FALLBACK GRAPHICS: OBSTACLE 2
// ============================================

function drawFallbackObstacle2(width, height) {

    ctx.save();

    ctx.scale(width / 90, height / 110);

    // Cape
    ctx.fillStyle = "#560c20";

    ctx.beginPath();

    ctx.moveTo(15, 37);
    ctx.lineTo(2, 108);
    ctx.lineTo(45, 94);
    ctx.lineTo(88, 108);
    ctx.lineTo(75, 37);

    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = "#15141d";
    ctx.fillRect(24, 39, 42, 62);

    // Shirt
    ctx.fillStyle = "#dddde5";

    ctx.beginPath();
    ctx.moveTo(45, 40);
    ctx.lineTo(34, 65);
    ctx.lineTo(45, 75);
    ctx.lineTo(56, 65);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = "#d5c3bd";

    ctx.beginPath();
    ctx.arc(45, 27, 23, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#100e18";

    ctx.beginPath();
    ctx.arc(45, 17, 23, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#ff2929";

    ctx.beginPath();
    ctx.arc(35, 28, 3, 0, Math.PI * 2);
    ctx.arc(55, 28, 3, 0, Math.PI * 2);
    ctx.fill();

    // Fangs
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.moveTo(34, 39);
    ctx.lineTo(39, 53);
    ctx.lineTo(42, 39);

    ctx.moveTo(48, 39);
    ctx.lineTo(52, 53);
    ctx.lineTo(57, 39);

    ctx.fill();

    ctx.restore();

}


// ============================================
// 13. FALLBACK GRAPHICS: DOODAD 1
// ============================================

function drawFallbackDoodad1(width, height) {

    ctx.save();

    ctx.scale(width / 110, height / 130);

    // Decorative silhouette
    ctx.fillStyle = "#101b1a";

    ctx.beginPath();
    ctx.moveTo(30, 40);
    ctx.lineTo(18, 125);
    ctx.lineTo(95, 125);
    ctx.lineTo(80, 40);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = "#344633";

    ctx.beginPath();
    ctx.arc(55, 33, 27, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#d82d35";

    ctx.beginPath();
    ctx.arc(44, 34, 4, 0, Math.PI * 2);
    ctx.arc(65, 34, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

}


// ============================================
// 14. FALLBACK GRAPHICS: DOODAD 2
// ============================================

function drawFallbackDoodad2(width, height) {

    ctx.save();

    ctx.scale(width / 100, height / 70);

    const flap = Math.sin(elapsedTime * 0.015) * 10;

    ctx.fillStyle = "#080b12";

    // Body
    ctx.beginPath();
    ctx.ellipse(50, 35, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left wing
    ctx.beginPath();
    ctx.moveTo(46, 35);
    ctx.lineTo(8, 12 - flap);
    ctx.lineTo(20, 52);
    ctx.lineTo(42, 44);
    ctx.closePath();
    ctx.fill();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(54, 35);
    ctx.lineTo(92, 12 - flap);
    ctx.lineTo(80, 52);
    ctx.lineTo(58, 44);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

}


// ============================================
// 15. DRAW ASSET
// ============================================

// Automatically uses PNG or Canvas fallback.


function drawAsset(name, rect) {

    if (imageLoaded[name]) {

        ctx.drawImage(
            images[name],
            rect.x,
            rect.y,
            rect.width,
            rect.height
        );

        return;
    }

    ctx.save();

    ctx.translate(rect.x, rect.y);

    switch (name) {

        case "runner":
            drawFallbackRunner(rect.width, rect.height);
            break;

        case "obstacle1":
            drawFallbackObstacle1(rect.width, rect.height);
            break;

        case "obstacle2":
            drawFallbackObstacle2(rect.width, rect.height);
            break;

        case "doodad1":
            drawFallbackDoodad1(rect.width, rect.height);
            break;

        case "doodad2":
            drawFallbackDoodad2(rect.width, rect.height);
            break;

    }

    ctx.restore();
}


// ============================================
// 16. DOODAD POSITIONING AND RENDERING
// ============================================

// Doodads use top-left anchors.
// Each decorative layer has independent movement.

function drawDoodad(name, settings) {

    const size = getDisplaySize(
        name,
        settings.maxWidth,
        settings.maxHeight
    );

    const tileWidth = size.width + settings.spacing;

    const movement =
        distanceTravelled * settings.scrollSpeed;

    const startX = settings.x + settings.imageOffsetX;
    const startY = settings.y + settings.imageOffsetY;

    ctx.save();

    ctx.beginPath();
    ctx.rect(0, 0, WIDTH, HEIGHT);
    ctx.clip();

    if (!settings.repeat) {

        const x = startX - movement;

        if (x + size.width > 0 && x < WIDTH) {

            drawAsset(name, {
                x: x,
                y: startY,
                width: size.width,
                height: size.height
            });

        }

    } else {

        const offset = (
            movement % tileWidth + tileWidth
        ) % tileWidth;

        let x = startX - offset;

        while (x > 0) {
            x -= tileWidth;
        }

        while (x < WIDTH) {

            drawAsset(name, {
                x: x,
                y: startY,
                width: size.width,
                height: size.height
            });

            x += tileWidth;
        }

    }

    ctx.restore();

}


// ============================================
// 17. RENDER DOODAD LAYERS
// ============================================

function drawDoodads() {

    // Distant decorative layer
    drawDoodad("doodad1", CONFIG.doodad1);

    // Flying decorative layer
    drawDoodad("doodad2", CONFIG.doodad2);

}


// ============================================
// 18. RUNNER RENDERING
// ============================================

function getRunnerRect() {

    return getObjectRect(
        "runner",
        CONFIG.runner.x,
        runnerBaseline,
        CONFIG.runner
    );

}


function getRunnerHitbox() {

    const rect = getRunnerRect();

    return getHitbox(
        rect,
        CONFIG.runner.hitboxPaddingX,
        CONFIG.runner.hitboxPaddingY
    );

}


function drawRunner() {

    const rect = getRunnerRect();

    ctx.save();

    ctx.translate(rect.x, rect.y);

    drawAsset("runner", {
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height
    });

    ctx.restore();

    drawHitbox(
        getRunnerHitbox(),
        CONFIG.debug.runnerHitboxColor
    );

}


// ============================================
// 19. RUNNER PHYSICS
// ============================================

function jump() {

    if (gameState !== "playing") {
        return;
    }

    // Prevent double jumping
    if (runnerJumping) {
        return;
    }

    runnerVelocityY = CONFIG.runner.jumpStrength;

    runnerJumping = true;

}


function updateRunner(deltaTime) {

    const timeScale = deltaTime / 16.67;

    runnerVelocityY += CONFIG.runner.gravity * timeScale;

    runnerBaseline += runnerVelocityY * timeScale;

    const groundPosition = GROUND_Y + CONFIG.runner.yOffset;

    if (runnerBaseline >= groundPosition) {

        runnerBaseline = groundPosition;

        runnerVelocityY = 0;

        runnerJumping = false;

    }

    runnerAnimation += 0.20 * timeScale;

    drawRunner();

}


// ============================================
// 20. OBSTACLE GENERATION
// ============================================

function getRandomObstacleSpacing() {

    const minimum = CONFIG.gameplay.minObstacleSpacing;
    const maximum = CONFIG.gameplay.maxObstacleSpacing;

    return minimum + Math.random() * (maximum - minimum);

}


function spawnObstacle() {

    const name = Math.random() < 0.5
        ? "obstacle1"
        : "obstacle2";

    const settings = CONFIG[name];

    const size = getDisplaySize(
        name,
        settings.maxWidth,
        settings.maxHeight
    );

    obstacles.push({

        name: name,

        x: WIDTH + size.width / 2,

        width: size.width,

        height: size.height

    });

}


// ============================================
// 21. OBSTACLE POSITIONING
// ============================================

function getObstacleRect(obstacle) {

    const settings = CONFIG[obstacle.name];

    const baselineY = GROUND_Y - settings.groundOffset;

    return getObjectRect(
        obstacle.name,
        obstacle.x,
        baselineY,
        settings
    );

}


function getObstacleHitbox(obstacle) {

    const rect = getObstacleRect(obstacle);

    const settings = CONFIG[obstacle.name];

    return getHitbox(
        rect,
        settings.hitboxPaddingX,
        settings.hitboxPaddingY
    );

}


// ============================================
// 22. OBSTACLE RENDERING
// ============================================

function drawObstacle(obstacle) {

    const rect = getObstacleRect(obstacle);

    ctx.save();

    drawAsset(obstacle.name, rect);

    ctx.restore();

    drawHitbox(
        getObstacleHitbox(obstacle),
        CONFIG.debug.obstacleHitboxColor
    );

}


// ============================================
// 23. OBSTACLE UPDATING
// ============================================

function updateObstacles(deltaTime) {

    const timeScale = deltaTime / 16.67;

    distanceSinceSpawn += gameSpeed * timeScale;

    if (distanceSinceSpawn >= nextObstacleSpacing) {

        spawnObstacle();

        distanceSinceSpawn = 0;

        nextObstacleSpacing = getRandomObstacleSpacing();

    }

    obstacles.forEach(obstacle => {

        obstacle.x -= gameSpeed * timeScale;

        drawObstacle(obstacle);

    });

    // Remove obstacles that leave the Canvas
    obstacles = obstacles.filter(obstacle => {

        return obstacle.x + obstacle.width / 2 > -20;

    });

}


// ============================================
// 24. COLLISION DETECTION
// ============================================

function checkCollision(rectA, rectB) {

    return (
        rectA.x < rectB.x + rectB.width &&
        rectA.x + rectA.width > rectB.x &&
        rectA.y < rectB.y + rectB.height &&
        rectA.y + rectA.height > rectB.y
    );

}


function detectCollisions() {

    const runnerHitbox = getRunnerHitbox();

    for (const obstacle of obstacles) {

        const obstacleHitbox = getObstacleHitbox(obstacle);

        if (checkCollision(runnerHitbox, obstacleHitbox)) {

            endGame();

            return;
        }

    }

}


// ============================================
// 25. SCORING SYSTEM
// ============================================

function updateScore(deltaTime) {

    const timeScale = deltaTime / 16.67;

    distanceTravelled += gameSpeed * timeScale;

    // Keep full numerical precision internally
    score = distanceTravelled / 10;

    // Display whole-number scores
    scoreDisplay.textContent = Math.floor(score).toString();

    // Increase difficulty gradually
    const difficultyLevel = Math.floor(score / 100);

    gameSpeed = Math.min(
        CONFIG.gameplay.startingSpeed +
        difficultyLevel * CONFIG.gameplay.difficultyIncrease,
        CONFIG.gameplay.maxSpeed
    );

    // Update high score
    if (Math.floor(score) > highScore) {

        highScore = Math.floor(score);

        highScoreDisplay.textContent = highScore.toString();

        saveHighScore();

    }

}


// ============================================
// 26. HIGH SCORE STORAGE
// ============================================

function loadHighScore() {

    try {

        return Math.max(
            0,
            Number(localStorage.getItem("pedroPendukoHighScore")) || 0
        );

    } catch (error) {

        return 0;

    }

}


function saveHighScore() {

    try {

        localStorage.setItem(
            "pedroPendukoHighScore",
            highScore.toString()
        );

    } catch (error) {

        // Continue playing if browser storage is unavailable.

    }

}


// ============================================
// 27. GAME OVER
// ============================================

function endGame() {

    if (gameState !== "playing") {
        return;
    }

    gameState = "gameover";

    const finalScore = Math.floor(score);

    if (finalScore > highScore) {

        highScore = finalScore;

        saveHighScore();

    }

    scoreDisplay.textContent = finalScore.toString();

    highScoreDisplay.textContent = highScore.toString();

    // Dynamic Game Over content
    overlayTitle.textContent = "Game Over!";

    overlayMessage.textContent =
        `Pedro scored ${finalScore} points! ` +
        "The creatures have caught up. Can you survive longer next time?";

    startButton.textContent = restartButtonText;

    gameOverlay.style.display = "flex";

    assetStatus.textContent = "Game Over! Try again!";

}


// ============================================
// 28. RESET GAME
// ============================================

function resetGame() {

    score = 0;

    distanceTravelled = 0;

    distanceSinceSpawn = 0;

    gameSpeed = CONFIG.gameplay.startingSpeed;

    nextObstacleSpacing = getRandomObstacleSpacing();

    obstacles = [];

    runnerBaseline = GROUND_Y + CONFIG.runner.yOffset;

    runnerVelocityY = 0;

    runnerJumping = false;

    runnerAnimation = 0;

    scoreDisplay.textContent = "0";

    highScoreDisplay.textContent = highScore.toString();

    // Restore original HTML content
    overlayTitle.textContent = initialOverlayTitle;

    overlayMessage.textContent = initialOverlayMessage;

    startButton.textContent = startButtonText;

}


// ============================================
// 29. START AND RESTART GAME
// ============================================

function startGame() {

    if (gameState === "playing") {
        return;
    }

    resetGame();

    gameState = "playing";

    gameOverlay.style.display = "none";

    startButton.textContent = restartButtonText;

    assetStatus.textContent = "Pedro is running! Survive the night!";

}


// ============================================
// 30. KEYBOARD CONTROLS
// ============================================

document.addEventListener("keydown", function(event) {

    if (
        event.code === "Space" ||
        event.code === "ArrowUp"
    ) {

        if (gameState === "playing") {

            event.preventDefault();

            jump();

        }

    }

});


// ============================================
// 31. MOUSE AND TOUCH CONTROLS
// ============================================

canvas.addEventListener("pointerdown", function(event) {

    if (gameState === "playing") {

        event.preventDefault();

        jump();

    }

});


// ============================================
// 32. BUTTON EVENT
// ============================================

startButton.addEventListener("click", function() {

    startGame();

});


// ============================================
// 33. MAIN GAME LOOP
// ============================================

function gameLoop(timestamp) {

    const deltaTime = lastTime === 0
        ? 16.67
        : Math.min(timestamp - lastTime, 50);

    lastTime = timestamp;

    elapsedTime += deltaTime;

    // Clear Canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw background
    drawBackground();

    // Draw decorative elements behind gameplay objects
    drawDoodads();

    if (gameState === "playing") {

        // Update runner
        updateRunner(deltaTime);

        // Update obstacles
        updateObstacles(deltaTime);

        // Update score and difficulty
        updateScore(deltaTime);

        // Check collisions
        detectCollisions();

    } else {

        // Display the runner in idle position
        drawRunner();

        // Keep obstacles stationary outside active gameplay

        if (gameState === "ready") {
            // Initial screen
        }

    }

    // Request exactly one next animation frame
    animationFrameId = requestAnimationFrame(gameLoop);

}


// ============================================
// 34. INITIALIZATION
// ============================================

function initializeGame() {

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    scoreDisplay.textContent = "0";

    highScoreDisplay.textContent = highScore.toString();

    startButton.textContent = startButtonText;

    gameOverlay.style.display = "flex";

    gameState = "ready";

    resetGame();

    assetStatus.textContent =
        "Loading PNG assets and preparing Canvas graphics...";

    // Begin loading images
    loadImages();

    // Start only one animation loop
    if (animationFrameId === null) {

        lastTime = 0;

        animationFrameId = requestAnimationFrame(gameLoop);

    }

}


// Start the game engine
initializeGame();

