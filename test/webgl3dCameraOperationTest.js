// settings
let lastFrame = 0.0;
let deltaTime = 0.0;

const originalCanvas = document.getElementById("cameraCanvas");
const originalgl = originalCanvas.getContext("webgl");
if (!originalgl) {
  console.log("WebGL Loading Failed ...");
}

// camera
const fov    = 30;
const aspect = originalgl.canvas.clientWidth / originalgl.canvas.clientHeight;
const zNear  = 0.01;
const zFar   = 100;
const camera = new fusion.gl.PerspectiveCamera(fov, aspect, zNear, zFar);
camera.position = [0, 0, 10];

let cameraPos   = new kiwiMatrix.Vec3().set(0.0, 0.0,  3.0);
let cameraFront = new kiwiMatrix.Vec3().set(0.0, 0.0, -1.0);
let cameraUp    = new kiwiMatrix.Vec3().set(0.0, 1.0,  0.0);

let lastX = originalgl.canvas.clientWidth / 2.0;
let lastY = originalgl.canvas.clientHeight / 2.0;
let firstMouse = true;

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const glCanvas = new fusion.gl.GLCanvas('cameraCanvas');
  const gl = glCanvas.getContext("webgl") || glCanvas.getContext("experimental-webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
  
  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  // Create a buffer to put positions in
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put geometry data into buffer
  setGeometry(gl);

  // Create a buffer to put colors in
  var colorBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // Put geometry data into buffer
  setColors(gl);

  requestAnimationFrame(drawScene);

  drawScene();

  glCanvas.linkToCanvas(document.getElementById('cameraCanvas'));

  // Draw the scene.
  function drawScene(currentFrame) {
    // Convert to seconds
    currentFrame = Date.now() * 0.01;
    // console.log(currentFrame);
    // Subtract the previous time from the current time
    deltaTime = currentFrame - lastFrame;
    // Remember the current time for the next frame.
    lastFrame = currentFrame;

    // input
    // -----
    processInput();

    webglUtils.resizeCanvasToDisplaySize(originalgl.canvas);
 
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, originalgl.canvas.width, originalgl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset)

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorLocation);

    // Bind the color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
    var size = 3;                 // 3 components per iteration
    var type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned values
    var normalize = true;         // normalize the data (convert from 0-255 to 0-1)
    var stride = 0;               // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;               // start at the beginning of the buffer
    gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);


    // let matrix = new kiwiMatrix.Mat4();
    // console.log(matrix);
    // matrix = matrix.translate(new kiwiMatrix.Vec3().set(0.5, 0.5, 0.0));
    // console.log(matrix);
    // matrix = matrix.scale(new kiwiMatrix.Vec3().set(100.0, 100.0, 100.0));
    // console.log(matrix);
    // gl.uniformMatrix4fv(matrixLocation, false, matrix.value);

    // console.log(camera.viewProjectionMatrix.value);
    gl.uniformMatrix4fv(matrixLocation, false, camera.viewProjectionMatrix.value);
    
    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6 * 6;
    gl.drawArrays(primitiveType, offset, count);

    // Call drawScene again next frame
    requestAnimationFrame(drawScene);
       
  }
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
  const positions = new Float32Array([
    // Back
    -0.5, -0.5, -0.5, 
     0.5,  0.5, -0.5, 
     0.5, -0.5, -0.5, 
    -0.5,  0.5, -0.5, 
     0.5,  0.5, -0.5, 
    -0.5, -0.5, -0.5, 

    // Front
    -0.5, -0.5,  0.5, 
     0.5, -0.5,  0.5, 
     0.5,  0.5,  0.5, 
     0.5,  0.5,  0.5, 
    -0.5,  0.5,  0.5, 
    -0.5, -0.5,  0.5, 

    // Left
    -0.5,  0.5,  0.5, 
    -0.5,  0.5, -0.5, 
    -0.5, -0.5, -0.5, 
    -0.5, -0.5, -0.5, 
    -0.5, -0.5,  0.5, 
    -0.5,  0.5,  0.5, 

    // Right
    0.5,  0.5, -0.5, 
    0.5,  0.5,  0.5, 
    0.5, -0.5, -0.5, 
    0.5, -0.5, -0.5, 
    0.5,  0.5,  0.5, 
    0.5, -0.5,  0.5, 

    // Down
    -0.5, -0.5, -0.5, 
    0.5, -0.5, -0.5, 
    0.5, -0.5,  0.5, 
    0.5, -0.5,  0.5, 
    -0.5, -0.5,  0.5, 
    -0.5, -0.5, -0.5, 

    // Up
    0.5,  0.5, -0.5, 
    -0.5,  0.5, -0.5, 
    0.5,  0.5,  0.5, 
    -0.5,  0.5,  0.5, 
    0.5,  0.5,  0.5, 
    -0.5,  0.5, -0.5]);

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with colors for the 'F'.
function setColors(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array([
        // Back 橙色
        255.0, 165.0, 0.0,
        255.0, 165.0, 0.0,
        255.0, 165.0, 0.0,
        255.0, 165.0, 0.0,
        255.0, 165.0, 0.0,
        255.0, 165.0, 0.0,

        // Front 红色
        255.0, 0.0,  0.0, 
        255.0, 0.0,  0.0, 
        255.0, 0.0,  0.0, 
        255.0, 0.0,  0.0, 
        255.0, 0.0,  0.0, 
        255.0, 0.0,  0.0, 

        // Left 蓝色
        0.0, 0.0,  255.0,
        0.0, 0.0,  255.0,
        0.0, 0.0,  255.0,
        0.0, 0.0,  255.0,
        0.0, 0.0,  255.0,
        0.0, 0.0,  255.0,

        // Right 绿色
        0.0, 255.0,  0.0,
        0.0, 255.0,  0.0,
        0.0, 255.0,  0.0,
        0.0, 255.0,  0.0,
        0.0, 255.0,  0.0,
        0.0, 255.0,  0.0,

        // Up 黄色
        255.0,  255.0, 0.0,
        255.0,  255.0, 0.0,
        255.0,  255.0, 0.0,
        255.0,  255.0, 0.0,
        255.0,  255.0, 0.0,
        255.0,  255.0, 0.0,

        // Down 白色
        255.0,  255.0, 255.0,
        255.0,  255.0, 255.0,
        255.0,  255.0, 255.0,
        255.0,  255.0, 255.0,
        255.0,  255.0, 255.0,
        255.0,  255.0, 255.0]),
      gl.STATIC_DRAW);
}

