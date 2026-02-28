import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * 3D Developer Room — Three.js module
 * Interactive 3D dev workspace with figurines, posters, bed, and light toggle.
 */

let scene, camera, renderer, controls;
let animationId = null;
let isInitialized = false;

// Lighting references for toggle
let roomLights = {
    ambient: null,
    deskLight: null,
    monitorLight: null,
    ledLight: null,
    ceilingLight: null,
    fillLight: null,
};
let lightsOn = true;

/* ============================================
   TEXTURES
   ============================================ */
const textureLoader = new THREE.TextureLoader();

function loadTexture(url) {
    return textureLoader.load(url);
}

/* ============================================
   MATERIALS
   ============================================ */
const colors = {
    wall: 0x1a1a2e,
    wallAccent: 0x16213e,
    floor: 0x0f0f1a,
    ceiling: 0x0d0d1a,
    desk: 0x2c1810,
    deskTop: 0x3d2317,
    monitor: 0x111111,
    screenGlow: 0x00d4ff,
    keyboard: 0x1a1a1a,
    chair: 0x222222,
    chairCushion: 0x2a2a3a,
    shelf: 0x2c1810,
    led: 0x7b2ff7,
    mousePad: 0x1a1a2e,
    mug: 0xf5f5dc,
    plant: 0x228b22,
    plantPot: 0x8b4513,
    bookSpines: [0xff2d87, 0x00d4ff, 0x7b2ff7, 0xffb800, 0x00e599],
    bedFrame: 0x2c1810,
    bedSheet: 0x1a1a3e,
    pillow: 0xd0d0e8,
    blanket: 0x252545,
};

function createMaterial(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: opts.roughness ?? 0.7,
        metalness: opts.metalness ?? 0.1,
        ...opts,
    });
}

/* ============================================
   ROOM GEOMETRY
   ============================================ */
