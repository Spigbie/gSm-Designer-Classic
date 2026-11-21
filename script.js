let easelWidth = 200;
let easelHeight = 300;
let zoomScale = 1;

const zoomScaleMax = 8 * 2;

let isDrawing = false;
let brushSize = 5;
let brushRadius = 3;
let colorAlpha = 1;
let brushColor = {r: 0, g: 0, b: 0, a: colorAlpha};

let history = [];
let historyIndex = -1;

let action = "none";


const easelElement = document.querySelector('#easel');
const zoomText = document.querySelector('#zoomText');

const zoomOutButton = document.querySelector('#zoomOutButton');
const zoomInButton = document.querySelector('#zoomInButton');

const brushButton = document.querySelector("#brushButton");

const undoButton = document.querySelector("#undoButton");
const redoButton = document.querySelector("#redoButton");

const brushSizeRange = document.querySelector("#brushSizeRange");
const brushSizeText = document.querySelector("#brushSizeText");

const colorAlphaRange = document.querySelector("#colorAlphaRange");
const colorAlphaText = document.querySelector("#colorAlphaText");

const baseCanvas = document.querySelector('#baseCanvas');
const topCanvas = document.querySelector('#topCanvas');
const previewCanvas = document.querySelector('#previewCanvas');
const brushShapeCanvas = document.querySelector("#brushShapeCanvas");

const baseCtx = baseCanvas.getContext("2d");
const topCtx = topCanvas.getContext("2d");
const previewCtx = previewCanvas.getContext("2d");
const brushShapeCtx = brushShapeCanvas.getContext("2d");

let lastStamp = null;

class Brush {
    constructor({
        size = 10,
        opacity = 1,
        spacing = 0.2,
        color = { r: 0, g: 0, b: 0 }
    } ={}) {
        this.size = size;
        this.opacity = opacity;
        this.spacing = spacing;
        this.color = color;

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
    }

    draw(ctx, x, y){
        ctx.save();

        ctx.globalAlpha = this.opacity;

        ctx.drawImage(
            this.canvas, 
            x - this.canvas.width / 2,
            y - this.canvas.height / 2
        );

        ctx.restore();
    }
}

class Pencil extends Brush {
    constructor({
        shape = "round", 
        ...options
    } = {}){
        super(options);
        this.shape = shape;
        this.update();
    }

    update(){
        const size = this.size;

        this.canvas.width = size;
        this.canvas.height = size;

        const ctx = this.ctx;

        ctx.clearRect(0, 0, size, size);

        ctx.fillStyle = `rgb(
            ${this.color.r},
            ${this.color.g},
            ${this.color.b}
        )`;

        if (this.shape === "round") {
            ctx.beginPath();
            ctx.roundRect(
                0,
                0,
                size,
                size,
                size / 2
            );
            ctx.fill();

            const imageData = ctx.getImageData(0, 0, size, size);
            ctx.putImageData(deAntiRasterize(imageData), 0, 0);
        }

        else if (this.shape === "square") {
            ctx.fillRect(0, 0, size, size);
        }
    }
}

class PaintBrush extends Brush {
    constructor({
        hardness = 0,
        ...options
    } = {}) {
        super(options);

        this.hardness = hardness;

        this.update();
    }

