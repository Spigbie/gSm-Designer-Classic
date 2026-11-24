// Easel Settings
let easelWidth = 200;
let easelHeight = 300;

// Brush Settings
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
const brushPreviewCanvas = document.querySelector("#brushPreviewCanvas");
const brushPreviewCtx = brushPreviewCanvas.getContext("2d");

const brushSizeRange = document.querySelector("#brushSizeRange");
const brushOpacityRange = document.querySelector("#brushOpacityRange");
const brushFlowRange = document.querySelector("#brushFlowRange");
const brushHardnessRange = document.querySelector("#brushHardnessRange");
const brushSpacingRange = document.querySelector("#brushSpacingRange");

const brushSizeText = document.querySelector("#brushSizeText");
const brushOpacityText = document.querySelector("#brushOpacityText");
const brushFlowText = document.querySelector("#brushFlowText");
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

        let drawX = x - this.canvas.width / 2;
        let drawY = y - this.canvas.height / 2;

        if (this.constructor.name === "PaintBrush") {
            ctx.globalAlpha = this.flow;           
        } else if (this.constructor.name === "Pencil"){
            //Pixel snap
            drawX = Math.round(drawX);
            drawY = Math.round(drawY);
        }

        ctx.drawImage(this.canvas, drawX, drawY);
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
        const radius = (size / 2);

        ctx.clearRect(0, 0, size, size);

        ctx.fillStyle = `rgb(
            ${color.r},
            ${color.g},
            ${color.b}
        )`;

        if (this.shape === "round") {
            const imgData = ctx.createImageData(size, size);
            const center = (size - 1) / 2;
            const radius = size / 2;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                const dist = Math.hypot(x - center, y - center);
                if (dist <= radius) {
                    const idx = (y * size + x) * 4;
                    imgData.data[idx] = color.r;
                    imgData.data[idx + 1] = color.g;
                    imgData.data[idx + 2] = color.b;
                    imgData.data[idx + 3] = 255;
                }
                }
            }
            ctx.putImageData(imgData, 0, 0);
            }

        else if (this.shape === "square") {
            ctx.fillRect(0, 0, size, size);
        }

        updateBrushPreview(this);
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

    update() {
        const size = Math.max(1, Math.round(Number(this.size)));
        this.canvas.width = size;
        this.canvas.height = size;

        this.alphaMap = new Float32Array(size * size); // Store exact 0.0 - 1.0 floats

        const imgData = this.ctx.createImageData(size, size);
        const data = imgData.data;

        // (size - 1) / 2 ensures exact symmetry for both even and odd brush sizes
        const center = (size - 1) / 2;
        const radius = size / 2;
        const opaqueEdge = this.hardness; // 0 to 1

        for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dist = Math.hypot(x - center, y - center);

            // Outside the brush circle -> leave transparent
            if (dist > radius) continue;

            // Normalized distance from center (0 at center, 1 at outer edge)
            const normDist = dist / radius;
            let alpha = 1;

            if (normDist > opaqueEdge) {
            if (opaqueEdge >= 1) {
                // Hard edge: 1px anti-aliased fringe at the very boundary
                alpha = clamp(radius - dist, 0, 1);
            } else {
                // Smoothstep falloff between opaqueEdge and 1
                const softProg = (normDist - opaqueEdge) / (1 - opaqueEdge);
                alpha = 1 - (3 * softProg ** 2 - 2 * softProg ** 3);
            }
            }

            alpha = clamp(alpha, 0, 1);
            this.alphaMap[y* size + x] = alpha;
            
            const idx = (y * size + x) * 4;
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = Math.round(clamp(alpha, 0, 1) * 255);
        }
        }

        //showMePixels(imgData);

        this.ctx.putImageData(imgData, 0, 0);
        updateBrushPreview(this);
        // this.updatePreviewShape();
    }
}



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



const brushes = [
    new PaintBrush({size: 10, hardness: 0, spacing: 0.2, opacity: 1, flow: 1}),
    new PaintBrush({size: 10, hardness: 1, spacing: 0.2, opacity: 1, flow: 1}),
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
    const value = Number(brushSizeRange.value);
    brushSizeText.textContent = value;
    currentBrush.size = value;
    currentBrush.update();
});

