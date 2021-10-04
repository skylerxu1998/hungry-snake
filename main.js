'use strict';

/* local storage keys
 * only initialized once when loading the script
 */
let BEST_SCORE_KEY = "bestScore";
let AVG_SCORE_KEY = "avgScore";
// let AVG_MOUSE_DOWN_TIME = "avgMouseDownTime";
let AVG_ALIVE_TIME = "avgAliveTime";
let NUM_GAMES_PLAYED = "numGamesPlayed";

let historicalStats = {
    bestScore: 0,
    avgScore: 0,
    gamesPlayed: 0,
    avgAliveTime: 0,
    // avgMouseDownTime: 0
};

// game param
let score = 0;
// let bestScore = -1;
let alive = true;
let currentScoreElementText;
let currentScoreElement;

let gameStartTime = Date.now();
let aliveTime;

// canvas params
let canvasElement;
let canvasWidth;
let canvasHeight;
let context;

// historial status html elements
let bestScoreSpanElement;
let avgScoreSpanElement;
let gamesPlayedSpanElement;
let avgAliveTimeSpanElement;

// snake params
let speed = 10; // pt per second
let speed_x = speed;
let speed_y = 0;
let length = 8;
let body_x = []; // keep it "length" length
let body_y = []; // keep it "length" length
let speedDelta = 0.08; // increment of speed every second
let sectionDistance = 8; // basically the radius of one snake section, i.e. the distance between the center of consecutive sections of the snake
let sectionRadius = (sectionDistance * 4 / 3) / 2;
let eyeDistance = 2 / 3 * sectionRadius;
let eyeRadius = 1 / 2 * sectionRadius;

// the threshold for snake head touching the body
let TOUCHING_THRESHOLD = sectionRadius * 2 / 3;
// the threshold for the snake eating a treat
let EATING_THRESHOLD = sectionRadius * 3 / 5;

let bodyColors = ["red", "blue", "white", "#87CEFA", "yellow"];

// food params
let food_x;
let food_y;
let foodColor = "green";
let foodRadius = sectionRadius * 2 / 3;

// for event handlers
let isMouseDown = false;

// paint frequency
let FRAME_MILLISECONS = 4; // this many milliseconds per frame
let FRAMES_PER_SECOND = 60 / FRAME_MILLISECONS;
let SPEED_PER_FRAME = speed / FRAMES_PER_SECOND;
let SPEED_PER_FRAME_X = speed_x / FRAMES_PER_SECOND;
let SPEED_PER_FRAME_Y = speed_y / FRAMES_PER_SECOND;
let SPEED_DELTA_PER_FRAME = speedDelta / FRAMES_PER_SECOND;
let count = 0;

function generateRandomFood() {
    food_x = 5 + Math.random() * (canvasWidth - 5);
    food_y = 5 + Math.random() * (canvasHeight - 5);
}

function resetLocalStorage() {
    window.localStorage.setItem(BEST_SCORE_KEY, 0);
    window.localStorage.setItem(NUM_GAMES_PLAYED, 0);
    window.localStorage.setItem(AVG_ALIVE_TIME, 0);
    window.localStorage.setItem(AVG_SCORE_KEY, 0);
}

