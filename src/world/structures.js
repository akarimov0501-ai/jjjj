import * as THREE from 'three';
import { getTerrainHeight, WATER_LEVEL } from './terrain.js';

export const POI_LOCATIONS = {
  valley: { x: 0, z: 0, name: "Yashil Markaziy Vodiy" },
  mountain: { x: 380, z: 420, name: "Muzli Cho'qqi" },
  'floating-island': { x: -160, z: -180, name: "Suzuvchi Sehrli Orol", y: 155 },
  ruins: { x: 220, z: 180, name: "Qadimiy Runa Minorasi" },
  beach: { x: -460, z: 60, name: "Sohil, Mayoq & Pristan" },
  crystals: { x: 140, z: -260, name: "Sehrli Kristall Kanyoni" }
};

export function createStructures(scene) {
  const animatedObjects = [];

  // ==========================================
  // 1. QADIMIY RUNA MINORALARI VA MONOLIT
  // ==========================================
  const ruinsPos = POI_LOCATIONS.ruins;
  const ruinsY = getTerrainHeight(ruinsPos.x, ruinsPos.z);
  const ruinsGroup = new THREE.Group();
  ruinsGroup.position.set(ruinsPos.x, ruinsY, ruinsPos.z);

  // Poydevor (Doiraviy tosh platforma)
  const daisGeo = new THREE.CylinderGeometry(24, 26, 1.8, 24);
  const daisMat = new THREE.MeshStandardMaterial({ color: 0x423e3b, roughness: 0.9 });
  const dais = new THREE.Mesh(daisGeo, daisMat);
  dais.position.y = 0.9;
  dais.receiveShadow = true;
  ruinsGroup.add(dais);

  // Runa ustunlari
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x5a5550,
    roughness: 0.82,
    metalness: 0.1
  });
  const runeGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const radius = 18;
  const pillarCount = 8;

  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2;
    const px = Math.cos(angle) * radius;
    const pz = Math.sin(angle) * radius;

    // Asosiy ustun
    const pMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 13, 2.4), pillarMat);
    pMesh.position.set(px, 6.5, pz);
    pMesh.rotation.y = -angle;
    pMesh.castShadow = true;
    pMesh.receiveShadow = true;
    ruinsGroup.add(pMesh);

    // Ustundagi neon runa chizig'i
    const rMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 8.0, 2.5), runeGlowMat);
    rMesh.position.set(px, 7.0, pz);
    rMesh.rotation.y = -angle;
    ruinsGroup.add(rMesh);

    // Tepasidagi to'sinlar
    if (i % 2 === 0) {
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 8.8), pillarMat);
      lintel.position.set(px, 13.8, pz);
      lintel.rotation.y = -angle + Math.PI / 2;
      lintel.castShadow = true;
      ruinsGroup.add(lintel);
    }
  }

  // Yiqilgan singan toshlar (Atmosphere detail)
  const fallenStone = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 7.5), pillarMat);
  fallenStone.position.set(6, 1.2, 5);
  fallenStone.rotation.set(0.1, 0.8, 0.05);
  fallenStone.castShadow = true;
  ruinsGroup.add(fallenStone);

  // Havoda muallaq aylanuvchi Kvant Monolit
  const monolithGeo = new THREE.OctahedronGeometry(4.2, 0);
  const monolithMat = new THREE.MeshStandardMaterial({
    color: 0x051a2e,
    emissive: 0x00d4ff,
    emissiveIntensity: 0.85,
    roughness: 0.1,
    metalness: 0.95
  });
  const monolith = new THREE.Mesh(monolithGeo, monolithMat);
  monolith.position.set(0, 9.5, 0);
  ruinsGroup.add(monolith);

  // Monolit atrofida aylanuvchi orbital runa halqasi
  const ringGeo = new THREE.TorusGeometry(6.5, 0.2, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const orbitRing = new THREE.Mesh(ringGeo, ringMat);
  orbitRing.position.set(0, 9.5, 0);
  orbitRing.rotation.x = Math.PI / 3;
  ruinsGroup.add(orbitRing);

  // Osmon sari yo'nalgan vertikal energiya nuri
  const beamGeo = new THREE.CylinderGeometry(0.8, 0.8, 120, 16);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const energyBeam = new THREE.Mesh(beamGeo, beamMat);
  energyBeam.position.set(0, 60, 0);
  ruinsGroup.add(energyBeam);

  const ruinsLight = new THREE.PointLight(0x00f0ff, 4, 50);
  ruinsLight.position.set(0, 9.5, 0);
  ruinsGroup.add(ruinsLight);

  scene.add(ruinsGroup);

  animatedObjects.push({
    update: (time) => {
      monolith.position.y = 9.5 + Math.sin(time * 2.2) * 1.4;
      monolith.rotation.y += 0.015;
      monolith.rotation.x = Math.sin(time) * 0.2;

      orbitRing.position.y = monolith.position.y;
      orbitRing.rotation.z += 0.02;
      orbitRing.rotation.y = time * 0.5;

      ruinsLight.intensity = 3.5 + Math.sin(time * 4) * 1.5;
    }
  });

  // ==========================================
  // 2. SUZUVCHI SEHRLI OROL (SKY ISLAND)
  // ==========================================
  const islandPos = POI_LOCATIONS['floating-island'];
  const islandGroup = new THREE.Group();
  islandGroup.position.set(islandPos.x, islandPos.y - 10, islandPos.z);

  // Pastki tosh qoyasi
  const islandRockGeo = new THREE.ConeGeometry(42, 55, 9);
  islandRockGeo.rotateX(Math.PI);
  const islandRockMat = new THREE.MeshStandardMaterial({
    color: 0x484038,
    roughness: 0.9,
    flatShading: true
  });
  const islandRock = new THREE.Mesh(islandRockGeo, islandRockMat);
  islandRock.position.y = -27;
  islandRock.castShadow = true;
  islandGroup.add(islandRock);

  // Pastga osilib tushgan qalin lianalar / ildizlar
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const vx = Math.cos(angle) * (15 + Math.random() * 10);
    const vz = Math.sin(angle) * (15 + Math.random() * 10);
    const vLen = 20 + Math.random() * 25;
    const vine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.15, vLen, 4),
      new THREE.MeshStandardMaterial({ color: 0x224418, roughness: 0.9 })
    );
    vine.position.set(vx, -vLen / 2 - 5, vz);
    vine.rotation.z = (Math.random() - 0.5) * 0.3;
    islandGroup.add(vine);
  }

  // Tepadagi yam-yashil chim
  const islandTop = new THREE.Mesh(
    new THREE.CylinderGeometry(42, 40, 5, 20),
    new THREE.MeshStandardMaterial({ color: 0x3d8530, roughness: 0.8 })
  );
  islandTop.position.y = 1;
  islandTop.receiveShadow = true;
  islandGroup.add(islandTop);

  // Orol tepasidagi oq marmar saroy pavilyoni
  const pavColMat = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.3, metalness: 0.2 });
  for (let i = 0; i < 6; i++) {
    const pAng = (i / 6) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 12, 8), pavColMat);
    col.position.set(Math.cos(pAng) * 12, 7.5, Math.sin(pAng) * 12);
    col.castShadow = true;
    islandGroup.add(col);
  }
  // Gumbaz
  const domeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(13, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x0077b6, roughness: 0.2, metalness: 0.6 })
  );
  domeMesh.position.y = 13.5;
  islandGroup.add(domeMesh);

  // Sharshara (Orol chetidan pastga otilib tushuvchi suv)
  const wfGeo = new THREE.PlaneGeometry(8, 70, 4, 15);
  const wfMat = new THREE.MeshBasicMaterial({
    color: 0xa0e7e5,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  const waterfall = new THREE.Mesh(wfGeo, wfMat);
  waterfall.position.set(32, -32, 0);
  islandGroup.add(waterfall);

  scene.add(islandGroup);

  animatedObjects.push({
    update: (time) => {
      islandGroup.position.y = (islandPos.y - 10) + Math.sin(time * 0.9) * 3.5;
      islandGroup.rotation.y = Math.sin(time * 0.25) * 0.06;
      waterfall.material.opacity = 0.7 + Math.sin(time * 8) * 0.15;
    }
  });

  // ==========================================
  // 3. SOHIL MAYOG'I VA YOG'OCH PRISTAN (PIER)
  // ==========================================
  const beachPos = POI_LOCATIONS.beach;
  const beachY = getTerrainHeight(beachPos.x, beachPos.z);
  const lighthouseGroup = new THREE.Group();
  lighthouseGroup.position.set(beachPos.x, beachY, beachPos.z);

  // Poydevor
  const lhBase = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 10, 5, 16),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 })
  );
  lhBase.position.y = 2.5;
  lhBase.receiveShadow = true;
  lighthouseGroup.add(lhBase);

  // Mayoq tanasi (Oq-qizil yo'llar)
  const lhBody = new THREE.Mesh(
    new THREE.CylinderGeometry(5.0, 7.5, 38, 16),
    new THREE.MeshStandardMaterial({ color: 0xef233c, roughness: 0.55 })
  );
  lhBody.position.y = 24;
  lhBody.castShadow = true;
  lighthouseGroup.add(lhBody);

  // Oq belbog'
  const stripeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(5.9, 6.7, 12, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  );
  stripeMesh.position.y = 24;
  lighthouseGroup.add(stripeMesh);

  // Balkon (Railing)
  const balcony = new THREE.Mesh(
    new THREE.CylinderGeometry(7.2, 7.2, 1.2, 16),
    new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
  );
  balcony.position.y = 43.5;
  lighthouseGroup.add(balcony);

  // Fonar xonasi
  const lanternRoom = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.2, 8, 12),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      transparent: true,
      opacity: 0.5
    })
  );
  lanternRoom.position.y = 48;
  lighthouseGroup.add(lanternRoom);

  // Mayoq aylanuvchi nuri
  const spotLight = new THREE.SpotLight(0xfff3aa, 12, 450, Math.PI / 5.5, 0.4, 1.1);
  spotLight.position.set(0, 48, 0);
  const spotTarget = new THREE.Object3D();
  lighthouseGroup.add(spotTarget);
  spotLight.target = spotTarget;
  lighthouseGroup.add(spotLight);

  // Nurning 3D konusi (Volumetric Beam)
  const lhBeamGeo = new THREE.ConeGeometry(30, 240, 16);
  lhBeamGeo.rotateX(Math.PI / 2);
  lhBeamGeo.translate(0, 0, 120);
  const lhBeamMat = new THREE.MeshBasicMaterial({
    color: 0xfff0aa,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const beamMesh = new THREE.Mesh(lhBeamGeo, lhBeamMat);
  beamMesh.position.set(0, 48, 0);
  lighthouseGroup.add(beamMesh);

  // Yog'och Pristan (Pier) - Suvga qarab cho'zilgan ko'prik
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 0.9 });
  const pierLength = 65;
  const pierWidth = 6;
  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(pierLength, 0.6, pierWidth), pierMat);
  pierDeck.position.set(-32, WATER_LEVEL - beachY + 1.2, 15);
  pierDeck.receiveShadow = true;
  lighthouseGroup.add(pierDeck);

  // Pristanning suvga botgan ustunlari (Piles)
  for (let px = -5; px > -pierLength; px -= 12) {
    [-pierWidth / 2 + 0.6, pierWidth / 2 - 0.6].forEach(pz => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), pierMat);
      post.position.set(px, WATER_LEVEL - beachY - 1.5, 15 + pz);
      lighthouseGroup.add(post);
    });
  }

  scene.add(lighthouseGroup);

  animatedObjects.push({
    update: (time) => {
      const beamAngle = time * 1.4;
      spotTarget.position.set(Math.cos(beamAngle) * 180, 46, Math.sin(beamAngle) * 180);
      beamMesh.rotation.y = -beamAngle + Math.PI / 2;
    }
  });

  // ==========================================
  // 4. SEHRLI KRISTALL KANYONI (CRYSTAL CLUSTERS)
  // ==========================================
  const crystalPos = POI_LOCATIONS.crystals;
  const crystalY = getTerrainHeight(crystalPos.x, crystalPos.z);
  const crystalGroup = new THREE.Group();
  crystalGroup.position.set(crystalPos.x, crystalY, crystalPos.z);

  const crystalHues = [0x00f0ff, 0xff0077, 0x8b00ff, 0x00ff88, 0xffb703];
  const crystalMeshes = [];

  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 6 + Math.random() * 40;
    const cx = Math.cos(angle) * dist;
    const cz = Math.sin(angle) * dist;
    const cHeight = 5 + Math.random() * 9;
    const cWidth = 1.3 + Math.random() * 1.5;

    const col = crystalHues[i % crystalHues.length];
    const cMat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.75,
      roughness: 0.08,
      metalness: 0.9
    });

    const cGeo = new THREE.ConeGeometry(1.6, 4.5, 6);
    const cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.position.set(cx, cHeight / 2, cz);
    cMesh.scale.set(cWidth, cHeight / 4.5, cWidth);
    cMesh.rotation.set((Math.random() - 0.5) * 0.45, Math.random() * Math.PI, (Math.random() - 0.5) * 0.45);
    cMesh.castShadow = true;
    crystalGroup.add(cMesh);
    crystalMeshes.push(cMesh);
  }

  const crystalLight = new THREE.PointLight(0x8b00ff, 5, 75);
  crystalLight.position.set(0, 10, 0);
  crystalGroup.add(crystalLight);

  scene.add(crystalGroup);

  animatedObjects.push({
    update: (time) => {
      const pulse = 0.5 + Math.sin(time * 3.2) * 0.35;
      crystalLight.intensity = 4 + pulse * 3;
      crystalMeshes.forEach((c, idx) => {
        c.material.emissiveIntensity = 0.55 + Math.sin(time * 2.8 + idx) * 0.35;
      });
    }
  });

  // ==========================================
  // 5. O'RMON QISHLOG'I VA GULXAN (FOREST CABIN & BONFIRE)
  // ==========================================
  const campPos = { x: -75, z: 85 };
  const campY = getTerrainHeight(campPos.x, campPos.z);
  const campGroup = new THREE.Group();
  campGroup.position.set(campPos.x, campY, campPos.z);

  // Yog'och uycha (Log Cabin)
  const cabinWalls = new THREE.Mesh(
    new THREE.BoxGeometry(10, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.85 })
  );
  cabinWalls.position.set(0, 3, 0);
  cabinWalls.castShadow = true;
  cabinWalls.receiveShadow = true;
  campGroup.add(cabinWalls);

  // Tom (Pitched Roof)
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(9.2, 4.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x2e1f14, roughness: 0.9 })
  );
  roof.position.set(0, 8.2, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.1, 1.0, 0.9);
  roof.castShadow = true;
  campGroup.add(roof);

  // Eshik va Yorug' deraza
  const windowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  windowMesh.position.set(0, 3.5, 4.05);
  campGroup.add(windowMesh);

  // Gulxan (Bonfire)
  const fireGroup = new THREE.Group();
  fireGroup.position.set(12, 0, 4);

  // Gulxan toshlari
  const ringStoneMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
  for (let i = 0; i < 8; i++) {
    const sAng = (i / 8) * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), ringStoneMat);
    st.position.set(Math.cos(sAng) * 2.2, 0.3, Math.sin(sAng) * 2.2);
    fireGroup.add(st);
  }

  // Olov konusi
  const flameMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 2.4, 7),
    new THREE.MeshBasicMaterial({ color: 0xff5500 })
  );
  flameMesh.position.y = 1.2;
  fireGroup.add(flameMesh);

  const flameLight = new THREE.PointLight(0xff7700, 4, 30);
  flameLight.position.y = 1.6;
  fireGroup.add(flameLight);

  campGroup.add(fireGroup);
  scene.add(campGroup);

  animatedObjects.push({
    update: (time) => {
      // Olov tebranishi
      const flicker = Math.sin(time * 15) * 0.15 + Math.cos(time * 22) * 0.1;
      flameMesh.scale.set(1 + flicker, 1 + flicker * 1.5, 1 + flicker);
      flameLight.intensity = 3.5 + flicker * 2;
    }
  });

  return {
    update: (time) => {
      animatedObjects.forEach(obj => obj.update(time));
    }
  };
}
