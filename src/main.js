import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import GUI from "lil-gui";

let gui, guiParams;

let camera, scene, renderer, controls;

let objectR = new THREE.Group();
let mixersR = [];
let objectM = new THREE.Group();
let mixersM = [];

let exploseButton, nextButton, musicButton;

let nbrR = 1;
let nbrM = 2;

let scaleFactor = 0.3;
let gridSize, offset;
let spacing = 1;
let separation;

let explosionProgress = 0;
let explose = false;
const explosionSpeed = 0.3;
const explosionStrength = 5;
const randomDirections = [];

const url = 'RobotExpressive.glb';
const urlEnnemy = 'Michelle.glb';
const audio = new Audio('explode.wav');
const music = new Audio('music_AoW.mp3');
music.loop = true;

const clock = new THREE.Clock();

init();
createUI();
setupGUI();

function init() {

    // Scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x99DDFF );

    scene.fog = new THREE.Fog( 0x99DDFF, 5000, 10000 );

    scene.add(objectR);
    scene.add(objectM);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(nbrM * 0.9, nbrM * 0.9, nbrM * 0.9);
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
    const groundMat = new THREE.MeshLambertMaterial( { color: 0xAAA339 } );
    groundMat.color.setHSL( 0.125, 0.70, 0.70 );

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

            loadGLTF(url, nbrR);
            loadEnnemy(urlEnnemy, nbrM);
    
            });

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadEnnemy(url, count) {

    const loader = new GLTFLoader();
    loader.load(url, function (gltf) {

        const offset = (count - 1) / 2;

        for (let x = 0; x < count; x++) {
            for (let y = 0; y < count; y++) {

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
                mixersM.push(mixer);

                // Positionnement en grille centrée
                clone.position.set(
                    offset - x,  // Décale pour centrer la grille
                    0,                     // Niveau du sol
                    -(offset - y) - nbrM - 5  // Décale pour centrer la grille
                );

                objectM.add(clone);
            }
        }
    });
}

function loadGLTF(url, count) {

    const loader = new GLTFLoader();
    loader.load(url, function (gltf) {

        const spacing = 1; // Distance entre les objets
        const center = { x: 0, y: 0 }; // Centre du groupe

        // Trouver la position du nouveau clone en respectant la logique de placement
        const position = getNextPosition(count, spacing, center);

        // Clone proprement le modèle avec les animations
        const clone = SkeletonUtils.clone(gltf.scene);
        scene.add(clone);

        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true; 
                child.receiveShadow = true;
            }
        });

        clone.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Ajouter l'animation pour chaque clone
        const array = [0, 2, 3, 4, 5, 9, 11, 12, 13];
        const animation = array[Math.floor(Math.random() * array.length)];

        const mixer = new THREE.AnimationMixer(clone);
        const action = mixer.clipAction(gltf.animations[animation]);
        action.play();
        mixersR.push(mixer);

        // ✅ Placer le clone à la bonne position sans toucher les autres
        clone.position.set(position.x, 0, position.y);
        clone.rotation.y = Math.PI;

        objectR.add(clone);
    });
}

function getNextPosition(count, spacing, center) {

    if (count === 1) return center; // Premier clone au centre

    let layer = Math.ceil((Math.sqrt(count) - 1) / 2); // Trouve l'anneau (carré) dans lequel placer le clone
    let start = (2 * layer - 1) ** 2 + 1; // Première position de cet anneau
    let index = count - start; // Position relative dans l'anneau

    let side = 2 * layer; // Taille du côté de l'anneau
    let pos = { x: center.x, y: center.y };

    if (index < side) {
        pos.x = center.x + (index - layer) * spacing;
        pos.y = center.y + layer * spacing;
    } else if (index < 2 * side) {
        pos.x = center.x + layer * spacing;
        pos.y = center.y + (layer - (index - side)) * spacing;
    } else if (index < 3 * side) {
        pos.x = center.x + (layer - (index - 2 * side)) * spacing;
        pos.y = center.y - layer * spacing;
    } else {
        pos.x = center.x - layer * spacing;
        pos.y = center.y - (layer - (index - 3 * side)) * spacing;
    }

    return pos;
}

function removeAllClonesAsync() {
    return new Promise((resolve) => {
        if (!objectM) {
            resolve(); // Si le groupe est vide, on passe directement à la suite
            return;
        }

        objectM.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });

        while (objectM.children.length > 0) {
            objectM.remove(objectM.children[0]);
        }

        mixersM= []; // Nettoyer les animations

        resolve(); // Signale que la suppression est terminée
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

    musicButton = document.createElement('button');
    musicButton.innerText = 'Music';
    musicButton.style.position = 'absolute';
    musicButton.style.top = '10px';
    musicButton.style.left = '500px';
    musicButton.style.padding = '10px';
    musicButton.style.fontSize = '16px';
    document.body.appendChild(musicButton);

    musicButton.addEventListener('click', musicClick);
}

function setupGUI() {
    gui = new GUI();
    guiParams = {
        NombreEnnemis: Math.pow(nbrM, 2),
        NombreRestants: nbrR,
    };

    gui.add(guiParams, 'NombreEnnemis').listen();
    gui.add(guiParams, 'NombreRestants').listen();
}

function updateGUI() {
    if (guiParams) {
        guiParams.NombreEnnemis = Math.pow(nbrM, 2);
        guiParams.NombreRestants = nbrR;
    }
}

function addSoldier() {
    nbrR++;
    updateGUI();
    loadGLTF(url, nbrR);
}

function prepareExplosion() {

    const count = Math.pow(nbrM, 2);

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
    randomDirections.length = 0;

    audio.pause();
    audio.currentTime = 0;

    removeAllClonesAsync().then(() => {
        nbrM++;
        updateGUI();
        loadEnnemy(urlEnnemy, nbrM);
    });
}

function musicClick() {
    if (music.paused) {
        music.play();
    } else {
        music.pause();
    }
}

function animate() {

    const delta = clock.getDelta();
    if (mixersR) mixersR.forEach(mixer => mixer.update(delta));
    if (mixersM) mixersM.forEach(mixer => mixer.update(delta));


    if (nbrR >= Math.pow(nbrM, 2) && !explose) exploseButton.disabled = false;

    if (explose) {
        explode()
    }

    renderer.render(scene, camera);

}

function explode() {
    explosionProgress += explosionSpeed;

    if (randomDirections.length > 0) {
        let gridSize = Math.ceil(Math.sqrt(objectM.children.length)); // Détermine la taille de la grille

        objectM.children.forEach((child, i) => {
            let x = i % gridSize; // Position colonne
            let y = Math.floor(i / gridSize); // Position ligne
            
            let direction = randomDirections[i];
            let explosionOffset = direction.clone().multiplyScalar(explosionProgress * explosionStrength);
            
            child.position.set(
                (gridSize - 1) / 2 - x + explosionOffset.x,
                explosionOffset.y,
                (gridSize - 1) / 2 - y + explosionOffset.z - nbrM - 5
            );
        });
    }

    renderer.render(scene, camera);
}
