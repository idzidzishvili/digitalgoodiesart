var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = 700;
canvas.height = 700;
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var canvasTopLeft = canvas.getBoundingClientRect();

var isDragging = false;
var uploadedImages = [];
let imgInput = document.getElementById('image-input');
var activeImage = 0; 
var imgOffsetX = 0;
var imgOffsetY = 0;
var resizeArray = [];
var isResizing = false;
var resizeNode = 0;


imgInput.addEventListener('change', function (e) {
   if (e.target.files) {
      let imageFile = e.target.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
         let img = new Image();
         img.onload = function () {
            // get width/height ratio
            let ratio = img.width / img.height;
            // Do not allow image to display at Y more then 400px
            let x = 0;
            let y = uploadedImages.length*200>=400 ? 400 : uploadedImages.length*200;
            ctx.drawImage(img, x, y, parseInt(200*ratio), 200); // img, x, y, w, h
            // save to array new images deminsions
            uploadedImages.push({id:uploadedImages.length+1, img:e.target.result, x:x, y:y, w:parseInt(200*ratio), h:200});
         }
         img.src = e.target.result;
      }
      reader.readAsDataURL(imageFile);
   }
});


canvas.addEventListener('click', function (e) {
   // clear canvas and if clicked on any of images make it active
   ctx.clearRect(0, 0, canvasWidth, canvasHeight);
   resizeArray = [];
   uploadedImages.forEach(img => {
      drawImage(img.id)
      if(pressedOnImage(e.clientX, e.clientY, img) && activeImage===0){
         activeImage = img.id;
      }
   });
   // if any of images activate redraw it (to draw topmost) and draw resize nodes
   if (activeImage){
      drawImage(activeImage);
      let im = uploadedImages[activeImage-1];
      drawResizeRectangle(im.x, im.y, im.w, im.h);
   }
});


canvas.addEventListener('mousedown', function(e) {
   let canvasClickX = window.pageXOffset + e.clientX - canvasTopLeft.left;
   let canvasClickY = window.pageYOffset + e.clientY - canvasTopLeft.top;
   // if clicked on any of resizing nodes, set resizing mote active
   let rn = 0;
   resizeArray.forEach(function(item){
      rn++;
      if(item.x<canvasClickX && item.x+6>canvasClickX && item.y<canvasClickY && item.y+6>canvasClickY) {
         isResizing = true;
         resizeNode = rn;
      }
   });
   // if resizing do not deal with dragging
   if (isResizing) return;
   // if pressed on active image set dragging mode to true
   if(activeImage && pressedOnImage(e.clientX, e.clientY, uploadedImages[activeImage-1])){
      isDragging = true;
      imgOffsetX = canvasClickX - uploadedImages[activeImage-1].x;
      imgOffsetY = canvasClickY - uploadedImages[activeImage-1].y;
   }
   // otherwise if cliked on any of image make it active and set dragging mode to true
   else{
      let actImg = false;
      uploadedImages.forEach(img => {
         if(pressedOnImage(e.clientX, e.clientY, img)){
            actImg = true;
            if (!isDragging){
               isDragging = true;
               activeImage = img.id;
               imgOffsetX = canvasClickX - img.x;
               imgOffsetY = canvasClickY - img.y;
               drawResizeRectangle(img.x, img.y, img.w, img.h);
               return;
            }
         }
      });
      if (!actImg) activeImage = 0;
   }
});


canvas.addEventListener('mouseup', function(e) {
   let canvasMouseX = window.pageXOffset + e.clientX - canvasTopLeft.left;
   let canvasMouseY = window.pageYOffset + e.clientY - canvasTopLeft.top;
   // if resizing, update active image's size on mouse up
   if(isResizing){      
      if ((resizeNode==1 || resizeNode==4 || resizeNode==6) && canvasMouseX<uploadedImages[activeImage-1].x+uploadedImages[activeImage-1].w) {
         uploadedImages[activeImage-1].w = uploadedImages[activeImage-1].w + uploadedImages[activeImage-1].x-canvasMouseX;
         uploadedImages[activeImage-1].x = canvasMouseX;
      }
      if ((resizeNode==1 || resizeNode==2 || resizeNode==3) && canvasMouseY<uploadedImages[activeImage-1].y+uploadedImages[activeImage-1].h) {
         uploadedImages[activeImage-1].h = uploadedImages[activeImage-1].h + uploadedImages[activeImage-1].y-canvasMouseY;
         uploadedImages[activeImage-1].y = canvasMouseY;
      }
      if ((resizeNode==3 || resizeNode==5 || resizeNode==8) && canvasMouseX>uploadedImages[activeImage-1].x) {
         uploadedImages[activeImage-1].w = canvasMouseX-uploadedImages[activeImage-1].x;
      }
      if ((resizeNode==6 || resizeNode==7 || resizeNode==8) && canvasMouseY>uploadedImages[activeImage-1].y) {
         uploadedImages[activeImage-1].h = canvasMouseY-uploadedImages[activeImage-1].y;
      }
   }
   // if dragging, update active image's location on mouse up
   if (isDragging) {
      uploadedImages[activeImage-1].x = canvasMouseX - imgOffsetX;
      uploadedImages[activeImage-1].y = canvasMouseY - imgOffsetY;
   }
   // if mouse button released on image (i.e. active image) draw resize nodes
   if (activeImage) {
      let im = uploadedImages[activeImage-1];
      drawResizeRectangle(im.x, im.y, im.w, im.h);
   }
   // deactivate dragging and resizing modes
   isDragging = false;
   isResizing = false;
   resizeNode = 0;
});


