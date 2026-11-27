// Easel Settings
let easelWidth = 200;
let easelHeight = 300;

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
const undoButton = document.querySelector("#undoButton");
const redoButton = document.querySelector("#redoButton");


// Colour Window
const colorPreview = document.querySelector("#colorPreview");
const colorSettingsContainer = document.querySelector("#colorSettings");


// Brush Window
const brushPreviewCanvas = document.querySelector("#brushPreviewCanvas");
const brushPreviewCtx = brushPreviewCanvas.getContext("2d");
const brushSettingsContainer = document.querySelector("#brushSettings");
const brushTipsContainer = document.querySelector("#brushTipsContainer");


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


// Math
const toPercent = (val) => Math.round(val * 100);

const tipImagePaths = [
    "images/brush tips/tip.png", 
    "images/brush tips/tip2.png", 
    "images/brush tips/tip3.png",
    "images/brush tips/tip4.png"
];


// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



const draw = {
    active: false,

    start(e){
        this.active = true;
        // paint(e);
    },

    stop(){
        lastStamp = null;
        this.active = false;
        mergeDownTopCanvas();
        saveDrawingState();
        updatePreview();
    }, 

    move(e){
        // paint(e);
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
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



class CircleTip{
    constructor({
        hardness = 0, 
        pixelSnap = false
    } = {}){
        this.hardness = hardness;
        this.pixelSnap = pixelSnap;
    }

    render(maskCtx, size){
        const imgData = maskCtx.createImageData(size, size);
        const data = imgData.data;
        const center = (size - 1) / 2;
        const radius = size / 2;

        for (let y = 0; y < size; y++){for (let x = 0; x < size; x++){
            
            const dist = Math.hypot(x - center, y - center);
            if(dist > radius) continue;
            let alpha = 1;

            if(!this.pixelSnap){
                const normDist = dist/radius;

                if(normDist > this.hardness){
                    if(this.hardness >= 1){
                        alpha = clamp(radius - dist,  0, 1);

                    } else{
                        const softProg = (normDist - this.hardness) / (1 - this.hardness);
                        alpha = 1 - (3 * softProg ** 2 - 2 * softProg ** 3);
                    }
                }
            } 

            const idx = (y * size + x) * 4;
            imgData.data[idx] = 0;
            imgData.data[idx + 1] = 0;
            imgData.data[idx + 2] = 0;
            imgData.data[idx + 3] = Math.round(alpha * 255);

        }}

        maskCtx.putImageData(imgData, 0, 0);
    }
}

function trimCtx(ctx, width, height){
    const imgdata = ctx.getImageData(0, 0, width, height);
    const data = imgdata.data;

    let left = width;
    let top = height;
    let right = 0;
    let bottom = 0;
    let hasPixel = false;

    for(let i = 3; i < data.length; i+=4){
        if (data[i] > 0){
            hasPixel = true;

            const pixelIndex = (i - 3) / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);

            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
        }
    }

    if (!hasPixel) {
        return { left: 0, top: 0, width: 0, height: 0 };
    }

    return {
        left, 
        top, 
        width: (right - left) +1 , 
        height: (bottom - top) + 1
    };
}

class ImageTip{
    constructor(imageSource){
        this.image = imageSource;

        const canvas = document.createElement("canvas");
        canvas.width = this.image.width;
        canvas.height = this.image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(this.image, 0, 0);

        this.trimmed = trimCtx(ctx, canvas.width, canvas.height);
    }

    render(maskCtx, size){
        const {left, top, width, height} = this.trimmed;
        if (width === 0 || height === 0) return;

        const scale = Math.min(size / width, size / height);
        const destWidth = width * scale;
        const destHeight = height * scale;

        const destX = (size - destWidth) / 2;
        const destY = (size - destHeight) / 2;

        maskCtx.drawImage(
            this.image, 
            left,   top,    width,      height,
            destX,  destY,  destWidth,  destHeight
        );
    }
}

class SquareTip{
    constructor(){
    }

    render(maskCtx, size){
        maskCtx.beginPath();
        maskCtx.rect(0, 0, size, size);
        maskCtx.fillStyle = `rgb(0, 0, 0)`;
        maskCtx.fill();
    }
}

const brushTips = [
    new CircleTip({hardness:0,      pixelSnap: false}),
    new CircleTip({hardness:0.25,   pixelSnap: false}),
    new CircleTip({hardness:0.5,    pixelSnap: false}),
    new CircleTip({hardness:0.75,   pixelSnap: false}),
    new CircleTip({hardness:1,      pixelSnap: false}),
    new CircleTip({hardness:0,      pixelSnap: true}),
    new CircleTip({hardness:0.25,   pixelSnap: true}),
    new CircleTip({hardness:0.5,    pixelSnap: true}),
    new CircleTip({hardness:0.75,   pixelSnap: true}),
    new CircleTip({hardness:1,      pixelSnap: true}),
    new SquareTip({}),
];

// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



class Brush {
    constructor({
        name,
        tip,
        settings,
        size = 10,
        opacity = 1,
        spacing = 0.2,
        flow

    } ={}) {
        this.name = name;
        this.tip = tip;
        this.supportedSettings = settings;

        this.size = size;
        this.spacing = spacing;
        this.opacity = opacity;
        this.flow = flow;

        this.maskCanvas = document.createElement("canvas");
        this.maskCtx = this.maskCanvas.getContext("2d");
        this.tintCanvas = document.createElement("canvas");
        this.tintCtx = this.tintCanvas.getContext("2d");

        this.rebuildMask();
    }

    rebuildMask(){
        this.maskCanvas.width = this.size;
        this.maskCanvas.height = this.size;
        this.maskCtx.clearRect(0, 0, this.size, this.size);

        this.tip.render(this.maskCtx, size);
        this.tint(r, g, b);

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


// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



const brushSettings = {
    size:       {default: 10,   min: 1,     max: 100,   step: 1,    unit: "px"  },
    hardness:   {default: 0,    min: 0,     max: 1,     step: 0.01, unit: "%",  format: toPercent},
    spacing:    {default: 0.2,  min: 0,     max: 1,     step: 0.01, unit: "%",  format: toPercent},
    opacity:    {default: 1,    min: 0.01,  max: 1,     step: 0.01, unit: "%",  format: toPercent},
    flow:       {default: 1,    min: 0.01,  max: 1,     step: 0.01, unit: "%",  format: toPercent},
};



// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
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



brushSettingsContainer.addEventListener("input", (e) =>{
    const wrapper = e.target.closest(".range-wrapper");
    if (!wrapper) return;

    const range = wrapper.querySelector("input[type='range']");
    const text = wrapper.querySelector(".range-text");
    const settingName = range.dataset.setting;

    if(!settingName) return;

    const rawValue = Number(range.value);
    const formatValue = brushSettings[settingName].format? brushSettings[settingName].format(rawValue): rawValue;
    text.textContent = formatValue;
});


// Color Settings
colorSettingsContainer.addEventListener("input", (e) =>{
    const wrapper = e.target.closest(".color-wrapper");
    const range = wrapper.querySelector("input[type='range']");
    const text = wrapper.querySelector(".range-text");
    const colorName = range.dataset.color;

    text.textContent = range.value;
    color[colorName] = range.value;
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
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
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
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



async function initiate(){
    const loadedImages = await Promise.all(tipImagePaths.map(loadImage));

    for (const img of loadedImages) {
        brushTips.push(new ImageTip(img));
    }

    saveDrawingState();
    renderBrushControls(brushSettingsContainer);
    updateColorPreview();    
    displayBrushTips();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function updateColorPreview(){
    colorPreview.style.background = `rgb(${color.r}, ${color.g}, ${color.b})`;
}


function displayBrushTips(){
    const tipSize = 20;
    for(const tip of brushTips){
        const canvas = document.createElement("canvas");

        canvas.width = tipSize;
        canvas.height = tipSize;

        const ctx = canvas.getContext("2d");

        console.log(tip);
        tip.render(ctx, tipSize, tipSize);

        brushTipsContainer.appendChild(canvas);
    } 
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
        rangeInput.min = setting.min;
        rangeInput.max = setting.max;
        rangeInput.step = setting.step;
        rangeInput.value = setting.default;
        rangeInput.dataset.setting = name;

        rangeWrapper.append(rangeLabel, rangeInput);
        container.appendChild(rangeWrapper);
    }
}


function mergeDownTopCanvas(){
    if(historyIndex < history.length - 1){
        history.splice(historyIndex + 1);
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
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
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
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
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
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿
// ✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿✿



initiate();