// Easel Settings
let easelWidth = 200;
let easelHeight = 300;

// Pen Settings

// Brush Settings

let brushSize = 10;
let opacity = 1;
let currentBrush;

// Color Settings
let color = {r: 0, g: 0, b: 0, a: 255};

//Background Settings


//Navigation Settings
let zoomScale = 1;
const zoomScaleMax = 8 * 2;


// Other
let isDrawing = false;
let history = [];
let historyIndex = -1;
let action = "none";
let lastStamp = null;
let recordMousePos = false;



// Tool Window
const drawButton = document.querySelector("#drawButton");
const undoButton = document.querySelector("#undoButton");
const redoButton = document.querySelector("#redoButton");


// Colour Window
const redRange = document.querySelector("#redRange");
const greenRange = document.querySelector("#greenRange");
const blueRange = document.querySelector("#blueRange");
const redText = document.querySelector("#redText");
const greenText = document.querySelector("#greenText");
const blueText = document.querySelector("#blueText");
const colorPreview = document.querySelector("#colorPreview");


// Brush Window
const brushShapeCanvas = document.querySelector("#brushShapeCanvas");
const brushShapeCtx = brushShapeCanvas.getContext("2d");

const brushSizeRange = document.querySelector("#brushSizeRange");
const brushOpacityRange = document.querySelector("#brushOpacityRange");
const brushHardnessRange = document.querySelector("#brushHardnessRange");
const brushSpacingRange = document.querySelector("#brushSpacingRange");

const brushSizeText = document.querySelector("#brushSizeText");
const brushOpacityText = document.querySelector("#brushOpacityText");
const brushHardnessText = document.querySelector("#brushHardnessText");
const brushSpacingText = document.querySelector("#brushSpacingText");


// Background Window


// Navigation window
const previewCanvas = document.querySelector('#previewCanvas');
const zoomOutButton = document.querySelector('#zoomOutButton');
const zoomInButton = document.querySelector('#zoomInButton');
const zoomText = document.querySelector('#zoomText');
const previewCtx = previewCanvas.getContext("2d");


// Easel
const easelElement = document.querySelector('#easel');
const baseCanvas = document.querySelector('#baseCanvas');
const topCanvas = document.querySelector('#topCanvas');
const baseCtx = baseCanvas.getContext("2d");
const topCtx = topCanvas.getContext("2d");



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



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
            ${color.r},
            ${color.g},
            ${color.b}
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
            ctx.putImageData(deAntiAlias(imageData), 0, 0);
        }

        else if (this.shape === "square") {
            ctx.fillRect(0, 0, size, size);
        }

        brushShapeCtx.drawImage(this.canvas, 0, 0);
    }
}


