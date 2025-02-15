import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

let camera, scene, renderer, controls;
let mesh, object, action, mixers;
let nbrM = 1;
let nbrS = 2;
let separation;

let explosionProgress = 0;
let explose = false;
const explosionSpeed = 0.1;
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
    ground.position.y = -2;
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
        const maxAmount = Math.max(nbrM, count);
        separation = maxAmount * 1.5;

        const dummy = new THREE.Object3D();

        for (let x = 0; x < count; x++) {
            for (let y = 0; y < count; y++) {
                dummy.position.set(offset - x, 0, -(offset - y) - separation);
                dummy.updateMatrix();
                mesh.setMatrixAt(i++, dummy.matrix);
                console.log(i);
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
    loader.load('Michelle.glb', function (gltf) {

        object = new THREE.Group();
        mixers = []
        
        const offset = (count - 1) / 2;
        for (let x = 0; x < count; x++) {
            for (let y = 0; y < count; y++) {

                // Clone proprement le modèle avec les animations
                const clone = SkeletonUtils.clone(gltf.scene);
                scene.add(clone);

                const mixer = new THREE.AnimationMixer(clone);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                mixers.push(mixer);

                clone.position.set(offset - x, 0, offset - y);
                clone.rotation.y = Math.PI;7

                object.add(clone);
            }
        }
        scene.add(object);
    });
}

// function start() {
//     if (mesh) {
//         let i = 0;
//         const offset = (amount - 1) / 2;
//         object.rotation.y = Math.PI;

//         object.traverse( ( child ) => {
//             for (let x = 0; x < amount; x++) {
//                 for (let y = 0; y < amount; y++) {
//                     dummy.position.set(offset - x, 0, offset - y);
//                     dummy.updateMatrix();
//                     dummy.matrix.toArray( child.instanceMatrix.array, i);
//                     mesh.setMatrixAt(i++, dummy.matrix);
//                 }
//             }
//             mesh.instanceMatrix.needsUpdate = true;
//             mesh.computeBoundingSphere();
//             object.add(mesh);
//         });
//     }

//     if (mesh2) {
//         let i = 0;
//         const offset = (amount2 - 1) / 2;
//         const maxAmount = Math.max(amount, amount2);
//         separation = maxAmount * 1.5;

//         for (let x = 0; x < amount2; x++) {
//             for (let y = 0; y < amount2; y++) {
//                 dummy.position.set(offset - x, 0, -(offset - y) - separation);
//                 dummy.updateMatrix();
//                 mesh2.setMatrixAt(i++, dummy.matrix);
//             }
//         }
//         mesh2.instanceMatrix.needsUpdate = true;
//         mesh2.computeBoundingSphere();
//     }

//     if (count > count2) {
//         prepareExplosion(mesh2);
//     } else if (count2 > count) {
//         prepareExplosion(mesh);
//     }
    
// }

function updateInstances() {
    if (explose) {
        explose = false;
        explosionProgress = 0;
        audio.pause();
        audio.currentTime = 0;

        amount = Math.floor(Math.random() * (max - min + 1) + min);
        count = Math.pow(amount, 2);
        amount2 = Math.floor(Math.random() * (max - min + 1) + min);
        count2 = Math.pow(amount2, 2);
        Promise.all([
            loadGeometry('suzanne_buffergeometry.json', 0x2194ce, count),
            loadGeometry('suzanne_buffergeometry.json', 0x8d8d8d, count2)
        ]).then(([loadedMesh, loadedMesh2]) => {
            if (mesh) {
                scene.remove(mesh);
            }
            if (mesh2) {
                scene.remove(mesh2);
            }
            mesh = loadedMesh;
            mesh2 = loadedMesh2;

            scene.add(mesh);
            scene.add(mesh2);
            // start();
        });
    } else {
        explose = true;
        audio.play();
    }
    
}

function createUI() {
    const button = document.createElement('button');
    button.innerText = 'Explose/Random';
    button.style.position = 'absolute';
    button.style.top = '10px';
    button.style.left = '10px';
    button.style.padding = '10px';
    button.style.fontSize = '16px';
    document.body.appendChild(button);

    button.addEventListener('click', updateInstances);
}

function animate() {
    const delta = clock.getDelta(); // Calcul du temps écoulé depuis la dernière frame
    if (mixers) mixers.forEach(mixer => mixer.update(delta));

    if (!explose) {
        renderer.render(scene, camera);
    } else {
        // explode()
        renderer.render(scene, camera);

    }
}

function prepareExplosion(mesh) {
    const count = mesh.count;
    randomDirections.length = 0;

    for (let i = 0; i < count; i++) {
        randomDirections.push(new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize());
    }
}

function explode() {
    if (count > count2 && mesh2) {
        explosionProgress += explosionSpeed;

        let i = 0;
        for (let x = 0; x < amount2; x++) {
            for (let y = 0; y < amount2; y++) {
                let direction = randomDirections[i];
                let explosionOffset = direction.clone().multiplyScalar(explosionProgress * explosionStrength);
                
                dummy.position.set(
                    (amount2 - 1) / 2 - x + explosionOffset.x,
                    explosionOffset.y,
                    (amount2 - 1) / 2 - y -separation + explosionOffset.z
                );

                dummy.updateMatrix();
                mesh2.setMatrixAt(i++, dummy.matrix);
            }
        }
        mesh2.instanceMatrix.needsUpdate = true;
    } 
    else if (count2 > count && mesh) {
        explosionProgress += explosionSpeed;

        let i = 0;
        for (let x = 0; x < amount; x++) {
            for (let y = 0; y < amount; y++) {
                let direction = randomDirections[i];
                let explosionOffset = direction.clone().multiplyScalar(explosionProgress * explosionStrength);
                
                dummy.position.set(
                    (amount - 1) / 2 - x + explosionOffset.x,
                    explosionOffset.y,
                    (amount - 1) / 2 - y + explosionOffset.z
                );

                dummy.updateMatrix();
                mesh.setMatrixAt(i++, dummy.matrix);
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);
}