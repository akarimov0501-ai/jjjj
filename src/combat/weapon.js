import * as THREE from 'three';

export const WEAPON_TYPES = [
  {
    id: 'blaster',
    name: 'Plazma Avtomat',
    damage: 32,
    fireRate: 0.13,
    magSize: 32,
    reloadTime: 1.6,
    color: 0x00f0ff,
    bulletSpeed: 220,
    icon: '⚡'
  },
  {
    id: 'railgun',
    name: 'Kvant Reylgan',
    damage: 140,
    fireRate: 0.88,
    magSize: 6,
    reloadTime: 2.2,
    color: 0xbf00ff,
    bulletSpeed: 360,
    icon: '🎯'
  },
  {
    id: 'shotgun',
    name: 'Tarqoq Shotgun',
    damage: 24,
    pellets: 6,
    fireRate: 0.65,
    magSize: 8,
    reloadTime: 2.0,
    color: 0xffaa00,
    bulletSpeed: 170,
    icon: '💥'
  }
];

export class WeaponSystem {
  constructor(camera, projectileManager, soundManager) {
    this.camera = camera;
    this.projectileManager = projectileManager;
    this.soundManager = soundManager;

    this.currentWeaponIndex = 0;
    this.ammo = {};
    WEAPON_TYPES.forEach(w => {
      this.ammo[w.id] = { current: w.magSize, reserve: w.magSize * 4 };
    });

    this.isReloading = false;
    this.lastFireTime = 0;
    this.isAiming = false;
    this.isInspecting = false;
    this.inspectTimer = 0;

    // Qurol ildizi (Holder)
    this.weaponRoot = new THREE.Group();
    this.camera.add(this.weaponRoot);

    this.defaultPos = new THREE.Vector3(0.28, -0.24, -0.52);
    this.aimPos = new THREE.Vector3(0.0, -0.17, -0.42);
    this.weaponRoot.position.copy(this.defaultPos);

    // Muzzle Flash
    this.muzzleLight = new THREE.PointLight(0x00f0ff, 0, 12);
    this.muzzleLight.position.set(0, 0.05, -0.75);
    this.weaponRoot.add(this.muzzleLight);

    this.weaponMeshes = [];
    this.animatedWeaponElements = [];

    this.createWeaponModels();

    this.recoilOffset = 0;
    this.recoilRot = 0;
    this.bobTimer = 0;

    this.selectWeapon(0);

    // [I] tugmasi bilan qurolni ko'zdan kechirish (Inspect)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyI' && !this.isReloading && !this.isAiming) {
        this.isInspecting = true;
        this.inspectTimer = 0;
      }
    });
  }

  // Qurol ustidagi raqamli OLED ammo displeyini yaratish
  createAmmoDisplay() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);

    const updateDisplay = (current, max) => {
      ctx.fillStyle = '#050a12';
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 124, 60);

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 36px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${current}`, 64, 46);
      texture.needsUpdate = true;
    };

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.04),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );

    return { mesh: plane, update: updateDisplay };
  }

  createWeaponModels() {
    // ==========================================
    // 1. PLAZMA AVTOMAT (BLASTER)
    // ==========================================
    const blaster = new THREE.Group();
    const gunMetalMat = new THREE.MeshStandardMaterial({
      color: 0x18202c,
      metalness: 0.88,
      roughness: 0.18
    });
    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x0c1017,
      roughness: 0.7
    });
    const cyanGlowMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00c8e6,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });

    // Korpus
    const bChassis = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.46), gunMetalMat);
    const bTopRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.4), carbonMat);
    bTopRail.position.set(0, 0.07, 0);

    // Stvol va Sovutgich quvurlari
    const bBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.36, 12), cyanGlowMat);
    bBarrel.rotateX(Math.PI / 2);
    bBarrel.position.set(0, 0.03, -0.32);

    // Yon tomonidagi sovutish ventilyatsiyalari
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.04, 0.18), cyanGlowMat);
    ventL.position.set(0.045, 0.02, -0.12);
    const ventR = ventL.clone();
    ventR.position.x = -0.045;

    // Tutqich (Grip)
    const bGrip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.16, 0.08), carbonMat);
    bGrip.position.set(0, -0.11, 0.1);
    bGrip.rotation.x = -0.28;

    // Raqamli OLED ekran
    const ammoDisp = this.createAmmoDisplay();
    ammoDisp.mesh.position.set(0, 0.09, -0.05);
    ammoDisp.mesh.rotation.x = -Math.PI / 3.5;

    blaster.add(bChassis, bTopRail, bBarrel, ventL, ventR, bGrip, ammoDisp.mesh);
    this.weaponRoot.add(blaster);
    this.weaponMeshes.push(blaster);
    this.blasterAmmoDisplay = ammoDisp;

    // ==========================================
    // 2. KVANT REYLGAN (RAILGUN)
    // ==========================================
    const railgun = new THREE.Group();
    const purpleGlowMat = new THREE.MeshStandardMaterial({
      color: 0xbf00ff,
      emissive: 0x9900cc,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });

    const rChassis = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.68), gunMetalMat);

    // Ikkita magnit relslar
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.025, 0.52), purpleGlowMat);
    railTop.position.set(0.028, 0.04, -0.38);
    const railBot = railTop.clone();
    railBot.position.x = -0.028;

    // Snayper optikasi (Scope)
    const scopeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 12);
    scopeGeo.rotateX(Math.PI / 2);
    const scopeMesh = new THREE.Mesh(scopeGeo, carbonMat);
    scopeMesh.position.set(0, 0.1, -0.06);

    const lensMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.032, 16),
      new THREE.MeshBasicMaterial({ color: 0xbf00ff, side: THREE.DoubleSide })
    );
    lensMesh.position.set(0, 0.1, 0.05);

    // Batareya moduli
    const battery = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.12), purpleGlowMat);
    battery.position.set(0, -0.08, 0.05);

    railgun.add(rChassis, railTop, railBot, scopeMesh, lensMesh, battery);
    this.weaponRoot.add(railgun);
    this.weaponMeshes.push(railgun);

    // ==========================================
    // 3. TARQOQ SHOTGUN (SCATTER BLASTER)
    // ==========================================
    const shotgun = new THREE.Group();
    const orangeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xcc7700,
      emissiveIntensity: 0.8
    });

    const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.54), carbonMat);

    // Ikkitalik stvol (Double Barrel)
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.42, 10), gunMetalMat);
    b1.rotateX(Math.PI / 2);
    b1.position.set(0.035, 0.03, -0.32);

    const b2 = b1.clone();
    b2.position.x = -0.035;

    // Qayta o'qlovchi harakatlanuvchi pompa (Pump Action)
    const pumpMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 10), orangeGlowMat);
    pumpMesh.rotateX(Math.PI / 2);
    pumpMesh.position.set(0, -0.04, -0.22);
    this.shotgunPump = pumpMesh;

    shotgun.add(sBody, b1, b2, pumpMesh);
    this.weaponRoot.add(shotgun);
    this.weaponMeshes.push(shotgun);
  }

  selectWeapon(index) {
    if (index < 0 || index >= WEAPON_TYPES.length) return;
    this.currentWeaponIndex = index;
    this.weaponMeshes.forEach((mesh, idx) => {
      mesh.visible = idx === index;
    });

    const currentW = this.getCurrentWeapon();
    this.muzzleLight.color.setHex(currentW.color);
    this.isReloading = false;
    this.isInspecting = false;
  }

  getCurrentWeapon() {
    return WEAPON_TYPES[this.currentWeaponIndex];
  }

  shoot() {
    if (this.isReloading) return false;

    const now = performance.now() / 1000;
    const w = this.getCurrentWeapon();
    const ammoData = this.ammo[w.id];

    if (now - this.lastFireTime < w.fireRate) return false;
    if (ammoData.current <= 0) {
      this.reload();
      return false;
    }

    this.lastFireTime = now;
    ammoData.current--;

    // Recoil
    this.recoilOffset = w.id === 'railgun' ? 0.14 : w.id === 'shotgun' ? 0.12 : 0.07;
    this.recoilRot = w.id === 'railgun' ? 0.2 : 0.11;

    // Pompa orqaga tortilishi
    if (this.shotgunPump && w.id === 'shotgun') {
      this.shotgunPump.position.z = -0.15;
      setTimeout(() => { if (this.shotgunPump) this.shotgunPump.position.z = -0.22; }, 220);
    }

    // Muzzle Flash
    this.muzzleLight.intensity = 6;
    setTimeout(() => { this.muzzleLight.intensity = 0; }, 45);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const origin = this.camera.position.clone().addScaledVector(forward, 0.55);

    if (w.id === 'shotgun') {
      this.soundManager.playShotgunShoot();
      for (let i = 0; i < (w.pellets || 6); i++) {
        const spreadDir = forward.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.13,
          (Math.random() - 0.5) * 0.13,
          (Math.random() - 0.5) * 0.13
        )).normalize();
        this.projectileManager.spawnPlayerBullet(origin, spreadDir, w.bulletSpeed, w.damage, w.color);
      }
    } else if (w.id === 'railgun') {
      this.soundManager.playRailgunShoot();
      this.projectileManager.spawnPlayerBullet(origin, forward, w.bulletSpeed, w.damage, w.color);
    } else {
      this.soundManager.playBlasterShoot();
      this.projectileManager.spawnPlayerBullet(origin, forward, w.bulletSpeed, w.damage, w.color);
    }

    return true;
  }

  reload() {
    const w = this.getCurrentWeapon();
    const ammoData = this.ammo[w.id];

    if (this.isReloading || ammoData.current >= w.magSize || ammoData.reserve <= 0) return;

    this.isReloading = true;
    this.isInspecting = false;
    this.soundManager.playReload();

    setTimeout(() => {
      const needed = w.magSize - ammoData.current;
      const toAdd = Math.min(needed, ammoData.reserve);
      ammoData.current += toAdd;
      ammoData.reserve -= toAdd;
      this.isReloading = false;
    }, w.reloadTime * 1000);
  }

  setAiming(isAiming) {
    this.isAiming = isAiming;
    if (isAiming) this.isInspecting = false;
  }

  update(delta, isMoving) {
    const w = this.getCurrentWeapon();
    const ammoData = this.ammo[w.id];

    // OLED ekranni yangilash
    if (this.blasterAmmoDisplay && w.id === 'blaster') {
      this.blasterAmmoDisplay.update(ammoData.current, w.magSize);
    }

    // 1. Recoilni silliq qaytarish
    this.recoilOffset = THREE.MathUtils.lerp(this.recoilOffset, 0, delta * 14);
    this.recoilRot = THREE.MathUtils.lerp(this.recoilRot, 0, delta * 14);

    // 2. Yurish paytida qurolning tebranishi (Bobbing)
    if (isMoving) {
      this.bobTimer += delta * 10.5;
    } else {
      this.bobTimer += delta * 1.8;
    }
    const bobX = Math.cos(this.bobTimer * 0.5) * (isMoving ? 0.016 : 0.003);
    const bobY = Math.sin(this.bobTimer) * (isMoving ? 0.013 : 0.004);

    // 3. Inspect animatsiyasi
    let inspectRotY = 0;
    let inspectRotZ = 0;
    if (this.isInspecting) {
      this.inspectTimer += delta * 2.2;
      inspectRotY = Math.sin(this.inspectTimer) * 0.55;
      inspectRotZ = Math.sin(this.inspectTimer * 1.5) * 0.35;
      if (this.inspectTimer > Math.PI * 2) {
        this.isInspecting = false;
      }
    }

    // Pozitsiya va aylanish
    const targetPos = this.isAiming ? this.aimPos : this.defaultPos;
    this.weaponRoot.position.x = THREE.MathUtils.lerp(this.weaponRoot.position.x, targetPos.x + bobX, delta * 12);
    this.weaponRoot.position.y = THREE.MathUtils.lerp(
      this.weaponRoot.position.y,
      targetPos.y + bobY - (this.isReloading ? 0.28 : 0),
      delta * 12
    );
    this.weaponRoot.position.z = THREE.MathUtils.lerp(this.weaponRoot.position.z, targetPos.z + this.recoilOffset, delta * 12);

    this.weaponRoot.rotation.x = THREE.MathUtils.lerp(this.weaponRoot.rotation.x, -this.recoilRot, delta * 12);
    this.weaponRoot.rotation.y = bobX * 1.5 + inspectRotY;
    this.weaponRoot.rotation.z = inspectRotZ;
  }
}
