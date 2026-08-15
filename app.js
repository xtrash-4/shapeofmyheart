/**
 * =======================================================
 * SHAPE OF MY HEART — 3D GRAND INDOOR ART MUSEUM
 * Smooth Museum Spotlights (Redup -> Terang), Flush Venetian Walls,
 * 24K Royal Gold Trims, Portoro Black Marble & 3D Constellation
 * =======================================================
 */

// --- SYNC TIMELINE DATA (User's Exact Timings) ---
const syncData = [
    { time: 0.0, text: "I'm lookin' back on things I've done", img: "foto1.jpg" },
    { time: 6.0, text: "I never wanna play the same old part", img: "foto2.jpg" },
    { time: 11.0, text: "I'll keep you in the dark (keep you in the dark)", img: "foto3.jpg" },
    { time: 16.2, text: "Now let me show you the shape of my heart", img: "foto4.jpg" }
];

// --- DOM ELEMENTS ---
const audio = document.getElementById("main-audio");
const btnPlay = document.getElementById("btn-play");
const playIcon = document.getElementById("play-icon");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const playerBar = document.getElementById("player-bar");
const bottomContainer = document.getElementById("bottom-container");

const introScreen = document.getElementById("intro-screen");
const btnStartExplore = document.getElementById("btn-start-explore");

const curTimeDisplay = document.getElementById("cur-time");
const durTimeDisplay = document.getElementById("dur-time");
const progressBarGlow = document.getElementById("progress-bar-glow");
const progressContainer = document.getElementById("progress-container");

const constellationEndingOverlay = document.getElementById("constellation-ending-overlay");
const btnReplayTour = document.getElementById("btn-replay-tour");
const btnFreeRoam = document.getElementById("btn-free-roam");
const canvasContainer = document.getElementById("canvas-container");

// State
let isPlaying = false;
let currentActiveIndex = 0;
let hasJourneyStarted = false;
let isEndingSequenceActive = false;

// =======================================================
// THREE.JS 3D ART GALLERY ENGINE
// =======================================================
let scene, camera, renderer;
let galleryExhibits = [];
let galleryGroup, floorMesh, architecturalGroup, centralSculpture, dustParticles;
let constellationLinesGroup;
let ambientLight, mainGalleryLight, secondaryFillLight;
let raycaster, mouse, pointerPos = { x: 0, y: 0 };
let isPointerDown = false, startPointer = { x: 0, y: 0 }, orbitOffset = { x: 0, y: 0 };

const cameraLookTarget = new THREE.Vector3(0, 3.1, 0);

// Gallery Rotunda Radius
const GALLERY_RADIUS = 10.5;

// GLSL Color Correction & Specular Holographic Scan Shader
const CCVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const CCFragmentShader = `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uIsActive;
    
    varying vec2 vUv;
    varying vec3 vNormal;

    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        vec4 texColor = texture2D(uTexture, vUv);
        vec3 col = texColor.rgb;

        // 1. Clean S-Curve Film Tone
        col = pow(col, vec3(1.04));
        col = smoothstep(0.0, 1.0, col);
        col = pow(col, vec3(0.96));

        // 2. Natural Vibrancy
        vec3 hsv = rgb2hsv(col);
        hsv.y = clamp(hsv.y * 1.08, 0.0, 1.0);
        col = hsv2rgb(hsv);

        col.r = clamp(col.r * 1.02 + 0.005, 0.0, 1.0);
        col.g = clamp(col.g * 1.00 + 0.002, 0.0, 1.0);
        col.b = clamp(col.b * 0.98 + 0.005, 0.0, 1.0);

        // 3. Project 1 Holographic Diagonal Scan Sweep (.shimmer / sweepShine)
        float cycleTime = mod(uTime, 3.6);
        if (cycleTime < 1.6) {
            float sweepProgress = -0.5 + (cycleTime / 1.6) * 2.1;
            float skewPos = vUv.x + (1.0 - vUv.y) * 0.46;
            float dist = abs(skewPos - sweepProgress);
            float beam = smoothstep(0.20, 0.0, dist);
            
            if (beam > 0.0) {
                float lum = dot(col, vec3(0.299, 0.587, 0.114));
                vec3 scanColor = vec3(1.0, 0.98, 0.92) * (beam * 0.28 + pow(beam, 2.2) * lum * 0.38);
                col += scanColor;
            }
        }

        // 4. Subtle Vignette
        float distCenter = distance(vUv, vec2(0.5, 0.5));
        float vignette = 1.0 - smoothstep(0.52, 0.85, distCenter * 1.08) * 0.14;
        col *= vignette;

        gl_FragColor = vec4(col, texColor.a);
    }
`;

// Procedural Royal Portoro Black & 24K Gold Slabs Floor Texture Generator
function createAuthenticNeroMarquinaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    const baseGrad = ctx.createRadialGradient(1024, 1024, 100, 1024, 1024, 1400);
    baseGrad.addColorStop(0, '#0e111a');
    baseGrad.addColorStop(0.6, '#080a10');
    baseGrad.addColorStop(1, '#05070c');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 2048, 2048);

    const tileSize = 512;
    for (let x = 0; x < 2048; x += tileSize) {
        for (let y = 0; y < 2048; y += tileSize) {
            ctx.fillStyle = (Math.random() > 0.5) ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let v = 0; v < 3; v++) {
                ctx.beginPath();
                let vx = x + Math.random() * tileSize;
                let vy = y + Math.random() * tileSize;
                ctx.moveTo(vx, vy);

                for (let seg = 0; seg < 5; seg++) {
                    vx += (Math.random() - 0.45) * 120;
                    vy += (Math.random() - 0.45) * 120;
                    ctx.lineTo(vx, vy);
                }

                ctx.strokeStyle = 'rgba(255, 207, 51, 0.22)';
                ctx.lineWidth = 1.8 + Math.random() * 2.2;
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255, 235, 140, 0.35)';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 3.0;
            ctx.strokeRect(x, y, tileSize, tileSize);

            ctx.strokeStyle = 'rgba(255, 207, 51, 0.18)';
            ctx.lineWidth = 1.0;
            ctx.strokeRect(x + 4, y + 4, tileSize - 8, tileSize - 8);

            ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
}

