import * as THREE from 'three';
import { EnemyDrone } from './enemy.js';
import { ProjectileManager } from './projectile.js';
import { WeaponSystem, WEAPON_TYPES } from './weapon.js';
import { getTerrainHeight } from '../world/terrain.js';

export class CombatManager {
  constructor(scene, camera, player, soundManager) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.soundManager = soundManager;

    this.isCombatMode = true;

    this.projectileManager = new ProjectileManager(scene);
    this.weaponSystem = new WeaponSystem(camera, this.projectileManager, soundManager);

    this.enemies = [];
    this.wave = 1;
    this.score = 0;
    this.kills = 0;

    this.maxHealth = 100;
    this.health = 100;
    this.maxShield = 100;
    this.shield = 100;
    this.lastDamageTime = 0;
    this.isDead = false;

    this.pickups = [];

    this.setupCombatEvents();
    this.spawnWave(this.wave);
  }

  setupCombatEvents() {
    window.addEventListener('mousedown', (e) => {
      if (!this.player.isLocked || !this.isCombatMode || this.isDead) return;

      if (e.button === 0) {
        this.weaponSystem.shoot();
      } else if (e.button === 2) {
        this.weaponSystem.setAiming(true);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.weaponSystem.setAiming(false);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!this.isCombatMode) return;

      if (e.code === 'KeyR') {
        this.weaponSystem.reload();
      } else if (e.code === 'Digit1') {
        this.weaponSystem.selectWeapon(0);
        this.updateWeaponUI();
      } else if (e.code === 'Digit2') {
        this.weaponSystem.selectWeapon(1);
        this.updateWeaponUI();
      } else if (e.code === 'Digit3') {
        this.weaponSystem.selectWeapon(2);
        this.updateWeaponUI();
      } else if (e.code === 'KeyB') {
        this.toggleCombatMode();
      }
    });

    window.addEventListener('wheel', (e) => {
      if (!this.player.isLocked || !this.isCombatMode) return;
      let nextIndex = this.weaponSystem.currentWeaponIndex + (e.deltaY > 0 ? 1 : -1);
      if (nextIndex < 0) nextIndex = WEAPON_TYPES.length - 1;
      if (nextIndex >= WEAPON_TYPES.length) nextIndex = 0;
      this.weaponSystem.selectWeapon(nextIndex);
      this.updateWeaponUI();
    });
  }

  toggleCombatMode() {
    this.isCombatMode = !this.isCombatMode;
    const modeBtn = document.getElementById('combat-mode-text');
    const crosshair = document.getElementById('crosshair');

    if (modeBtn) modeBtn.innerText = this.isCombatMode ? "Otishma: ON" : "Otishma: OFF";
    if (crosshair) crosshair.className = this.isCombatMode ? 'combat-crosshair' : '';

    this.weaponSystem.weaponRoot.visible = this.isCombatMode;
  }

  spawnWave(waveNum) {
    const isBossWave = waveNum % 3 === 0;
    const enemyCount = 3 + waveNum * 2;

    if (isBossWave) {
      this.waveAlert(`⚠️ OG'IR TITAN BOSS BOSQICHI! (To'lqin ${waveNum})`);
      // Boss yaratish
      const bAngle = Math.random() * Math.PI * 2;
      const bx = this.player.position.x + Math.cos(bAngle) * 75;
      const bz = this.player.position.z + Math.sin(bAngle) * 75;
      const by = getTerrainHeight(bx, bz) + 16;
      this.enemies.push(new EnemyDrone(this.scene, new THREE.Vector3(bx, by, bz), waveNum, true));
    } else {
      this.waveAlert(`Hujum To'lqini ${waveNum}: ${enemyCount} ta Dron yaqinlashmoqda!`);
    }

    // Skaut dronlar
    for (let i = 0; i < enemyCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 45 + Math.random() * 65;
      const x = this.player.position.x + Math.cos(angle) * distance;
      const z = this.player.position.z + Math.sin(angle) * distance;
      const y = getTerrainHeight(x, z) + 12;

      const drone = new EnemyDrone(this.scene, new THREE.Vector3(x, y, z), waveNum, false);
      this.enemies.push(drone);
    }
  }

  waveAlert(text) {
    const banner = document.getElementById('wave-banner');
    if (!banner) return;
    banner.innerText = text;
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
    }, 3800);
  }

  showHitmarker() {
    const hm = document.getElementById('hitmarker');
    if (!hm) return;
    hm.classList.add('hit');
    setTimeout(() => {
      hm.classList.remove('hit');
    }, 120);
  }

  onEnemyHit(enemy, damage) {
    this.soundManager.playHitmarker();
    this.showHitmarker();

    if (!enemy.isAlive) {
      this.soundManager.playExplosion();
      this.projectileManager.createImpactSparks(enemy.mesh.position, 0xff0044, enemy.isBoss ? 80 : 35);
      this.kills++;
      this.score += enemy.isBoss ? (500 * this.wave) : (100 * this.wave);

      this.spawnPickup(enemy.mesh.position);
      if (enemy.isBoss) {
        this.spawnPickup(enemy.mesh.position.clone().add(new THREE.Vector3(2, 0, 2)));
      }
    }
  }

  spawnPickup(pos) {
    const isHealth = Math.random() > 0.5;
    const geo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    const mat = new THREE.MeshStandardMaterial({
      color: isHealth ? 0x38ef7d : 0x00f0ff,
      emissive: isHealth ? 0x22aa55 : 0x0088cc,
      emissiveIntensity: 0.7
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.pickups.push({
      mesh,
      type: isHealth ? 'health' : 'ammo',
      rotationSpeed: 2.2
    });
  }

  onPlayerHit(damage) {
    if (this.isDead) return;

    this.lastDamageTime = performance.now() / 1000;
    this.soundManager.playPlayerHurt();

    const vignette = document.getElementById('damage-vignette');
    if (vignette) {
      vignette.classList.add('damage');
      setTimeout(() => vignette.classList.remove('damage'), 220);
    }

    if (this.shield > 0) {
      const shieldDmg = Math.min(this.shield, damage);
      this.shield -= shieldDmg;
      damage -= shieldDmg;
    }

    if (damage > 0) {
      this.health -= damage;
    }

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.isDead = true;
    const gameOverModal = document.getElementById('game-over-modal');
    if (gameOverModal) {
      gameOverModal.style.display = 'flex';
      const finalScore = document.getElementById('final-score');
      if (finalScore) finalScore.innerText = `Ochkolar: ${this.score} | Mag'lub etilganlar: ${this.kills}`;
    }
  }

  respawn() {
    this.isDead = false;
    this.health = this.maxHealth;
    this.shield = this.maxShield;
    this.player.teleport(0, 0);

    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.pickups.forEach(p => this.scene.remove(p.mesh));
    this.pickups = [];
    this.projectileManager.clear();

    const gameOverModal = document.getElementById('game-over-modal');
    if (gameOverModal) gameOverModal.style.display = 'none';

    this.wave = 1;
    this.score = 0;
    this.kills = 0;
    this.spawnWave(1);
  }

  update(delta) {
    if (!this.isCombatMode) return;

    const isMoving = this.player.velocity.lengthSq() > 2.0;
    this.weaponSystem.update(delta, isMoving);

    const now = performance.now() / 1000;
    if (now - this.lastDamageTime > 4.0 && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + delta * 25);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.isAlive) {
        enemy.destroy();
        this.enemies.splice(i, 1);
        continue;
      }
      enemy.update(delta, this.player.position, this.camera, this.projectileManager, this.soundManager);
    }

    this.projectileManager.update(
      delta,
      this.enemies,
      this.player,
      (e, d) => this.onEnemyHit(e, d),
      (d) => this.onPlayerHit(d)
    );

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.mesh.rotation.y += delta * p.rotationSpeed;
      p.mesh.rotation.x += delta * 0.5;

      const dist = p.mesh.position.distanceTo(this.player.position);
      if (dist < 3.2) {
        if (p.type === 'health') {
          this.health = Math.min(this.maxHealth, this.health + 40);
        } else {
          const currentW = this.weaponSystem.getCurrentWeapon();
          this.weaponSystem.ammo[currentW.id].reserve += currentW.magSize * 2;
        }
        this.soundManager.playTeleport();
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
      }
    }

    if (this.enemies.length === 0 && !this.isDead) {
      this.wave++;
      this.spawnWave(this.wave);
    }

    this.updateHUD();
  }

  updateWeaponUI() {
    const w = this.weaponSystem.getCurrentWeapon();
    const ammoData = this.weaponSystem.ammo[w.id];

    const wName = document.getElementById('weapon-name');
    const wAmmo = document.getElementById('weapon-ammo');
    const wIcon = document.getElementById('weapon-icon');

    if (wName) wName.innerText = w.name;
    if (wAmmo) wAmmo.innerText = `${ammoData.current} / ${ammoData.reserve}`;
    if (wIcon) wIcon.innerText = w.icon;

    document.querySelectorAll('.weapon-slot').forEach((slot, idx) => {
      slot.classList.toggle('active', idx === this.weaponSystem.currentWeaponIndex);
    });
  }

  updateHUD() {
    const hpBar = document.getElementById('player-hp-bar');
    const hpText = document.getElementById('player-hp-text');
    const shBar = document.getElementById('player-shield-bar');
    const shText = document.getElementById('player-shield-text');

    if (hpBar) hpBar.style.width = `${(this.health / this.maxHealth) * 100}%`;
    if (hpText) hpText.innerText = `${Math.ceil(this.health)} / 100`;

    if (shBar) shBar.style.width = `${(this.shield / this.maxShield) * 100}%`;
    if (shText) shText.innerText = `${Math.ceil(this.shield)} / 100`;

    const waveEl = document.getElementById('hud-wave');
    const killsEl = document.getElementById('hud-kills');
    const scoreEl = document.getElementById('hud-score');

    if (waveEl) waveEl.innerText = this.wave;
    if (killsEl) killsEl.innerText = this.kills;
    if (scoreEl) scoreEl.innerText = this.score;

    this.updateWeaponUI();
  }
}