canvas.addEventListener('mousemove', function(e) {
   let canvasMouseX = window.pageXOffset + e.clientX - canvasTopLeft.left;
   let canvasMouseY = window.pageYOffset + e.clientY - canvasTopLeft.top;
   // if resizing mode active while mouse move clear canvas and redraw inactive images (if any)
   if(isResizing){
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      uploadedImages.forEach(image => {
         if(activeImage>0 && activeImage!=image.id){
            drawImage(image.id);
         }
      });
      let img = new Image();
      img.src = uploadedImages[activeImage-1].img;
      // Calculate new deminsions
      let x = uploadedImages[activeImage-1].x;
      let y = uploadedImages[activeImage-1].y;
      let w = uploadedImages[activeImage-1].w;
      let h = uploadedImages[activeImage-1].h;
      if (resizeNode==1 || resizeNode==4 || resizeNode==6) {w=w+x-canvasMouseX; x=canvasMouseX;}
      if (resizeNode==1 || resizeNode==2 || resizeNode==3) {h=h+y-canvasMouseY; y=canvasMouseY;}
      if (resizeNode==3 || resizeNode==5 || resizeNode==8) {w=canvasMouseX-x;}
      if (resizeNode==6 || resizeNode==7 || resizeNode==8) {h=canvasMouseY-y;}
      // and draw active image regarding mouse coordinates on canvas
      ctx.drawImage(img, x, y, w, h);
      drawResizeRectangle(x, y, w, h);
      // draw deminsion tooltip 
      let deminsions = w.toString() + ' x ' + h.toString()
      drawTooltip(x+parseInt(w/2)-parseInt(deminsions.length*7.2/2), y+h+7, deminsions);
      return;
   }
   // else if dragging mode clear canvas and redraw inactive images
   else if (isDragging) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      resizeArray = [];
      uploadedImages.forEach(image => {
         if(activeImage>0 && activeImage!=image.id){
            drawImage(image.id);
         }
      });
      let img = new Image();
      img.src=uploadedImages[activeImage-1].img;
      // and draw active image regarding mouse coordinates on canvas
      ctx.drawImage(img, canvasMouseX-imgOffsetX, canvasMouseY-imgOffsetY, uploadedImages[activeImage-1].w, uploadedImages[activeImage-1].h);
      // X,Y LINES WILL BE DRAWN ACCORDING TO MIDDLE POINT OF MOVING OBJECT
      // draw lines to edges with tooltip
      drawAxisLines(canvasMouseX-imgOffsetX, canvasMouseY-imgOffsetY, uploadedImages[activeImage-1].w, uploadedImages[activeImage-1].h);
      let deminsions = uploadedImages[activeImage-1].w.toString() + ' x ' + uploadedImages[activeImage-1].h.toString();
      drawTooltip(
         canvasMouseX-imgOffsetX+parseInt(uploadedImages[activeImage-1].w/2)-parseInt(deminsions.length*7.2/2),
         canvasMouseY-imgOffsetY+uploadedImages[activeImage-1].h+5,
         deminsions
         );
   }
});


function drawImage(id){
   let img = new Image();
   img.src=uploadedImages[id-1].img
   ctx.drawImage(img, uploadedImages[id-1].x, uploadedImages[id-1].y, uploadedImages[id-1].w, uploadedImages[id-1].h);
}

