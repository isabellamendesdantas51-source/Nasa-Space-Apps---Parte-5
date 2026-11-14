import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MissionPhase, ReentryMoment, SubsystemSlot } from '../types/mission';
import {
  createEarthTexture,
  createMoonTexture,
  createOrionTileTexture,
  createParachuteTexture,
  createSolarCellTexture,
} from '../utils/proceduralTextures';
import {
  createEarthAtmosphereShaderMaterial,
  createEnginePlumeShaderMaterial,
  createOceanWaveShaderMaterial,
  createReentryPlasmaShaderMaterial,
} from '../utils/orionShaders';

export interface OrionViewportProps {
  phase: MissionPhase;
  explodedAmount: number; // 0 to 1 (used in Phase 1 inspection)
  highlightedSlot?: SubsystemSlot | null;
  selectedSubsystems: Record<SubsystemSlot, string>;
  // Phase 2
  phase2Progress?: number; // 0 to 100
  inEclipse?: boolean;
  inFarSide?: boolean;
  shelterActive?: boolean;
  // Phase 3
  engineBurnActive?: boolean;
  reentryMoment?: ReentryMoment;
  reentryProgress?: number; // 0 to 100
  reentryAngle?: number;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _skyBlack = new THREE.Color('#040711');
const _skyPlasma = new THREE.Color('#230c05');
const _skyAtmos = new THREE.Color('#0b2a4d');
const _skyOcean = new THREE.Color('#3874a8');
const _tmpColor = new THREE.Color();

export const OrionViewport3D: React.FC<OrionViewportProps> = (props) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef<OrionViewportProps>(props);
  propsRef.current = props;

  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    scene.background = _skyBlack.clone();

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 400);
    camera.position.set(5.2, 2.5, 6.4);

    // Environment reflection for metallic aerospace finishes
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 16;
    controls.enablePan = false;

    // 3-Point Aerospace Lighting
    const hemiLight = new THREE.HemisphereLight('#7dd3fc', '#0f172a', 0.45);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 2.4);
    sunLight.position.set(12, 8, 10);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.9);
    rimLight.position.set(-10, -4, -9);
    scene.add(rimLight);

    // Procedural Textures
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const tileTex = createOrionTileTexture(maxAniso);
    const solarTex = createSolarCellTexture(maxAniso);
    const moonTex = createMoonTexture(maxAniso);
    const earthTex = createEarthTexture(maxAniso);
    const chuteTex = createParachuteTexture(maxAniso);

    // Starfield (Instanced / Points)
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 65 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: '#e2e8f0',
      size: 0.35,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // =====================================================
    // COMPOSITE ORION SPACECRAFT GROUP
    // =====================================================
    const orionRoot = new THREE.Group();
    scene.add(orionRoot);

    // Materials
    const cmMat = new THREE.MeshStandardMaterial({
      map: tileTex,
      roughness: 0.45,
      metalness: 0.15,
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.35,
      metalness: 0.85,
    });
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.28,
      metalness: 0.9,
    });
    const goldFoilMat = new THREE.MeshStandardMaterial({
      color: '#d97706',
      roughness: 0.25,
      metalness: 0.92,
    });
    const heatShieldMat = new THREE.MeshStandardMaterial({
      color: '#3f2e26',
      roughness: 0.78,
      metalness: 0.08,
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#082f49',
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1,
    });
    const solarMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.22,
      metalness: 0.65,
    });
    const esmBodyMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.42,
      metalness: 0.55,
    });

    // 1. CREW MODULE GROUP
    const crewModuleGroup = new THREE.Group();
    orionRoot.add(crewModuleGroup);

    // Main conical capsule
    const cmConeGeo = new THREE.CylinderGeometry(0.62, 1.38, 1.25, 36);
    const cmCone = new THREE.Mesh(cmConeGeo, cmMat);
    cmCone.position.y = 1.05;
    cmCone.castShadow = true;
    cmCone.receiveShadow = true;
    crewModuleGroup.add(cmCone);

    // Forward docking ring & hatch
    const dockingRingGeo = new THREE.CylinderGeometry(0.42, 0.62, 0.28, 28);
    const dockingRing = new THREE.Mesh(dockingRingGeo, darkMetalMat);
    dockingRing.position.y = 1.81;
    crewModuleGroup.add(dockingRing);

    const hatchCapGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.1, 24);
    const hatchCap = new THREE.Mesh(hatchCapGeo, titaniumMat);
    hatchCap.position.y = 1.98;
    crewModuleGroup.add(hatchCap);

    // 4 Crew Windows
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + Math.PI / 4;
      const winGeo = new THREE.BoxGeometry(0.24, 0.14, 0.08);
      const winMesh = new THREE.Mesh(winGeo, glassMat);
      winMesh.position.set(Math.cos(ang) * 0.92, 1.22, Math.sin(ang) * 0.92);
      winMesh.lookAt(Math.cos(ang) * 2, 1.55, Math.sin(ang) * 2);
      crewModuleGroup.add(winMesh);
    }

    // Flotation collar (visible only on splashdown)
    const collarGeo = new THREE.TorusGeometry(1.48, 0.2, 16, 40);
    const collarMat = new THREE.MeshStandardMaterial({
      color: '#f97316',
      roughness: 0.4,
      metalness: 0.1,
    });
    const flotationCollar = new THREE.Mesh(collarGeo, collarMat);
    flotationCollar.rotation.x = Math.PI / 2;
    flotationCollar.position.y = 0.5;
    flotationCollar.visible = false;
    crewModuleGroup.add(flotationCollar);

    // 2. HEAT SHIELD GROUP (Avcoat TPS)
    const heatShieldGroup = new THREE.Group();
    crewModuleGroup.add(heatShieldGroup);
    const shieldGeo = new THREE.SphereGeometry(1.42, 36, 16, 0, Math.PI * 2, Math.PI * 0.68, Math.PI * 0.32);
    const shieldMesh = new THREE.Mesh(shieldGeo, heatShieldMat);
    shieldMesh.position.y = 1.05;
    heatShieldGroup.add(shieldMesh);

    // 3. PARACHUTES GROUP (3 Ring-Sail Canopies)
    const parachutesGroup = new THREE.Group();
    parachutesGroup.visible = false;
    crewModuleGroup.add(parachutesGroup);

    const chuteMat = new THREE.MeshStandardMaterial({
      map: chuteTex,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const cordMat = new THREE.LineBasicMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.7 });

    const chuteOffsets = [
      new THREE.Vector3(-1.3, 4.2, 0.7),
      new THREE.Vector3(1.3, 4.2, 0.7),
      new THREE.Vector3(0, 4.4, -1.2),
    ];
    chuteOffsets.forEach((offset) => {
      const chuteSub = new THREE.Group();
      chuteSub.position.copy(offset);
      const canopyGeo = new THREE.SphereGeometry(1.1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.48);
      const canopy = new THREE.Mesh(canopyGeo, chuteMat);
      chuteSub.add(canopy);
      parachutesGroup.add(chuteSub);

      // Shroud lines
      for (let s = 0; s < 4; s++) {
        const a = (s * Math.PI) / 2;
        const pts = [
          new THREE.Vector3(0, 1.85, 0),
          new THREE.Vector3(
            offset.x + Math.cos(a) * 0.95,
            offset.y + 0.08,
            offset.z + Math.sin(a) * 0.95
          ),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        parachutesGroup.add(new THREE.Line(lineGeo, cordMat));
      }
    });

    // 4. EUROPEAN SERVICE MODULE (ESM) GROUP
    const esmGroup = new THREE.Group();
    orionRoot.add(esmGroup);

    const esmCylGeo = new THREE.CylinderGeometry(1.26, 1.26, 1.45, 32);
    const esmBody = new THREE.Mesh(esmCylGeo, esmBodyMat);
    esmBody.position.y = -0.35;
    esmBody.castShadow = true;
    esmGroup.add(esmBody);

    // Gold MLI band
    const mliGeo = new THREE.CylinderGeometry(1.29, 1.29, 0.36, 32);
    const mliBand = new THREE.Mesh(mliGeo, goldFoilMat);
    mliBand.position.y = -0.78;
    esmGroup.add(mliBand);

    // 4 Internal Propellant Tanks (revealed during exploded view)
    const tanksGroup = new THREE.Group();
    esmGroup.add(tanksGroup);
    const tankSphGeo = new THREE.SphereGeometry(0.36, 20, 16);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const tank = new THREE.Mesh(tankSphGeo, titaniumMat);
      tank.position.set(Math.cos(a) * 0.65, -0.35, Math.sin(a) * 0.65);
      tanksGroup.add(tank);
    }

    // 4 Auxiliary RCS Thruster Quads
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const rcs = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), darkMetalMat);
      rcs.position.set(Math.cos(a) * 1.32, 0.05, Math.sin(a) * 1.32);
      rcs.lookAt(Math.cos(a) * 3, 0.05, Math.sin(a) * 3);
      esmGroup.add(rcs);
    }

    // 5. MAIN ENGINE NOZZLE GROUP (LatheGeometry)
    const engineGroup = new THREE.Group();
    esmGroup.add(engineGroup);

    const bellPts = [
      new THREE.Vector2(0.18, 0.0),
      new THREE.Vector2(0.26, -0.18),
      new THREE.Vector2(0.42, -0.45),
      new THREE.Vector2(0.56, -0.78),
    ];
    const bellGeo = new THREE.LatheGeometry(bellPts, 28);
    const bellMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.3,
      metalness: 0.88,
      side: THREE.DoubleSide,
    });
    const engineBell = new THREE.Mesh(bellGeo, bellMat);
    engineBell.position.y = -1.08;
    engineGroup.add(engineBell);

    // Inner glowing engine core
    const engineCoreGeo = new THREE.SphereGeometry(0.22, 16, 12);
    const engineCoreMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0,
    });
    const engineCore = new THREE.Mesh(engineCoreGeo, engineCoreMat);
    engineCore.position.y = -1.22;
    engineGroup.add(engineCore);

    const engineLight = new THREE.PointLight('#fb923c', 0, 12);
    engineLight.position.y = -1.9;
    engineGroup.add(engineLight);

    // Volumetric GLSL engine exhaust plume cone
    const plumeConeGeo = new THREE.CylinderGeometry(0.28, 0.88, 3.6, 28, 12, true);
    const plumeConeMat = createEnginePlumeShaderMaterial();
    const plumeCone = new THREE.Mesh(plumeConeGeo, plumeConeMat);
    plumeCone.position.y = -3.45;
    plumeCone.visible = false;
    engineGroup.add(plumeCone);

    // 6. 4 DEPLOYABLE SOLAR ARRAY WINGS
    const solarWingsGroup = new THREE.Group();
    esmGroup.add(solarWingsGroup);
    const wingGroups: THREE.Group[] = [];

    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const pivot = new THREE.Group();
      pivot.position.set(Math.cos(a) * 1.26, -0.42, Math.sin(a) * 1.26);
      pivot.rotation.y = -a;

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.08), titaniumMat);
      arm.position.set(0.3, 0, 0);
      pivot.add(arm);

      const panel1 = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.62), solarMat);
      panel1.position.set(1.32, 0, 0);
      panel1.rotation.x = 0.25;
      pivot.add(panel1);

      const panel2 = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.62), solarMat);
      panel2.position.set(2.85, 0, 0);
      panel2.rotation.x = 0.25;
      pivot.add(panel2);

      solarWingsGroup.add(pivot);
      wingGroups.push(pivot);
    }

    // 7. HIGH-GAIN DISH ANTENNA
    const antennaGroup = new THREE.Group();
    esmGroup.add(antennaGroup);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.65, 12), titaniumMat);
    mast.position.set(0.95, 0.55, 0);
    antennaGroup.add(mast);

    const dishPts = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.18, 0.04),
      new THREE.Vector2(0.34, 0.14),
    ];
    const dishGeo = new THREE.LatheGeometry(dishPts, 24);
    const dish = new THREE.Mesh(dishGeo, titaniumMat);
    dish.position.set(0.95, 0.9, 0);
    dish.rotation.z = -0.65;
    antennaGroup.add(dish);

    // 8. RADIATION SHELTER SHIELD FIELD (Subtle cyan wireframe halo when active)
    const shelterFieldGeo = new THREE.SphereGeometry(1.75, 24, 18);
    const shelterFieldMat = new THREE.MeshBasicMaterial({
      color: '#22d3ee',
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    const shelterField = new THREE.Mesh(shelterFieldGeo, shelterFieldMat);
    shelterField.position.y = 0.95;
    crewModuleGroup.add(shelterField);

    // =====================================================
    // THRUSTER PLUME PARTICLES (Blue & Orange fire)
    // =====================================================
    const plumeCount = 220;
    const plumePos = new Float32Array(plumeCount * 3);
    const plumeCol = new Float32Array(plumeCount * 3);
    const plumeMeta = new Float32Array(plumeCount); // phase offset
    for (let i = 0; i < plumeCount; i++) {
      plumeMeta[i] = Math.random();
    }
    const plumeGeo = new THREE.BufferGeometry();
    plumeGeo.setAttribute('position', new THREE.BufferAttribute(plumePos, 3));
    plumeGeo.setAttribute('color', new THREE.BufferAttribute(plumeCol, 3));
    const plumeMat = new THREE.PointsMaterial({
      size: 0.26,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const plumePoints = new THREE.Points(plumeGeo, plumeMat);
    plumePoints.visible = false;
    engineGroup.add(plumePoints);

    // =====================================================
    // REENTRY PLASMA PARTICLES & BOW SHOCK CONE
    // =====================================================
    const plasmaCount = 260;
    const plasmaPos = new Float32Array(plasmaCount * 3);
    const plasmaCol = new Float32Array(plasmaCount * 3);
    const plasmaSeed = new Float32Array(plasmaCount * 2);
    for (let i = 0; i < plasmaCount; i++) {
      plasmaSeed[i * 2] = Math.random() * Math.PI * 2;
      plasmaSeed[i * 2 + 1] = Math.random();
    }
    const plasmaGeo = new THREE.BufferGeometry();
    plasmaGeo.setAttribute('position', new THREE.BufferAttribute(plasmaPos, 3));
    plasmaGeo.setAttribute('color', new THREE.BufferAttribute(plasmaCol, 3));
    const plasmaMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const plasmaPoints = new THREE.Points(plasmaGeo, plasmaMat);
    plasmaPoints.visible = false;
    crewModuleGroup.add(plasmaPoints);

    const bowShockGeo = new THREE.SphereGeometry(1.62, 32, 18, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
    const bowShockMat = createReentryPlasmaShaderMaterial();
    const bowShockMesh = new THREE.Mesh(bowShockGeo, bowShockMat);
    bowShockMesh.position.y = 0.85;
    crewModuleGroup.add(bowShockMesh);

    // =====================================================
    // CELESTIAL BODIES: MOON, EARTH & OCEAN
    // =====================================================
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4.4, 48, 36),
      new THREE.MeshStandardMaterial({
        map: moonTex,
        roughness: 0.92,
        metalness: 0.02,
      })
    );
    moonMesh.position.set(0, 0, 0);
    moonMesh.visible = false;
    scene.add(moonMesh);

    const earthGroup = new THREE.Group();
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(7.2, 48, 36),
      new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.72,
        metalness: 0.05,
      })
    );
    earthGroup.add(earthMesh);

    // Atmospheric rim glow (GLSL Fresnel shader)
    const atmosGeo = new THREE.SphereGeometry(7.52, 44, 32);
    const atmosMat = createEarthAtmosphereShaderMaterial();
    earthGroup.add(new THREE.Mesh(atmosGeo, atmosMat));
    earthGroup.visible = false;
    scene.add(earthGroup);

    // Ocean plane for Splashdown (Moment D - GPU GLSL wave displacement + specular)
    const oceanGeo = new THREE.PlaneGeometry(90, 90, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = createOceanWaveShaderMaterial();
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = -0.35;
    oceanMesh.visible = false;
    scene.add(oceanMesh);

    // Animation loop state
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    // Smooth damped state
    let currentExplode = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function updateScene(delta: number, elapsed: number) {
      const p = propsRef.current;

      // Reset default visibilities & GLSL shader uniforms
      moonMesh.visible = false;
      earthGroup.visible = false;
      oceanMesh.visible = false;
      esmGroup.visible = true;
      parachutesGroup.visible = false;
      flotationCollar.visible = false;
      plumePoints.visible = false;
      plumeCone.visible = false;
      plasmaPoints.visible = false;
      plumeConeMat.uniforms.uTime.value = elapsed;
      plumeConeMat.uniforms.uThrottle.value = 0;
      bowShockMat.uniforms.uTime.value = elapsed;
      bowShockMat.uniforms.uIntensity.value = 0;
      atmosMat.uniforms.uTime.value = elapsed;
      oceanMat.uniforms.uTime.value = elapsed;
      engineCoreMat.opacity = 0;
      engineLight.intensity = 0;
      heatShieldMat.emissive.setHex(0x000000);
      heatShieldMat.emissiveIntensity = 0;
      sunLight.intensity = 2.4;
      stars.visible = true;

      // Highlight glow for Phase 1 selection
      const slot = p.highlightedSlot;
      cmMat.emissive.setHex(slot === 'shield' ? 0x0e7490 : 0x000000);
      cmMat.emissiveIntensity = slot === 'shield' ? 0.25 : 0;
      esmBodyMat.emissive.setHex(slot === 'tank' ? 0x0e7490 : 0x000000);
      esmBodyMat.emissiveIntensity = slot === 'tank' ? 0.28 : 0;
      bellMat.emissive.setHex(slot === 'engine' ? 0x0e7490 : 0x000000);
      bellMat.emissiveIntensity = slot === 'engine' ? 0.45 : 0;
      solarMat.emissive.setHex(slot === 'power' ? 0x0e7490 : 0x000000);
      solarMat.emissiveIntensity = slot === 'power' ? 0.35 : 0;

      // Exploded view damping
      const targetExplode = p.phase === 1 ? p.explodedAmount : 0;
      currentExplode = THREE.MathUtils.damp(currentExplode, targetExplode, 6, delta);
      crewModuleGroup.position.y = currentExplode * 0.95;
      heatShieldGroup.position.y = -currentExplode * 0.55;
      esmGroup.position.y = -currentExplode * 0.45;
      engineGroup.position.y = -currentExplode * 0.85;
      tanksGroup.scale.setScalar(1 + currentExplode * 0.28);
      antennaGroup.position.x = currentExplode * 0.45;
      wingGroups.forEach((wg, idx) => {
        const a = (idx * Math.PI) / 2 + Math.PI / 4;
        wg.position.set(
          Math.cos(a) * (1.26 + currentExplode * 0.7),
          -0.42,
          Math.sin(a) * (1.26 + currentExplode * 0.7)
        );
      });

      // Radiation shelter visual
      shelterFieldMat.opacity = p.shelterActive ? 0.18 + Math.sin(elapsed * 4) * 0.06 : 0;

      if (p.phase === 1) {
        controls.enabled = true;
        _tmpColor.copy(_skyBlack);
        (scene.background as THREE.Color).copy(_tmpColor);
        orionRoot.position.set(0, Math.sin(elapsed * 0.8) * 0.08, 0);
        orionRoot.rotation.set(0.15, elapsed * 0.14, 0.08);
        orionRoot.scale.setScalar(1);
        controls.update();
      } else if (p.phase === 2) {
        controls.enabled = false;
        (scene.background as THREE.Color).copy(_skyBlack);
        moonMesh.visible = true;
        moonMesh.rotation.y = elapsed * 0.03;

        // Orbit around the Moon: 0% (front-left) -> 37% (behind Moon far-side) -> 100% (front-right)
        const prog = (p.phase2Progress ?? 0) / 100;
        const orbitAngle = THREE.MathUtils.lerp(-Math.PI * 0.35, Math.PI * 1.45, prog);
        const orbitR = 6.5;
        const ox = Math.sin(orbitAngle) * orbitR;
        const oz = Math.cos(orbitAngle) * orbitR;
        const oy = Math.sin(orbitAngle * 1.3) * 0.7;

        orionRoot.position.set(ox, oy, oz);
        orionRoot.scale.setScalar(0.55);
        orionRoot.lookAt(
          Math.sin(orbitAngle + 0.15) * orbitR,
          Math.sin((orbitAngle + 0.15) * 1.3) * 0.7,
          Math.cos(orbitAngle + 0.15) * orbitR
        );
        orionRoot.rotateX(Math.PI / 2);

        // Dim sun during eclipse
        sunLight.intensity = p.inEclipse ? 0.28 : 2.45;

        // Camera smoothly tracks orbital view showing Moon & Orion passing behind it
        _vec3A.set(0, 3.2, 13.5);
        camera.position.lerp(_vec3A, 1 - Math.exp(-3 * delta));
        _vec3B.set(ox * 0.25, oy * 0.25, oz * 0.15);
        camera.lookAt(_vec3B);
      } else if (p.phase === 3 || p.phase === 4) {
        controls.enabled = false;
        const moment = p.reentryMoment ?? 'IDLE';
        const rProg = (p.reentryProgress ?? 0) / 100;

        if (moment === 'IDLE') {
          (scene.background as THREE.Color).copy(_skyBlack);
          earthGroup.visible = true;
          earthMesh.rotation.y = elapsed * 0.025;
          earthGroup.position.set(4.5, -2.2, -16);
          earthGroup.scale.setScalar(0.95);

          orionRoot.scale.setScalar(0.9);
          const burn = Boolean(p.engineBurnActive);

          if (burn) {
            // Engine burn visual sequence
            const shakeX = (Math.random() - 0.5) * 0.05;
            const shakeY = (Math.random() - 0.5) * 0.05;
            orionRoot.position.set(-1.1 + shakeX, 0.2 + shakeY, 0.6);
            orionRoot.rotation.set(-0.35, 0.55, -0.45);
            plumePoints.visible = true;
            plumeCone.visible = true;
            plumeConeMat.uniforms.uThrottle.value = 1.0;
            engineCoreMat.opacity = 0.95;
            engineLight.intensity = 5.5 + Math.sin(elapsed * 28) * 1.2;

            // Animate blue & orange flame particles shooting out -Y of engine nozzle
            const posAttr = plumeGeo.attributes.position as THREE.BufferAttribute;
            const colAttr = plumeGeo.attributes.color as THREE.BufferAttribute;
            for (let i = 0; i < plumeCount; i++) {
              const t = (elapsed * 3.8 + plumeMeta[i]) % 1;
              const spread = t * 0.55;
              const ang = i * 2.399;
              posAttr.setXYZ(
                i,
                Math.cos(ang) * spread * (0.4 + (i % 5) * 0.15),
                -1.25 - t * 4.2,
                Math.sin(ang) * spread * (0.4 + (i % 5) * 0.15)
              );
              // Core blue -> mid white -> tail orange
              if (t < 0.35) {
                colAttr.setXYZ(i, 0.25, 0.8, 1.0);
              } else {
                colAttr.setXYZ(i, 1.0, 0.55 - t * 0.35, 0.1);
              }
            }
            posAttr.needsUpdate = true;
            colAttr.needsUpdate = true;

            _vec3A.set(3.8, 1.2, 6.2);
            camera.position.lerp(_vec3A, 1 - Math.exp(-4 * delta));
            camera.lookAt(-0.5, -0.4, 0);
          } else {
            orionRoot.position.set(-1.3, 0.3 + Math.sin(elapsed) * 0.08, 0.8);
            const tilt = ((p.reentryAngle ?? 6) - 6) * 0.06;
            orionRoot.rotation.set(-0.28 + tilt, 0.45, -0.42);
            _vec3A.set(3.2, 1.5, 6.6);
            camera.position.lerp(_vec3A, 1 - Math.exp(-3 * delta));
            camera.lookAt(0.4, -0.2, -3);
          }
        } else if (moment === 'APPROACH') {
          (scene.background as THREE.Color).copy(_skyBlack);
          earthGroup.visible = true;
          const pNorm = Math.min(1, rProg / 0.25);
          earthGroup.position.set(1.5, -3.5, THREE.MathUtils.lerp(-18, -9.5, pNorm));
          earthGroup.scale.setScalar(THREE.MathUtils.lerp(1.0, 1.6, pNorm));
          earthMesh.rotation.y += delta * 0.04;

          // Separate Service Module smoothly
          esmGroup.visible = pNorm < 0.55;
          esmGroup.position.y = -pNorm * 5.0;

          orionRoot.scale.setScalar(0.95);
          orionRoot.position.set(0, 0.4, 0);
          // Turn heat shield forward toward Earth
          orionRoot.rotation.set(THREE.MathUtils.lerp(-0.3, -1.25, pNorm), 0.3, 0.15);

          _vec3A.set(3.8, 1.8, 5.4);
          camera.position.lerp(_vec3A, 1 - Math.exp(-4 * delta));
          camera.lookAt(0, 0.5, -1);
        } else if (moment === 'PLASMA') {
          const pNorm = Math.min(1, Math.max(0, (rProg - 0.25) / 0.33));
          _tmpColor.copy(_skyBlack).lerp(_skyPlasma, Math.sin(pNorm * Math.PI));
          (scene.background as THREE.Color).copy(_tmpColor);
          esmGroup.visible = false;
          earthGroup.visible = true;
          earthGroup.position.set(0, -10.5, -6);
          earthGroup.scale.setScalar(2.2);

          // Intense heat shield glow & GLSL plasma bow-shock envelope
          const heatIntensity = 0.65 + Math.sin(pNorm * Math.PI) * 0.9;
          heatShieldMat.emissive.set('#f97316');
          heatShieldMat.emissiveIntensity = heatIntensity * 1.6;
          bowShockMat.uniforms.uIntensity.value = 0.75 + Math.sin(pNorm * Math.PI) * 0.35;
          plasmaPoints.visible = true;

          const posAttr = plasmaGeo.attributes.position as THREE.BufferAttribute;
          const colAttr = plasmaGeo.attributes.color as THREE.BufferAttribute;
          for (let i = 0; i < plasmaCount; i++) {
            const ang = plasmaSeed[i * 2] + elapsed * 3.5;
            const flow = (plasmaSeed[i * 2 + 1] + elapsed * 2.8) % 1;
            const r = 1.35 + flow * 0.95;
            posAttr.setXYZ(i, Math.cos(ang) * r, 0.3 + flow * 2.9, Math.sin(ang) * r);
            colAttr.setXYZ(i, 1.0, 0.45 + (1 - flow) * 0.45, 0.12);
          }
          posAttr.needsUpdate = true;
          colAttr.needsUpdate = true;

          const shake = 0.045;
          orionRoot.position.set(
            (Math.random() - 0.5) * shake,
            0.2 + (Math.random() - 0.5) * shake,
            0
          );
          orionRoot.rotation.set(-0.65, elapsed * 0.4, 0.15);

          _vec3A.set(4.1, 1.3, 4.8);
          camera.position.lerp(_vec3A, 1 - Math.exp(-5 * delta));
          camera.lookAt(0, 0.8, 0);
        } else if (moment === 'PARACHUTES') {
          const pNorm = Math.min(1, Math.max(0, (rProg - 0.58) / 0.26));
          _tmpColor.copy(_skyAtmos).lerp(_skyOcean, pNorm);
          (scene.background as THREE.Color).copy(_tmpColor);
          stars.visible = false;
          esmGroup.visible = false;
          parachutesGroup.visible = true;
          parachutesGroup.scale.setScalar(THREE.MathUtils.lerp(0.2, 1.0, Math.min(1, pNorm * 2.2)));

          orionRoot.scale.setScalar(0.85);
          orionRoot.position.set(Math.sin(elapsed * 1.4) * 0.18, 0.1, 0);
          orionRoot.rotation.set(0, elapsed * 0.15, Math.sin(elapsed * 1.4) * 0.08);

          _vec3A.set(5.6, 2.2, 7.6);
          camera.position.lerp(_vec3A, 1 - Math.exp(-4 * delta));
          camera.lookAt(0, 1.9, 0);
        } else if (moment === 'SPLASHDOWN') {
          (scene.background as THREE.Color).copy(_skyOcean);
          stars.visible = false;
          esmGroup.visible = false;
          flotationCollar.visible = true;
          oceanMesh.visible = true;

          orionRoot.scale.setScalar(0.95);
          orionRoot.position.set(0, -0.58 + Math.sin(elapsed * 1.8) * 0.08, 0);
          orionRoot.rotation.set(
            Math.sin(elapsed * 1.4) * 0.06,
            elapsed * 0.08,
            Math.cos(elapsed * 1.6) * 0.06
          );

          _vec3A.set(4.8, 1.8, 5.8);
          camera.position.lerp(_vec3A, 1 - Math.exp(-3.5 * delta));
          camera.lookAt(0, 0.3, 0);
        }
      }
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      updateScene(delta, elapsed);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      envTex.dispose();
      tileTex.dispose();
      solarTex.dispose();
      moonTex.dispose();
      earthTex.dispose();
      chuteTex.dispose();
      renderer.dispose();
    };
  }, []);

  if (webglError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#060b16] text-slate-300 p-6 text-center">
        <p className="font-display text-lg font-semibold text-cyan-300">
          Visualizador 3D Orion em Modo de Contingência
        </p>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          WebGL indisponível neste dispositivo. Os cálculos de telemetria, orçamento e simulação permanecem 100% ativos.
        </p>
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full relative select-none" />;
};
