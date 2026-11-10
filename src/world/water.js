import * as THREE from 'three';
import { WATER_LEVEL, WORLD_SIZE } from './terrain.js';
import { generateWaterNormalTexture } from '../utils/textureGenerator.js';

export function createWater(scene) {
  const waterGeo = new THREE.PlaneGeometry(WORLD_SIZE * 1.25, WORLD_SIZE * 1.25, 90, 90);
  waterGeo.rotateX(-Math.PI / 2);

  const waterNormalMap = generateWaterNormalTexture(512);

  // Ultra-realistik Physical Material
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f5e8a,
    roughness: 0.08,
    metalness: 0.15,
    transmission: 0.68,
    ior: 1.333,
    transparent: true,
    opacity: 0.88,
    reflectivity: 0.95,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    normalMap: waterNormalMap,
    normalScale: new THREE.Vector2(0.6, 0.6),
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = WATER_LEVEL;
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  const pos = waterGeo.attributes.position;
  const initialY = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    initialY[i] = pos.getY(i);
  }

  function update(time) {
    // Normal mapni oqim yo'nalishi bo'ylab siljitish
    waterNormalMap.offset.x = (time * 0.04) % 1;
    waterNormalMap.offset.y = (time * 0.03) % 1;

    // To'lqinlar geometriyasi
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getZ(i);
      const wave = Math.sin(u * 0.04 + time * 2.0) * 0.38 +
                   Math.cos(v * 0.035 + time * 1.6) * 0.35 +
                   Math.sin((u + v) * 0.02 + time * 2.4) * 0.22;
      pos.setY(i, initialY[i] + wave);
    }
    pos.needsUpdate = true;
    waterGeo.computeVertexNormals();
  }

  return {
    mesh: waterMesh,
    update
  };
}