function createRoom() {
    const group = new THREE.Group();
    const roomW = 7, roomH = 3.2, roomD = 5.5;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(roomW, roomD);
    const floorMat = createMaterial(colors.floor, { roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(roomW, roomD);
    const ceilMat = createMaterial(colors.ceiling, { roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomH;
    group.add(ceiling);

    // Back wall
    const backWallGeo = new THREE.PlaneGeometry(roomW, roomH);
    const backWallMat = createMaterial(colors.wall, { roughness: 0.85 });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, roomH / 2, -roomD / 2);
    backWall.receiveShadow = true;
    group.add(backWall);

    // Left wall
    const leftWallGeo = new THREE.PlaneGeometry(roomD, roomH);
    const leftWallMat = createMaterial(colors.wallAccent, { roughness: 0.85 });
    const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
    leftWall.position.set(-roomW / 2, roomH / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(leftWallGeo, leftWallMat.clone());
    rightWall.position.set(roomW / 2, roomH / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    return group;
}

/* ============================================
   DESK
   ============================================ */
function createDesk() {
    const group = new THREE.Group();

    const topGeo = new THREE.BoxGeometry(2.2, 0.06, 0.9);
    const topMat = createMaterial(colors.deskTop, { roughness: 0.5, metalness: 0.05 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.78;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    const legGeo = new THREE.BoxGeometry(0.05, 0.75, 0.05);
    const legMat = createMaterial(0x333333, { metalness: 0.6 });
    [[-1.0, 0.375, -0.38], [1.0, 0.375, -0.38], [-1.0, 0.375, 0.38], [1.0, 0.375, 0.38]].forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(x, y, z);
        leg.castShadow = true;
        group.add(leg);
    });

    const trayGeo = new THREE.BoxGeometry(1.5, 0.02, 0.15);
    const tray = new THREE.Mesh(trayGeo, createMaterial(0x222222, { metalness: 0.5 }));
    tray.position.set(0, 0.55, -0.35);
    group.add(tray);

    group.position.set(-0.5, 0, -2.2);
    return group;
}

/* ============================================
   MONITOR
   ============================================ */
function createMonitor() {
    const group = new THREE.Group();

    const frameGeo = new THREE.BoxGeometry(1.05, 0.62, 0.03);
    const frameMat = createMaterial(colors.monitor, { roughness: 0.3, metalness: 0.5 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 1.2;
    frame.castShadow = true;
    group.add(frame);

    const screenGeo = new THREE.PlaneGeometry(0.95, 0.54);

    // Code lines on screen
    const codeCanvas = document.createElement('canvas');
    codeCanvas.width = 512;
    codeCanvas.height = 290;
    const ctx = codeCanvas.getContext('2d');
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, 512, 290);

    const codeLines = [
        { text: 'const portfolio = {', color: '#7b93db' },
        { text: '  name: "Adrian Hinojosa",', color: '#98c379' },
        { text: '  role: "IT Analyst",', color: '#98c379' },
        { text: '  stack: [', color: '#7b93db' },
        { text: '    "Docker", "Azure",', color: '#e5c07b' },
        { text: '    "Jenkins", "SAP",', color: '#e5c07b' },
        { text: '    "Angular", ".NET"', color: '#e5c07b' },
        { text: '  ],', color: '#7b93db' },
        { text: '  available: true', color: '#00e599' },
        { text: '};', color: '#7b93db' },
        { text: '', color: '#636d8a' },
        { text: '// Deploy to production 🚀', color: '#636d8a' },
    ];

    ctx.font = '14px monospace';
    codeLines.forEach((line, i) => {
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, 20, 28 + i * 22);
    });
    ctx.fillStyle = '#3a3a5a';
    ctx.font = '12px monospace';
    for (let i = 0; i < 12; i++) {
        ctx.fillText(`${i + 1}`, 4, 28 + i * 22);
    }

    const codeTex = new THREE.CanvasTexture(codeCanvas);
    const codeScreen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: codeTex }));
    codeScreen.position.set(0, 1.2, 0.017);
    group.add(codeScreen);

    // Stand
    const standGeo = new THREE.BoxGeometry(0.08, 0.28, 0.08);
    const standMat = createMaterial(0x222222, { metalness: 0.5 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(0, 0.95, 0);
    group.add(stand);

    const baseGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.02, 16);
    const base = new THREE.Mesh(baseGeo, standMat);
    base.position.set(0, 0.81, 0.05);
    group.add(base);

    group.position.set(-0.5, 0, -2.3);
    return group;
}

/* ============================================
   SECOND MONITOR
   ============================================ */
function createSecondMonitor() {
    const group = new THREE.Group();

    const frameGeo = new THREE.BoxGeometry(0.6, 0.45, 0.025);
    const frameMat = createMaterial(colors.monitor, { roughness: 0.3, metalness: 0.5 });
    group.add(new THREE.Mesh(frameGeo, frameMat));

    const termCanvas = document.createElement('canvas');
    termCanvas.width = 320;
    termCanvas.height = 240;
    const tCtx = termCanvas.getContext('2d');
    tCtx.fillStyle = '#0a0a12';
    tCtx.fillRect(0, 0, 320, 240);
    tCtx.font = '11px monospace';

    const termLines = [
        { text: '$ docker ps', color: '#00e599' },
        { text: 'CONTAINER  IMAGE       STATUS', color: '#636d8a' },
        { text: 'sap-api    node:18     Up 3h', color: '#e8eaf6' },
        { text: 'postgres   pg:15       Up 3h', color: '#e8eaf6' },
        { text: 'nginx      nginx:1.25  Up 3h', color: '#e8eaf6' },
        { text: '', color: '#636d8a' },
        { text: '$ kubectl get pods', color: '#00e599' },
        { text: 'NAME         READY  STATUS', color: '#636d8a' },
        { text: 'api-deploy   1/1    Running', color: '#e8eaf6' },
        { text: 'web-front    1/1    Running', color: '#e8eaf6' },
        { text: '', color: '#636d8a' },
        { text: '$ _', color: '#00d4ff' },
    ];
    termLines.forEach((line, i) => {
        tCtx.fillStyle = line.color;
        tCtx.fillText(line.text, 10, 20 + i * 18);
    });

    const termTex = new THREE.CanvasTexture(termCanvas);
    const screenGeo = new THREE.PlaneGeometry(0.52, 0.38);
    const screenMesh = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: termTex }));
    screenMesh.position.z = 0.014;
    group.add(screenMesh);

    const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.2, 0.05),
        createMaterial(0x222222, { metalness: 0.5 })
    );
    stand.position.set(0, -0.32, 0);
    group.add(stand);

    group.position.set(0.3, 1.25, -2.45);
    group.rotation.y = -0.3;
    return group;
}

