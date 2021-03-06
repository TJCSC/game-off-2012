var canvas = document.getElementById('canvas');
if (!canvas.getContext){
    // if canvas not supported
    alert('broke');
} else {
    //canvas is supported
    //alert('not broke');
}  
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
var context = canvas.getContext('2d');
var requestAnimationFrame = 
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame;
const dirUp = Math.PI*3/2;
const dirRight = 0;
const dirDown = Math.PI/2;
const dirLeft = Math.PI;
const turnSpeed = Math.PI/18;

var snakes = initSnakes();
var activeSnake = snakes[0];
var cellWidth = 10;
var food = placeFood();
const keySpace = 32;
const keyLeft = 37;
const keyUp = 38;
const keyRight = 39;
const keyDown = 40;
var keys = {keyLeft:false, keyUp:false, keyRight:false, keyDown:false};

const LR = 0;
const LL = 1;
const UL = 2;
const UR = 3;

var targetFPS = 30;
var frameDelay = 1000/targetFPS; // time between frames in ms
var updateDelay = 125; // time between updates in ms
var time0 = new Date();
var time1 = time0;
var ttime = 0; // total time since last frame
var dtime = 0; // time difference

window.addEventListener('keydown',handleKeyDown,true);
window.addEventListener('keyup',handleKeyUp,true);
requestAnimationFrame(loop);

function loop() {
    time1 = new Date();
    dtime = time1-time0;
    time0 = time1;

    ttime += dtime;

    if(ttime > updateDelay){
        ttime -= updateDelay;
        updateWorld();
    }
    drawWorld();

    window.setTimeout(function(){requestAnimationFrame(loop)}, frameDelay);
}
function drawWorld() {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    for(var i in snakes) {
        drawSnake(snakes[i]);
    }
    drawWall();
    drawCell(food, 'red');
}
function updateWorld() {
    doMovement();
    for(var i in snakes) {
        updateSnake(snakes[i]);
    }
}

function initSnakes() {
    var firstSnake = {cells:new Array()};
    for(var i=5; i>0; i--) {
        firstSnake.cells.push({x:i, y:1, r:dirRight});
    }
    firstSnake.dir = dirRight;
    firstSnake.prevDir = dirRight;
    firstSnake.color = 'blue';
    var secondSnake = {cells:new Array()};
    for(var i=5; i>0; i--) {
        secondSnake.cells.push({x:i, y:12, r:dirRight});
    }
    secondSnake.dir = dirRight;
    secondSnake.prevDir = dirRight;
    secondSnake.color = 'green';
    return [firstSnake,secondSnake];
}

function updateSnake(snake) { 
    var cells = snake.cells;
    var head = cells[0];
    var tail = {x:head.x,y:head.y,r:head.r};
    tail.x += Math.cos(snake.dir);
    tail.y += Math.sin(snake.dir);
    tail.r = snake.dir;

    snake.cells.unshift(tail);
    snake.prevDir = snake.dir;
    if(checkCollision(head,food)) {
        food = placeFood();
        if(snake.cells.length === 10) {
            splitSnake(snake);
        }
    } else {
        cells.pop();
    }

    killSnakes();
}

function distance(c1, c2) {
    var x1 = c1.x + cellWidth/2;
    var y1 = c1.y + cellWidth/2;
    var x2 = c2.x + cellWidth/2;
    var y2 = c2.y + cellWidth/2;
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
}

function splitSnake(snake) { 
    var newSnake = {cells:new Array()};
    for(var i=0; i<5; i++) {
        newSnake.cells.push(snake.cells.pop());
    }
    newSnake.dir = newSnake.cells[0].r - Math.PI;
    if(newSnake.dir < 0) {
        newSnake.dir += 2*Math.PI;
    }
    newSnake.color = 'green';
    snakes.push(newSnake);
}

// If you run into the side of another snake or yourself,
// you cut off part of that snake.  If you have a head on
// collision, both die, unless one snake is just a head,
// in which case it dies and the other lives.
function killSnakes() { 
    for(var i=snakes.length-1; i>=0; i--) {
        var snake = snakes[i];
        if(!snake || snake.cells.length<1) {
            snakes.splice(i,1);
            continue;
        }
        var head = snake.cells[0];
        if(head.x < 1 || head.x >= WIDTH/cellWidth-1) { //update to new collision detection
            snake.cells.splice(0, 1);
        } else if(head.y < 1 || head.y >= HEIGHT/cellWidth-1) {
            snake.cells.splice(0, 1);
        }
        if(snake.cells.length<1) { // fixme: stop duplicating this code block
            snakes.splice(i,1);
            continue;
        }
        
        snakeloop:
        for(var j=snakes.length-1; j>=0; j--) {
            for(var k in snakes[j].cells) {
                if(j === i && k < 2) continue;
                var cell = snakes[j].cells[k];
                if(checkCollision(cell,head)) {
                    if(k == 0) {
                        ilength = snakes[i].cells.length;
                        jlength = snakes[j].cells.length;
                        if(ilength >= 1) {
                            snakes[j].cells.splice(0, 1);
                        }
                        if(jlength >= 1) {
                            snakes[i].cells.splice(0, 1);
                        }
                        
                    } else {
                        snakes[j].cells = snakes[j].cells.slice(0, k); // fixme: have snake grow by one
                    }
                    if(snakes[j].cells.length<1) {
                        snakes.splice(j,1);
                    }
                    if(snake.cells.length<1) {
                        snakes.splice(snakes.indexOf(snake),1);
                        break snakeloop;
                    }
                    break;
                }
            }
        } 
    }
}