brushOpacityRange.addEventListener("input", () => {
    const value = Number(brushOpacityRange.value);
    brushOpacityText.textContent = value;
    currentBrush.opacity = value / 100;
    currentBrush.update();
    topCanvas.style.opacity = value / 100;
    // brushPreviewCanvas.style.opacity = value / 100;
});

brushFlowRange.addEventListener("input", () => {
    const value = Number(brushFlowRange.value);
    brushFlowText.textContent = value;
    currentBrush.flow = value / 100;
    currentBrush.update();
});

brushHardnessRange.addEventListener("input", () => {
    const value = Number(brushHardnessRange.value);
    brushHardnessText.textContent = value;
    currentBrush.hardness = value / 100;
    currentBrush.update();
});

brushSpacingRange.addEventListener("input", () => {
    const value = Number(brushSpacingRange.value);
    brushSpacingText.textContent = value;
    currentBrush.spacing = value / 100;
    currentBrush.update();
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
    updateBrushSettings();
    saveDrawingState();
    loadBrushes(brushes);
    updateColorPreview();
    updateBrushPreview(currentBrush);
    
    console.log(currentBrush);
}

function updateColorPreview(){
    colorPreview.style.background = `rgb(${color.r}, ${color.g}, ${color.b})`;
    currentBrush.update();
}

//render brush stroke preview
function updateBrushPreview(brush){
    const rect = brushPreviewCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    brushPreviewCanvas.width = width;
    brushPreviewCanvas.height = height;
    
    const midpoint = Math.round(height / 2);
    const brushRadius = brush.size / 2;

    const startPoint = {x : midpoint, y: midpoint};
    const endPoint = {x: width - midpoint, y: midpoint};
    const strokeLength = endPoint.x - startPoint.x;

    brushPreviewCtx.clearRect(0, 0, width, height);

    if (strokeLength <= 0) return;// in case th space is too small :/

    let lastX = startPoint.x;
    let lastY = startPoint.y;
    brush.draw(brushPreviewCtx, lastX, lastY);

    const bow = 2;
    const minSpacing = Math.max(1, brush.size * brush.spacing);
    
    for (let i = 1; i <= strokeLength; i++){
        
        const x = startPoint.x + i;
        const t = i / strokeLength;

        const wave  = ((25 / (3 * bow)) * (t ** 3)) 
                    - ((25 / (2 * bow)) * (t ** 2)) 
                    + ((25 / (6 * bow)) * t);
        
        const y = startPoint.y + height * wave;
        const distance = Math.hypot(x - lastX, y - lastY);

        if(distance < minSpacing) continue;

        brush.draw(brushPreviewCtx, x, y);
        lastX = x;
        lastY = y;
    }
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

    topCanvas.style.opacity = currentBrush.opacity;

    brushSizeRange.value = currentBrush.size;
    brushSizeText.textContent = currentBrush.size;

    brushOpacityRange.value = currentBrush.opacity * 100;
    brushOpacityText.textContent = currentBrush.opacity * 100;

    brushSpacingRange.value = currentBrush.spacing * 100;
    brushSpacingText.textContent = currentBrush.spacing * 100;

    if(brushType == "PaintBrush"){
        brushFlowRange.value = currentBrush.flow * 100;
        brushFlowText.textContent = currentBrush.flow * 100;

        brushHardnessRange.value = currentBrush.hardness * 100;
        brushHardnessText.textContent = currentBrush.hardness * 100;
    }

    updateBrushPreview(currentBrush);
}

function getGlobalMouseCordinates(e){
    const x = e.clientX;
    const y = e.clientY;
    console.log(e.clientX, e.clientY);
    return {x, y};
}


function paint(e){
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
        history.splice(historyIndex + 1);
        // console.log(history);
    }
    baseCtx.globalAlpha = currentBrush.opacity;
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
            updateBrushPreview(currentBrush);
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


// Image Processing Functions
function showMePixels(imageData){
    for(let i = 0; i < imageData.data.length; i += 4){
        console.log(`r: ${imageData.data[i]}, g: ${imageData.data[i + 1]}, b: ${imageData.data[i + 2]}, a: ${imageData.data[i + 3]}`);
    }
}


// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



initiate();