/* ============================================
   KEYBOARD + MOUSE
   ============================================ */
function createPeripherals() {
    const group = new THREE.Group();

    const kbGeo = new THREE.BoxGeometry(0.5, 0.02, 0.16);
    const kbMat = createMaterial(colors.keyboard, { roughness: 0.4, metalness: 0.3 });
    const kb = new THREE.Mesh(kbGeo, kbMat);
    kb.position.set(-0.6, 0.82, -2.0);
    group.add(kb);

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 12; col++) {
            const key = new THREE.Mesh(
                new THREE.BoxGeometry(0.032, 0.008, 0.028),
                createMaterial(0x2a2a2a, { roughness: 0.3 })
            );
            key.position.set(-0.6 - 0.2 + col * 0.036, 0.835, -2.0 - 0.05 + row * 0.036);
            group.add(key);
        }
    }

    const mouse = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.025, 0.1),
        createMaterial(0x1a1a1a, { roughness: 0.3, metalness: 0.2 })
    );
    mouse.position.set(0.0, 0.82, -2.0);
    group.add(mouse);

    const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.005, 0.25),
        createMaterial(colors.mousePad, { roughness: 0.9 })
    );
    pad.position.set(0.0, 0.81, -2.02);
    group.add(pad);

    return group;
}

/* ============================================
   CHAIR
   ============================================ */
function createChair() {
    const group = new THREE.Group();
    const chairMat = createMaterial(colors.chair, { metalness: 0.4 });
    const cushionMat = createMaterial(colors.chairCushion, { roughness: 0.8 });

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.5), cushionMat);
    seat.position.y = 0.52;
    seat.castShadow = true;
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.05), cushionMat);
    back.position.set(0, 0.85, -0.24);
    back.rotation.x = 0.05;
    group.add(back);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), chairMat);
    pole.position.set(0, 0.32, 0);
    group.add(pole);

    for (let i = 0; i < 5; i++) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.35), chairMat);
        arm.rotation.y = (i * Math.PI * 2) / 5;
        arm.position.y = 0.12;
        group.add(arm);

        const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), createMaterial(0x111111));
        const angle = (i * Math.PI * 2) / 5;
        wheel.position.set(Math.sin(angle) * 0.17, 0.03, Math.cos(angle) * 0.17);
        group.add(wheel);
    }

    [-0.28, 0.28].forEach(x => {
        const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.3), chairMat);
        armRest.position.set(x, 0.68, -0.05);
        group.add(armRest);
        const support = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.03), chairMat);
        support.position.set(x, 0.59, -0.05);
        group.add(support);
    });

    group.position.set(-0.5, 0, -1.2);
    group.rotation.y = Math.PI + 0.15;
    return group;
}

/* ============================================
   WALL POSTERS (Code, DevOps, Space, StarCraft 2)
   ============================================ */
function createPosters() {
    const group = new THREE.Group();

    const posterData = [
        // Back wall
        { url: '/textures/poster_code.png', pos: [-1.8, 2.0, -2.72], size: [0.65, 0.65], rot: [0, 0, 0] },
        { url: '/textures/poster_devops.png', pos: [0.8, 2.0, -2.72], size: [0.65, 0.65], rot: [0, 0, 0] },
        { url: '/textures/poster_space.png', pos: [-0.5, 2.4, -2.72], size: [0.55, 0.55], rot: [0, 0, 0] },
        // Left wall — StarCraft 2 poster
        { url: '/textures/poster_starcraft.png', pos: [-3.47, 1.8, 0.5], size: [0.8, 0.8], rot: [0, Math.PI / 2, 0] },
    ];

    posterData.forEach(p => {
        const tex = loadTexture(p.url);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.0 });
        const geo = new THREE.PlaneGeometry(p.size[0], p.size[1]);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...p.pos);
        if (p.rot) mesh.rotation.set(...p.rot);
        group.add(mesh);

        // Frame
        const ft = 0.02, fd = 0.015;
        const frameMat = createMaterial(0x333333, { metalness: 0.4, roughness: 0.3 });

        [p.size[1] / 2, -p.size[1] / 2].forEach(yOff => {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(p.size[0] + ft * 2, ft, fd), frameMat);
            bar.position.set(p.pos[0], p.pos[1] + yOff, p.pos[2]);
            if (p.rot) bar.rotation.set(...p.rot);
            group.add(bar);
        });
        [p.size[0] / 2, -p.size[0] / 2].forEach(xOff => {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(ft, p.size[1], fd), frameMat);
            // For rotated posters, offset needs to be in the correct axis
            if (p.rot && p.rot[1] !== 0) {
                bar.position.set(p.pos[0], p.pos[1], p.pos[2] + xOff);
            } else {
                bar.position.set(p.pos[0] + xOff, p.pos[1], p.pos[2]);
            }
            if (p.rot) bar.rotation.set(...p.rot);
            group.add(bar);
        });
    });

    return group;
}