function init() {
    // check for local storage
    if (!window.localStorage) {
        alert('No localStorage support!');
        return;
    }

    /* INIT all the game params !! */
    score = 0;
    // bestScore = -1;
    // get the historic best score
    alive = true;
    currentScoreElementText = "Current Score: ";
    currentScoreElement = $('#score-span-id')[0];
    currentScoreElement.innerHTML = currentScoreElementText + score; // reset the score at init every time.
    gameStartTime = Date.now();
    // canvas params
    canvasElement = $('#game-canvas-id')[0];
    canvasWidth = canvasElement.width;
    canvasHeight = canvasElement.height;
    context = canvasElement.getContext('2d');
    // historical stats html elements
    bestScoreSpanElement = $('#best-score-span-id')[0];
    avgScoreSpanElement = $('#avgScore-span-id')[0];
    gamesPlayedSpanElement = $('#gamesPlayed-span-id')[0];
    avgAliveTimeSpanElement = $('#avgAliveTime-span-id')[0];
    // snake params
    speed = 10; // pt per second
    speed_x = speed;
    speed_y = 0;
    length = 8;
    body_x = []; // keep it "length" length
    body_y = []; // keep it "length" length
    speedDelta = 0.05; // increment of speed every second
    sectionDistance = 8; // basically the radius of one snake section, i.e. the distance between the center of consecutive sections of the snake
    sectionRadius = (sectionDistance * 4 / 3) / 2;
    eyeDistance = 2 / 3 * sectionRadius;
    eyeRadius = 1 / 2 * sectionRadius;
    // the threshold for snake head touching the body
    TOUCHING_THRESHOLD = sectionRadius * 2 / 3;
    // let TOUCHING_THRESHOLD = sectionDistance / 2;
    EATING_THRESHOLD = sectionRadius * 3 / 5;
    bodyColors = ["red", "blue", "white", "green", "yellow"];
    // food params
    generateRandomFood();
    // for event handlers
    isMouseDown = false;
    // paint frequency
    FRAME_MILLISECONS = 4; // this many milliseconds per frame
    FRAMES_PER_SECOND = 60 / FRAME_MILLISECONS;
    SPEED_PER_FRAME = speed / FRAMES_PER_SECOND;
    SPEED_PER_FRAME_X = speed_x / FRAMES_PER_SECOND;
    SPEED_PER_FRAME_Y = speed_y / FRAMES_PER_SECOND;
    SPEED_DELTA_PER_FRAME = speedDelta / FRAMES_PER_SECOND;
    count = 0;
    // initialize the snake's position at the center
    let head_x = canvasWidth / 2.0;
    let head_y = canvasHeight / 2.0;
    // fill the rest of the snake body at init
    for (let i = 0; i < length; i++) {
        body_x.push(head_x - i * sectionDistance);
        body_y.push(head_y);
    }
    /* End of init game params */

    /* Get stats from local storage */
    if (window.localStorage.getItem(NUM_GAMES_PLAYED)) {
        historicalStats = {
            bestScore: parseInt(window.localStorage.getItem(BEST_SCORE_KEY)),
            avgScore: parseFloat(window.localStorage.getItem(AVG_SCORE_KEY)),
            gamesPlayed: parseInt(window.localStorage.getItem(NUM_GAMES_PLAYED)),
            avgAliveTime: parseFloat(window.localStorage.getItem(AVG_ALIVE_TIME)),
            // avgMouseDownTime: window.localStorage.getItem(AVG_MOUSE_DOWN_TIME)
        };
        // update them on the page
        bestScoreSpanElement.innerHTML = historicalStats.bestScore;
        gamesPlayedSpanElement.innerHTML = historicalStats.gamesPlayed;
        avgScoreSpanElement.innerHTML = historicalStats.avgScore;
        avgAliveTimeSpanElement.innerHTML = historicalStats.avgAliveTime;
    }

    /* add event listener for mouse movement when mouse down. */
    $('#game-canvas-id').bind('mousedown', function (e) {
        isMouseDown = true;
        updateSnakeDirection(e);
    });
    $('#game-canvas-id').bind('mouseup', function (e) {
        isMouseDown = false;
        // updateSnakeDirection(e);
    });
    $('#game-canvas-id').bind('mousemove', function (e) {
        if (isMouseDown) {
            updateSnakeDirection(e);
        }
    });

    // start animation
    requestAnimationFrame(paintSnake);
}