function doMovement() {
    if(keys[keyLeft]) {
        getActiveSnake().dir -= turnSpeed;
        if(getActiveSnake().dir < 0) {
            getActiveSnake().dir += 2*Math.PI;
        }
    }
    if(keys[keyRight]) {
        getActiveSnake().dir += turnSpeed;
        if(getActiveSnake().dir > 2*Math.PI) {
            getActiveSnake().dir -= 2*Math.PI;
        }
    }
}

function drawCell(cell, color) {
    var half = cellWidth/2;
    context.save();
    var x = cell.x * cellWidth + half;
    var y = cell.y * cellWidth + half;
    var r = cell.r || 0;
    context.translate(x,y);
    context.rotate(cell.r);
    context.beginPath();
    context.rect(-half, -half, cellWidth, cellWidth);
    context.fillStyle = color;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = 'white';
//                context.stroke();
    context.closePath();
    context.restore();
}

function placeFood() {
    var x = Math.random() * (WIDTH/cellWidth-2);
    x = Math.floor(x);
    x += 1;
    var y = Math.random() * (HEIGHT/cellWidth-2);
    y = Math.floor(y);
    y += 1;
    return {x:x, y:y};
}

function drawSnake(snake) {
    for (var i = snake.cells.length-1; i>=0; i-- ) {
        drawCell(snake.cells[i], snake.color);
    }
}

function drawWall() {
    for(var x=0; x<WIDTH/cellWidth; x++) {
        drawCell({x:x, y:0}, 'black');
        drawCell({x:x, y:HEIGHT/cellWidth-1}, 'black');
    }
    for(var y=1; y<HEIGHT/cellWidth-1; y++) {
        drawCell({x:0, y:y}, 'black');
        drawCell({x:WIDTH/cellWidth-1, y:y}, 'black');
    }
}

function handleKeyDown(evt) {
    if(evt.keyCode === keySpace) {
        changeSnake();
    } else {
        keys[evt.keyCode] = true;
    }
}

function handleKeyUp(evt) {
    if(evt.keyCode != keySpace) {
        keys[evt.keyCode] = false;
    }
}

function changeSnake() {
    if(snakes.length == 0) {
        return;
    }
    var oldSnake = getActiveSnake();
    oldSnake.color = 'green';
    
    var newPos = (snakes.indexOf(oldSnake) + 1) % snakes.length;
    activeSnake = snakes[newPos];
    activeSnake.color = 'blue';
}

function getActiveSnake() { // Fixme
    return activeSnake;
}

function checkCollision(c1, c2) { // needs cleaning
// http://www.gamedev.net/page/resources/_/technical/game-programming/2d-rotated-rectangle-collision-r2604
    if(distance(c1,c2) > 1.5) { // Quick check (1.5 = sqrt(2))
        return false;
    }

    var axes = new Array();
    var A = getCorners(c1);
    var B = getCorners(c2);

    axes[0] = {x:A[UR].x-A[UL].x, y:A[UR].y-A[UL].y};
    axes[1] = {x:A[UR].x-A[LR].x, y:A[UR].y-A[LR].y};
    axes[2] = {x:B[UL].x-B[LL].x, y:B[UL].y-B[LL].y};
    axes[3] = {x:B[UL].x-B[UR].x, y:B[UL].y-B[UR].y};

    for(var i=0; i<4; i++) {
        var proja = new Array();
        var projb = new Array();
        for(var j=0; j<4; j++) {
            proja[j] = dot(project(A[j],axes[i]),axes[i]);
            projb[j] = dot(project(B[j],axes[i]),axes[i]);
        }
        var bmax = Math.max(projb[0],projb[1],projb[2],projb[3]);
        var bmin = Math.min(projb[0],projb[1],projb[2],projb[3]);
        var amax = Math.max(proja[0], proja[1], proja[2], proja[3]);
        var amin = Math.min(proja[0], proja[1], proja[2], proja[3]);
        if(bmin >= amax || amin >= bmax) {
            return false;
        }
    }
    return true;
}
function getCorners(cell) {
    if(!cell.r) {
        cell.r = 0;
    }

    var A = new Array(new Array(), new Array(), new Array(), new Array()); // cell's coordinates
    A.cos = Math.cos(cell.r); 
    A.sin = Math.sin(cell.r);

    A[LR] = {x: 0.5,y: 0.5};
    A[UR] = {x: 0.5,y:-0.5};
    A[UL] = {x:-0.5,y:-0.5};
    A[LL] = {x:-0.5,y: 0.5};
    for(i=0;i<4;i++) {
        ax = A[i].x;
        ay = A[i].y;
        A[i].x = ax*A.cos + ay*A.sin;
        A[i].y = -ax*A.sin + ay*A.cos;

        A[i].x += cell.x;
        A[i].y += cell.y;
    }

    return A;                
}
function project(point,axis) { // Takes projection of one onto the other
    var inter = dot(point,axis)/dot(axis,axis);
    return {x:inter*axis.x, y:inter*axis.y};
}
function dot(v1,v2) { // Dot product of two vectors
    return v1.x*v2.x+v1.y*v2.y;
}