/* ============================================
   BOOKSHELF
   ============================================ */
function createBookshelf() {
    const group = new THREE.Group();
    const shelfMat = createMaterial(colors.shelf, { roughness: 0.6 });
    const shelfW = 0.8, shelfD = 0.25;

    const sideGeo = new THREE.BoxGeometry(0.02, 1.2, shelfD);
    [-shelfW / 2, shelfW / 2].forEach(x => {
        const side = new THREE.Mesh(sideGeo, shelfMat);
        side.position.set(x, 1.1, 0);
        group.add(side);
    });

    for (let i = 0; i < 3; i++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(shelfW, 0.02, shelfD), shelfMat);
        plank.position.set(0, 0.5 + i * 0.4, 0);
        group.add(plank);

        const bookCount = 4 + Math.floor(Math.random() * 3);
        let bookX = -shelfW / 2 + 0.06;
        for (let b = 0; b < bookCount; b++) {
            const bookW = 0.03 + Math.random() * 0.04;
            const bookH = 0.2 + Math.random() * 0.12;
            const book = new THREE.Mesh(
                new THREE.BoxGeometry(bookW, bookH, 0.16),
                createMaterial(colors.bookSpines[b % colors.bookSpines.length], { roughness: 0.7 })
            );
            book.position.set(bookX + bookW / 2, 0.52 + bookH / 2 + i * 0.4, 0);
            group.add(book);
            bookX += bookW + 0.005;
        }
    }

    group.position.set(-3.45, 0, -1.5);
    group.rotation.y = Math.PI / 2;
    return group;
}

/* ============================================
   BED
   ============================================ */
function createBed() {
    const group = new THREE.Group();
    const frameMat = createMaterial(colors.bedFrame, { roughness: 0.6 });

    // Bed frame base
    const baseGeo = new THREE.BoxGeometry(1.2, 0.2, 2.0);
    const base = new THREE.Mesh(baseGeo, frameMat);
    base.position.y = 0.2;
    base.castShadow = true;
    group.add(base);

    // Legs (4 corners)
    const legGeo = new THREE.BoxGeometry(0.08, 0.1, 0.08);
    [[-0.55, 0.05, -0.92], [0.55, 0.05, -0.92], [-0.55, 0.05, 0.92], [0.55, 0.05, 0.92]].forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, frameMat);
        leg.position.set(x, y, z);
        group.add(leg);
    });

    // Headboard (at back/wall side)
    const headboardGeo = new THREE.BoxGeometry(1.24, 0.7, 0.06);
    const headboard = new THREE.Mesh(headboardGeo, frameMat);
    headboard.position.set(0, 0.55, -0.97);
    group.add(headboard);

    // Mattress
    const mattressGeo = new THREE.BoxGeometry(1.12, 0.12, 1.9);
    const mattressMat = createMaterial(0xeeeeee, { roughness: 0.9 });
    const mattress = new THREE.Mesh(mattressGeo, mattressMat);
    mattress.position.set(0, 0.36, 0);
    group.add(mattress);

    // Bed sheet / duvet
    const sheetGeo = new THREE.BoxGeometry(1.14, 0.06, 1.3);
    const sheetMat = createMaterial(colors.bedSheet, { roughness: 0.8 });
    const sheet = new THREE.Mesh(sheetGeo, sheetMat);
    sheet.position.set(0, 0.44, 0.25);
    group.add(sheet);

    // Blanket fold at top
    const blanketGeo = new THREE.BoxGeometry(1.14, 0.04, 0.25);
    const blanketMat = createMaterial(colors.blanket, { roughness: 0.85 });
    const blanket = new THREE.Mesh(blanketGeo, blanketMat);
    blanket.position.set(0, 0.47, -0.35);
    group.add(blanket);

    // Pillow
    const pillowGeo = new THREE.BoxGeometry(0.45, 0.08, 0.3);
    const pillowMat = createMaterial(colors.pillow, { roughness: 0.9 });
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.position.set(-0.15, 0.46, -0.72);
    pillow.rotation.y = 0.05;
    group.add(pillow);

    // Second pillow
    const pillow2 = new THREE.Mesh(pillowGeo, pillowMat);
    pillow2.position.set(0.25, 0.46, -0.72);
    pillow2.rotation.y = -0.08;
    group.add(pillow2);

    // Position on right side of room
    group.position.set(2.8, 0, 0.5);
    group.rotation.y = -Math.PI / 2;
    return group;
}