// process all input: query GLFW whether relevant keys are pressed/released this frame and react accordingly
// ---------------------------------------------------------------------------------------------------------
function processInput()
{
  document.onkeydown=function(event){    //对整个页面文档监听  
    let keyNum = window.event? event.keyCode : event.which;       //获取被按下的键值  
    //判断如果用户按下了W键（keycody=87）  
    if(keyNum == 87){  
      camera.move("FORWARD", deltaTime);
    }
    //判断如果用户按下了A键（keycody=65）  
    if(keyNum == 65){  
      camera.move("LEFT", deltaTime);  
    }
    //判断如果用户按下了S键（keycody=65）  
    if(keyNum == 83){  
      camera.move("BACKWARD", deltaTime);  
    }
    //判断如果用户按下了D键（keycody=65）  
    if(keyNum == 68){  
      camera.move("RIGHT", deltaTime);  
    }
  }

  document.onmousemove=function(event){
    let xpos = event.x;
    let ypos = event.y;
    console.log(xpos);
    console.log(ypos);

    if (firstMouse)
    {
        lastX = xpos;
        lastY = ypos;
        firstMouse = false;
    }

    let xoffset = xpos - lastX;
    let yoffset = lastY - ypos; // reversed since y-coordinates go from bottom to top
    console.log(xoffset);
    console.log(yoffset);

    lastX = xpos;
    lastY = ypos;

    camera.rotate(xoffset, yoffset);
 } 
}
main();