// Procedural Art Deco Luxury Brass Lattice & Venetian Stucco Wall Texture (Idea #5)
function createVenetianWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // 1. Deep Midnight Velvet Slate Background Gradient
    const bg = ctx.createLinearGradient(0, 0, 0, 2048);
    bg.addColorStop(0, '#0e1220');
    bg.addColorStop(0.5, '#090b14');
    bg.addColorStop(1, '#06070d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 2048, 2048);

    // 2. Subtle Micro-Stipple Plaster Texture
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        const r = 1 + Math.random() * 2.5;
        ctx.fillStyle = (Math.random() > 0.5) ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.06)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. Art Deco 24K Gold Geometric Lattice / Brass Fretwork
    const latticeTop = 80;
    const latticeBottom = 1450;
    const latticeLeft = 60;
    const latticeRight = 1988;
    const latticeW = latticeRight - latticeLeft;
    const latticeH = latticeBottom - latticeTop;

    // Outer Stepped Double Gold Frame
    ctx.strokeStyle = 'rgba(255, 207, 51, 0.55)';
    ctx.lineWidth = 4.0;
    ctx.strokeRect(latticeLeft, latticeTop, latticeW, latticeH);

    ctx.strokeStyle = 'rgba(255, 207, 51, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(latticeLeft + 16, latticeTop + 16, latticeW - 32, latticeH - 32);

    // Diagonal Diamond / Chevron Lattice Grid
    ctx.save();
    ctx.beginPath();
    ctx.rect(latticeLeft + 20, latticeTop + 20, latticeW - 40, latticeH - 40);
    ctx.clip();

    const step = 160;
    for (let d = -2048; d <= 4096; d += step) {
        ctx.strokeStyle = 'rgba(255, 207, 51, 0.22)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(latticeLeft + d, latticeTop);
        ctx.lineTo(latticeLeft + d + latticeH, latticeBottom);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 235, 140, 0.40)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }

    for (let d = -2048; d <= 4096; d += step) {
        ctx.strokeStyle = 'rgba(255, 207, 51, 0.22)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(latticeLeft + d, latticeBottom);
        ctx.lineTo(latticeLeft + d + latticeH, latticeTop);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 235, 140, 0.40)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }

    // Center Diamond Inset Motifs at Grid Intersections
    for (let x = latticeLeft + 20; x <= latticeRight - 20; x += step) {
        for (let y = latticeTop + 20; y <= latticeBottom - 20; y += step) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.65)';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 207, 51, 0.35)';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(x - 12, y - 12, 24, 24);
        }
    }
    ctx.restore();

    // 4. Lower Wainscoting Section
    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 1480, 2048, 568);

    const railGrad = ctx.createLinearGradient(0, 1480, 2048, 1480);
    railGrad.addColorStop(0, 'rgba(255, 207, 51, 0.6)');
    railGrad.addColorStop(0.5, 'rgba(255, 245, 180, 0.9)');
    railGrad.addColorStop(1, 'rgba(255, 207, 51, 0.6)');
    ctx.fillStyle = railGrad;
    ctx.fillRect(0, 1475, 2048, 12);

    ctx.strokeStyle = 'rgba(255, 207, 51, 0.35)';
    ctx.lineWidth = 3.0;
    ctx.strokeRect(80, 1540, 1888, 440);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 5.0;
    ctx.strokeRect(74, 1534, 1900, 452);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
}

// Brushed Titanium-Gold & Dark Basalt Fluted Column Texture Generator
function createFlutedColumnTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#12141c');
    grad.addColorStop(0.5, '#1e2230');
    grad.addColorStop(1, '#12141c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1024);

    const fluteWidth = 16;
    for (let x = 0; x < 512; x += fluteWidth) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(x, 0, fluteWidth * 0.45, 1024);

        ctx.fillStyle = 'rgba(255, 207, 51, 0.28)';
        ctx.fillRect(x + fluteWidth * 0.45, 0, fluteWidth * 0.25, 1024);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(x + fluteWidth * 0.7, 0, 1.5, 1024);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    return tex;
}

function init3DUniverse() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070e);
    scene.fog = new THREE.FogExp2(0x06070e, 0.015);

    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3.4, 18);
    cameraLookTarget.set(0, 3.1, 0);
    camera.lookAt(cameraLookTarget);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    canvasContainer.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Warm, Rich Museum Ambient Lighting (Never completely dark)
    ambientLight = new THREE.AmbientLight(0xfff8ee, 1.6);
    scene.add(ambientLight);

    mainGalleryLight = new THREE.DirectionalLight(0xffedd4, 1.8);
    mainGalleryLight.position.set(10, 22, 12);
    scene.add(mainGalleryLight);

    secondaryFillLight = new THREE.DirectionalLight(0x94b4db, 0.7);
    secondaryFillLight.position.set(-10, 15, -10);
    scene.add(secondaryFillLight);

    buildAuthenticMuseumFloor();
    buildAuthenticMuseumArchitecture();
    buildCenterpieceKineticSculpture();
    buildFloatingDustMotes();
    buildGalleryExhibits();
    init3DInteraction();

    window.addEventListener('resize', onWindowResize);
}