/* ============================================
   MORDEKAISER FIGURINE (League of Legends)
   Armored dark knight with mace, on shelf
   ============================================ */
function createMordekaiserFigurine() {
    const group = new THREE.Group();
    const armorMat = createMaterial(0x1a1a1a, { metalness: 0.8, roughness: 0.3 });
    const glowMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff44,
        emissiveIntensity: 1.5,
        roughness: 0.2,
        metalness: 0.3,
    });

    // Body (torso)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), armorMat);
    torso.position.y = 0.10;
    group.add(torso);

    // Head / Helmet
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.04), armorMat);
    helmet.position.y = 0.17;
    group.add(helmet);

    // Helmet visor (glowing green)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.005), glowMat);
    visor.position.set(0, 0.17, 0.023);
    group.add(visor);

    // Helmet horns
    [-1, 1].forEach(side => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.04, 4), armorMat);
        horn.position.set(side * 0.025, 0.2, -0.01);
        horn.rotation.z = side * -0.3;
        group.add(horn);
    });

    // Shoulder pads (large, Mordekaiser style)
    [-1, 1].forEach(side => {
        const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.045), armorMat);
        shoulder.position.set(side * 0.045, 0.14, 0);
        group.add(shoulder);

        // Shoulder spike
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.025, 4), armorMat);
        spike.position.set(side * 0.055, 0.16, 0);
        spike.rotation.z = side * -0.5;
        group.add(spike);
    });

    // Arms
    [-1, 1].forEach(side => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.02), armorMat);
        arm.position.set(side * 0.04, 0.06, 0);
        group.add(arm);
    });

    // Legs
    [-1, 1].forEach(side => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.025), armorMat);
        leg.position.set(side * 0.015, 0.01, 0);
        group.add(leg);
    });

    // Mace (Nightfall)
    const maceHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.14, 6), createMaterial(0x444444, { metalness: 0.7 }));
    maceHandle.position.set(0.06, 0.1, 0);
    maceHandle.rotation.z = 0.2;
    group.add(maceHandle);

    const maceHead = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), armorMat);
    maceHead.position.set(0.075, 0.17, 0);
    group.add(maceHead);

    // Glowing green base
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 12), glowMat);
    basePlate.position.y = -0.025;
    group.add(basePlate);

    // Position on desk
    group.position.set(0.5, 0.84, -2.2);
    group.scale.setScalar(1.2);
    return group;
}

/* ============================================
   HOLLOW KNIGHT FIGURINE
   Small masked knight with nail sword
   ============================================ */
