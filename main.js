import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

const cubeSize = 0.5;
const cubeSpacing = 0.1;
const cubeOffset = (cubeSize/1.5 + cubeSpacing) * 2;

const cubes = []; 


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);

const normalMaterial = new THREE.MeshNormalMaterial({ flatShading: true  });













let isAudioContextStarted = false

let audioContext = new AudioContext();
function startAudioContext() {
  if (!isAudioContextStarted) {
    isAudioContextStarted = true;
    audioContext.resume().then(() => {
      console.log('AudioContext started');
    });
  }
}

document.addEventListener('click', startAudioContext);
document.addEventListener('touchstart', startAudioContext);

// virtual cable {deviceId: 'VBAudioVACWDM'}

function getSound(callback) {
  
  navigator.mediaDevices.getUserMedia({audio: {deviceId: 'VBAudioVACWDM'}})
    .then(stream => {
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const timeDomainData = new Uint8Array(analyser.frequencyBinCount);
      function updateAmplitude() {
        analyser.getByteTimeDomainData(timeDomainData);
        let amplitude = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const sample = timeDomainData[i] / 128 - 1;
          amplitude += sample * sample;
        }
        amplitude = Math.sqrt(amplitude / timeDomainData.length);
        callback(amplitude);
        requestAnimationFrame(updateAmplitude);
      }
      updateAmplitude();
    })
    .catch(error => {
      console.error(error);
    });
}

let amplitude = 0;

getSound(newAmplitude => {
  amplitude = newAmplitude;
});

let selectedCube = null;

for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    for (let k = 0; k < 3; k++) {
      const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x9A00A3, wireframe:true});
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(
        (i - 1) * cubeOffset,
        (j - 1) * cubeOffset,
        (k - 1) * cubeOffset
      );
      scene.add(cube);
      cubes.push(cube); 
    }
  }
}

renderer.domElement.addEventListener('click', event => {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubes);
  if (intersects.length > 0) {

    if (selectedCube) {
      selectedCube.material = new THREE.MeshBasicMaterial({ color: 0x9A00A3, wireframe:true });
    }

    selectedCube = intersects[0].object;
    selectedCube.material = normalMaterial;
    
  }
});



function animate() {
  requestAnimationFrame(animate);

  if (selectedCube) {
    selectedCube.scale.set(Math.floor(amplitude*10),Math.floor(amplitude*10),Math.floor(amplitude*10))
  }
  

  controls.update();
  renderer.render(scene, camera);
}

animate();