// 1. Ultra-Glossy Royal Noir & 24K Gold Marble Floor
function buildAuthenticMuseumFloor() {
    const marbleTex = createAuthenticNeroMarquinaTexture();
    const floorGeo = new THREE.PlaneGeometry(90, 90);
    const floorMat = new THREE.MeshStandardMaterial({
        map: marbleTex,
        roughness: 0.08,
        metalness: 0.65,
        color: 0xffffff
    });
    floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    scene.add(floorMesh);

    const ringGeo = new THREE.RingGeometry(GALLERY_RADIUS - 0.25, GALLERY_RADIUS + 0.25, 128);
    const ringMat = new THREE.MeshStandardMaterial({
        color: 0xffcf33,
        metalness: 0.96,
        roughness: 0.12,
        side: THREE.DoubleSide
    });
    const guideRing = new THREE.Mesh(ringGeo, ringMat);
    guideRing.rotation.x = -Math.PI / 2;
    guideRing.position.y = 0.015;
    scene.add(guideRing);
}

// 2. Fully Enclosed Grand Luxury Museum Architecture (Seamless Flush Walls & Coffered Dome Ceiling)
function buildAuthenticMuseumArchitecture() {
    architecturalGroup = new THREE.Group();
    scene.add(architecturalGroup);

    const flutedTexture = createFlutedColumnTexture();
    const wallTexture = createVenetianWallTexture();

    const flutedShaftMat = new THREE.MeshStandardMaterial({
        map: flutedTexture,
        roughness: 0.35,
        metalness: 0.65,
        color: 0xcccccc
    });

    const royalGoldMat = new THREE.MeshStandardMaterial({
        color: 0xffcf33,
        metalness: 0.96,
        roughness: 0.14
    });

    const darkBasaltMat = new THREE.MeshStandardMaterial({
        color: 0x07080f,
        roughness: 0.25,
        metalness: 0.80
    });

    const venetianWallMat = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.30,
        metalness: 0.45,
        color: 0xffffff,
        side: THREE.FrontSide
    });

    const pillarCount = 12;
    for (let i = 0; i < pillarCount; i++) {
        const ang = (i / pillarCount) * Math.PI * 2;
        const x = Math.cos(ang) * 16.5;
        const z = Math.sin(ang) * 16.5;

        // Pillar Assembly
        const columnGroup = new THREE.Group();
        columnGroup.position.set(x, 0, z);

        const basePlinthGeo = new THREE.BoxGeometry(1.1, 0.4, 1.1);
        const basePlinth = new THREE.Mesh(basePlinthGeo, darkBasaltMat);
        basePlinth.position.y = 0.2;
        columnGroup.add(basePlinth);

        const baseRingGeo = new THREE.CylinderGeometry(0.52, 0.58, 0.15, 32);
        const baseRing = new THREE.Mesh(baseRingGeo, royalGoldMat);
        baseRing.position.y = 0.47;
        columnGroup.add(baseRing);

        const shaftGeo = new THREE.CylinderGeometry(0.42, 0.42, 8.8, 32);
        const shaft = new THREE.Mesh(shaftGeo, flutedShaftMat);
        shaft.position.y = 4.95;
        columnGroup.add(shaft);

        const capRing = new THREE.CylinderGeometry(0.58, 0.46, 0.25, 32);
        const capRingMesh = new THREE.Mesh(capRing, royalGoldMat);
        capRingMesh.position.y = 9.4;
        columnGroup.add(capRingMesh);

        const capPlinthGeo = new THREE.BoxGeometry(1.1, 0.35, 1.1);
        const capPlinth = new THREE.Mesh(capPlinthGeo, darkBasaltMat);
        capPlinth.position.y = 9.68;
        columnGroup.add(capPlinth);

        architecturalGroup.add(columnGroup);

        // Solid Grand Venetian Wall Section Between Pillars (Seamlessly flush)
        const nextAng = ((i + 1) / pillarCount) * Math.PI * 2;
        const nx = Math.cos(nextAng) * 16.5;
        const nz = Math.sin(nextAng) * 16.5;

        const wallDist = Math.hypot(nx - x, nz - z);
        const wallGeo = new THREE.PlaneGeometry(wallDist + 0.3, 9.6);
        const wallMesh = new THREE.Mesh(wallGeo, venetianWallMat);

        const midX = (x + nx) / 2;
        const midZ = (z + nz) / 2;
        wallMesh.position.set(midX, 4.8, midZ);
        wallMesh.lookAt(0, 4.8, 0);
        architecturalGroup.add(wallMesh);
    }

    // Grand Concentric Coffered Dome Ceiling
    const ceilingDomeGeo = new THREE.CylinderGeometry(16.8, 16.8, 0.5, 64);
    const ceilingDomeMat = new THREE.MeshStandardMaterial({
        color: 0x090b14,
        roughness: 0.35,
        metalness: 0.60
    });
    const ceilingDome = new THREE.Mesh(ceilingDomeGeo, ceilingDomeMat);
    ceilingDome.position.y = 9.85;
    architecturalGroup.add(ceilingDome);

    const innerDomeGeo = new THREE.CylinderGeometry(11.5, 11.5, 0.4, 64);
    const innerDomeMat = new THREE.MeshStandardMaterial({
        color: 0x0c0e1a,
        roughness: 0.25,
        metalness: 0.70
    });
    const innerDome = new THREE.Mesh(innerDomeGeo, innerDomeMat);
    innerDome.position.y = 10.15;
    architecturalGroup.add(innerDome);

    for (let r of [16.5, 11.5, 6.0]) {
        const ringBeamGeo = new THREE.TorusGeometry(r, 0.14, 16, 64);
        const ringBeam = new THREE.Mesh(ringBeamGeo, royalGoldMat);
        ringBeam.rotation.x = Math.PI / 2;
        ringBeam.position.y = 9.75;
        architecturalGroup.add(ringBeam);
    }
}

