import * as THREE from 'three';
import { getTerrainHeight } from '../world/terrain.js';

export class ProjectileManager {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];
    this.particles = [];
    this.shockwaves = [];

    // O'qlar geometriyasi va materiallari
    this.playerBulletGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.8, 6);
    this.playerBulletGeo.rotateX(Math.PI / 2);

    this.enemyBulletGeo = new THREE.SphereGeometry(0.42, 8, 8);
    this.enemyBulletMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    // Uchqun zarralari
    this.sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(500 * 3);
    const sparkCol = new Float32Array(500 * 3);
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));

    this.sparkMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    this.sparkMesh = new THREE.Points(this.sparkGeo, this.sparkMat);
    this.scene.add(this.sparkMesh);
  }

  spawnPlayerBullet(origin, direction, speed = 200, damage = 30, color = 0x00f0ff) {
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(this.playerBulletGeo, mat);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);

    // O'qning atrofni yorituvchi nuri (Dynamic Bullet Light)
    const bulletLight = new THREE.PointLight(color, 3, 16);
    mesh.add(bulletLight);

    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      direction: direction.clone().normalize(),
      speed,
      damage,
      isEnemy: false,
      color,
      life: 2.8
    });
  }

  spawnEnemyBullet(origin, direction, speed = 80, damage = 14) {
    const mesh = new THREE.Mesh(this.enemyBulletGeo, this.enemyBulletMat);
    mesh.position.copy(origin);

    const bulletLight = new THREE.PointLight(0xff0044, 2, 12);
    mesh.add(bulletLight);

    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      direction: direction.clone().normalize(),
      speed,
      damage,
      isEnemy: true,
      color: 0xff0044,
      life: 3.5
    });
  }

  createImpactSparks(pos, hexColor = 0x00f0ff, count = 20) {
    const col = new THREE.Color(hexColor);
    for (let i = 0; i < count; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 22,
        Math.random() * 16 + 4,
        (Math.random() - 0.5) * 22
      );
      this.particles.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        vx: vel.x,
        vy: vel.y,
        vz: vel.z,
        r: col.r,
        g: col.g,
        b: col.b,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.8
      });
    }

    // Katta zarba to'lqini (Shockwave)
    if (count > 25) {
      const swGeo = new THREE.RingGeometry(0.5, 1.2, 24);
      swGeo.rotateX(-Math.PI / 2);
      const swMat = new THREE.MeshBasicMaterial({
        color: hexColor,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const swMesh = new THREE.Mesh(swGeo, swMat);
      swMesh.position.copy(pos);
      swMesh.position.y += 0.2;
      this.scene.add(swMesh);

      this.shockwaves.push({
        mesh: swMesh,
        scale: 1,
        life: 0.4
      });
    }
  }

  update(delta, enemies, player, onEnemyHit, onPlayerHit) {
    // 1. O'qlarni yangilash
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= delta;

      const moveStep = p.speed * delta;
      p.mesh.position.addScaledVector(p.direction, moveStep);

      let destroyed = false;

      // Relyef bilan to'qnashuv
      const terrainY = getTerrainHeight(p.mesh.position.x, p.mesh.position.z);
      if (p.mesh.position.y <= terrainY) {
        this.createImpactSparks(p.mesh.position, p.color, 14);
        destroyed = true;
      }

      // Dushmanga tegishi
      if (!p.isEnemy && !destroyed) {
        for (let j = 0; j < enemies.length; j++) {
          const enemy = enemies[j];
          if (!enemy.isAlive) continue;

          const dist = p.mesh.position.distanceTo(enemy.mesh.position);
          if (dist < enemy.radius) {
            enemy.takeDamage(p.damage);
            this.createImpactSparks(p.mesh.position, p.color, 24);
            if (onEnemyHit) onEnemyHit(enemy, p.damage);
            destroyed = true;
            break;
          }
        }
      }

      // O'yinchiga tegishi
      if (p.isEnemy && !destroyed) {
        const dist = p.mesh.position.distanceTo(player.position);
        if (dist < 2.2) {
          this.createImpactSparks(p.mesh.position, 0xff0044, 20);
          if (onPlayerHit) onPlayerHit(p.damage);
          destroyed = true;
        }
      }

      if (destroyed || p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Shockwave to'lqinlarini yangilash
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= delta;
      sw.scale += delta * 25;
      sw.mesh.scale.set(sw.scale, sw.scale, sw.scale);
      sw.mesh.material.opacity = sw.life / 0.4;

      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Uchqun zarralari
    const posAttr = this.sparkGeo.attributes.position;
    const colAttr = this.sparkGeo.attributes.color;
    let sparkIdx = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= delta;

      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      pt.x += pt.vx * delta;
      pt.y += pt.vy * delta;
      pt.z += pt.vz * delta;
      pt.vy -= 26.0 * delta;

      if (sparkIdx < 500) {
        posAttr.setXYZ(sparkIdx, pt.x, pt.y, pt.z);
        const fade = pt.life / pt.maxLife;
        colAttr.setXYZ(sparkIdx, pt.r * fade, pt.g * fade, pt.b * fade);
        sparkIdx++;
      }
    }

    for (let i = sparkIdx; i < 500; i++) {
      posAttr.setXYZ(i, 0, -9999, 0);
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  clear() {
    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.shockwaves.forEach(sw => this.scene.remove(sw.mesh));
    this.projectiles = [];
    this.shockwaves = [];
    this.particles = [];
  }
}