function drawResizeRectangle(x, y, w, h){   
   ctx.strokeStyle = 'red';
   ctx.fillStyle = 'red';
   ctx.lineWidth = 1;
   // overall rectangle
   ctx.strokeRect(x, y, w, h);
   // top-left rectangle
   ctx.strokeRect(x-3, y-3, 6, 6);
   ctx.fillRect(x-3, y-3, 6, 6);
   resizeArray.push({x:x-3, y:y-3});
   // top-middle rectangle
   ctx.strokeRect(x+parseInt(w/2)-3, y-3, 6, 6);
   ctx.fillRect(x+parseInt(w/2)-3, y-3, 6, 6);
   resizeArray.push({x:x+parseInt(w/2)-3, y:y-3});
   // top-right rectangle
   ctx.strokeRect(x+w-3, y-3, 6, 6);
   ctx.fillRect(x+w-3, y-3, 6, 6);
   resizeArray.push({x:x+w-3, y:y-3});
   // // left-middle rectangle
   ctx.strokeRect(x-3, y+parseInt(h/2)-3, 6, 6);
   ctx.fillRect(x-3, y+parseInt(h/2)-3, 6, 6);
   resizeArray.push({x:x-3, y:y+parseInt(h/2)-3});
   // right-middle rectangle
   ctx.strokeRect(x+w-3, y+parseInt(h/2)-3, 6, 6);
   ctx.fillRect(x+w-3, y+parseInt(h/2)-3, 6, 6);
   resizeArray.push({x:x+w-3, y:y+parseInt(h/2)-3});
   // bottom-left rectangle
   ctx.strokeRect(x-3, y+h-3, 6, 6);
   ctx.fillRect(x-3, y+h-3, 6, 6);
   resizeArray.push({x:x-3, y:y+h-3});
   // bottom-middle rectangle
   ctx.strokeRect(x+parseInt(w/2)-3, y+h-3, 6, 6);
   ctx.fillRect(x+parseInt(w/2)-3, y+h-3, 6, 6);
   resizeArray.push({x:x+parseInt(w/2)-3, y:y+h-3});
   // bottom-right rectangle
   ctx.strokeRect(x+w-3, y+h-3, 6, 6);
   ctx.fillRect(x+w-3, y+h-3, 6, 6);
   resizeArray.push({x:x+w-3, y:y+h-3});        
}

function drawTooltip(x, y, txt, color='red'){   
   ctx.font = '11px Arial';
   ctx.textAlign = 'center';
   ctx.fillStyle = color;
   ctx.strokeStyle = color;
   ctx.setLineDash([]);
   ctx.strokeRect(x, y, txt.length*7, 14);
   ctx.fillRect(x, y, txt.length*7, 14);
   ctx.fillStyle = 'white';
   ctx.fillText(txt, x+parseInt(txt.length*7.25/2), y+11);
}

function drawAxisLines(x, y, w, h){
   let maxX = 0;
   let maxY = 0;
   let xAxisLine = x+parseInt(w/2);
   let yAxisLine = y+parseInt(h/2);
   // Check if there is any picture left or above other then current image
   uploadedImages.forEach(img => {
      if (img.id!=activeImage && // if it is not current (active) image
         img.x<xAxisLine &&  // other image's start is less then xAxisLine
         img.x+img.w>xAxisLine && // but start+width is greater then xAxisLine
         img.y+img.h<y && // other image is completely above the active image
         img.y+img.h>maxY // and it is the most lower image
         ) maxY=img.y+img.h;
      
      if (img.id!=activeImage && // if it is not current (active) image
         img.y<yAxisLine &&  // other image's start is less then yAxisLine
         img.y+img.h>yAxisLine && // but start+height is greater then yAxisLine
         img.x+img.w<x && // other image is completely left to the active image
         img.x+img.w>maxX // and it is the most right image
         ) maxX=img.x+img.w;      
   });
   ctx.strokeStyle = 'red';
   ctx.setLineDash([]);
   // Draw X line & tooltip
   ctx.beginPath();
   ctx.moveTo(xAxisLine, y);
   ctx.lineTo(xAxisLine, maxY);
   ctx.stroke();
   if(y>0) this.drawTooltip(xAxisLine+5, maxY+parseInt((y-maxY)/2)-7, (y-maxY).toString());
   // Draw Y line & tooltip
   ctx.beginPath();
   ctx.moveTo(x, yAxisLine);
   ctx.lineTo(maxX, yAxisLine);
   ctx.stroke();   
   if(x>0) this.drawTooltip(maxX+parseInt((x-maxX)/2)-5, yAxisLine+7, (x-maxX).toString());
   
   ctx.setLineDash([3, 3]);
   ctx.strokeStyle = 'blue';
   // Draw dashed X line & tooltip
   if (maxY){
      ctx.beginPath();
      ctx.moveTo(xAxisLine, 0);
      ctx.lineTo(xAxisLine, maxY);
      ctx.stroke();
      if(y>0) this.drawTooltip(xAxisLine+5, parseInt((maxY)/2)-7, maxY.toString(), 'blue');
   }
   // Draw dashed Y line & tooltip
   if (maxX){
      ctx.beginPath();
      ctx.moveTo(0, yAxisLine);
      ctx.lineTo(maxX, yAxisLine);
      ctx.stroke();
      if(x>0) this.drawTooltip(parseInt((maxX)/2)-7, yAxisLine+5, maxX.toString(), 'blue');
   }
}

function pressedOnImage(clientX, clientY, img){
   return img.x < window.pageXOffset + clientX - canvasTopLeft.left && 
      img.x + img.w > window.pageXOffset + clientX - canvasTopLeft.left && 
      img.y < window.pageYOffset + clientY - canvasTopLeft.top && 
      img.y + img.h  >window.pageYOffset + clientY - canvasTopLeft.top;
}