// 3. Central Kinetic Prism Sculpture
function buildCenterpieceKineticSculpture() {
    const group = new THREE.Group();
    scene.add(group);

    const baseGeo = new THREE.CylinderGeometry(1.3, 1.5, 1.2, 32);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0a0c14,
        roughness: 0.18,
        metalness: 0.85
    });
    const pedestal = new THREE.Mesh(baseGeo, baseMat);
    pedestal.position.set(0, 0.6, 0);
    group.add(pedestal);

    const ringGeo = new THREE.TorusGeometry(1.35, 0.05, 16, 64);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xffcf33, metalness: 0.96, roughness: 0.14 });
    const pRing = new THREE.Mesh(ringGeo, brassMat);
    pRing.rotation.x = Math.PI / 2;
    pRing.position.set(0, 1.2, 0);
    group.add(pRing);

    const prismGeo = new THREE.IcosahedronGeometry(0.9, 0);
    const prismMat = new THREE.MeshPhysicalMaterial({
        color: 0xffe6a7,
        transmission: 0.92,
        opacity: 0.88,
        transparent: true,
        roughness: 0.06,
        ior: 1.85,
        reflectivity: 0.98
    });
    centralSculpture = new THREE.Mesh(prismGeo, prismMat);
    centralSculpture.position.set(0, 2.5, 0);
    group.add(centralSculpture);

    const orbitRingGeo = new THREE.TorusGeometry(1.5, 0.025, 16, 64);
    const ring1 = new THREE.Mesh(orbitRingGeo, brassMat);
    ring1.rotation.x = Math.PI * 0.3;
    ring1.position.set(0, 2.5, 0);
    group.add(ring1);

    centralSculpture.userData = { ring: ring1 };
}

// 4. Sparse Gentle Ambient Dust Motes
function buildFloatingDustMotes() {
    const particleCount = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = Math.random() * 8.0;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        size: 0.045,
        color: 0xffe8b8,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });

    dustParticles = new THREE.Points(geometry, material);
    scene.add(dustParticles);
}

// 5. Standalone High-End Engraved Brass Curator Plaque Canvas Texture (2048x512 Ultra-HD)
function renderCuratorPlaqueCanvas(ctx, index, text) {
    ctx.clearRect(0, 0, 2048, 512);

    const bgGrad = ctx.createLinearGradient(0, 0, 2048, 512);
    bgGrad.addColorStop(0, '#0e1220');
    bgGrad.addColorStop(0.5, '#070912');
    bgGrad.addColorStop(1, '#0e1220');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 512);

    // Double 24K Royal Gold Borders
    ctx.strokeStyle = '#ffcf33';
    ctx.lineWidth = 6.0;
    ctx.strokeRect(12, 12, 2024, 488);

    ctx.strokeStyle = 'rgba(255, 207, 51, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(26, 26, 1996, 460);

    // 4 Corner Screw Rivets
    const corners = [[46, 46], [2002, 46], [46, 466], [2002, 466]];
    corners.forEach(([cx, cy]) => {
        ctx.fillStyle = '#ffcf33';
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#05070c';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy);
        ctx.lineTo(cx + 5, cy);
        ctx.stroke();
    });

    // Top Header
    ctx.font = '700 42px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffcf33';
    ctx.textAlign = 'left';
    ctx.fillText('EXHIBIT // 0' + (index + 1) + ' OF 04', 80, 100);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.70)';
    ctx.font = '600 34px "Space Grotesk", sans-serif';
    ctx.fillText('MINJI MEMORIAL ARCHIVE', 1968, 100);

    ctx.strokeStyle = 'rgba(255, 207, 51, 0.45)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(80, 130);
    ctx.lineTo(1968, 130);
    ctx.stroke();

    // Large Prominent Crisp Lyric Text with Golden Ambient Glow
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 207, 51, 0.95)';
    ctx.shadowBlur = 22;

    let fontSize = 84;
    if (text.length > 40) fontSize = 70;
    ctx.font = 'italic 700 ' + fontSize + 'px "Cormorant Garamond", "Playfair Display", Georgia, serif';

    const fullDisplay = '“' + text + '”';
    ctx.fillText(fullDisplay, 1024, 295);

    // Bottom Subtitle
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 207, 51, 0.85)';
    ctx.font = '600 32px "Space Grotesk", sans-serif';
    ctx.fillText('✦   BACKSTREET BOYS • SHAPE OF MY HEART   ✦', 1024, 430);
}

