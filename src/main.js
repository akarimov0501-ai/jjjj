import * as THREE from 'three';
import { createTerrain, getBiomeAt } from './world/terrain.js';
import { createWater } from './world/water.js';
import { createSky } from './world/sky.js';
import { createClouds } from './world/clouds.js';
import { createVegetation } from './world/vegetation.js';
import { createStructures, POI_LOCATIONS } from './world/structures.js';
import { PlayerController } from './player/controller.js';
import { SoundManager } from './audio/soundManager.js';
import { Minimap } from './ui/minimap.js';
import { CombatManager } from './combat/combatManager.js';
import { PostProcessingManager } from './effects/postprocessing.js';

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      2500
    );
    this.scene.add(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // Postprocessingda FXAA ishlatiladi
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Ovoz tizimi
    this.soundManager = new SoundManager();

    // 5. O'yinchi kontrolleri
    this.player = new PlayerController(this.camera, this.renderer.domElement, this.soundManager);
    this.scene.add(this.player.avatar);

    // 6. Dunyo komponentlari (Terrain, Water, Sky, Vegetation, Structures)
    this.initWorld();

    // 7. Otishma va Jang Tizimi (Combat System)
    this.combatManager = new CombatManager(this.scene, this.camera, this.player, this.soundManager);

    // 8. Post-Processing Kinematografik Grafika Tizimi (Bloom, FXAA, ToneMapping)
    this.postprocessing = new PostProcessingManager(this.renderer, this.scene, this.camera);

    // 9. UI va Minimap
    this.minimap = new Minimap('minimap-canvas');
    this.setupUI();

    // 10. FPS va Vaqt kuzatuvchisi
    this.clock = new THREE.Clock();
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.timeSpeed = 0;

    window.addEventListener('resize', () => this.onWindowResize());

    // Boshlang'ich joylashuv
    this.player.teleport(0, 0);

    // Animatsiya siklini ishga tushirish
    this.animate();
  }

  initWorld() {
    this.terrain = createTerrain(this.scene);
    this.water = createWater(this.scene);
    this.sky = createSky(this.scene);
    this.clouds = createClouds(this.scene);
    this.vegetation = createVegetation(this.scene);
    this.structures = createStructures(this.scene);
  }

  setupUI() {
    // Vaqt slayderi
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) {
      timeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.sky.setTime(val);
        this.updateTimeText(val);
      });
    }

    // Teleport tugmalari
    document.querySelectorAll('.tp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tp-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const locKey = btn.dataset.location;
        const target = POI_LOCATIONS[locKey];
        if (target) {
          this.player.teleport(target.x, target.z, target.y || null);
          this.soundManager.playTeleport();
        }
      });
    });

    // Qurol slotlari
    document.querySelectorAll('.weapon-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const idx = parseInt(slot.dataset.slot, 10);
        this.combatManager.weaponSystem.selectWeapon(idx);
        this.combatManager.updateWeaponUI();
      });
    });

    // Otishma rejimini almashtirish (B)
    const combatBtn = document.getElementById('btn-combat-toggle');
    if (combatBtn) {
      combatBtn.addEventListener('click', () => this.combatManager.toggleCombatMode());
    }

    // Grafika sifatini almashtirish (G): ULTRA -> HIGH -> MEDIUM -> ULTRA
    const gfxBtn = document.getElementById('btn-gfx-quality');
    const gfxText = document.getElementById('gfx-quality-text');
    let gfxLevels = ['ULTRA', 'HIGH', 'MEDIUM'];
    let currentGfxIdx = 0;

    const cycleGfx = () => {
      currentGfxIdx = (currentGfxIdx + 1) % gfxLevels.length;
      const level = gfxLevels[currentGfxIdx];
      this.postprocessing.setQuality(level);
      if (gfxText) gfxText.innerText = `Grafika: ${level}`;
    };

    if (gfxBtn) gfxBtn.addEventListener('click', cycleGfx);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyG') cycleGfx();
    });

    // Qayta tirilish (Respawn)
    const respawnBtn = document.getElementById('btn-respawn');
    if (respawnBtn) {
      respawnBtn.addEventListener('click', () => {
        this.combatManager.respawn();
        this.renderer.domElement.requestPointerLock();
      });
    }

    // Kamera ko'rinishi
    const camBtn = document.getElementById('btn-camera-view');
    if (camBtn) {
      camBtn.addEventListener('click', () => this.player.toggleCameraMode());
    }

    // Uchish rejimi
    const flyBtn = document.getElementById('btn-fly-mode');
    if (flyBtn) {
      flyBtn.addEventListener('click', () => this.player.toggleFlyMode());
    }

    // Ovoz
    const audioBtn = document.getElementById('btn-audio-toggle');
    const audioText = document.getElementById('audio-text');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const enabled = this.soundManager.toggle();
        if (audioText) {
          audioText.innerText = enabled ? "Ovoz: ON" : "Ovoz: OFF";
        }
      });
    }

    // Boshlash tugmasi
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.renderer.domElement.requestPointerLock();
      });
    }
  }

  updateTimeText(hour) {
    const timeDisplay = document.getElementById('time-display');
    if (!timeDisplay) return;

    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    let label = "Kunduz";
    if (hour >= 5 && hour < 8) label = "Tong";
    else if (hour >= 8 && hour < 17) label = "Kunduz";
    else if (hour >= 17 && hour < 20) label = "Shafaq";
    else label = "Tun";

    timeDisplay.innerText = `${timeStr} (${label})`;
  }

  updateHUD() {
    const p = this.player.position;

    const coordsEl = document.getElementById('player-coords');
    if (coordsEl) {
      coordsEl.innerText = `X: ${Math.round(p.x)} | Y: ${Math.round(p.y)} | Z: ${Math.round(p.z)}`;
    }

    const altEl = document.getElementById('player-altitude');
    if (altEl) {
      altEl.innerText = `${p.y.toFixed(1)} m`;
    }

    const biomeEl = document.getElementById('biome-name');
    if (biomeEl) {
      const biome = getBiomeAt(p.x, p.z);
      biomeEl.innerText = biome.name;
      biomeEl.style.color = biome.color;
    }

    this.minimap.update(p, this.player.rotation.y, this.combatManager.enemies);
  }

  onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.postprocessing.onResize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // O'yinchi harakati
    this.player.update(delta);

    // Otishma va dushmanlar
    this.combatManager.update(delta);

    // Dunyo animatsiyalari
    this.water.update(elapsedTime);
    this.sky.update(delta, this.timeSpeed, this.player.position, this.camera);
    this.clouds.update(delta);
    this.vegetation.update(elapsedTime);
    this.structures.update(elapsedTime);

    // HUD ma'lumotlari
    this.updateHUD();

    // FPS hisoblash
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      const fpsEl = document.getElementById('fps-counter');
      if (fpsEl) fpsEl.innerText = fps;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    // Kinematografik Post-Processing render
    this.postprocessing.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
