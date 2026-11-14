import * as THREE from 'three';

/**
 * 1. GLSL Earth Atmospheric Fresnel Scattering Shader
 */
export function createEarthAtmosphereShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uGlowColor: { value: new THREE.Color('#38bdf8') },
      uDeepColor: { value: new THREE.Color('#0284c7') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uGlowColor;
      uniform vec3 uDeepColor;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        float rim = clamp(1.0 - abs(dot(vNormal, vViewDir)), 0.0, 1.0);
        float intensity = pow(rim, 3.2);
        float pulse = 0.92 + 0.08 * sin(uTime * 1.8);
        vec3 col = mix(uDeepColor, uGlowColor, rim);
        gl_FragColor = vec4(col * 1.35 * pulse, intensity * 0.85);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

/**
 * 2. GLSL Reentry Plasma Bow-Shock Shader (Moment B)
 */
export function createReentryPlasmaShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vec3 pos = position;
        // High-frequency aerodynamic plasma ripple along the shock envelope
        float ripple = sin(pos.y * 14.0 - uTime * 24.0) * cos(pos.x * 11.0 + uTime * 16.0);
        pos += normal * (ripple * 0.035 * uIntensity);
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        if (uIntensity <= 0.01) discard;

        vec2 flowUv = vec2(vUv.x * 6.0, vUv.y * 4.0 - uTime * 3.8);
        float n1 = noise(flowUv);
        float n2 = noise(flowUv * 2.2 + vec2(uTime * 1.4, -uTime * 2.5));
        float plasma = clamp(n1 * 0.6 + n2 * 0.4, 0.0, 1.0);

        float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 1.6);
        float heatBand = smoothstep(0.05, 0.85, 1.0 - vUv.y);

        vec3 coreWhite = vec3(1.0, 0.96, 0.86);
        vec3 midOrange = vec3(1.0, 0.45, 0.06);
        vec3 tailRed = vec3(0.85, 0.12, 0.05);

        vec3 col = mix(tailRed, midOrange, plasma);
        col = mix(col, coreWhite, smoothstep(0.55, 0.95, plasma * heatBand));

        float alpha = clamp((0.28 + fresnel * 0.65) * (0.55 + plasma * 0.45) * uIntensity, 0.0, 0.92);
        gl_FragColor = vec4(col * 1.4, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/**
 * 3. GLSL Engine Exhaust Volumetric Plume Shader (AJ10 + Shock Diamonds)
 */
export function createEnginePlumeShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uThrottle: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uThrottle;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 pos = position;
        float flutter = sin(pos.y * 10.0 + uTime * 32.0) * 0.04 * (1.0 - vUv.y);
        pos.x += flutter;
        pos.z += cos(pos.y * 9.0 + uTime * 28.0) * 0.04 * (1.0 - vUv.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uThrottle;
      varying vec2 vUv;

      void main() {
        if (uThrottle <= 0.01) discard;

        // vUv.y = 1.0 at nozzle exit, 0.0 at tail tip
        float axial = vUv.y;
        float shock = 0.5 + 0.5 * sin(axial * 28.0 + uTime * 36.0);
        float flicker = 0.85 + 0.15 * sin(uTime * 45.0 + vUv.x * 12.0);

        vec3 blueCore = vec3(0.25, 0.82, 1.0);
        vec3 whiteHot = vec3(0.95, 0.98, 1.0);
        vec3 orangeTail = vec3(1.0, 0.48, 0.08);

        vec3 col = mix(orangeTail, blueCore, smoothstep(0.25, 0.85, axial));
        col = mix(col, whiteHot, smoothstep(0.65, 1.0, axial) * shock);

        float alpha = smoothstep(0.0, 0.7, axial) * flicker * uThrottle * 0.78;
        gl_FragColor = vec4(col * 1.45, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/**
 * 4. GLSL Animated Pacific Ocean Wave Shader (Splashdown Moment D)
 */
export function createOceanWaveShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color('#06345c') },
      uShallowColor: { value: new THREE.Color('#0ea5e9') },
      uSunDir: { value: new THREE.Vector3(0.6, 0.55, 0.58).normalize() },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying float vWaveHeight;
      varying vec3 vApproxNormal;

      float waveFn(vec2 p, float t) {
        float w1 = sin(p.x * 0.42 + t * 1.9) * 0.16;
        float w2 = cos(p.y * 0.52 + t * 1.45) * 0.13;
        float w3 = sin((p.x + p.y) * 0.75 - t * 2.3) * 0.06;
        return w1 + w2 + w3;
      }

      void main() {
        vec3 pos = position;
        float h = waveFn(pos.xz, uTime);
        pos.y += h;

        // Finite difference normal for crisp specular highlights
        float eps = 0.25;
        float hx = waveFn(pos.xz + vec2(eps, 0.0), uTime);
        float hz = waveFn(pos.xz + vec2(0.0, eps), uTime);
        vec3 n = normalize(vec3(h - hx, eps, h - hz));

        vWaveHeight = h;
        vApproxNormal = n;
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSunDir;
      varying vec3 vWorldPos;
      varying float vWaveHeight;
      varying vec3 vApproxNormal;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 normal = normalize(vApproxNormal);

        float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);
        float crest = smoothstep(-0.2, 0.28, vWaveHeight);
        vec3 baseCol = mix(uDeepColor, uShallowColor, crest * 0.45 + fresnel * 0.5);

        vec3 halfVec = normalize(uSunDir + viewDir);
        float spec = pow(max(0.0, dot(normal, halfVec)), 72.0);
        vec3 finalCol = baseCol + vec3(1.0, 0.97, 0.9) * spec * 0.85;

        float dist = length(vWorldPos.xz);
        float horizonFade = smoothstep(42.0, 18.0, dist);
        vec3 skyHorizon = vec3(0.22, 0.45, 0.66);
        finalCol = mix(skyHorizon, finalCol, horizonFade);

        gl_FragColor = vec4(finalCol, 1.0);
      }
    `,
  });
}