// 6. Build 4 Authentic Masterpiece Museum Frames with Dedicated Smooth Picture Spotlights
function buildGalleryExhibits() {
    galleryGroup = new THREE.Group();
    scene.add(galleryGroup);

    const textureLoader = new THREE.TextureLoader();

    const totalArc = Math.PI * 1.2;
    const startArc = -totalArc / 2;

    const darkWalnutOuterMouldingMat = new THREE.MeshStandardMaterial({
        color: 0x090b12,
        roughness: 0.35,
        metalness: 0.75
    });

    const brushedGoldBevelMat = new THREE.MeshStandardMaterial({
        color: 0xffcf33,
        metalness: 0.96,
        roughness: 0.14
    });

    const museumConservationMatteMat = new THREE.MeshBasicMaterial({
        color: 0xf6f6f8,
        depthWrite: true
    });

    const museumGlazingGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        roughness: 0.02,
        transmission: 0.92,
        reflectivity: 0.95,
        ior: 1.5,
        depthWrite: false
    });

    const brassPlaqueFrameMat = new THREE.MeshStandardMaterial({
        color: 0xffcf33,
        metalness: 0.94,
        roughness: 0.16
    });

    syncData.forEach((item, index) => {
        const exhibitStation = new THREE.Group();

        const angle = startArc + (index / (syncData.length - 1)) * totalArc;
        const x = Math.sin(angle) * GALLERY_RADIUS;
        const z = Math.cos(angle) * GALLERY_RADIUS;
        const y = 3.3;

        exhibitStation.position.set(x, y, z);
        exhibitStation.lookAt(0, y, 0);

        const outerWidth = 3.4;
        const outerHeight = 2.6;
        const frameDepth = 0.12;

        const outerFrameGeo = new THREE.BoxGeometry(outerWidth, outerHeight, frameDepth);
        const outerFrameMesh = new THREE.Mesh(outerFrameGeo, darkWalnutOuterMouldingMat.clone());
        outerFrameMesh.position.set(0, 0, -0.06);
        exhibitStation.add(outerFrameMesh);

        const goldBevelGeo = new THREE.BoxGeometry(outerWidth - 0.08, outerHeight - 0.08, frameDepth + 0.01);
        const goldBevelMesh = new THREE.Mesh(goldBevelGeo, brushedGoldBevelMat.clone());
        goldBevelMesh.position.set(0, 0, -0.055);
        exhibitStation.add(goldBevelMesh);

        const shadowBoxGeo = new THREE.PlaneGeometry(outerWidth - 0.16, outerHeight - 0.16);
        const shadowBoxMesh = new THREE.Mesh(shadowBoxGeo, new THREE.MeshBasicMaterial({ color: 0x05060a }));
        shadowBoxMesh.position.set(0, 0, 0.005);
        exhibitStation.add(shadowBoxMesh);

        const matteWidth = outerWidth - 0.26;
        const matteHeight = outerHeight - 0.26;
        const matteGeo = new THREE.PlaneGeometry(matteWidth, matteHeight);
        const matteMesh = new THREE.Mesh(matteGeo, museumConservationMatteMat);
        matteMesh.position.set(0, 0, 0.015);
        exhibitStation.add(matteMesh);

        const photoWidth = matteWidth - 0.18;
        const photoHeight = matteHeight - 0.18;
        const photoTexture = textureLoader.load(item.img);
        photoTexture.encoding = THREE.sRGBEncoding;
        photoTexture.generateMipmaps = true;
        photoTexture.minFilter = THREE.LinearMipmapLinearFilter;

        const photoGeo = new THREE.PlaneGeometry(photoWidth, photoHeight);
        const ccShaderMat = new THREE.ShaderMaterial({
            vertexShader: CCVertexShader,
            fragmentShader: CCFragmentShader,
            uniforms: {
                uTexture: { value: photoTexture },
                uTime: { value: 0.0 },
                uIsActive: { value: index === 0 ? 1.0 : 0.0 }
            },
            depthWrite: true
        });
        const photoPlane = new THREE.Mesh(photoGeo, ccShaderMat);
        photoPlane.position.set(0, 0, 0.025);
        exhibitStation.add(photoPlane);

        const glassGlazingGeo = new THREE.PlaneGeometry(outerWidth - 0.10, outerHeight - 0.10);
        const glassGlazingMesh = new THREE.Mesh(glassGlazingGeo, museumGlazingGlassMat);
        glassGlazingMesh.position.set(0, 0, 0.045);
        exhibitStation.add(glassGlazingMesh);

        // Overhead Minimalist Picture Light Fixture
        const lampArmGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.45, 16);
        const lampArm = new THREE.Mesh(lampArmGeo, brushedGoldBevelMat);
        lampArm.rotation.x = Math.PI * 0.45;
        lampArm.position.set(0, (outerHeight / 2) + 0.15, 0.18);
        exhibitStation.add(lampArm);

        const lampHoodGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 16);
        const lampHood = new THREE.Mesh(lampHoodGeo, brushedGoldBevelMat);
        lampHood.rotation.z = Math.PI / 2;
        lampHood.position.set(0, (outerHeight / 2) + 0.28, 0.34);
        exhibitStation.add(lampHood);

        // Dedicated Soft Museum Picture Spotlight for EACH artwork (Redup: 2.0, Terang: 4.8)
        const dedicatedSpotlight = new THREE.SpotLight(0xfffaea, index === 0 ? 4.8 : 2.0, 22, Math.PI * 0.38, 0.5, 1.0);
        dedicatedSpotlight.position.set(x * 0.82, y + 2.5, z * 0.82);
        dedicatedSpotlight.target = exhibitStation;
        scene.add(dedicatedSpotlight);

        // Plaque Group
        const plaqueGroup = new THREE.Group();
        plaqueGroup.position.set(0, -(outerHeight / 2) - 0.42, 0.08);
        plaqueGroup.rotation.x = -Math.PI * 0.06;

        for (let rx of [-1.0, 1.0]) {
            const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 12);
            const rod = new THREE.Mesh(rodGeo, brushedGoldBevelMat);
            rod.position.set(rx, 0.12, -0.04);
            plaqueGroup.add(rod);
        }

        const plaqueWidth = 3.3;
        const plaqueHeight = 0.80;

        const plaqueBoxGeo = new THREE.BoxGeometry(plaqueWidth, plaqueHeight, 0.04);
        const plaqueBox = new THREE.Mesh(plaqueBoxGeo, brassPlaqueFrameMat);
        plaqueGroup.add(plaqueBox);

        const plaqueCanvas = document.createElement('canvas');
        plaqueCanvas.width = 2048;
        plaqueCanvas.height = 512;
        const plaqueCtx = plaqueCanvas.getContext('2d');
        renderCuratorPlaqueCanvas(plaqueCtx, index, item.text);

        const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas);
        plaqueTexture.encoding = THREE.sRGBEncoding;
        plaqueTexture.generateMipmaps = true;
        plaqueTexture.minFilter = THREE.LinearMipmapLinearFilter;

        const plaqueFaceGeo = new THREE.PlaneGeometry(plaqueWidth - 0.04, plaqueHeight - 0.04);
        const plaqueFaceMat = new THREE.MeshBasicMaterial({ map: plaqueTexture });
        const plaqueFace = new THREE.Mesh(plaqueFaceGeo, plaqueFaceMat);
        plaqueFace.position.set(0, 0, 0.022);
        plaqueGroup.add(plaqueFace);

        exhibitStation.add(plaqueGroup);

        const floorRingGeo = new THREE.RingGeometry(0.85, 1.0, 32);
        const floorRingMat = new THREE.MeshBasicMaterial({
            color: index === 0 ? 0xffcf33 : 0xffffff,
            transparent: true,
            opacity: index === 0 ? 0.9 : 0.25,
            side: THREE.DoubleSide
        });
        const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
        floorRing.rotation.x = -Math.PI / 2;
        floorRing.position.set(x, 0.02, z);
        scene.add(floorRing);

        photoPlane.userData = { index: index, data: item };
        outerFrameMesh.userData = { index: index, data: item };
        glassGlazingMesh.userData = { index: index, data: item };
        plaqueFace.userData = { index: index, data: item };

        galleryExhibits.push({
            container: exhibitStation,
            frame: outerFrameMesh,
            bevel: goldBevelMesh,
            photo: photoPlane,
            shaderMat: ccShaderMat,
            plaque: plaqueFace,
            floorRing: floorRing,
            spotlight: dedicatedSpotlight,
            basePos: new THREE.Vector3(x, y, z),
            baseRot: exhibitStation.rotation.clone(),
            index: index
        });

        galleryGroup.add(exhibitStation);
    });
}

