import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

let scene, camera, renderer;
let object, mixers;

let count = 4;

const clock = new THREE.Clock();

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x99DDFF );
    

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(count * 0.9, count * 0.9, count * 0.9);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;

    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 50, 0 );
    scene.add( hemiLight );

    const loader = new GLTFLoader();
        loader.load('Michelle.glb', function (gltf) {
    
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

        window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    const delta = clock.getDelta();
    if (mixers) mixers.forEach(mixer => mixer.update(delta));

    renderer.render(scene, camera);
}