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
let history = [];
let historyIndex = -1;
let activeTool = null;
let lastStamp = null;
let recordMousePos = false;


// tool Window
const toolsContainerElement = document.querySelector("#toolsContainer");
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
const brushSettingsContainer = document.querySelector("#brushSettings");


// Background Window


// Navigation window
const previewCanvas = document.querySelector('#previewCanvas');
const zoomOutButton = document.querySelector('#zoomOutButton');
const zoomInButton = document.querySelector('#zoomInButton');
const zoomText = document.querySelector('#zoomText');
const previewCtx = previewCanvas.getContext("2d");


// Workspace
const workspaceElement = document.querySelector('#workspace');
const easelElement = document.querySelector('#easel');
const baseCanvas = document.querySelector('#baseCanvas');
const topCanvas = document.querySelector('#topCanvas');
const baseCtx = baseCanvas.getContext("2d");
const topCtx = topCanvas.getContext("2d");




// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



const draw = {
    active: false,

    start(e){
        this.active = true;
        paint(e);
    },

    stop(){
        lastStamp = null;
        this.active = false;
        mergeDownTopCanvas();
        saveDrawingState();
        updatePreview();
    }, 

    move(e){
        paint(e);
    }
}

const erase = {
    active: false,

    start(e){
        this.active = true;
        console.log("start erasing");
    },

    stop(){
        lastStamp = null;
        this.active = false;
    },

    move(e){}
}

const sample = {
    active: false,
    start(e){},
    stop(){},
    move(e){}
}

const select = {
    active: false,
    start(e){},
    stop(){},
    move(e){}
}

const fill = {
    active: false,
    start(e){},
    stop(){},
    move(e){}
}

const replace = {
    active: false,
    start(e){},
    stop(){},
    move(e){}
}


const tools = {
    draw,
    erase,
    sample,
    select,
    fill,
    replace
}



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

        this.previewCanvas = document.createElement("canvas");
        this.previewCtx = this.previewCanvas.getContext("2d");
    }

    renderStamp(targetCanvas, targetCtx, stampSize, stampColor){}

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

    erase(ctx, x, y){
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



// tool Window Event Listeners
toolsContainerElement.addEventListener("click", (e) => {
    const button = e.target.closest(".option");
    const toolName = button.dataset.tool;

    if(!toolName || !tools[toolName]) return;

    toolsContainerElement.querySelector(".selected")?.classList.remove("selected");
    button.classList.add("selected");

    activeTool = tools[toolName];
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


const toPercent = (val) => Math.round(val * 100);

const brushSettings = {
    size:       {default: 5,    min: 1,     max: 100,   step: 1,    unit: "px"  },
    hardness:   {default: 1,    min: 0,     max: 1,     step: 0.01, unit: "%",  format: toPercent},
    spacing:    {default: 0.2,  min: 0,     max: 1,     step: 0.01, unit: "%",  format: toPercent},
    opacity:    {default: 1,    min: 0.01,  max: 1,     step: 0.01, unit: "%",  format: toPercent},
    flow:       {default: 1,    min: 0.01,  max: 1,     step: 0.01, unit: "%",  format: toPercent},
}

function renderBrushControls(container){
    for (const name in brushSettings){

        const setting = brushSettings[name];

        const rangeWrapper = document.createElement("div");
        rangeWrapper.classList.add("window-group", "range-wrapper");

        const rangeLabel = document.createElement("label");
        const rawValue = setting.default;
        const formatValue = brushSettings[name].format? brushSettings[name].format(rawValue): rawValue;

        rangeLabel.innerHTML = `${name}: <span class="range-text">${formatValue}</span>${setting.unit}`;

        const rangeInput = document.createElement("input");
        rangeInput.type = "range";
        rangeInput.value = 0.5;
        rangeInput.min = setting.min;
        rangeInput.max = setting.max;
        rangeInput.step = setting.step;
        rangeInput.dataset.setting = name;

        rangeWrapper.append(rangeLabel, rangeInput);
        container.appendChild(rangeWrapper);
    }
}

brushSettingsContainer.addEventListener("input", (e) =>{
    const wrapper = e.target.closest(".range-wrapper");
    if (!wrapper) return;

    const range = wrapper.querySelector("input[type='range']");
    const rangeText = wrapper.querySelector(".range-text");
    const settingName = range.dataset.setting;

    if(!settingName || !(settingName in currentBrush)) return;

    const rawValue = Number(range.value);

    const formatValue = brushSettings[settingName].format? brushSettings[settingName].format(rawValue): rawValue;

    rangeText.textContent = formatValue;
    currentBrush[settingName] = rawValue;

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



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



// Workspace Event Listeners
workspaceElement.addEventListener("mousedown", (e) => {
    activeTool?.start(e);
});

window.addEventListener("mouseup", (e) =>{
    activeTool?.stop(e);
});

window.addEventListener("mousemove", (e) => {
    if(activeTool?.active) activeTool?.move(e);
});



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



function initiate(){
    renderBrushControls(brushSettingsContainer);
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
    // const brushType = currentBrush.constructor.name;

    // topCanvas.style.opacity = currentBrush.opacity;

    // brushSizeRange.value = currentBrush.size;
    // brushSizeText.textContent = currentBrush.size;

    // brushOpacityRange.value = currentBrush.opacity * 100;
    // brushOpacityText.textContent = currentBrush.opacity * 100;

    // brushSpacingRange.value = currentBrush.spacing * 100;
    // brushSpacingText.textContent = currentBrush.spacing * 100;

    // if(brushType == "PaintBrush"){
    //     brushFlowRange.value = currentBrush.flow * 100;
    //     brushFlowText.textContent = currentBrush.flow * 100;

    //     brushHardnessRange.value = currentBrush.hardness * 100;
    //     brushHardnessText.textContent = currentBrush.hardness * 100;
    // }

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


    const rect = topCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomScale;
    const y = (e.clientY - rect.top) / zoomScale; 

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