// Smooth Museum Camera & Lighting Navigation (Smooth Redup -> Terang -> Redup)
function focusCameraOnExhibit(index, duration = 2.4) {
    if (!galleryExhibits[index] || isEndingSequenceActive) return;

    const targetExhibit = galleryExhibits[index];
    const exhibitPos = targetExhibit.basePos;

    // Smoothly reset any user-orbit drag so the camera is ALWAYS 100% square to the target exhibit
    if (galleryGroup) {
        gsap.to(galleryGroup.rotation, { x: 0, y: 0, z: 0, duration: duration * 0.8, ease: "power2.inOut" });
    }
    orbitOffset.x = 0;
    orbitOffset.y = 0;

    const isMobile = window.innerWidth <= 600;
    const camDistance = isMobile ? 8.6 : 7.6;

    // Use canonical base rotation to guarantee 100% perpendicular front view
    const forwardVec = new THREE.Vector3(0, 0, camDistance);
    forwardVec.applyEuler(targetExhibit.baseRot);

    const targetCamPos = exhibitPos.clone().add(forwardVec);
    targetCamPos.y = exhibitPos.y + 0.1;

    // Smooth lighting transition: Active is Bright (4.8), Others are Soft Ambient (2.0)
    galleryExhibits.forEach((exObj, i) => {
        if (i === index) {
            exObj.bevel.material.color.setHex(0xffffff);
            exObj.shaderMat.uniforms.uIsActive.value = 1.0;
            exObj.floorRing.material.color.setHex(0xffcf33);
            exObj.floorRing.material.opacity = 0.95;
            gsap.to(exObj.spotlight, { intensity: 4.8, duration: 2.0, ease: "power2.inOut" });
            gsap.to(exObj.container.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.8, ease: "back.out(1.5)" });
        } else {
            exObj.bevel.material.color.setHex(0xffcf33);
            exObj.shaderMat.uniforms.uIsActive.value = 0.0;
            exObj.floorRing.material.color.setHex(0xffffff);
            exObj.floorRing.material.opacity = 0.25;
            gsap.to(exObj.spotlight, { intensity: 2.0, duration: 2.0, ease: "power2.inOut" });
            gsap.to(exObj.container.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.8, ease: "power2.out" });
        }
    });

    gsap.to(camera.position, {
        x: targetCamPos.x,
        y: targetCamPos.y,
        z: targetCamPos.z,
        duration: duration,
        ease: "power2.inOut"
    });

    gsap.to(cameraLookTarget, {
        x: exhibitPos.x,
        y: exhibitPos.y - 0.2,
        z: exhibitPos.z,
        duration: duration,
        ease: "power2.inOut"
    });
}