    update(){
        const size = this.size;

        this.canvas.width = size;
        this.canvas.height = size;

        const ctx = this.ctx;
        const radius = (size / 2);

        ctx.clearRect(0, 0, size, size);

        const gradient = ctx.createRadialGradient(
            radius, radius, 0, radius, radius, radius
        );

        const stops = 30;
        const opaqueEdge = this.hardness; // between 0 and 1

        for (let i = 0; i <= stops; i++) {
            const stopProgression = i / stops; // between 0 and 1
            let alpha;

            if (stopProgression <= opaqueEdge) {
                alpha = 1;

            } else if(stopProgression >= 1){
                alpha = 0;

            } else {
                let softProgression = (stopProgression - opaqueEdge) / (1 - opaqueEdge);
                alpha = 1 - ((3 * softProgression ** 2) - (2 * softProgression ** 3)); // 1 - (3x^2) - (2x^3)
            }

            gradient.addColorStop(stopProgression, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`);
        }

        ctx.beginPath();
        ctx.roundRect(
                0,
                0,
                size,
                size,
                size / 2
            );
        ctx.fillStyle = gradient;
        ctx.fill();
        
    }
}

const brushes = [
    new PaintBrush({size: 10, hardness: 0, opacity: 1}),
    new PaintBrush({size: 10, hardness: 1, opacity: 1}),
    new Pencil({size: 10, shape: "round", opacity: 1}),
    new Pencil({size: 10, shape: "square", opacity: 1}),
];
const currentBrush = brushes[0];
console.log(currentBrush);

initiate();
function initiate(){
    saveDrawingState()
}

function deAntiRasterize(imageData){

    for(let i = 3; i < imageData.data.length; i += 4){
        imageData.data[i] = (imageData.data[i] > 127) ? 255 : 0;
    }

    return imageData;
}

//====================================================================================
brushButton.addEventListener("click", () => {
    
    if(action === "draw"){
        action = "none";
        brushButton.classList.remove("selected");
    }
    else{
        action = "draw";
        brushButton.classList.add("selected");
    }

});

undoButton.addEventListener("click", () => {
    if(historyIndex <= 0 ){return;}
    console.log("undo");
    historyIndex--;
    // console.log(historyIndex);
    const previousState = history[historyIndex];
    baseCtx.putImageData(previousState, 0, 0);
    updatePreview(historyIndex);
});

redoButton.addEventListener("click", () => {
    if(historyIndex >= history.length - 1){return;}
    console.log("redo");
    historyIndex++;
    // console.log(historyIndex);
    const nextState = history[historyIndex];
    baseCtx.putImageData(nextState, 0, 0);
    updatePreview(nextState);
});
//====================================================================================
brushSizeRange.addEventListener("input", () => {
    brushSize = brushSizeRange.value;
    brushSizeText.textContent = brushSizeRange.value;
});

//====================================================================================

colorAlphaRange.addEventListener("input", () => {
    colorAlpha = colorAlphaRange.value / 100;
    colorAlphaText.textContent = colorAlphaRange.value;
});
//====================================================================================

topCanvas.addEventListener("mousedown", (e) => {
    switch (action) {
        case "draw":
            isDrawing = true;
            if(isDrawing){startDrawing(e);}
            break;
    
        default:
            break;
    }
});

topCanvas.addEventListener("mouseover", (e) => {
});

topCanvas.addEventListener("mouseout", (e) => {
});

topCanvas.addEventListener("mousemove", (e) => {
    switch (action) {
        case "draw":
            if(isDrawing){startDrawing(e);}
            break;
    
        default:
            break;
    }
});

document.addEventListener("mouseup", (e) =>{
    switch (action) {
        case "draw":
            if(isDrawing){
            stopDrawing();
            // console.log("isDrawing: ", isDrawing);
            mergeDownTopCanvas();
            saveDrawingState();
            updatePreview();
        }
            break;
    
        default:
            break;
    }
});

//====================================================================================
function paint(e){
    // console.log("isDrawing: ", isDrawing);
    const brushSize = currentBrush.size;
    const spacing = currentBrush.spacing;

    const rect = e.target.getBoundingClientRect();

    const x = (e.clientX - rect.left) / zoomScale; //x position within the element.
    const y = (e.clientY - rect.top) / zoomScale;  //y position within the element.

    if(!lastStamp){
        lastStamp = {x, y};
        currentBrush.draw(topCtx, x, y);
        return;
    }

    const distanceX = x - lastStamp.x;
    const distanceY = y - lastStamp.y;

    const distance = Math.hypot(distanceX, distanceY);

    if(distance < brushSize * spacing){return;};
    currentBrush.draw(topCtx, x, y);
    lastStamp = {x, y};
}

function startDrawing(e) {
    lastPoint = null;
    isDrawing = true;
    paint(e);
}

function stopDrawing() {
    lastPoint = null;
    isDrawing = false;
}

function mergeDownTopCanvas(){

    if(historyIndex < history.length - 1){
        history.splice(historyIndex);
        // console.log(history);
    }
    console.log("merge");
    baseCtx.drawImage(topCanvas, 0, 0);
    topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
}

function saveDrawingState(){
    const imageData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    history.push(imageData);
    historyIndex++;

    // console.log(historyIndex);
    // console.log(history);
}

function updatePreview(imageData){
    console.log("update preview");
    previewCtx.drawImage(baseCanvas, 0, 0);
    // previewCtx.putImageData(nextState, 0, 0);
}

//====================================================================================
zoomOutButton.addEventListener("click", () =>{
    if(zoomScale <= 1){return;}
    zoomScale = clamp(zoomScale / 2, 1, zoomScaleMax);  
    scaleEasel();
});

zoomInButton.addEventListener("click", () =>{
    if(zoomScale >= zoomScaleMax){return;}
    zoomScale = clamp(zoomScale * 2, 1, zoomScaleMax);     
    scaleEasel();
});

function scaleEasel(){
    const newEaselWidth = easelWidth * zoomScale;
    const newEaselHeight = easelHeight * zoomScale;
    zoomText.textContent = `${zoomScale}x`; 
    easelElement.style.width = `${newEaselWidth}px`;
    easelElement.style.height = `${newEaselHeight}px`;
}

//====================================================================================
document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('pointerdown', e => {
        const panel = handle.previousElementSibling.classList.contains('main')
            ? handle.nextElementSibling
            : handle.previousElementSibling;

        const direction = panel === handle.previousElementSibling ? 1 : -1;
        const startX = e.clientX;
        const startWidth = panel.offsetWidth;

        handle.setPointerCapture(e.pointerId);

        handle.onpointermove = e => {
            panel.style.flexBasis =
            `${Math.min(300, Math.max(100, startWidth + (e.clientX - startX) * direction))}px`;
        };

        handle.onpointerup = () => {
            handle.onpointermove = null;
        };
    });
});

//====================================================================================
function clamp(num, min, max) {
  return num <= min 
    ? min 
    : num >= max 
      ? max 
      : num
}