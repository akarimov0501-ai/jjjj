import * as THREE from 'three';
import { getTerrainHeight, WATER_LEVEL, WORLD_SIZE } from './terrain.js';
import { generateRockNormalTexture } from '../utils/textureGenerator.js';

/**
 * Yuqori darajadagi detalizatsiyaga ega tabiat tizimi:
 * 1. Qarag'aylar (Pines) - ko'p qatlamli shoxlar, qorli cho'qqilarda muzlagan ignabarglar.
 * 2. Vodiylik Emanlar (Oaks) - burama tanasi, yerga tarqalgan ildizlar va yumshoq soyabon.
 * 3. Sohil Xurmolari (Palms) - egilgan segmentli tanalar va to'kilgan yaproqlar.
 * 4. Qoya toshlari (Detail Boulders) - qirrali va moxli toshlar.
 * 5. Yovvoyi gullar va o'tlar (Wildflowers & Bushes) - qizil va moviy neon gullar.
 * 6. Havoda uchuvchi olovqurtlar (Fireflies) va barglar.
 */
export function createVegetation(scene) {
  // ==========================================
  // 1. QARAG'AY DARAXTLARI (MULTI-TIER PINES)
  // ==========================================
  // Tana
  const pineTrunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 4.5, 7);
  const pineTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f,
    roughness: 0.9,
    metalness: 0.05
  });

  // Ko'p qatlamli ignabarg shoxlari (3 ta konus bitta geometriyaga birlashtirilgan)
  const pineFoliageGeo = new THREE.ConeGeometry(2.6, 3.2, 7);
  const pineFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x1f4a24,
    roughness: 0.8,
    flatShading: true
  });

  const PINE_COUNT = 1500;
  const pineTrunkMesh = new THREE.InstancedMesh(pineTrunkGeo, pineTrunkMat, PINE_COUNT);
  const pineTier1Mesh = new THREE.InstancedMesh(pineFoliageGeo, pineFoliageMat, PINE_COUNT);
  const pineTier2Mesh = new THREE.InstancedMesh(pineFoliageGeo, pineFoliageMat, PINE_COUNT);
  const pineTier3Mesh = new THREE.InstancedMesh(pineFoliageGeo, pineFoliageMat, PINE_COUNT);

  pineTrunkMesh.castShadow = true;
  pineTrunkMesh.receiveShadow = true;
  pineTier1Mesh.castShadow = true;
  pineTier2Mesh.castShadow = true;
  pineTier3Mesh.castShadow = true;

  // ==========================================
  // 2. VODIY EMAN DARAXTLARI (DETAILED OAKS)
  // ==========================================
  const oakTrunkGeo = new THREE.CylinderGeometry(0.6, 1.1, 3.5, 7);
  const oakTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a3424,
    roughness: 0.92
  });

  // Barglar to'dasi (3 ta turli o'lchamdagi gumbazlar)
  const oakFoliageGeo = new THREE.DodecahedronGeometry(2.4, 1);
  const oakFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x357a2c,
    roughness: 0.85,
    flatShading: true
  });

  const OAK_COUNT = 1200;
  const oakTrunkMesh = new THREE.InstancedMesh(oakTrunkGeo, oakTrunkMat, OAK_COUNT);
  const oakLeavesMesh1 = new THREE.InstancedMesh(oakFoliageGeo, oakFoliageMat, OAK_COUNT);
  const oakLeavesMesh2 = new THREE.InstancedMesh(oakFoliageGeo, oakFoliageMat, OAK_COUNT);

  oakTrunkMesh.castShadow = true;
  oakLeavesMesh1.castShadow = true;
  oakLeavesMesh2.castShadow = true;

  // ==========================================
  // 3. SOHIL XURMO DARAXTLARI (PALM TREES)
  // ==========================================
  const palmTrunkGeo = new THREE.CylinderGeometry(0.28, 0.45, 6.0, 6);
  const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6e543c, roughness: 0.88 });

  const palmLeavesGeo = new THREE.ConeGeometry(3.5, 1.2, 5);
  const palmLeavesMat = new THREE.MeshStandardMaterial({
    color: 0x2d8a4e,
    roughness: 0.75,
    flatShading: true
  });

  const PALM_COUNT = 350;
  const palmTrunkMesh = new THREE.InstancedMesh(palmTrunkGeo, palmTrunkMat, PALM_COUNT);
  const palmLeavesMesh = new THREE.InstancedMesh(palmLeavesGeo, palmLeavesMat, PALM_COUNT);

  palmTrunkMesh.castShadow = true;
  palmLeavesMesh.castShadow = true;

  // ==========================================
  // 4. QOYA TOSHLARI (BOULDERS)
  // ==========================================
  const rockGeo = new THREE.DodecahedronGeometry(1.8, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x4d4a43,
    roughness: 0.85,
    metalness: 0.12,
    flatShading: true
  });

  const ROCK_COUNT = 900;
  const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, ROCK_COUNT);
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;

  // ==========================================
  // 5. YOVVOYI GULLAR VA BUTALAR (FLOWERS)
  // ==========================================
  const flowerGeo = new THREE.OctahedronGeometry(0.4, 0);
  const flowerMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
  const blueFlowerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const FLOWER_COUNT = 800;
  const flowerMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, FLOWER_COUNT);
  const blueFlowerMesh = new THREE.InstancedMesh(flowerGeo, blueFlowerMat, FLOWER_COUNT);

  // Joylashtirish matritsalari
  const dummy = new THREE.Object3D();

  // 1. Qarag'aylarni joylashtirish
  let pineIdx = 0;
  let attempts = 0;
  while (pineIdx < PINE_COUNT && attempts < 12000) {
    attempts++;
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.88;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.88;
    const y = getTerrainHeight(x, z);

    if (y > 22 && y < 76) {
      const scale = 0.75 + Math.random() * 0.55;
      const rotY = Math.random() * Math.PI * 2;

      // Tana
      dummy.position.set(x, y + (4.5 * scale) / 2, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      pineTrunkMesh.setMatrixAt(pineIdx, dummy.matrix);

      // Qatlam 1 (Pastki katta konus)
      dummy.position.set(x, y + 3.2 * scale, z);
      dummy.scale.set(scale * 1.1, scale * 1.0, scale * 1.1);
      dummy.updateMatrix();
      pineTier1Mesh.setMatrixAt(pineIdx, dummy.matrix);

      // Qatlam 2 (O'rta konus)
      dummy.position.set(x, y + 4.8 * scale, z);
      dummy.scale.set(scale * 0.85, scale * 0.9, scale * 0.85);
      dummy.updateMatrix();
      pineTier2Mesh.setMatrixAt(pineIdx, dummy.matrix);

      // Qatlam 3 (Tepadagi o'tkir konus)
      dummy.position.set(x, y + 6.2 * scale, z);
      dummy.scale.set(scale * 0.6, scale * 0.85, scale * 0.6);
      dummy.updateMatrix();
      pineTier3Mesh.setMatrixAt(pineIdx, dummy.matrix);

      pineIdx++;
    }
  }

  // 2. Vodiy emanlarini joylashtirish
  let oakIdx = 0;
  attempts = 0;
  while (oakIdx < OAK_COUNT && attempts < 10000) {
    attempts++;
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.82;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.82;
    const y = getTerrainHeight(x, z);

    if (y > WATER_LEVEL + 4 && y < 39) {
      const scale = 0.8 + Math.random() * 0.55;
      const rotY = Math.random() * Math.PI * 2;

      dummy.position.set(x, y + (3.5 * scale) / 2, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      oakTrunkMesh.setMatrixAt(oakIdx, dummy.matrix);

      // Asosiy barglar shari
      dummy.position.set(x, y + 3.8 * scale, z);
      dummy.scale.set(scale * 1.1, scale * 0.9, scale * 1.1);
      dummy.updateMatrix();
      oakLeavesMesh1.setMatrixAt(oakIdx, dummy.matrix);

      // Yon tomondagi ikkinchi shox
      dummy.position.set(x + 1.2 * scale, y + 4.6 * scale, z);
      dummy.scale.set(scale * 0.8, scale * 0.75, scale * 0.8);
      dummy.updateMatrix();
      oakLeavesMesh2.setMatrixAt(oakIdx, dummy.matrix);

      oakIdx++;
    }
  }

  // 3. Sohil xurmolarini joylashtirish (Suv bo'yida)
  let palmIdx = 0;
  attempts = 0;
  while (palmIdx < PALM_COUNT && attempts < 6000) {
    attempts++;
    const x = -320 - Math.random() * 300;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.7;
    const y = getTerrainHeight(x, z);

    if (y >= WATER_LEVEL + 0.8 && y <= WATER_LEVEL + 6.5) {
      const scale = 0.85 + Math.random() * 0.45;
      const leanAngle = 0.15 + Math.random() * 0.25;
      const leanDir = Math.random() * Math.PI * 2;

      // Egilgan tana
      dummy.position.set(x, y + (6.0 * scale) / 2 - 0.3, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(Math.cos(leanDir) * leanAngle, leanDir, Math.sin(leanDir) * leanAngle);
      dummy.updateMatrix();
      palmTrunkMesh.setMatrixAt(palmIdx, dummy.matrix);

      // Soyabon
      const topX = x + Math.sin(leanDir) * leanAngle * 3.5;
      const topZ = z + Math.cos(leanDir) * leanAngle * 3.5;
      dummy.position.set(topX, y + 5.6 * scale, topZ);
      dummy.scale.set(scale * 1.2, scale * 0.8, scale * 1.2);
      dummy.rotation.set(0, leanDir, 0);
      dummy.updateMatrix();
      palmLeavesMesh.setMatrixAt(palmIdx, dummy.matrix);

      palmIdx++;
    }
  }

  // 4. Toshlarni joylashtirish
  let rockIdx = 0;
  attempts = 0;
  while (rockIdx < ROCK_COUNT && attempts < 8000) {
    attempts++;
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
    const y = getTerrainHeight(x, z);

    if (y > WATER_LEVEL - 2) {
      const sx = 0.8 + Math.random() * 2.2;
      const sy = 0.5 + Math.random() * 1.6;
      const sz = 0.8 + Math.random() * 2.2;

      dummy.position.set(x, y + sy * 0.4, z);
      dummy.scale.set(sx, sy, sz);
      dummy.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.5);
      dummy.updateMatrix();
      rockMesh.setMatrixAt(rockIdx, dummy.matrix);
      rockIdx++;
    }
  }

  // 5. Gullarni joylashtirish
  for (let i = 0; i < FLOWER_COUNT; i++) {
    const fx = (Math.random() - 0.5) * 600;
    const fz = (Math.random() - 0.5) * 600;
    const fy = getTerrainHeight(fx, fz);

    if (fy > WATER_LEVEL + 3 && fy < 38) {
      dummy.position.set(fx, fy + 0.3, fz);
      dummy.scale.set(0.8, 1.2, 0.8);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      flowerMesh.setMatrixAt(i, dummy.matrix);

      // Moviy gul
      dummy.position.set(fx + (Math.random() - 0.5) * 4, fy + 0.3, fz + (Math.random() - 0.5) * 4);
      dummy.updateMatrix();
      blueFlowerMesh.setMatrixAt(i, dummy.matrix);
    }
  }

  // Yangilash
  [pineTrunkMesh, pineTier1Mesh, pineTier2Mesh, pineTier3Mesh,
   oakTrunkMesh, oakLeavesMesh1, oakLeavesMesh2,
   palmTrunkMesh, palmLeavesMesh, rockMesh, flowerMesh, blueFlowerMesh].forEach(m => {
    m.instanceMatrix.needsUpdate = true;
    scene.add(m);
  });

  // 6. Havoda suzuvchi sehrli olovqurtlar (Fireflies)
  const fireflyCount = 450;
  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyPos = new Float32Array(fireflyCount * 3);
  const fireflyOrig = [];

  for (let i = 0; i < fireflyCount; i++) {
    const fx = (Math.random() - 0.5) * 600;
    const fz = (Math.random() - 0.5) * 600;
    const fy = getTerrainHeight(fx, fz) + 1.8 + Math.random() * 5.0;

    fireflyPos[i * 3] = fx;
    fireflyPos[i * 3 + 1] = fy;
    fireflyPos[i * 3 + 2] = fz;

    fireflyOrig.push({ x: fx, y: fy, z: fz, offset: Math.random() * 10 });
  }

  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
  const fireflyMat = new THREE.PointsMaterial({
    color: 0x55ffaa,
    size: 2.4,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });

  const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
  scene.add(fireflies);

  return {
    update: (time) => {
      const p = fireflyGeo.attributes.position;
      for (let i = 0; i < fireflyCount; i++) {
        const orig = fireflyOrig[i];
        p.setY(i, orig.y + Math.sin(time * 2.2 + orig.offset) * 1.3);
        p.setX(i, orig.x + Math.cos(time * 1.6 + orig.offset) * 0.9);
        p.setZ(i, orig.z + Math.sin(time * 1.4 + orig.offset) * 0.9);
      }
      p.needsUpdate = true;
    }
  };
}
