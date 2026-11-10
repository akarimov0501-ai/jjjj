import * as THREE from 'three';
import { WORLD_SIZE } from './terrain.js';

export function createClouds(scene) {
  const group = new THREE.Group();
  const cloudCount = 45;

  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
    transparent: true,
    opacity: 0.88,
  });

  const puffGeo = new THREE.DodecahedronGeometry(1, 1);

  for (let i = 0; i < cloudCount; i++) {
    const cloud = new THREE.Group();
    const puffCount = 5 + Math.floor(Math.random() * 6);
    const cloudScale = 18 + Math.random() * 22;

    for (let j = 0; j < puffCount; j++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 2.2,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 1.8
      );
      const s = 0.8 + Math.random() * 0.7;
      puff.scale.set(s, s * 0.7, s);
      cloud.add(puff);
    }

    cloud.scale.set(cloudScale, cloudScale * 0.6, cloudScale);

    // Dunyo bo'ylab joylashtirish
    cloud.position.set(
      (Math.random() - 0.5) * WORLD_SIZE * 0.9,
      140 + Math.random() * 60,
      (Math.random() - 0.5) * WORLD_SIZE * 0.9
    );

    // Shamol tezligi
    cloud.userData = {
      speedX: 2.5 + Math.random() * 3.5,
      speedZ: (Math.random() - 0.5) * 1.5,
    };

    group.add(cloud);
  }

  scene.add(group);

  function update(delta) {
    const half = WORLD_SIZE * 0.5;
    group.children.forEach(cloud => {
      cloud.position.x += cloud.userData.speedX * delta;
      cloud.position.z += cloud.userData.speedZ * delta;

      // Xaritaning narigi tarafiga qaytarish (Wrap around)
      if (cloud.position.x > half) cloud.position.x = -half;
      if (cloud.position.x < -half) cloud.position.x = half;
      if (cloud.position.z > half) cloud.position.z = -half;
      if (cloud.position.z < -half) cloud.position.z = half;
    });
  }

  return {
    group,
    update
  };
}