class PaintBrush extends Brush {
    constructor({
        hardness = 0,
        flow = 1,
        ...options
    } = {}) {
        super(options);

        this.hardness = hardness;
        this.flow = flow;

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

            gradient.addColorStop(stopProgression, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
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



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



const brushes = [
    new PaintBrush({size: 10, hardness: 0, spacing: 0.2, opacity: 1}),
    new PaintBrush({size: 10, hardness: 1, spacing: 0.2, opacity: 1}),
    new Pencil({size: 10, shape: "round", spacing: 0, opacity: 1}),
    new Pencil({size: 10, shape: "square", spacing: 0, opacity: 1}),
];

currentBrush = brushes[0];



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



// Tool Window Event Listeners
drawButton.addEventListener("click", () => {
    if(action === "draw"){
        action = "none";
        drawButton.classList.remove("selected");
    }else{
        action = "draw";
        drawButton.classList.add("selected");
    }
});


undoButton.addEventListener("click", () => {
    if(historyIndex <= 0 ){return;}
    historyIndex--;
    const previousState = history[historyIndex];
    baseCtx.putImageData(previousState, 0, 0);
    updatePreview(historyIndex);
});


redoButton.addEventListener("click", () => {
    if(historyIndex >= history.length - 1){return;}
    historyIndex++;
    const nextState = history[historyIndex];
    baseCtx.putImageData(nextState, 0, 0);
    updatePreview(nextState);
});


// Brush Window Event Listeners
brushSizeRange.addEventListener("input", () => {
    currentBrush.size = brushSizeRange.value;
    currentBrush.update();
    brushSizeText.textContent = brushSizeRange.value;
});

brushOpacityRange.addEventListener("input", () => {
    currentBrush.opacity = brushOpacityRange.value / 100;
    brushOpacityText.textContent = brushOpacityRange.value;
});

brushHardnessRange.addEventListener("input", () => {
    currentBrush.hardness = brushHardnessRange.value / 100;
    currentBrush.update();
    brushHardnessText.textContent = brushHardnessRange.value;
});

brushSpacingRange.addEventListener("input", () => {
    currentBrush.spacing = brushSpacingRange.value / 100;
    currentBrush.update();
    brushSpacingText.textContent = brushSpacingRange.value;
});




// Color Window Event Listeners
redRange.addEventListener("input", () => {
    redText.textContent = redRange.value;
    color.r = redRange.value;
    updateColorPreview();
});

greenRange.addEventListener("input", () => {
    greenText.textContent = greenRange.value;
    color.g = greenRange.value;
    updateColorPreview();
});

blueRange.addEventListener("input", () => {
    blueText.textContent = blueRange.value;
    color.b = blueRange.value;
    updateColorPreview();
});


// Navigation Window Event Listeners
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



// Easel Event Listeners
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


topCanvas.addEventListener("mouseover", (e) => {});


topCanvas.addEventListener("mouseout", (e) => {});


window.addEventListener("mousedown", (e) => {
    recordMousePos = true;
});


window.addEventListener("mouseup", (e) => {
    recordMousePos = false;
});


window.addEventListener("mousemove", (e) => {
    if(!recordMousePos){return};
    // getGlobalMouseCordinates(e);
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
    
        default: break;
    }
});



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



function initiate(){
    brushSizeRange.value = brushSize;
    brushSizeText.textContent = brushSize;
    brushOpacityRange.value = opacity * 100;
    brushOpacityText.textContent = opacity * 100;

    saveDrawingState();
    loadBrushes(brushes);
    updateColorPreview();
    
    console.log(currentBrush);
}

function updateColorPreview(){
    colorPreview.style.background = `rgb(${color.r}, ${color.g}, ${color.b})`;
    currentBrush.update();
}


function loadBrushes(brushes){
    const brushPresetsContainer = document.querySelector("#brushPresets");
    brushes.forEach(brush => {
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = 20;
        canvas.height = 20;
        const div = document.createElement("div");

        ctx.drawImage(brush.canvas, 0, 0);

        div.appendChild(canvas);
        brushPresetsContainer.appendChild(div);

        div.addEventListener("click", () => {
            currentBrush = brush;
            updateBrushSettings();
        });
    });
}

function updateBrushSettings(){
    const brushType = currentBrush.constructor.name;

    brushSizeRange.value = currentBrush.size;
    brushSizeText.textContent = currentBrush.size;

    brushOpacityRange.value = currentBrush.opacity * 100;
    brushOpacityText.textContent = currentBrush.opacity * 100;

    brushSpacingRange.value = currentBrush.spacing * 100;
    brushSpacingText.textContent = currentBrush.spacing * 100;

    if(brushType == "PaintBrush"){
        brushHardnessRange.value = currentBrush.hardness * 100;
        brushHardnessText.textContent = currentBrush.hardness * 100;
    }
}

function getGlobalMouseCordinates(e){
    const x = e.clientX;
    const y = e.clientY;
    console.log(e.clientX, e.clientY);
    return {x, y};
}


function paint(e){
    // console.log("isDrawing: ", isDrawing);
    const brushSize = currentBrush.size;
    const spacing = currentBrush.spacing;
    const step = Math.max(1, brushSize * spacing);

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

    if(distance < step){return;}

    const dirX = distanceX / distance;
    const dirY = distanceY / distance;


    const startX = lastStamp.x;
    const startY = lastStamp.y;

    for (let i = step; i <= distance; i += step) {
        const newX = startX + dirX * i;
        const newY = startY + dirY * i;
        currentBrush.draw(topCtx, newX, newY);
        
        // Safe to update lastStamp now because we read from startX/startY
        lastStamp = { x: newX, y: newY };
    }
}


function startDrawing(e) {
    isDrawing = true;
    paint(e);
}


function stopDrawing() {
    lastStamp = null;
    isDrawing = false;
}


function mergeDownTopCanvas(){
    if(historyIndex < history.length - 1){
        history.splice(historyIndex);
        // console.log(history);
    }
    baseCtx.drawImage(topCanvas, 0, 0);
    topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
}


function saveDrawingState(){
    const imageData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    history.push(imageData);
    historyIndex++;
}


function updatePreview(imageData){
    previewCtx.clearRect(0, 0, easelWidth, easelHeight);
    previewCtx.drawImage(baseCanvas, 0, 0);
    // previewCtx.putImageData(nextState, 0, 0);
}



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



function scaleEasel(){
    const newEaselWidth = easelWidth * zoomScale;
    const newEaselHeight = easelHeight * zoomScale;
    zoomText.textContent = `${zoomScale}x`; 
    easelElement.style.width = `${newEaselWidth}px`;
    easelElement.style.height = `${newEaselHeight}px`;
}

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



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



// Help Functions
function clamp(num, min, max) {
  return num <= min 
    ? min 
    : num >= max 
      ? max 
      : num
}


// Image Processing Functions
function deAntiAlias(imageData){
    for(let i = 3; i < imageData.data.length; i += 4){
        imageData.data[i] = (imageData.data[i] > 127) ? 255 : 0;
    }
    return imageData;
}


// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



initiate();