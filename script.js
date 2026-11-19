let easelWidth = 200;
let easelHeight = 300;
let zoomScale = 1;

let isDrawing = false;
let brushSize = 3;
let brushRadius = 3;
let brushColor = {r: 0, g: 0, b: 0};

const easelElement = document.querySelector('#easel');
const zoomText = document.querySelector('#zoomText');
const previewCanvas = document.querySelector('#previewCanvas');

const zoomOutButton = document.querySelector('#zoomOutButton');
const zoomInButton = document.querySelector('#zoomInButton');

const canvas = document.querySelector('#canvas');

//====================================================================================

const drawButton = document.querySelector("#drawButton");

//====================================================================================
const ctx = canvas.getContext("2d");
const imgData = ctx.getImageData(0, 0, easelWidth, easelHeight);

const previewCtx = previewCanvas.getContext("2d");
const previewImgData = previewCtx.getImageData(0, 0, easelWidth, easelHeight);
//====================================================================================



// canvas.addEventListener("click", () => {
//     console.log("click canvas"); 
// });

canvas.addEventListener("mousedown", (e) => {
    // console.log("mouse down");
    isDrawing = true;

    if(isDrawing){
        paint(e);
    }
});

canvas.addEventListener("mouseup", (e) => {
    // console.log("mouse up");
    isDrawing = false;
    console.log("isDrawing: ", isDrawing);
    updatePreview();
});

canvas.addEventListener("mouseover", (e) => {
    // console.log("mouse over");
});

canvas.addEventListener("mouseout", (e) => {
    // console.log("mouse out");
});

canvas.addEventListener("mousemove", (e) => {
    //console.log("mouse move");
    if(isDrawing){
        paint(e);
        //updatePreview();
    }
    
});

document.addEventListener("mouseup", (e) =>{
    if(isDrawing){
        isDrawing = false;
        console.log("isDrawing: ", isDrawing);
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

    ctx.fillStyle = `rgb(${brushColor.r}, ${brushColor.g}, ${brushColor.b});`
    ctx.fillRect(x2, y2, brushSize, brushSize);

    
}

function updatePreview(){
    console.log("update preview");
    previewCtx.drawImage(canvas, 0, 0);
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