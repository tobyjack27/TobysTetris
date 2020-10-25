// ––– Window setup –––
// assign variables to window elements
const   scoreDisplay = document.getElementById('score'),
        mainGrid = document.getElementById('main-grid'),
        previewGrid = document.getElementById('preview-grid'),
        startBtn = document.getElementById('start-btn'),
        resetBtn = document.getElementById('reset-btn'),
        namesDisplay = Array.from(document.querySelectorAll('.hs')),
        scoresDisplay = Array.from(document.querySelectorAll('.score')),
        savePanel = document.querySelector('.save-panel'),
        nameInput = document.querySelector('.name-input'),
        saveBtn = document.getElementById('save-btn'),
        highscoreDisplay = document.getElementById('highscore');

// draw main grid
for(let i=0; i<200; i++){
    let div = document.createElement('div');
    mainGrid.appendChild(div);
}

// draw preview grid
for(let i=0; i<16; i++){
    let div = document.createElement('div');
    previewGrid.appendChild(div);
}

// assign different sets of grid squares to constant arrays
var mainGridSquares = Array.from(document.querySelectorAll('.main-grid div')),
    previewGridSquares = Array.from(document.querySelectorAll('.preview-grid div'));

// ––– Game variables –––
// set width of grid
const   width = 10;
// log base shape indices
const   jTetromino = [
            //indexes for different rotations
            [0, width, width*2, 1], 
            [0, 1, width+2, 2],
            [1, width+1, width*2, width*2+1],
            [0, width, width+1, width+2]
        ],
        lTetromino = [
            [0, 1, width+1, width*2+1],
            [2, width, width+1, width+2],
            [0, width, width*2, width*2+1],
            [0, 1, width, 2]
        ]
        zTetromino = [
            [0, width, width+1, width*2+1],
            [1, width, width+1, 2]
        ],
        sTetromino = [
            [1, width, width*2, width+1],
            [0, 1, width+1, width+2]
        ]
        oTetromino = [
            [0, 1, width, width+1]
        ],
        iTetromino = [
            [0, width, width*2, width*3],
            [0, 1, 2, 3]
        ],
        tTetromino = [
            [0, width, width*2, width+1],
            [0, 1, width+1, 2],
            [1, width, width+1, width*2+1],
            [1, width, width+1, width+2]
        ],
        // array of all possible tetromino indexes
        tetrominoes = [jTetromino, lTetromino, zTetromino, sTetromino, oTetromino, iTetromino, tTetromino];

// log base shape indices based on preview grid width
const previewTetros = [
    // j
    [0, 4, 8, 1],
    // l
    [0, 1, 5, 9],
    // z
    [0, 4, 5, 9],
    // s
    [1, 4, 8, 5],
    // o
    [0, 1, 4, 5],
    // i
    [0, 4, 8, 12],
    // t
    [0, 4, 8, 5]
]

