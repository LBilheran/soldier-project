import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

let camera, scene, renderer, controls;
let mesh, object, mixers;
let exploseButton, nextButton;

let nbrM = 1;
let nbrS = 2;
let separation;
let explosionProgress = 0;
let explose = false;
const explosionSpeed = 0.3;
const explosionStrength = 5;
const randomDirections = [];

const audio = new Audio('explode.wav');
const clock = new THREE.Clock();

init();
createUI();

function init() {

    // Scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x99DDFF );

    scene.fog = new THREE.Fog( 0x99DDFF, 5000, 10000 );

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(nbrS * 0.9, nbrS * 0.9, nbrS * 0.9);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.target.set(0, 2, 0);
    controls.update();

    // Lumières
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 50, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( - 1, 1.75, 1 );
    dirLight.position.multiplyScalar( 30 );
    scene.add( dirLight );

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    const d = 50;

    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = - 0.0001;

    const groundGeo = new THREE.PlaneGeometry( 10000, 10000 );
    const groundMat = new THREE.MeshLambertMaterial( { color: 0xffffff } );
    groundMat.color.setHSL( 0.095, 1, 0.75 );

    const ground = new THREE.Mesh( groundGeo, groundMat );
    ground.position.y = 0;
    ground.rotation.x = - Math.PI / 2;
    ground.receiveShadow = true;
    scene.add( ground );

    new RGBELoader()
        .load('quarry_01_1k.hdr', function ( texture ) {

            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.background = texture;
            scene.environment = texture;

            loadGLTF('Michelle.glb', nbrM),
            loadGeometry('suzanne_buffergeometry.json', 0x8d8d8d, nbrS)
    
            });

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadGeometry(url, color, count) {

    if (mesh) {
        scene.remove(mesh);
    }

    const loader = new THREE.BufferGeometryLoader();
    loader.load(url, function (geometry) {
        geometry.computeVertexNormals();
        geometry.scale(0.5, 0.5, 0.5);

        const material = new THREE.MeshPhongMaterial({ color: color, shininess: 100 });
        mesh = new THREE.InstancedMesh(geometry, material, Math.pow(count,2));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        scene.add(mesh);

        let i = 0;
        const offset = (count - 1) / 2;

        const dummy = new THREE.Object3D();

        for (let x = 0; x < count; x++) {
            for (let y = 0; y < count; y++) {
                dummy.position.set(offset - x, 1, -(offset - y) - nbrS - 1);
                dummy.updateMatrix();
                mesh.setMatrixAt(i++, dummy.matrix);
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
    });
}

function loadGLTF(url, count) {
    if (object) {
        scene.remove(object);
    }

    const loader = new GLTFLoader();
    loader.load(url, function (gltf) {

        object = new THREE.Group();
        mixers = []
        
        const gridSize = Math.ceil(Math.sqrt(count)); // Détermine la taille de la grille
        const spacing = 1; // Distance entre les objets
        const offset = (gridSize - 1) * spacing * 0.5; // Décale pour centrer

        for (let i = 0; i < count; i++) {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);

            // Clone proprement le modèle avec les animations
            const clone = SkeletonUtils.clone(gltf.scene);
            scene.add(clone);

            clone.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true; // Permet au clone de projeter une ombre
                    child.receiveShadow = true; // Permet au clone de recevoir une ombre
                }
            });


            // Ajouter l'animation pour chaque clone
            const mixer = new THREE.AnimationMixer(clone);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
            mixers.push(mixer);

            // Positionnement en grille centrée
            clone.position.set(
                x * spacing - offset,  // Décale pour centrer la grille
                0,                     // Niveau du sol
                y * spacing - offset   // Décale pour centrer la grille
            );
            clone.rotation.y = Math.PI; // Rotation si nécessaire

            object.add(clone);
        }

        scene.add(object);
    });
}

function createUI() {
    const addButton = document.createElement('button');
    addButton.innerText = 'Add';
    addButton.style.position = 'absolute';
    addButton.style.top = '10px';
    addButton.style.left = '10px';
    addButton.style.padding = '10px';
    addButton.style.fontSize = '16px';
    document.body.appendChild(addButton);

    addButton.addEventListener('click', addSoldier);

    exploseButton = document.createElement('button');
    exploseButton.innerText = 'Explose';
    exploseButton.style.position = 'absolute';
    exploseButton.style.top = '10px';
    exploseButton.style.left = '70px';
    exploseButton.style.padding = '10px';
    exploseButton.style.fontSize = '16px';
    exploseButton.disabled = true;
    document.body.appendChild(exploseButton);

    exploseButton.addEventListener('click', prepareExplosion);

    nextButton = document.createElement('button');
    nextButton.innerText = 'Next';
    nextButton.style.position = 'absolute';
    nextButton.style.top = '10px';
    nextButton.style.left = '160px';
    nextButton.style.padding = '10px';
    nextButton.style.fontSize = '16px';
    nextButton.disabled = true;
    document.body.appendChild(nextButton);

    nextButton.addEventListener('click', next);
}

function addSoldier() {
    nbrM++;
    loadGLTF('Michelle.glb', nbrM);
}

function prepareExplosion(mesh) {
    randomDirections.length = 0;
    const count = Math.pow(nbrS, 2);

    for (let i = 0; i < count; i++) {
        randomDirections.push(new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize());
    }

    explose = true;
    nextButton.disabled = false;
    exploseButton.disabled = true;
    audio.play();
}

function next() {
    nextButton.disabled = true;
    explose = false;
    explosionProgress = 0;

    audio.pause();
    audio.currentTime = 0;

    nbrS++;
    loadGeometry('suzanne_buffergeometry.json', 0x8d8d8d, nbrS);
}

function animate() {
    const delta = clock.getDelta();
    if (mixers) mixers.forEach(mixer => mixer.update(delta));

    if (nbrM >= Math.pow(nbrS, 2) && !explose) exploseButton.disabled = false;

    if (explose) {
        explode()
    }

    renderer.render(scene, camera);

}

function explode() {
    explosionProgress += explosionSpeed;

    let i = 0;
    if (randomDirections.length > 0 ) {
        
        const dummy = new THREE.Object3D();

        for (let x = 0; x < nbrS; x++) {
            for (let y = 0; y < nbrS; y++) {
                let direction = randomDirections[i];
                let explosionOffset = direction.clone().multiplyScalar(explosionProgress * explosionStrength);
                
                dummy.position.set(
                    (nbrS - 1) / 2 - x + explosionOffset.x,
                    explosionOffset.y,
                    (nbrS - 1) / 2 - y + explosionOffset.z
                );

                dummy.updateMatrix();
                mesh.setMatrixAt(i++, dummy.matrix);
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);
}