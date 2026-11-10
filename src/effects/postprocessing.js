import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class PostProcessingManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.quality = 'ULTRA'; // ULTRA, HIGH, MEDIUM

    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(window.innerWidth, window.innerHeight);

    // 1. Asosiy Render Pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 2. Kinematografik Neonly Bloom (UnrealBloomPass)
    // Lazerlar, quyosh, sehrli kristallar va portlashlarga neon jilo beradi
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.85, // bloom kuchi (strength)
      0.45, // radius
      0.68  // chegara (threshold)
    );
    this.composer.addPass(this.bloomPass);

    // 3. FXAA Antialiasing (Piksel qirralarini silliqlash)
    this.fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = this.renderer.getPixelRatio();
    this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
    this.composer.addPass(this.fxaaPass);

    // 4. Output Pass (Ranglar korreksiyasi va ToneMapping)
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  setQuality(level) {
    this.quality = level;
    if (level === 'ULTRA') {
      this.bloomPass.enabled = true;
      this.bloomPass.strength = 0.9;
      this.fxaaPass.enabled = true;
      this.renderer.shadowMap.enabled = true;
    } else if (level === 'HIGH') {
      this.bloomPass.enabled = true;
      this.bloomPass.strength = 0.55;
      this.fxaaPass.enabled = false;
      this.renderer.shadowMap.enabled = true;
    } else {
      // MEDIUM / LOW
      this.bloomPass.enabled = false;
      this.fxaaPass.enabled = false;
      this.renderer.shadowMap.enabled = false;
    }
  }

  onResize(width, height) {
    this.composer.setSize(width, height);
    const pixelRatio = this.renderer.getPixelRatio();
    this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
    this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
  }

  render() {
    if (this.quality === 'MEDIUM') {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render();
    }
  }
}
