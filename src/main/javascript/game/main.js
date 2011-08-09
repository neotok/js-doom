var canvas, ctx;
var game;
var previousTime, currentTime, deltaTime;



function init() {

    textureLoader = new TextureLoader();
    textureLoader.load("name", "data/tiles-64.xpm.png", 64, 64);
    textureLoader.load("flat5_5", "data/flat5_5.png", 256, 256);
    textureLoader.load("floor4_8", "data/floor4_8.png", 256, 256);
    textureLoader.load("flat18", "data/flat18.png", 256, 256);
    textureLoader.load("flat20", "data/flat20.png", 256, 256);
    textureLoader.load("flat14", "data/flat14.png", 256, 256);
    textureLoader.load("floor5_1", "data/floor5_1.png", 256, 256);
    textureLoader.load("floor5_2", "data/floor5_2.png", 256, 256);
    textureLoader.load("step2", "data/step2.png", 256, 256);
    textureLoader.load("floor1_1", "data/floor1_1.png", 256, 256);
    textureLoader.load("nukage3", "data/nukage3.png", 256, 256);
    textureLoader.load("floor7_1", "data/floor7_1.png", 256, 256);

    canvas = document.getElementById("canvas");
    if (canvas && canvas.getContext) {
        ctx = canvas.getContext("2d");

        document.addEventListener('mousemove', documentMouseMoveHandler, false);
        document.addEventListener('mousedown', documentMouseDownHandler, false);
        document.addEventListener('mouseup', documentMouseUpHandler, false);

        window.addEventListener('resize', windowResizeHandler, false);
        windowResizeHandler();

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        game = new Game();
        game.init();
        loop();
    }

}

function documentMouseMoveHandler(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

function documentMouseDownHandler(e) {
    mouseDown = true;
}

function documentMouseUpHandler(e) {
    mouseDown = false;
}

function windowResizeHandler() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

hack = 16;

function loop() {
  ctx.fillStyle = "rgba(76,76,78,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  currentTime = (Date.now());
  deltaTime = currentTime - previousTime;
  game.draw(ctx);
  previousTime = currentTime;
}


setInterval(loop, 5000);