function createHollowKnightFigurine() {
    const group = new THREE.Group();
    const bodyMat = createMaterial(0xd0d0d0, { roughness: 0.5, metalness: 0.1 });
    const darkMat = createMaterial(0x1a1a2e, { roughness: 0.6 });
    const cloakMat = createMaterial(0x2a2a3a, { roughness: 0.7 });

    // Body / Cloak (triangular shape)
    const cloakGeo = new THREE.ConeGeometry(0.03, 0.07, 4);
    const cloak = new THREE.Mesh(cloakGeo, cloakMat);
    cloak.position.y = 0.05;
    group.add(cloak);

    // Head (large, round — iconic Hollow Knight shape)
    const headGeo = new THREE.SphereGeometry(0.032, 10, 8);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 0.11;
    head.scale.set(1, 1.1, 0.9);
    group.add(head);

    // Eyes (two dark holes)
    [-1, 1].forEach(side => {
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.008, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x000000 })
        );
        eye.position.set(side * 0.013, 0.112, 0.025);
        group.add(eye);
    });

    // Horns (two upward curving horns — signature look)
    [-1, 1].forEach(side => {
        const hornGeo = new THREE.ConeGeometry(0.005, 0.05, 4);
        const horn = new THREE.Mesh(hornGeo, bodyMat);
        horn.position.set(side * 0.02, 0.145, -0.005);
        horn.rotation.z = side * -0.25;
        horn.rotation.x = -0.1;
        group.add(horn);
    });

    // Nail (sword) — thin and long
    const nailBlade = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.09, 0.003),
        createMaterial(0xaaaaaa, { metalness: 0.6, roughness: 0.3 })
    );
    nailBlade.position.set(0.04, 0.06, 0);
    nailBlade.rotation.z = 0.15;
    group.add(nailBlade);

    // Nail handle
    const nailHandle = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.02, 0.008),
        createMaterial(0x555555, { metalness: 0.5 })
    );
    nailHandle.position.set(0.038, 0.01, 0);
    group.add(nailHandle);

    // Base plate
    const basePlate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.006, 12),
        darkMat
    );
    basePlate.position.y = -0.002;
    group.add(basePlate);

    // Position on bookshelf top
    group.position.set(-3.42, 1.35, -1.2);
    group.scale.setScalar(1.3);
    return group;
}

/* ============================================
   DECORATIONS (mug, plant, LED strip, headphones)
   ============================================ */
function createDecorations() {
    const group = new THREE.Group();

    // Coffee mug on desk
    const mugGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.1, 12);
    const mugMat = createMaterial(colors.mug, { roughness: 0.4 });
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mug.position.set(-1.3, 0.86, -2.2);
    mug.castShadow = true;
    group.add(mug);

    const handleGeo = new THREE.TorusGeometry(0.025, 0.006, 8, 12, Math.PI);
    const handle = new THREE.Mesh(handleGeo, mugMat);
    handle.position.set(-1.26, 0.86, -2.2);
    handle.rotation.z = Math.PI / 2;
    handle.rotation.y = Math.PI / 2;
    group.add(handle);

    // Plant
    const potGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8);
    const pot = new THREE.Mesh(potGeo, createMaterial(colors.plantPot, { roughness: 0.8 }));
    pot.position.set(-1.35, 0.87, -2.5);
    pot.castShadow = true;
    group.add(pot);

    const leafMat = createMaterial(colors.plant, { roughness: 0.8 });
    for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 8, 6), leafMat);
        const angle = (i / 5) * Math.PI * 2;
        leaf.position.set(-1.35 + Math.cos(angle) * 0.04, 0.97 + Math.random() * 0.06, -2.5 + Math.sin(angle) * 0.04);
        group.add(leaf);
    }

    // LED strip behind desk (back wall)
    const ledGeo = new THREE.BoxGeometry(2.2, 0.015, 0.015);
    const ledMat = new THREE.MeshStandardMaterial({ color: colors.led, emissive: colors.led, emissiveIntensity: 2.0, roughness: 0.1 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(-0.5, 0.76, -2.67);
    group.add(led);

    // LED strip ceiling
    const ceilingLedGeo = new THREE.BoxGeometry(6.9, 0.01, 0.01);
    const ceilingLedMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 0.5, roughness: 0.1 });
    const ceilingLed = new THREE.Mesh(ceilingLedGeo, ceilingLedMat);
    ceilingLed.position.set(0, 3.18, -2.72);
    group.add(ceilingLed);

    // Headphones
    const hpBand = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.008, 8, 16, Math.PI),
        createMaterial(0x222222, { metalness: 0.5 })
    );
    hpBand.position.set(-1.05, 0.9, -1.9);
    hpBand.rotation.x = Math.PI;
    group.add(hpBand);

    [-1, 1].forEach(side => {
        const cup = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12),
            createMaterial(0x1a1a1a, { roughness: 0.3 })
        );
        cup.position.set(-1.05 + side * 0.08, 0.82, -1.9);
        cup.rotation.x = Math.PI / 2;
        group.add(cup);
    });

    return group;
}

