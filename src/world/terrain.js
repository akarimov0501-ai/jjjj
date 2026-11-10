import * as THREE from 'three';
import { noiseGen } from '../math/noise.js';
import { generateRockNormalTexture } from '../utils/textureGenerator.js';

export const WORLD_SIZE = 2000;
export const TERRAIN_SEGMENTS = 300; // Yuqori aniqlikdagi to'r
export const WATER_LEVEL = 8.0;

export function getTerrainHeight(x, z) {
  const distFromCenter = Math.sqrt(x * x + z * z);
  const centerDamp = Math.min(1.0, Math.max(0.15, distFromCenter / 300));

  // 1. Asosiy materik shakli
  const baseLand = noiseGen.fbm(x * 0.0008, z * 0.0008, 3, 2.0, 0.5) * 45;

  // 2. Tog' tizmalari (O'tkir qirrali tog'lar)
  const mountainNoise = noiseGen.ridgeNoise(x * 0.0018 + 0.5, z * 0.0018 + 0.5, 4);
  const mountainMask = Math.max(0, noiseGen.fbm(x * 0.001, z * 0.001, 2) * 1.5 - 0.2);
  const mountains = mountainNoise * mountainMask * 115 * centerDamp;

  // 3. Adirlar va to'lqinlar
  const hills = noiseGen.fbm(x * 0.005, z * 0.005, 3, 2.2, 0.45) * 19;

  // 4. Mikrotekstura
  const micro = noiseGen.noise2D(x * 0.03, z * 0.03) * 1.6;

  let height = baseLand + mountains + hills + micro;

  if (x < -300) {
    const oceanFactor = Math.min(1.0, (-300 - x) / 400);
    height = height * (1 - oceanFactor) + (WATER_LEVEL - 12) * oceanFactor;
  }

  return height;
}

export function getBiomeAt(x, z) {
  const h = getTerrainHeight(x, z);
  if (h < WATER_LEVEL + 1.5) {
    return { name: "Moviy Sohil & Okean", color: "#1a73e8", type: "water" };
  } else if (h < WATER_LEVEL + 6) {
    return { name: "Oltin Qirg'oq", color: "#d4b36a", type: "beach" };
  } else if (h < 40) {
    return { name: "Yam-yashil Vodiy", color: "#38ef7d", type: "valley" };
  } else if (h < 75) {
    return { name: "Qoyali Adirlar", color: "#95a5a6", type: "rock" };
  } else {
    return { name: "Qorli Alp Cho'qqisi", color: "#ffffff", type: "snow" };
  }
}

export function createTerrain(scene) {
  const geometry = new THREE.PlaneGeometry(
    WORLD_SIZE,
    WORLD_SIZE,
    TERRAIN_SEGMENTS,
    TERRAIN_SEGMENTS
  );

  geometry.rotateX(-Math.PI / 2);

  const posAttr = geometry.attributes.position;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  // Kengaytirilgan rang palitrasi
  const colDeepWater = new THREE.Color(0x0e2744);
  const colSand = new THREE.Color(0xdfc182);
  const colGrassLight = new THREE.Color(0x4ea83b);
  const colGrassDark = new THREE.Color(0x275a1c);
  const colRock = new THREE.Color(0x56534a);
  const colRockDark = new THREE.Color(0x353430);
  const colSnow = new THREE.Color(0xf6faff);

  for (let i = 0; i < count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const vy = getTerrainHeight(vx, vz);
    posAttr.setY(i, vy);
  }

  geometry.computeVertexNormals();
  const normalAttr = geometry.attributes.normal;
  const tempCol = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const ny = normalAttr.getY(i);

    const isSteep = ny < 0.73;
    const steepFactor = THREE.MathUtils.clamp((0.73 - ny) / 0.24, 0, 1);

    // Mayda shovqinli rang o'zgarishi
    const colorNoise = (noiseGen.noise2D(x * 0.05, z * 0.05) + 1) * 0.5;

    if (y < WATER_LEVEL) {
      tempCol.copy(colDeepWater);
    } else if (y < WATER_LEVEL + 4.5) {
      const alpha = (y - WATER_LEVEL) / 4.5;
      tempCol.copy(colSand).lerp(colGrassLight, alpha * 0.35);
    } else if (y < 42) {
      const alpha = (y - (WATER_LEVEL + 4.5)) / 37.5;
      tempCol.copy(colGrassLight).lerp(colGrassDark, alpha);
      tempCol.lerp(new THREE.Color(0x62b84d), colorNoise * 0.2);
    } else if (y < 78) {
      const alpha = (y - 42) / 36;
      tempCol.copy(colGrassDark).lerp(colRock, alpha);
    } else {
      const alpha = THREE.MathUtils.clamp((y - 78) / 25, 0, 1);
      tempCol.copy(colRock).lerp(colSnow, alpha);
    }

    if (isSteep && y >= WATER_LEVEL) {
      const rCol = y > 82 ? colSnow : colRockDark;
      tempCol.lerp(rCol, steepFactor * 0.88);
    }

    colors[i * 3] = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Ultra-aniqlikdagi Normal Map va PBR Material
  const rockNormalMap = generateRockNormalTexture(512);

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    normalMap: rockNormalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughness: 0.82,
    metalness: 0.08,
    flatShading: false,
  });

  const terrainMesh = new THREE.Mesh(geometry, material);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = false;
  scene.add(terrainMesh);

  return {
    mesh: terrainMesh,
    getHeight: getTerrainHeight,
    getBiome: getBiomeAt
  };
}
