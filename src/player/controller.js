import * as THREE from 'three';
import { getTerrainHeight, WATER_LEVEL } from '../world/terrain.js';

export class PlayerController {
  constructor(camera, domElement, soundManager) {
    this.camera = camera;
    this.domElement = domElement;
    this.soundManager = soundManager;

    // Harakat parametrlari
    this.position = new THREE.Vector3(0, 30, 0);
    this.velocity = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');

    this.walkSpeed = 16.0;
    this.runSpeed = 38.0;
    this.flySpeed = 70.0;
    this.jumpForce = 18.0;
    this.gravity = 42.0;

    this.isGrounded = false;
    this.isFlying = false;
    this.isThirdPerson = false;
    this.speedMultiplier = 1.0;

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      crouch: false,
      sprint: false
    };

    this.isLocked = false;
    this.playerHeight = 2.0;

    // 3-shaxs rejimida ko'rinadigan qahramon modeli (Explorer Avatar)
    this.createAvatar();

    this.setupPointerLock();
    this.setupKeyboard();
  }

  createAvatar() {
    this.avatar = new THREE.Group();

    // Tana (Palto/Kostyum)
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    body.castShadow = true;
    this.avatar.add(body);

    // Bosh (Dubulg'a / Kaska)
    const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x111d2e,
      roughness: 0.2,
      metalness: 0.8
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.85;
    this.avatar.add(head);

    // Dubulg'a oynasi (Visor)
    const visorGeo = new THREE.BoxGeometry(0.5, 0.2, 0.3);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x38ef7d });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.85, -0.3);
    this.avatar.add(visor);

    // Orqa ryukzak (Jetpack)
    const packGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 1.0, 0.35);
    this.avatar.add(pack);

    this.avatar.visible = this.isThirdPerson;
  }

  setupPointerLock() {
    const blocker = document.getElementById('blocker');

    blocker.addEventListener('click', () => {
      this.domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.domElement) {
        this.isLocked = true;
        blocker.style.display = 'none';
        if (this.soundManager) this.soundManager.resume();
      } else {
        this.isLocked = false;
        blocker.style.display = 'flex';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      const mouseSensitivity = 0.0022;

      this.rotation.y -= movementX * mouseSensitivity;
      this.rotation.x -= movementY * mouseSensitivity;

      // Kameraning vertikal burchagini cheklash (-85 dan +85 gradusgacha)
      const maxPolar = Math.PI / 2 - 0.05;
      this.rotation.x = Math.max(-maxPolar, Math.min(maxPolar, this.rotation.x));
    });
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          this.keys.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'KeyF':
          this.toggleFlyMode();
          break;
        case 'KeyV':
          this.toggleCameraMode();
          break;
        case 'KeyC':
          this.keys.crouch = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
        case 'KeyC':
          this.keys.crouch = false;
          break;
      }
    });
  }

  toggleFlyMode() {
    this.isFlying = !this.isFlying;
    this.velocity.set(0, 0, 0);
    const flyBtn = document.getElementById('fly-mode-text');
    const moveMode = document.getElementById('move-mode');
    if (flyBtn) flyBtn.innerText = this.isFlying ? "Uchish" : "Yurish";
    if (moveMode) moveMode.innerText = this.isFlying ? "Uchish (Parvoz)" : "Piyoda";
  }

  toggleCameraMode() {
    this.isThirdPerson = !this.isThirdPerson;
    this.avatar.visible = this.isThirdPerson;
    const camText = document.getElementById('cam-view-text');
    if (camText) camText.innerText = this.isThirdPerson ? "3-Shaxs" : "1-Shaxs";
  }

  teleport(x, z, y = null) {
    const groundY = getTerrainHeight(x, z);
    const targetY = y !== null ? y : groundY + this.playerHeight + 2;
    this.position.set(x, targetY, z);
    this.velocity.set(0, 0, 0);
  }

  update(delta) {
    if (delta > 0.1) delta = 0.1; // Katta freym kechikishlarini himoyalash

    // Qaysi yo'nalishga harakatlanish
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);

    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) moveDir.normalize();

    const isMoving = moveDir.lengthSq() > 0;

    if (this.isFlying) {
      // ==========================
      // UCHISH REJIMI (FLY MODE)
      // ==========================
      const speed = this.flySpeed * this.speedMultiplier * (this.keys.sprint ? 2.2 : 1.0);
      this.position.addScaledVector(moveDir, speed * delta);

      if (this.keys.jump) {
        this.position.y += speed * delta;
      }
      if (this.keys.crouch) {
        this.position.y -= speed * delta;
      }

      // Pastki chegarani ushlash (yer ostiga tushib ketmaslik)
      const terrainY = getTerrainHeight(this.position.x, this.position.z);
      if (this.position.y < terrainY + 1.5) {
        this.position.y = terrainY + 1.5;
      }
    } else {
      // ==========================
      // YURISH VA GRAVITATSIYA
      // ==========================
      const baseSpeed = this.keys.sprint ? this.runSpeed : this.walkSpeed;
      const targetSpeed = baseSpeed * this.speedMultiplier;

      // Gorizontal tezlanish
      this.velocity.x = moveDir.x * targetSpeed;
      this.velocity.z = moveDir.z * targetSpeed;

      // Gravitatsiya
      this.velocity.y -= this.gravity * delta;

      // Sakrash
      if (this.isGrounded && this.keys.jump) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        if (this.soundManager) this.soundManager.playJump();
      }

      // Pozitsiyani siljitish
      this.position.x += this.velocity.x * delta;
      this.position.z += this.velocity.z * delta;
      this.position.y += this.velocity.y * delta;

      // Yer bilan to'qnashuv (Terrain Collision)
      const terrainY = getTerrainHeight(this.position.x, this.position.z);
      const minAltitude = terrainY + this.playerHeight;

      if (this.position.y <= minAltitude) {
        this.position.y = minAltitude;
        this.velocity.y = 0;
        this.isGrounded = true;

        // Qadam tovushlari
        if (isMoving && this.soundManager) {
          this.soundManager.playStep(this.keys.sprint ? 0.28 : 0.45);
        }
      } else {
        this.isGrounded = false;
      }
    }

    // Avatar pozitsiyasi va aylanishini yangilash
    this.avatar.position.copy(this.position);
    this.avatar.rotation.y = this.rotation.y;

    // Kamerani o'rnatish
    if (this.isThirdPerson) {
      // 3-Shaxs kamerasi: orqada va balandroqda
      const camOffset = new THREE.Vector3(0, 2.5, 6.0);
      camOffset.applyEuler(this.rotation);
      this.camera.position.copy(this.position).add(camOffset);
      this.camera.lookAt(this.position.x, this.position.y + 1.5, this.position.z);
    } else {
      // 1-Shaxs kamerasi: to'g'ridan-to'g'ri o'yinchi ko'zi o'rnida
      this.camera.position.copy(this.position);
      this.camera.quaternion.setFromEuler(this.rotation);
    }
  }
}