// ––– Tetromino class –––
class Tetromino {
    // set initial parameters – constructor takes 'nextTetro' from previous tetromino, or randomly generates a new tetromino type if none provided (i.e. for the first tetromino)
    constructor(nextTetro=Math.floor(Math.random()*7)) {
        // position on grid
        this.currentPosition = 4;
        // type of tetromino
        this.type = tetrominoes[nextTetro].slice();
        // rotational position
        this.rotation = 0;
        // indices for combination of type and rotation position
        this.shape = this.type[this.rotation];
        // current main grid indices
        this.currIndxs = this.shape.map((index) => index + this.currentPosition);
        // randomly select next shape
        this.nextTetro = Math.floor(Math.random()*7);
        // draw next shape on the preview grid
        this.drawPreview();
    }
    // draw preview
    drawPreview() {
        for(let square of previewGridSquares){
            if(square.className.includes('preview')){
                square.classList.remove('preview');
            }
        }
        previewTetros[this.nextTetro].forEach((index) => previewGridSquares[index+1].classList.add('preview'));
    }
    // check if tetromino can drop to next level and if possible, set new position as one level lower.
    drop() {
        let newPosition = this.currentPosition + width;
        this.newIndxs = this.shape.map((index) => index + newPosition);
        // Check if tetromino is at bottom of grid
        if(this.newIndxs.some((index) => index > mainGridSquares.length - 1)){
            this.drawTetro('locked');
            checkForLines();
            return game.tetro = new Tetromino(this.nextTetro);
        } 
        // Check if tetromino will hit locked square 
        else if(this.newIndxs.some((index) => mainGridSquares[index].className.includes('locked'))){
            // check if tetro only fits above top of grid (i.e. if game over)
            if(this.newIndxs.some((index) => (index - width*2) < 0)){
                this.currIndxs.map((index) => index - width*2);
                this.drawTetro('locked');
                gameOver();
            } 
            // game not lost so lock and create new tetromino
            else{
                this.drawTetro('locked');
                checkForLines();
                game.tetro = new Tetromino(this.nextTetro);
                return;
            }
        }
        // All squares valid, so update tetromino indexes and draw in new position
        else {
            game.score += 5;
            updateScore();
            return this.updateTetro(newPosition);
        }
    }
    // update object properties and draw tetromino in new position passed in as a paramater. If no new position is passed into the function, current position is used.
    updateTetro(newPosition=this.currentPosition) {
        this.shape = this.type[this.rotation];
        // recording previous indices allows those grid squares to be cleared easily when tetromino is moved
        this.prevIndxs = this.currIndxs;
        this.currIndxs = this.newIndxs;
        this.currentPosition = newPosition;
        this.drawTetro();
    }
    // clear squares previously occupied by tetromino and draw it in its new position
    drawTetro(tetromino='tetromino') {
        if(this.prevIndxs){
            this.prevIndxs.forEach((index) => {
            let sq = mainGridSquares[index];
                if(sq){
                    sq.classList.remove('tetromino');
                }
            });
        }
        this.currIndxs.forEach((index) => {
            let sq = mainGridSquares[index];
            if(sq){
                sq.classList.add(tetromino);
            }
        })
    }
    // check that a left or right move is possible after keypress, if so, update position of tetromino
    checkNewIndxsMove(newPosition) {
        this.newIndxs = this.shape.map((index) => index + newPosition);
        if(
            // checking not pushing tetromino over edge of grid
            this.shape.some((index) => {
                return Math.floor((index + this.currentPosition)/10) !== Math.floor((index + newPosition)/10);
            })
            ||
            // checking not pushing tetromino into locked square
            this.newIndxs.some((index) => {
                return mainGridSquares[index].className.includes('locked');
            })
        ){
            // if either check fails, do nothing
            return;
        } 
        // checks passed, update tetro position
        else {
            this.updateTetro(newPosition);
        }
    }
    // rotate the tetromino (if possible)
    rotateTetro() {
        this.shape = this.type[this.rotation];
        this.newIndxs = this.shape.map((index) => index + this.currentPosition);
        var count = 0;
        // ensure that tetromino remains complete and does not get pushed over edge of grid by rotation
        while(this.newIndxs[3]%10 < this.newIndxs[0]%10) {
            this.currentPosition--;
            this.newIndxs = this.shape.map((index) => index + this.currentPosition);
        };
        // if not possible to rotate, reverse rotation and shape change
        if(this.newIndxs.some((index) => mainGridSquares[index].className.includes('locked'))){
            this.rotation--;
            return this.shape = this.type[this.rotation];
        };
        // if possible, update the tetromino position and rotation
        this.updateTetro();
    }
}
//create first tetromino

// ––– Game class –––
class Game {
    // create game
    constructor(){
        // set default game settings
        this.state = "paused";
        this.score = 0;
        this.speed = 250;
        // reattach eventlistener to start button if new game
        startBtn.addEventListener('click', startStop);
        // create first tetromino
        this.tetro = new Tetromino;
        fetchHighScores();
    }
}
// create first game
var game = new Game;

// ––– Button functionality –––
startBtn.addEventListener('click', startStop);
resetBtn.addEventListener('click', reset);
document.addEventListener('keydown', moveTetromino);
saveBtn.addEventListener('click', postHighScore);

// start/stop functions
function startStop(){
    if(game){
        if(game.state === "paused"){
            game.state = "running";
            start();
        } else if(game.state === "running") {
            game.state = "paused";
            pause();
        }
    } else {
        game = new Game;
        game.state = "running";
        start();
    }
}