/* ============================================
   LIGHTING (with references for toggle)
   ============================================ */
function createLighting() {
    const group = new THREE.Group();

    // Ambient
    roomLights.ambient = new THREE.AmbientLight(0x404060, 0.4);
    group.add(roomLights.ambient);

    // Main desk lamp
    roomLights.deskLight = new THREE.PointLight(0xffeedd, 1.2, 6);
    roomLights.deskLight.position.set(-0.5, 2.0, -1.5);
    roomLights.deskLight.castShadow = true;
    roomLights.deskLight.shadow.mapSize.width = 512;
    roomLights.deskLight.shadow.mapSize.height = 512;
    group.add(roomLights.deskLight);

    // Monitor glow
    roomLights.monitorLight = new THREE.PointLight(0x00d4ff, 0.8, 3);
    roomLights.monitorLight.position.set(-0.5, 1.2, -2.0);
    group.add(roomLights.monitorLight);

    // Purple LED accent
    roomLights.ledLight = new THREE.PointLight(0x7b2ff7, 0.6, 5);
    roomLights.ledLight.position.set(-0.5, 0.8, -2.5);
    group.add(roomLights.ledLight);

    // Ceiling light
    roomLights.ceilingLight = new THREE.PointLight(0xeeeeff, 1.5, 8);
    roomLights.ceilingLight.position.set(0, 3.0, -0.5);
    group.add(roomLights.ceilingLight);

    // Ceiling light fixture
    const fixtureMat = createMaterial(0xdddddd, { roughness: 0.4, metalness: 0.3 });
    const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.04, 16), fixtureMat);
    fixture.position.set(0, 3.17, -0.5);
    group.add(fixture);

    // Fill light
    roomLights.fillLight = new THREE.DirectionalLight(0x334466, 0.3);
    roomLights.fillLight.position.set(3, 2, 0);
    group.add(roomLights.fillLight);

    return group;
}

/* ============================================
    FLOOR MAT (under chair)
   ============================================ */
function createFloorMat() {
    const mat = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.2),
        createMaterial(0x15152a, { roughness: 0.95 })
    );
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(-0.5, 0.005, -1.2);
    return mat;
}

/* ============================================
   LIGHT TOGGLE
   ============================================ */
export function toggleLight() {
    lightsOn = !lightsOn;

    if (lightsOn) {
        // Full room light ON
        roomLights.ambient.intensity = 0.4;
        roomLights.deskLight.intensity = 1.2;
        roomLights.ceilingLight.intensity = 1.5;
        roomLights.fillLight.intensity = 0.3;
    } else {
        // Lights OFF — only monitor + LED accent remain
        roomLights.ambient.intensity = 0.08;
        roomLights.deskLight.intensity = 0.1;
        roomLights.ceilingLight.intensity = 0;
        roomLights.fillLight.intensity = 0;
    }
    // Monitor and LED lights always stay the same
    return lightsOn;
}

/* ============================================
   INIT & CONTROLS
   ============================================ */
export function init3DRoom(container) {
    if (isInitialized) return;
    isInitialized = true;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060610);
    scene.fog = new THREE.Fog(0x060610, 5, 12);

    camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 20);
    camera.position.set(0.5, 2.2, 2.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.minPolarAngle = 0.2;
    controls.minDistance = 1.0;
    controls.maxDistance = 6.0;
    controls.target.set(0, 1.2, -1.2);
    controls.enablePan = true;
    controls.panSpeed = 0.5;

    // Build scene
    scene.add(createRoom());
    scene.add(createDesk());
    scene.add(createMonitor());
    scene.add(createSecondMonitor());
    scene.add(createPeripherals());
    scene.add(createChair());
    scene.add(createPosters());
    scene.add(createBookshelf());
    scene.add(createDecorations());
    scene.add(createLighting());
    scene.add(createFloorMat());
    scene.add(createBed());
    scene.add(createMordekaiserFigurine());
    scene.add(createHollowKnightFigurine());

    const onResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

export function dispose3DRoom() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
    }
    if (controls) {
        controls.dispose();
    }
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    isInitialized = false;
}