function paintSnake() {
    if (count >= FRAME_MILLISECONS) {
        // clear the canvas first before the next paint
        context.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // update the head position first for this frame
        let prevSection_x = body_x[0] + SPEED_PER_FRAME_X;
        let prevSection_y = body_y[0] + SPEED_PER_FRAME_Y;
        body_x[0] = prevSection_x;
        body_y[0] = prevSection_y;
        // CHECK WHETHER THE SNAKE WOULD HIT THE WALL
        checkWall(prevSection_x, prevSection_y);
        if (alive) {
            // CHECK whether the snake eats the treat and paint the next treat
            checkAndPaintTreat(prevSection_x, prevSection_y);
            // paint the head section
            // paintSnakeSection(prevSection_x, prevSection_y, bodyColors[0]);
            paintHeadSection(prevSection_x, prevSection_y, bodyColors[0]);
            // paint the rest of the bodu
            for (let i = 1; i < body_x.length; i++) {
                let old_x = body_x[i];
                let old_y = body_y[i];
                // calcualte the displace of the old position to the position of the updated previous section of the snake
                let delta_x = prevSection_x - old_x;
                let delta_y = prevSection_y - old_y;
                let distanceToMakeUp = Math.sqrt(delta_x ** 2 + delta_y ** 2);
                // if the distanceToMakeUp <= sectionDistance, no need to move
                if (distanceToMakeUp <= sectionDistance) {
                    prevSection_x = old_x;
                    prevSection_y = old_y;
                } else {
                    // calculate the distance to move along the vector version of distanceToMakeUp
                    let move_x = (distanceToMakeUp - sectionDistance) / distanceToMakeUp * delta_x;
                    let move_y = (distanceToMakeUp - sectionDistance) / distanceToMakeUp * delta_y;
                    prevSection_x = old_x + move_x;
                    prevSection_y = old_y + move_y;
                    // update the position of the current section in tbe body array
                    body_x[i] = prevSection_x;
                    body_y[i] = prevSection_y;
                }
                // SNAKE DIES IF IT TOUCHES ITSELF !!!!!
                let distanceToBodySection = Math.sqrt((prevSection_x - body_x[0]) ** 2 + (prevSection_y - body_y[0]) ** 2);
                checkTouchItself(distanceToBodySection);
                if (!alive) {
                    break;
                }

                // continue to paint the current section if alive
                paintSnakeSection(prevSection_x, prevSection_y, bodyColors[i % 5]);
            }

            // increment speed in each frame
            updateSpeed();
        }

        // reset the frame per second param
        count = 0;
    }
    count += 1;
    // only continue the animation if not yet lost
    if (alive) {
        requestAnimationFrame(paintSnake);
    } else {
        // update game stats if the snake dies in this round
        updateGameStats();
    }
}

function displayGameLoss() {
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // paint the loss message to the player
    context.fillStyle = "white";
    context.fillRect(0, 0, canvasElement.width, canvasElement.height);
    context.fillStyle = "red";
    context.font = "10px Comic Sans MS";
    context.fillText("Game Over!!", 4 * canvasElement.width / 11 + 10, canvasElement.height / 2 - 20);
    context.fillText("Score: " + score, 4 * canvasElement.width / 11 + 16, canvasElement.height / 2);
}

function updateAliveTime() {
    let gameEndTime = Date.now();
    aliveTime = gameEndTime - gameStartTime; //in ms
    // strip the ms
    aliveTime /= 1000;
}

function checkWall(head_x, head_y) {
    if (head_x < 0 || head_x > canvasWidth || head_y < 0 || head_y > canvasHeight) {
        alive = false;
        updateAliveTime();
        displayGameLoss();
    }
}

function checkTouchItself(distanceToBody) {
    if (distanceToBody <= TOUCHING_THRESHOLD) {
        // game loss
        updateAliveTime();
        displayGameLoss();
        // break out of the animation loop !!
        alive = false;
    }
}

function updateScore() {
    score += 1;
    currentScoreElement.innerHTML = currentScoreElementText + score;
}

function updateGameStats() {
    // update the best score and historical stats on the page
    historicalStats.gamesPlayed += 1;
    historicalStats.bestScore = Math.max(historicalStats.bestScore, score);
    historicalStats.avgAliveTime = ((historicalStats.gamesPlayed - 1) * historicalStats.avgAliveTime + aliveTime) / historicalStats.gamesPlayed;
    historicalStats.avgScore = ((historicalStats.gamesPlayed - 1) * historicalStats.avgScore + score) / historicalStats.gamesPlayed;
    window.localStorage.setItem(BEST_SCORE_KEY, historicalStats.bestScore);
    window.localStorage.setItem(NUM_GAMES_PLAYED, historicalStats.gamesPlayed);
    window.localStorage.setItem(AVG_ALIVE_TIME, historicalStats.avgAliveTime);
    window.localStorage.setItem(AVG_SCORE_KEY, historicalStats.avgScore);
    // update them on the page
    bestScoreSpanElement.innerHTML = historicalStats.bestScore;
    gamesPlayedSpanElement.innerHTML = historicalStats.gamesPlayed;
    avgScoreSpanElement.innerHTML = historicalStats.avgScore;
    avgAliveTimeSpanElement.innerHTML = historicalStats.avgAliveTime;
}

