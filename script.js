import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);

camera.position.set(0, 5, 70);  

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();
controls.enablePan = false;

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);


let markerRoot = new THREE.Group();
scene.add(markerRoot);

let arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam',
});

arToolkitSource.init(function onReady() {
    setTimeout(() => {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
        if (arToolkitContext.arController !== null) {
            arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
        }
    }, 1000);
});

let arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'https://rawcdn.githack.com/AR-js-org/AR.js/master/data/data/camera_para.dat',
    detectionMode: 'mono',
});

arToolkitContext.init(function onCompleted() {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
});

let model1, model2;
let modelsVisible = false;

let loader = new THREE.GLTFLoader();
loader.load('bank-vault/source/Bank vault.glb', function (gltf) {
    model1 = gltf.scene;
    model1.scale.set(1,1,1);
    model1.position.set(0,0,0);
    model1.visible = false;
    model1.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    markerRoot.add(model1);
    console.log('Model 1 loaded');
}, undefined, function (error) {
    console.error('Error loading model 1', error);
});

loader.load('pile_of_coins.glb', function (gltf) {
    model2 = gltf.scene;
    model2.scale.set(10, 10, 18); 
    model2.position.set(-2, 3.8, 3);
    model2.visible = false;  // Initially hide the model
    model2.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    markerRoot.add(model2);
    console.log('Model 2 loaded');
}, undefined, function (error) {
    console.error('Error loading model 2', error);
});

window.addEventListener('resize', () => {
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
});

window.addEventListener('click', (event) => {
    if (!modelsVisible) {
        // First click: make models visible
        if (model1) model1.visible = true;
        if (model2) model2.visible = true;
        modelsVisible = true;
        console.log('Models made visible');
        return;
    }

    // Subsequent clicks: original placement logic
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    console.log('Intersects:', intersects);
    let point;
    if (intersects.length > 0) {
        point = intersects[0].point;
        console.log('Click position:', point);
    } else {
        point = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(5));
        console.log('Fallback position:', point);
    }

    if (model1 && model2) {
        while (markerRoot.children.length > 0) {
            markerRoot.remove(markerRoot.children[0]);
        }
        const group = new THREE.Group();
        const model1Clone = model1.clone();
        const model2Clone = model2.clone();
        model1Clone.position.set(0, 0, 0);
        model1Clone.scale.set(0.1, 0.1, 0.1); 
        model2Clone.position.set(1, 0, 0);
        model2Clone.scale.set(0.1, 0.1, 0.1);
        group.add(model1Clone);
        group.add(model2Clone);
        group.position.copy(point);
        markerRoot.add(group);
        console.log('Models placed at:', point);
    } else {
        console.log('Models not yet loaded');
    }
});

function animate() {
    requestAnimationFrame(animate);
    if (arToolkitSource.ready !== false) {
        arToolkitContext.update(arToolkitSource.domElement);
    }
    controls.update();
    renderer.render(scene, camera);
}

animate();