// =======================================================
// 3D CONSTELLATION ORBIT MOSAIC FINALE SEQUENCE
// =======================================================
function triggerConstellationEnding() {
    isEndingSequenceActive = true;
    isPlaying = false;
    playIcon.textContent = "replay";
    playerBar.classList.remove("playing");

    bottomContainer.style.opacity = "0";
    setTimeout(() => {
        bottomContainer.classList.add("hidden");
    }, 600);

    const isMobile = window.innerWidth <= 600;
    const craneCamPos = { x: 0, y: isMobile ? 6.0 : 5.4, z: isMobile ? 12.5 : 11.2 };
    const craneLookPos = { x: 0, y: 5.6, z: 0 };

    gsap.to(camera.position, {
        x: craneCamPos.x,
        y: craneCamPos.y,
        z: craneCamPos.z,
        duration: 3.0,
        ease: "power2.inOut"
    });

    gsap.to(cameraLookTarget, {
        x: craneLookPos.x,
        y: craneLookPos.y,
        z: craneLookPos.z,
        duration: 3.0,
        ease: "power2.inOut"
    });

    if (centralSculpture && centralSculpture.parent) {
        gsap.to(centralSculpture.parent.position, { y: -4.0, duration: 2.0, ease: "power2.in" });
    }

    const constellationPositions = [
        { x: -3.2, y: 7.2, z: 0.6, rotY: 0.12, scale: 0.78 },
        { x: 3.2, y: 7.2, z: 0.6, rotY: -0.12, scale: 0.78 },
        { x: -1.8, y: 4.6, z: 0.1, rotY: 0.06, scale: 0.80 },
        { x: 1.8, y: 4.6, z: 0.1, rotY: -0.06, scale: 0.80 }
    ];

    galleryExhibits.forEach((exObj, i) => {
        const cPos = constellationPositions[i];
        
        gsap.to(exObj.floorRing.material, { opacity: 0, duration: 1.5 });
        gsap.to(exObj.spotlight, { intensity: 3.5, duration: 2.0 });

        if (exObj.plaque && exObj.plaque.parent) {
            gsap.to(exObj.plaque.parent.scale, { x: 0, y: 0, z: 0, duration: 1.2, ease: "power2.in" });
        }
        
        gsap.to(exObj.container.position, {
            x: cPos.x,
            y: cPos.y,
            z: cPos.z,
            duration: 2.8 + i * 0.12,
            ease: "power2.inOut"
        });

        gsap.to(exObj.container.rotation, {
            x: 0,
            y: cPos.rotY,
            z: 0,
            duration: 2.8 + i * 0.12,
            ease: "power2.inOut"
        });

        gsap.to(exObj.container.scale, {
            x: cPos.scale,
            y: cPos.scale,
            z: cPos.scale,
            duration: 2.6,
            ease: "power2.inOut"
        });

        exObj.bevel.material.color.setHex(0xffcf33);
        exObj.shaderMat.uniforms.uIsActive.value = 1.0;
    });

    if (constellationLinesGroup) {
        scene.remove(constellationLinesGroup);
    }
    constellationLinesGroup = new THREE.Group();
    scene.add(constellationLinesGroup);

    const lineMat = new THREE.LineBasicMaterial({
        color: 0xffcf33,
        transparent: true,
        opacity: 0.0,
        linewidth: 2.5
    });

    const heartLinePoints = [
        new THREE.Vector3(-1.8, 8.2, -0.2),
        new THREE.Vector3(0.0, 7.3, -0.2),
        new THREE.Vector3(1.8, 8.2, -0.2),
        new THREE.Vector3(4.5, 6.8, -0.2),
        new THREE.Vector3(3.0, 4.0, -0.2),
        new THREE.Vector3(0.0, 2.8, -0.2),
        new THREE.Vector3(-3.0, 4.0, -0.2),
        new THREE.Vector3(-4.5, 6.8, -0.2),
        new THREE.Vector3(-1.8, 8.2, -0.2)
    ];

    const lineGeo = new THREE.BufferGeometry().setFromPoints(heartLinePoints);
    const constLine = new THREE.Line(lineGeo, lineMat);
    constellationLinesGroup.add(constLine);

    gsap.to(lineMat, { opacity: 0.85, duration: 1.8, delay: 2.0 });

    setTimeout(() => {
        constellationEndingOverlay.classList.remove("hidden");
        setTimeout(() => {
            constellationEndingOverlay.classList.add("active");
        }, 50);
    }, 2200);
}

// Restore Gallery from Constellation Back to Exhibition Promenade
function resetFromConstellationToExhibition() {
    isEndingSequenceActive = false;

    constellationEndingOverlay.classList.remove("active");
    setTimeout(() => {
        constellationEndingOverlay.classList.add("hidden");
    }, 400);

    if (constellationLinesGroup) {
        gsap.to(constellationLinesGroup.children[0].material, {
            opacity: 0,
            duration: 0.8,
            onComplete: () => {
                scene.remove(constellationLinesGroup);
                constellationLinesGroup = null;
            }
        });
    }

    // Explicitly reset gallery group rotation and orbit offsets
    if (galleryGroup) {
        gsap.to(galleryGroup.rotation, { x: 0, y: 0, z: 0, duration: 1.8, ease: "power2.inOut" });
    }
    orbitOffset.x = 0;
    orbitOffset.y = 0;

    if (centralSculpture && centralSculpture.parent) {
        gsap.to(centralSculpture.parent.position, { y: 0, duration: 2.0, ease: "power2.out" });
    }

    galleryExhibits.forEach((exObj, i) => {
        if (exObj.plaque && exObj.plaque.parent) {
            gsap.to(exObj.plaque.parent.scale, { x: 1, y: 1, z: 1, duration: 1.8, ease: "power2.out" });
        }

        gsap.to(exObj.container.position, {
            x: exObj.basePos.x,
            y: exObj.basePos.y,
            z: exObj.basePos.z,
            duration: 2.2,
            ease: "power2.inOut"
        });

        gsap.to(exObj.container.rotation, {
            x: exObj.baseRot.x,
            y: exObj.baseRot.y,
            z: exObj.baseRot.z,
            duration: 2.2,
            ease: "power2.inOut"
        });

        gsap.to(exObj.container.scale, {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            duration: 2.0,
            ease: "power2.inOut"
        });

        gsap.to(exObj.floorRing.material, {
            opacity: i === 0 ? 0.9 : 0.25,
            duration: 1.5
        });

        gsap.to(exObj.spotlight, {
            intensity: i === 0 ? 4.8 : 2.0,
            duration: 2.0
        });
    });

    bottomContainer.classList.remove("hidden");
    bottomContainer.style.opacity = "1";

    audio.currentTime = 0;
    currentActiveIndex = 0;
    togglePlay();
    focusCameraOnExhibit(0, 2.6);
}

btnReplayTour.addEventListener("click", resetFromConstellationToExhibition);
btnFreeRoam.addEventListener("click", () => {
    constellationEndingOverlay.classList.remove("active");
    setTimeout(() => {
        constellationEndingOverlay.classList.add("hidden");
    }, 400);
});