function checkAndPaintTreat(head_x, head_y) {
    if (Math.abs(head_x - food_x) <= EATING_THRESHOLD && Math.abs(head_y - food_y) <= EATING_THRESHOLD) {
        // increase the snake length
        let tail_x = body_x[body_x.length - 1];
        let tail_y = body_y[body_y.length - 1];
        let secondLastToTail_x = body_x[body_x.length - 2];
        let secondLastToTail_y = body_y[body_y.length - 2];
        let newTail_x = tail_x * 2 - secondLastToTail_x;
        let newTail_y = tail_y * 2 - secondLastToTail_y;
        body_x.push(newTail_x);
        body_y.push(newTail_y);

        updateScore();

        // generate new food
        generateRandomFood();
    }
    // paint the old/new food
    context.strokeStyle = foodColor;
    context.beginPath();
    context.arc(food_x, food_y, foodRadius, 0, 2 * Math.PI);
    context.fillStyle = foodColor;
    context.fill();
    context.stroke();
}

function paintHeadSection(centerX, centerY, color) {
    paintSnakeSection(centerX, centerY, color);
    // paint the eyes
    context.strokeStyle = "black";
    context.beginPath();
    let hypotenuse = Math.sqrt((body_x[0] - body_x[1]) ** 2 + (body_y[0] - body_y[1]) ** 2);
    let eye_x = body_x[0] + (body_x[0] - body_x[1]) * 1 / 4 * sectionRadius / hypotenuse;
    let eye_y = body_y[0] + (body_y[0] - body_y[1]) * 1 / 4 * sectionRadius / hypotenuse;
    context.arc(eye_x, eye_y, eyeRadius, 0, 2 * Math.PI);
    context.fillStyle = "black";
    context.fill();
    context.stroke();
}

function paintSnakeSection(centerX, centerY, color) {
    context.strokeStyle = color;
    context.beginPath();
    context.arc(centerX, centerY, sectionRadius, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
    context.stroke();
    // context.restore();
}

function updateSpeed() {
    let fraction = (SPEED_PER_FRAME + SPEED_DELTA_PER_FRAME) / SPEED_PER_FRAME;
    SPEED_PER_FRAME += SPEED_DELTA_PER_FRAME;
    SPEED_PER_FRAME_X *= fraction;
    SPEED_PER_FRAME_Y *= fraction;
    speed += speedDelta;
    speed_x *= fraction;
    speed_y *= fraction;
}

function updateSnakeDirection(e) {
    // get event position within the canvas
    let rectangle = canvasElement.getBoundingClientRect();
    let mouse_x = e.clientX - rectangle.left;
    let mouse_y = e.clientY - rectangle.top;
    // Add the following 3 lines to scale the mouse coordinates to the
    // canvas resolution
    const bounds = canvasElement.getBoundingClientRect();
    mouse_x = (mouse_x / bounds.width) * canvasElement.width;
    mouse_y = (mouse_y / bounds.height) * canvasElement.height;
    // update the snake direction
    let x_displacement = mouse_x - body_x[0];
    let y_displacement = mouse_y - body_y[0];

    let hypotenuse = Math.sqrt(x_displacement ** 2 + y_displacement ** 2)
    // update the speed
    SPEED_PER_FRAME_X = 1.0 * x_displacement / hypotenuse * SPEED_PER_FRAME;
    SPEED_PER_FRAME_Y = 1.0 * y_displacement / hypotenuse * SPEED_PER_FRAME;
    speed_x = x_displacement / hypotenuse * speed;
    speed_y = y_displacement / hypotenuse * speed;
}
