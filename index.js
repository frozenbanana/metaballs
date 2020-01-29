init();

window.requestAnimationFrame = window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame;



function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}


function init() {
  "strict mode"
  console.log("starting WebGL");
  let canvas = document.getElementById("canvas");
  canvas.setAttribute('width', '640');
  canvas.setAttribute('height', '480');

  console.log([canvas.width, canvas.height]);

  let gl = canvas.getContext("webgl2");

  // // ============ Blobs =====================
  // let blobs = new Array();
  // for (let i = 0; i < 3; i++) {
  //   let x = randomBetween(0.0, 4.0);
  //   let y = randomBetween(0.0, 4.0);
  //   let z = randomBetween(10, 12.1);
  //   blobs.push([x, y, z]);
  // }

  // ============ SHADERS ===================
  // Vertex source
  const vsSource = `#version 300 es
    precision mediump float;

    in vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

  const fsSource = `#version 300 es
    precision mediump float;
    #define MAX_STEPS 100
    #define MAX_DIST  100.0
    #define SURF_DIST    .01
    #define LIGHT_AMBI 0.075
    #define LIGHT_DIFF  0.3
    #define LIGHT_SPEC  0.2
    #define NUM_OF_LIGHTS 2
    //#define BLOB_FACTOR 2.

    out vec4 fragColor;
    uniform mat4 uModelViewMatrix;
    uniform vec3 uCamPos;
    uniform vec3 uCamTarget;
    uniform int uNumOfBlobs;
    //uniform vec3 uBlobs[MAX_NUM_BLOBS];
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uBlobFactor;
    //vec3 blobs[MAX_NUM_BLOBS]; // for matrix multiplication
    const int MAX_NUM_BLOBS = 50;

    float sdSphere(vec3 ray, vec3 sp, float r) {
      return length(ray-sp) - r;
    }

    float blob7(vec3 ray)
    {	
        float t = uTime;
        float d1 = sdSphere(ray, vec3(sin(-0.2*t),  .5+sin(0.2*t),4.0+cos(0.2*t)), 0.1);
        float d2 = sdSphere(ray, vec3(cos(-0.4*t), .5+sin(0.1*t),4.0-cos(0.3*t)), 0.2);
        float d3 = sdSphere(ray, vec3(cos(0.2*t),  .5+sin(0.2*t),4.0+cos(0.2*t)), 0.3);
        float d4 = sdSphere(ray, vec3(cos(-0.1*t), .5+sin(0.3*t),4.0-cos(0.1*t)), 0.2);
        float d5 = sdSphere(ray, vec3(cos(0.5*t),  .5+sin(0.2*t),4.0+cos(0.3*t)), 0.1);
        float d6 = sdSphere(ray, vec3(cos(-0.2*t), .5+sin(0.1*t),4.0-cos(0.2*t)), 0.2);
        float d7 = sdSphere(ray, vec3(cos(0.2*t),  .5+sin(0.2*t),4.0+cos(0.4*t)), 0.3);
        float k = uBlobFactor;
        
      return -log(exp(-k*d1)+
                    exp(-k*d2)+
                    exp(-k*d3)+
                    exp(-k*d4)+
                    exp(-k*d5)+
                    exp(-k*d6)+
                    exp(-k*d7))/k;
    }
    
    float blobN(float[MAX_NUM_BLOBS] bs) {
        float d = 0.0;
        float k = uBlobFactor;
        for (int i = 0; i < uNumOfBlobs; i++) {
          d += exp(-k*bs[i]);
        }
        d = -log(d)/k;
        return d;
    }

    
    float getDist(vec3 ray) {
        float t = uTime;
        
        // Floor and walls
        float d = ray.y + 1.0;
        d = min(d, 15.0 - ray.z);
        d = min(d, 3.4 + ray.x);
        d = min(d, 3.4 - ray.x);
        
        // Blobs
        float blobs = blob7(ray); // Constant number of blobs, 7
        
        //////// PARAMATERIZED BLOB FUNCTION //////////////
        //////// Crashing except when MAX_NUM_BLOBS = 2 ////
        /*float[MAX_NUM_BLOBS] sds;
         for (int i = 0; i < uNumOfBlobs; i++) {
            float id = float(i) * 0.1;
            sds[i] = sdSphere(ray, vec3(cos(t*id)+id, 2.0, 4.0 + sin(-t*id)), 0.2);
        }
        float blobs = blobN(sds);*/

        
        /*
        //////// This works. //////////////////////////////
        sds[0] = sdSphere(ray, vec3(sin(-0.2*t),  .5+sin(0.2*t),4.0+cos(0.2*t)), 0.1);
        sds[1] = sdSphere(ray, vec3(cos(-0.4*t), .5+sin(0.1*t),4.0-cos(0.3*t)), 0.2);
        sds[2] = sdSphere(ray, vec3(cos(0.2*t),  .5+sin(0.2*t),4.0+cos(0.2*t)), 0.3);
        sds[3] = sdSphere(ray, vec3(cos(-0.1*t), .5+sin(0.3*t),4.0-cos(0.1*t)), 0.2);
        sds[4] = sdSphere(ray, vec3(cos(0.5*t),  .5+sin(0.2*t),4.0+cos(0.3*t)), 0.1);
        sds[5] = sdSphere(ray, vec3(cos(-0.2*t), .5+sin(0.1*t),4.0-cos(0.2*t)), 0.2);
        sds[6] = sdSphere(ray, vec3(cos(0.2*t),  .5+sin(0.2*t),4.0+cos(0.4*t)), 0.3);
          
        float blobs = blobN(sds);*/
    
          
        d = min(d, blobs);
        return d;
    }

    
    vec3 getNormal(vec3 p) {
      float d = getDist(p);
      vec2 e = vec2(0.01, 0.0);
      vec3 normal = d - vec3(
          getDist(p - e.xyy),
          getDist(p - e.yxy),
          getDist(p - e.yyx));
      
      return normalize(normal);
    }

    float shadowMarch( in vec3 ro, in vec3 rd) {
    const float MAX_T = 2.0;
    const float MIN_T = 0.1;
      for( float t=MIN_T; t<MAX_T;)
      {
          float h = getDist(ro + rd*t);
          if( h<0.001 )
              return 0.0;
          t += h;
      }
      return 1.0;
    }

    float getLight(vec3 p, vec3 lightPos, vec3 camDir) {
      vec3 lightDir = normalize(lightPos-p);
      vec3 n = getNormal(p);
      
      // Phong lighting
      float cosa = pow(0.5+0.5*dot(n, lightDir), 1.0);
      float cosr = max(dot(-camDir, reflect(-lightDir, n)), 0.0);
      float ambi = LIGHT_AMBI;
      float diff = LIGHT_DIFF * cosa;
      float spec = LIGHT_SPEC * pow(cosr, 16.0);
      
      // Shadow
      float d = shadowMarch(p+n*SURF_DIST*2., lightDir);
      float t = length(lightPos-p);
      if(d == 0.0) {
          diff *= max(0.5, smoothstep(0.1, 0.90, d/t));
      }
  
      return ambi + diff + spec;   
  }

  float rayMarch(vec3 ro, vec3 rd) {
    float d0 = 0.0;
      for (int i = 0; i < MAX_STEPS; i++) {
          vec3 p = ro + rd * d0;
          float dS = getDist(p);
          d0 += dS;
          if (d0 > MAX_DIST || dS < SURF_DIST) break;
      }
      return d0;
  }
  

    void main() {
      //vec2 uv = fragCoord.xy / uResolution.xy;
      vec2 uv = (gl_FragCoord.xy-.5 * uResolution.xy)/uResolution.y;
      vec3 ro = uCamPos;
      vec3 rd = normalize(uCamTarget + vec3(uv, 0.0) - ro);
      vec3 col = vec3(0.);
    
      // Ray Marching
      float d = rayMarch(ro, rd);
  
      // Check if hit something
      if (d < MAX_DIST) {
          // Get intersection point
          vec3 p = ro + rd * d;
          
          // Lights
          col += vec3(getLight(p, vec3(0, 3, 4), rd));
          col += vec3(getLight(p, vec3(-2, 2, 2), rd));
          
      }

      fragColor = vec4(col, 1.0);
    }
  `;

  // Fragment source
  // get shader program
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  // get plane buffers
  const buffers = initBuffers(gl);

  console.log([canvas.width, canvas.height]);
  // Collect all information about the program in one object
  const programInfo = {
    isChanged: true,
    canvas: canvas,
    resolution: [canvas.width, canvas.height],
    program: shaderProgram,
    buffers: buffers,
    blobFactor: 2.0,
    numOfBlobs: 2,
    mouse: {
      x: 0,
      y: 0,
      z: 0,
      isDown: false,
    },
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      time: gl.getUniformLocation(shaderProgram, 'uTime'),
      blobFactor: gl.getUniformLocation(shaderProgram, 'uBlobFactor'),
      numOfBlobs: gl.getUniformLocation(shaderProgram, 'uNumOfBlobs'),
      resolution: gl.getUniformLocation(shaderProgram, 'uResolution'),
      cameraPosition: gl.getUniformLocation(shaderProgram, 'uCamPos'),
      cameraTarget: gl.getUniformLocation(shaderProgram, 'uCamTarget'),
      blobPosition: gl.getUniformLocation(shaderProgram, 'uBlobs'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
    }
  };

  document.getElementById('inputBlobFactor').addEventListener('change', function (event) {
    programInfo.blobFactor = event.target.value;
    programInfo.isChanged = true;
  }, false);

  document.getElementById('inputNumOfBlobs').addEventListener('change', function (event) {
    programInfo.numOfBlobs = parseInt(event.target.value);
    programInfo.isChanged = true;
  }, false);

  document.addEventListener('mousemove', function (event) {
    if (event.shiftKey) {
    programInfo.mouse.x = event.clientX;
    programInfo.mouse.y = event.clientY;
    programInfo.isChanged = true;
    }
  }, false);
  document.body.addEventListener("mousedown", function (event) {
    programInfo.mouse.isDown = true
  }, false);
  document.body.addEventListener("mouseup", function (event) {
    programInfo.mouse.isDown = false
  }, false);

  //adding the event listerner for Mozilla
  if (window.addEventListener)
    document.addEventListener('DOMMouseScroll', function (event) {
      if (event.shiftKey) {
      let delta = 0;
      // normalize the delta
      if (event.wheelDelta) {
        // IE and Opera
        delta = event.wheelDelta / 60;
      } else if (event.detail) {
        // W3C
        delta = -event.detail / 2;
      }
      programInfo.mouse.z += delta * 0.1;
    }}, false);

  // Main rendering function
  let start = null;
  function render(timestamp) {
    timestamp *= 0.001;
    if (start === null) {
      start = timestamp;
    }
    // Use the program
    gl.useProgram(programInfo.program);

    // Set time
    gl.uniform1f(programInfo.uniformLocations.time,
      timestamp);

    const deltaTime = timestamp - start;
    start = timestamp;

    renderScene(gl, programInfo, deltaTime);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function initBuffers(gl) {

  // Create a buffer for the square's positions.
  const quadBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);

  // Now create an array of positions for the square.
  const quadPos = [
    1.0, -1.0, // righttop
    -1.0, -1.0, // leffttop
    1.0, 1.0, // rightbottom
    -1.0, 1.0, // leftbottom
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array(quadPos),
    gl.STATIC_DRAW);

  return {
    quad: quadBuffer,
  };
}

// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

// creates a shader of the given type, uploads the source and
// compiles it.
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function setupUniforms(gl, programInfo) {
  // Create camera
  const cameraPosition = [0.0, 0.0, programInfo.mouse.z - 1.0];
  let cameraTarget = [programInfo.mouse.x / programInfo.canvas.clientWidth - 0.5,
  programInfo.mouse.y / programInfo.canvas.clientHeight - 0.5,
    0.0];

  const cameraUp = [0.0, 1.0, 0.0];

  const cameraMatrix = glMatrix.mat4.create();
  glMatrix.mat4.lookAt(cameraMatrix, cameraPosition, cameraTarget, cameraUp);
  const cameraViewMatrix = glMatrix.mat4.create();
  glMatrix.mat4.invert(cameraViewMatrix, cameraMatrix);

  // Create view matrix
  const modelViewMatrix = cameraViewMatrix; //glMatrix.mat4.create();
  // glMatrix.mat4.translate(modelViewMatrix,     // destination matrix
  //   modelViewMatrix,     // matrix to translate
  //   cameraPosition);     // amount to translate

  // Create projection matrix
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = glMatrix.mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  glMatrix.mat4.perspective(projectionMatrix,
    fieldOfView,
    aspect,
    zNear,
    zFar);


  // ============= Uniforms ====================
  // Set resolution
  gl.uniform2fv(programInfo.uniformLocations.resolution,
    programInfo.resolution);

  // Set camera position for rays
  gl.uniform3fv(
    programInfo.uniformLocations.cameraPosition,
    cameraPosition);

  // Set camera target
  gl.uniform3fv(
    programInfo.uniformLocations.cameraTarget,
    cameraTarget);


  // Tell shader how many blobs to use out of the hard limit MAX_NUM_BLOBS
  console.log(programInfo.blobFactor);
  gl.uniform1f(
    programInfo.uniformLocations.blobFactor,
    programInfo.blobFactor);

  // Tell shader how many blobs to use out of the hard limit MAX_NUM_BLOBS
  gl.uniform1i(
    programInfo.uniformLocations.numOfBlobs,
    programInfo.numOfBlobs);


  // Set matrices to shaders
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);
  
    programInfo.isChanged = false;
}

//
// Renders scene
//
function renderScene(gl, programInfo, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // =============== Attributes =================
  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;  // pull out 2 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.buffers.quad);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL to use our program when drawing
  if (programInfo.isChanged) {
    setupUniforms(gl, programInfo);
  } 


  // ================ Render ===================
  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}