// 3D Orbit & Click Interaction
function init3DInteraction() {
    const dom = renderer.domElement;

    dom.addEventListener("pointerdown", (e) => {
        isPointerDown = true;
        startPointer = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener("pointermove", (e) => {
        pointerPos.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointerPos.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (!isPointerDown) return;
        const dx = e.clientX - startPointer.x;
        const dy = e.clientY - startPointer.y;

        orbitOffset.x += dx * 0.003;
        orbitOffset.y += dy * 0.002;
        orbitOffset.y = Math.max(-0.35, Math.min(0.35, orbitOffset.y));

        startPointer = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener("pointerup", (e) => {
        isPointerDown = false;
        const totalDist = Math.hypot(e.clientX - startPointer.x, e.clientY - startPointer.y);
        if (totalDist < 6 && hasJourneyStarted && !isEndingSequenceActive) {
            handleRaycastClick(e);
        }
    });
}

function handleRaycastClick(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(galleryGroup.children, true);

    if (intersects.length > 0) {
        let clickedMesh = intersects[0].object;
        let userData = clickedMesh.userData;

        if (userData && userData.index !== undefined) {
            selectExhibit(userData.index);
        } else if (clickedMesh.parent && clickedMesh.parent.userData && clickedMesh.parent.userData.index !== undefined) {
            selectExhibit(clickedMesh.parent.userData.index);
        }
    }
}

function selectExhibit(index) {
    if (isEndingSequenceActive) return;
    currentActiveIndex = index;
    const targetData = syncData[index];

    audio.currentTime = targetData.time;

    if (audio.paused) {
        togglePlay();
    }

    focusCameraOnExhibit(index, 2.2);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (hasJourneyStarted && !isEndingSequenceActive) {
        focusCameraOnExhibit(currentActiveIndex, 0.5);
    }
}

// 3D Render Loop
let clock = new THREE.Clock();

function animate3D() {
    requestAnimationFrame(animate3D);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (centralSculpture) {
        centralSculpture.rotation.x = time * 0.4;
        centralSculpture.rotation.y = time * 0.6;
        if (centralSculpture.userData.ring) {
            centralSculpture.userData.ring.rotation.z = time * 0.3;
        }
    }

    if (dustParticles) {
        dustParticles.rotation.y = time * 0.015;
    }

    galleryExhibits.forEach(exObj => {
        if (exObj.shaderMat && exObj.shaderMat.uniforms.uTime) {
            exObj.shaderMat.uniforms.uTime.value = time;
        }
    });

    if (isEndingSequenceActive) {
        galleryExhibits.forEach((exObj, i) => {
            exObj.container.position.y += Math.sin(time * 1.5 + i * 1.2) * 0.003;
        });
        if (constellationLinesGroup) {
            constellationLinesGroup.rotation.y = Math.sin(time * 0.4) * 0.02;
        }
    } else if (hasJourneyStarted) {
        galleryExhibits.forEach((exObj, i) => {
            if (i === currentActiveIndex) {
                exObj.container.position.y = exObj.basePos.y + Math.sin(time * 2.0) * 0.04;
            } else {
                exObj.container.position.y = exObj.basePos.y;
            }
        });
    }

    if (galleryGroup) {
        galleryGroup.rotation.y += orbitOffset.x * 0.1;
        orbitOffset.x *= 0.92;
        orbitOffset.y *= 0.92;
    }

    camera.lookAt(cameraLookTarget);
    renderer.render(scene, camera);
}

// Controls
btnStartExplore.addEventListener("click", startJourney);
btnPlay.addEventListener("click", togglePlay);

function startJourney() {
    if (hasJourneyStarted) return;
    hasJourneyStarted = true;

    introScreen.classList.add("fade-out");
    setTimeout(() => {
        introScreen.classList.add("hidden");
    }, 800);

    bottomContainer.classList.remove("hidden");

    togglePlay();
    focusCameraOnExhibit(0, 2.6);
}

function togglePlay() {
    if (isEndingSequenceActive) {
        resetFromConstellationToExhibition();
        return;
    }

    if (audio.paused) {
        audio.play().then(() => {
            isPlaying = true;
            playIcon.textContent = "pause";
            playerBar.classList.add("playing");
        }).catch(err => {
            console.error("Playback error:", err);
            isPlaying = true;
            playIcon.textContent = "pause";
            playerBar.classList.add("playing");
        });
    } else {
        audio.pause();
        isPlaying = false;
        playIcon.textContent = "play_arrow";
        playerBar.classList.remove("playing");
    }
}

// Audio Timeupdate (23.7s total)
audio.addEventListener("timeupdate", () => {
    if (isEndingSequenceActive) return;

    const curTime = audio.currentTime;
    const duration = audio.duration || 23.69;

    const progressPercent = (curTime / duration) * 100;
    progressBarGlow.style.width = progressPercent + "%";

    curTimeDisplay.textContent = formatTime(curTime);
    durTimeDisplay.textContent = "-" + formatTime(duration - curTime);

    let activeIndex = -1;
    for (let i = 0; i < syncData.length; i++) {
        if (curTime >= syncData[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (activeIndex !== -1 && activeIndex !== currentActiveIndex) {
        currentActiveIndex = activeIndex;
        focusCameraOnExhibit(currentActiveIndex, 2.2);
    }
});

btnPrev.addEventListener("click", () => {
    const targetIdx = (currentActiveIndex - 1 + syncData.length) % syncData.length;
    selectExhibit(targetIdx);
});

btnNext.addEventListener("click", () => {
    const targetIdx = (currentActiveIndex + 1) % syncData.length;
    selectExhibit(targetIdx);
});

progressContainer.addEventListener("click", (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    if (audio.duration) {
        audio.currentTime = (clickX / width) * audio.duration;
    }
});

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ":" + String(secs).padStart(2, '0');
}

audio.addEventListener("ended", () => {
    setTimeout(() => {
        triggerConstellationEnding();
    }, 600);
});

window.addEventListener("DOMContentLoaded", () => {
    init3DUniverse();
    animate3D();
});
