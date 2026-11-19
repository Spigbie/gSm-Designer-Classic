let easelWidth = 200;
let easelHeight = 300;
let zoomScale = 1;

let isDrawing = false;
let brushSize = 3;
let brushRadius = 3;
let brushColor = {r: 0, g: 0, b: 0};

let history = [];
let historyIndex = 0;

const easelElement = document.querySelector('#easel');
const zoomText = document.querySelector('#zoomText');

const zoomOutButton = document.querySelector('#zoomOutButton');
const zoomInButton = document.querySelector('#zoomInButton');

const drawButton = document.querySelector("#drawButton");

const undoButton = document.querySelector("#undoButton");
const redoButton = document.querySelector("#redoButton");

const baseCanvas = document.querySelector('#baseCanvas');
const topCanvas = document.querySelector('#topCanvas');
const previewCanvas = document.querySelector('#previewCanvas');

const baseCtx = baseCanvas.getContext("2d");
const topCtx = topCanvas.getContext("2d");
const previewCtx = previewCanvas.getContext("2d");

initiate();
function initiate(){
    saveDrawingState();
}

//====================================================================================
undoButton.addEventListener("click", () => {
    console.log("undo");
    historyIndex--;
    const previousState = history[historyIndex];
    baseCtx.putImageData(previousState, 0, 0);
});

redoButton.addEventListener("click", () => {
    console.log("redo");
});


//====================================================================================

topCanvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    if(isDrawing){paint(e);}
});

topCanvas.addEventListener("mouseover", (e) => {
});

topCanvas.addEventListener("mouseout", (e) => {
});

topCanvas.addEventListener("mousemove", (e) => {
    if(isDrawing){paint(e);}
});

document.addEventListener("mouseup", (e) =>{
    if(isDrawing){
        isDrawing = false;
        console.log("isDrawing: ", isDrawing);
        mergeDownTopCanvas();
        saveDrawingState();
        updatePreview();
    }
});

//====================================================================================
function paint(e){
    console.log("isDrawing: ", isDrawing);

    const rect = e.target.getBoundingClientRect();

    const x = Math.floor((e.clientX - rect.left) / zoomScale); //x position within the element.
    const y = Math.floor((e.clientY - rect.top) / zoomScale);  //y position within the element.

    const x2 = x - Math.floor(brushSize / 2);
    const y2 = y - Math.floor(brushSize / 2);

    console.log(x, y);
    console.log(x2, y2);

    topCtx.fillStyle = `rgb(${brushColor.r}, ${brushColor.g}, ${brushColor.b});`
    topCtx.fillRect(x2, y2, brushSize, brushSize);
}

function mergeDownTopCanvas(){
    console.log("merge");
    baseCtx.drawImage(topCanvas, 0, 0);
    topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
}

function saveDrawingState(){
    const imageData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    history.push(imageData);
    historyIndex++;

    console.log(historyIndex);
    console.log(history);
}

function updatePreview(){
    console.log("update preview");
    previewCtx.drawImage(baseCanvas, 0, 0);
}

//====================================================================================
zoomOutButton.addEventListener("click", () =>{
    if(zoomScale <= 1){return;}
    zoomScale = clamp(zoomScale - 1, 1, 5);  

    scaleEasel();
});

zoomInButton.addEventListener("click", () =>{
    if(zoomScale >= 5){return;}
    zoomScale = clamp(zoomScale + 1, 1, 5);     
    scaleEasel();
});

function scaleEasel(){
    console.log(zoomScale);
    console.log("zoom in");

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