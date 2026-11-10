import * as THREE from 'three';
import { getTerrainHeight } from '../world/terrain.js';

export class EnemyDrone {
  constructor(scene, spawnPos, level = 1, isBoss = false) {
    this.scene = scene;
    this.level = level;
    this.isBoss = isBoss;

    this.maxHealth = isBoss ? (220 + level * 80) : (50 + level * 20);
    this.health = this.maxHealth;
    this.isAlive = true;
    this.radius = isBoss ? 3.0 : 1.4;

    this.speed = isBoss ? 8 : (11 + Math.random() * 5);
    this.attackRange = isBoss ? 85 : 60;
    this.detectionRange = isBoss ? 180 : 130;
    this.lastShotTime = 0;
    this.shotCooldown = isBoss ? 1.0 : (1.6 + Math.random() * 0.7);

    this.mesh = new THREE.Group();
    this.mesh.position.copy(spawnPos);

    if (isBoss) {
      this.createBossDroneModel();
    } else {
      this.createScoutDroneModel();
    }

    this.createHealthBar();
    this.scene.add(this.mesh);
    this.hoverOffset = Math.random() * 10;
  }

  // 1. Standart Skaut Dron
  createScoutDroneModel() {
    const coreGeo = new THREE.SphereGeometry(1.0, 16, 16);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0x1a212b,
      roughness: 0.25,
      metalness: 0.85
    });
    const core = new THREE.Mesh(coreGeo, this.coreMat);
    this.mesh.add(core);

    // Qizil sensor ko'z
    const eyeGeo = new THREE.SphereGeometry(0.38, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0, 0.82);
    this.mesh.add(eye);

    // Ikkita aylanuvchi orbital halqa
    const ringGeo = new THREE.TorusGeometry(1.5, 0.1, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.2 });
    this.ring1 = new THREE.Mesh(ringGeo, ringMat);
    this.mesh.add(this.ring1);

    // Pastki reaktiv nuri
    this.thrusterLight = new THREE.PointLight(0xff0044, 2, 9);
    this.thrusterLight.position.set(0, -1, 0);
    this.mesh.add(this.thrusterLight);
  }

  // 2. Og'ir Titan Boss Dron (Heavy Boss Mech)
  createBossDroneModel() {
    // Katta zirhli korpus
    const coreGeo = new THREE.DodecahedronGeometry(2.4, 1);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0x241119,
      roughness: 0.3,
      metalness: 0.9
    });
    const core = new THREE.Mesh(coreGeo, this.coreMat);
    this.mesh.add(core);

    // Markaziy qizil yadro (Glowing Reactor)
    const reactor = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0033 })
    );
    this.mesh.add(reactor);

    // Ikkita og'ir plazma to'plari (Twin Plasma Cannons)
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95 });
    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.5, 8), cannonMat);
    c1.rotateX(Math.PI / 2);
    c1.position.set(2.2, 0, 0.8);
    const c2 = c1.clone();
    c2.position.x = -2.2;
    this.mesh.add(c1, c2);

    // Og'ir tashqi himoya qalqonlari
    const shieldRingGeo = new THREE.TorusGeometry(3.2, 0.18, 8, 32);
    const shieldRingMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0x880022 });
    this.ring1 = new THREE.Mesh(shieldRingGeo, shieldRingMat);
    this.ring2 = new THREE.Mesh(shieldRingGeo, shieldRingMat);
    this.ring2.rotation.x = Math.PI / 2;
    this.mesh.add(this.ring1, this.ring2);

    // Katta boss nuri
    this.thrusterLight = new THREE.PointLight(0xff0044, 5, 25);
    this.mesh.add(this.thrusterLight);
  }

  createHealthBar() {
    this.healthBarGroup = new THREE.Group();
    const barY = this.isBoss ? 4.0 : 2.0;
    this.healthBarGroup.position.set(0, barY, 0);

    const barW = this.isBoss ? 3.8 : 2.0;
    const barH = this.isBoss ? 0.38 : 0.22;

    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(barW, barH),
      new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide })
    );
    this.healthBarGroup.add(bg);

    this.barMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(barW * 0.97, barH * 0.8),
      new THREE.MeshBasicMaterial({
        color: this.isBoss ? 0xff0077 : 0xff0044,
        side: THREE.DoubleSide
      })
    );
    this.barMesh.position.z = 0.02;
    this.barW = barW;
    this.healthBarGroup.add(this.barMesh);

    this.mesh.add(this.healthBarGroup);
  }

  takeDamage(amount) {
    if (!this.isAlive) return;
    this.health -= amount;

    const pct = Math.max(0, this.health / this.maxHealth);
    this.barMesh.scale.x = pct;
    this.barMesh.position.x = -(this.barW * (1 - pct)) / 2;

    this.coreMat.color.setHex(0xffffff);
    setTimeout(() => {
      if (this.coreMat) this.coreMat.color.setHex(this.isBoss ? 0x241119 : 0x1a212b);
    }, 70);

    if (this.health <= 0) {
      this.isAlive = false;
    }
  }

  update(delta, playerPos, camera, projectileManager, soundManager) {
    if (!this.isAlive) return;

    this.healthBarGroup.quaternion.copy(camera.quaternion);

    if (this.ring1) {
      this.ring1.rotation.x += delta * (this.isBoss ? 1.2 : 2.2);
      this.ring1.rotation.y += delta * (this.isBoss ? 1.0 : 1.8);
    }
    if (this.ring2) {
      this.ring2.rotation.z += delta * 1.5;
    }

    const time = performance.now() / 1000;
    const hoverY = Math.sin(time * 2.2 + this.hoverOffset) * (this.isBoss ? 1.2 : 0.8);

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
    const dist = toPlayer.length();

    this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);

    if (dist < this.detectionRange) {
      toPlayer.normalize();

      const stopDist = this.isBoss ? 28 : 16;
      if (dist > stopDist) {
        this.mesh.position.x += toPlayer.x * this.speed * delta;
        this.mesh.position.z += toPlayer.z * this.speed * delta;
      }

      // O'q otish
      if (dist < this.attackRange && time - this.lastShotTime > this.shotCooldown) {
        this.lastShotTime = time;

        if (this.isBoss) {
          // Boss ikkita to'pidan otadi
          const leftMuzzle = this.mesh.position.clone().add(new THREE.Vector3(2.0, 0, 0));
          const rightMuzzle = this.mesh.position.clone().add(new THREE.Vector3(-2.0, 0, 0));
          const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();

          projectileManager.spawnEnemyBullet(leftMuzzle, dir, 90, 22);
          projectileManager.spawnEnemyBullet(rightMuzzle, dir, 90, 22);
        } else {
          const origin = this.mesh.position.clone();
          const dir = new THREE.Vector3().subVectors(playerPos, origin).normalize();
          projectileManager.spawnEnemyBullet(origin, dir, 78, 14);
        }

        soundManager.playEnemyShoot();
      }
    }

    const groundY = getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
    const minFlyY = groundY + (this.isBoss ? 8.0 : 4.5);

    if (this.mesh.position.y < minFlyY) {
      this.mesh.position.y = minFlyY;
    } else {
      this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, minFlyY + hoverY + 1.2, delta * 3);
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
