import * as THREE from 'three';

export function createSky(scene) {
  // 1. Tuman (Fog)
  const fog = new THREE.FogExp2(0xa3ccf5, 0.0013);
  scene.fog = fog;

  // 2. Yulduzlar va Somon Yo'li galaktikasi
  const starGeo = new THREE.BufferGeometry();
  const starCount = 4500;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 950;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = Math.abs(r * Math.cos(phi)) + 30;
    const z = r * Math.sin(phi) * Math.sin(theta);

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;

    // Moviy, binafsha va oltin yulduzlar
    const isSpecial = Math.random() < 0.2;
    starColors[i * 3] = isSpecial ? 0.4 : 0.95;
    starColors[i * 3 + 1] = isSpecial ? 0.7 : 0.95;
    starColors[i * 3 + 2] = isSpecial ? 1.0 : 0.95;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 2.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });

  const starField = new THREE.Points(starGeo, starMat);
  scene.add(starField);

  // 3. Quyosh va Yorqin Korona nurlari
  const sunGroup = new THREE.Group();
  const sunCoreGeo = new THREE.SphereGeometry(24, 20, 20);
  const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfffdf0 });
  const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
  sunGroup.add(sunCore);

  // Quyosh tashqi neonly jilosi (Corona flare)
  const coronaGeo = new THREE.PlaneGeometry(160, 160);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xffd277,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
  sunGroup.add(coronaMesh);
  scene.add(sunGroup);

  // 4. Oy
  const moonGroup = new THREE.Group();
  const moonGeo = new THREE.SphereGeometry(16, 20, 20);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xd8e6f7 });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonMesh);

  // Oy nuri jilosi
  const moonHaloGeo = new THREE.PlaneGeometry(100, 100);
  const moonHaloMat = new THREE.MeshBasicMaterial({
    color: 0x88bbff,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const moonHalo = new THREE.Mesh(moonHaloGeo, moonHaloMat);
  moonGroup.add(moonHalo);
  scene.add(moonGroup);

  // 5. Yorug'lik (Ultra-High Resolution Shadow Map)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  hemiLight.position.set(0, 350, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfff8eb, 1.6);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 4096; // 4K Soya xaritasi
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 1400;

  const d = 360;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0003;
  scene.add(dirLight);

  // 6. Osmon gumbazi
  const skyGeo = new THREE.SphereGeometry(1000, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x6ca6e8,
    side: THREE.BackSide,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);

  // 7. Atmosfera chang zarrachalari (Sun Dust / Pollen Motes)
  const dustCount = 800;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 300;
    dustPos[i * 3 + 1] = Math.random() * 80 + 5;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 300;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xfff0aa,
    size: 1.8,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);

  let currentHour = 14.0;

  function setTime(hour) {
    currentHour = hour % 24;
    if (currentHour < 0) currentHour += 24;

    const angle = ((currentHour - 6) / 24) * Math.PI * 2;
    const distance = 850;

    const sunX = Math.cos(angle) * distance;
    const sunY = Math.sin(angle) * distance;
    const sunZ = Math.sin(angle * 0.4) * 250;

    sunGroup.position.set(sunX, sunY, sunZ);
    moonGroup.position.set(-sunX, -sunY, -sunZ);

    const sunElevation = sunY / distance;
    const isDay = sunY > 0;

    if (isDay) {
      dirLight.position.set(sunX, sunY, sunZ);

      if (sunElevation < 0.28) {
        // Oltin tong / olovli shafaq
        const t = Math.max(0, sunElevation / 0.28);
        skyMat.color.setRGB(0.96 * (1 - t) + 0.42 * t, 0.45 * (1 - t) + 0.65 * t, 0.28 * (1 - t) + 0.91 * t);
        fog.color.copy(skyMat.color);
        dirLight.color.setRGB(1.0, 0.68, 0.42);
        dirLight.intensity = 1.2 + t * 0.6;
        hemiLight.intensity = 0.5 + t * 0.3;
      } else {
        // Tiniq moviy peshin
        skyMat.color.setRGB(0.42, 0.68, 0.96);
        fog.color.setRGB(0.56, 0.77, 0.96);
        dirLight.color.setRGB(1.0, 0.98, 0.94);
        dirLight.intensity = 1.7;
        hemiLight.intensity = 0.8;
      }

      starMat.opacity = Math.max(0, 1 - sunElevation * 7);
      dustMat.opacity = Math.min(0.65, sunElevation * 1.5);
    } else {
      // Tungi samoviy osmon
      const moonElevation = -sunElevation;
      dirLight.position.set(-sunX, -sunY, -sunZ);

      skyMat.color.setRGB(0.015, 0.03, 0.08);
      fog.color.setRGB(0.03, 0.05, 0.12);
      dirLight.color.setRGB(0.45, 0.65, 0.95);
      dirLight.intensity = 0.4;
      hemiLight.intensity = 0.22;

      starMat.opacity = Math.min(1.0, moonElevation * 2.8);
      dustMat.opacity = 0.1;
    }

    scene.background = skyMat.color;
  }

  setTime(14);

  return {
    setTime,
    getTime: () => currentHour,
    dirLight,
    update: (delta, timeSpeed = 0, playerPos = null, camera = null) => {
      if (timeSpeed !== 0) {
        setTime(currentHour + delta * timeSpeed);
      }
      starField.rotation.y += delta * 0.006;

      // Korona doimo kameraga qaraydi
      if (camera) {
        coronaMesh.quaternion.copy(camera.quaternion);
        moonHalo.quaternion.copy(camera.quaternion);
      }

      // Soya kamerasi o'yinchini kuzatib yuradi (aniq soyalar uchun)
      if (playerPos) {
        dirLight.target.position.set(playerPos.x, playerPos.y, playerPos.z);
        scene.add(dirLight.target);
        dustPoints.position.set(playerPos.x, 0, playerPos.z);
      }
    }
  };
}