function start() {
    game.tetro.drawTetro();
    interval = window.setInterval(() => {
        game.tetro.drop();
    }, game.speed);
    startBtn.textContent = "Pause";
}

function pause() {
    window.clearInterval(interval);
    startBtn.textContent = "Start";
}

function gameOver() {
    game.state = "dead";
    pause();
    // prevent game restarting by removing event listener from start button
    startBtn.removeEventListener('click', startStop);
    startBtn.textContent = "Game Over!";
    if(game.score>Number(scoresDisplay[4].textContent)){
        highscoreDisplay.textContent = game.score;
        savePanel.classList.remove('hidden');
    }
}

function reset(){
    pause();
    mainGridSquares.forEach((square) => {
        square.classList.remove('tetromino');
        square.classList.remove('locked');
    })
    game = new Game;
    scoreDisplay.textContent = game.score;
}

// control functions
function moveTetromino(e){
    if(game.state === "paused"){
        return ;
    }
    else {
        //left
        if(e.which === 37){
            let nextPosition = game.tetro.currentPosition - 1;
            return game.tetro.checkNewIndxsMove(nextPosition);
        }
        //right
        if(e.which === 39){
            let nextPosition = game.tetro.currentPosition + 1;
            return game.tetro.checkNewIndxsMove(nextPosition);
        } 
        //down
        if(e.which === 40){
            game.tetro.drop();
            return;
        }
        //rotate
        if(e.which === 38){
            game.tetro.rotation++;
            if(!game.tetro.type[game.tetro.rotation]){
                game.tetro.rotation = 0
            }
            game.tetro.shape = game.tetro.type[game.tetro.rotation];
            game.tetro.rotateTetro();
        }
    }   
}

function checkForLines() {
    // log score to be added
    let tetroScore = 0;
    // log combo total
    let combo = 0;
    // create array of 1–10 so lines can be checked easily
    for(let i=0; i<mainGridSquares.length; i+=width){
        let line = [];
        for(let j=0; j<10; j++){
            line.push(i+j);
        }
        // check if line is complete
        if(line.every(index => mainGridSquares[index].className.includes('locked'))){
            // add to score counter
            tetroScore += 1000;
            combo++;
            // clear completed line
            line.forEach(index => {
                mainGridSquares[index].classList.remove('locked');
                mainGridSquares[index].classList.remove('tetromino');
            })
            // move all locked squares above cleared line down by one line
            for(let k=i-1; k>=0; k--){
                if(
                    mainGridSquares[k].className.includes('locked')    
                ){
                    mainGridSquares[k].classList.remove('locked');
                    mainGridSquares[k].classList.remove('tetromino');
                    mainGridSquares[k+width].classList.add('locked');
                }
            }
        }
    }
    // check if points scored
    if(tetroScore){
        // apply combo bonus to score
        tetroScore = tetroScore*combo;
        // add to total game score
        game.score += tetroScore;
        // increase game speed
        game.speed -= 1
        updateScore();
    }
}

// updates score display
function updateScore(){
    scoreDisplay.textContent = game.score;
}

async function fetchHighScores(){
    try {
        let data = await $.getJSON('https://lit-hollows-17437.herokuapp.com/api/highscores/tetris');
        for(let i=0; i<5; i++){
            if(data[i]){
                let rank = i+1;
                let name = data[i].name.slice(0,6);
                let score = data[i].score;
                namesDisplay[i].textContent = `${rank}: ${name}`;
                scoresDisplay[i].textContent = score;
            }
        }
        return data;
    } catch(e) {
        console.log(`There was an error: ${e}`);
    }
}

async function postHighScore(){
    saveBtn.removeEventListener('click', postHighScore);
    saveBtn.textContent = "Saving";
    let data = {
        name: nameInput.value,
        score: game.score,
        game: 'tetris'
    }
    try {
        let response = await $.post('https://lit-hollows-17437.herokuapp.com/api/highscores', data);
        savePanel.classList.add('hidden');
        let response2 = await fetchHighScores()
        saveBtn.addEventListener('click', postHighScore);
        saveBtn.textContent = "Save";
    } catch(e) {
        console.log(`There was an error: ${e}`);
    }
}