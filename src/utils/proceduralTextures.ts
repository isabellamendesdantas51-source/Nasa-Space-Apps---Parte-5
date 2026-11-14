import * as THREE from 'three';

export function createOrionTileTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 512, 512);

  // Thermal protection tile grid
  const cols = 16;
  const rows = 16;
  const cw = 512 / cols;
  const ch = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shade = 224 + ((r * 7 + c * 13) % 24) - 12;
      ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 9})`;
      ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(c * cw + 0.5, r * ch + 0.5, cw - 1, ch - 1);
    }
  }

  // Subtle dark accent band near base
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 468, 512, 44);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function createSolarCellTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#071329';
  ctx.fillRect(0, 0, 512, 256);

  const cols = 16;
  const rows = 6;
  const cw = 512 / cols;
  const ch = 256 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const grad = ctx.createLinearGradient(c * cw, r * ch, (c + 1) * cw, (r + 1) * ch);
      grad.addColorStop(0, '#0f2952');
      grad.addColorStop(0.5, '#173e7a');
      grad.addColorStop(1, '#0b1e3d');
      ctx.fillStyle = grad;
      ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
    }
  }

  // Silver conductive busbars
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.lineWidth = 1.5;
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * ch);
    ctx.lineTo(512, r * ch);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createMoonTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base regolith
  ctx.fillStyle = '#8b9099';
  ctx.fillRect(0, 0, 1024, 512);

  // Maria (dark basalt plains)
  const maria = [
    { x: 260, y: 200, rx: 140, ry: 95, a: 0.42 },
    { x: 420, y: 170, rx: 110, ry: 85, a: 0.35 },
    { x: 640, y: 270, rx: 130, ry: 80, a: 0.3 },
    { x: 180, y: 310, rx: 95, ry: 70, a: 0.28 },
  ];
  maria.forEach((m) => {
    const g = ctx.createRadialGradient(m.x, m.y, 10, m.x, m.y, m.rx);
    g.addColorStop(0, `rgba(45, 50, 58, ${m.a})`);
    g.addColorStop(1, 'rgba(45, 50, 58, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx, m.ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Deterministic procedural craters
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 190; i++) {
    const cx = rand() * 1024;
    const cy = 24 + rand() * 464;
    const r = 4 + rand() * 28;
    const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
    g.addColorStop(0, 'rgba(55, 60, 68, 0.65)');
    g.addColorStop(0.75, 'rgba(105, 110, 118, 0.4)');
    g.addColorStop(0.92, 'rgba(215, 220, 228, 0.65)');
    g.addColorStop(1, 'rgba(139, 144, 153, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createEarthTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const ocean = ctx.createLinearGradient(0, 0, 0, 512);
  ocean.addColorStop(0, '#0c3b6e');
  ocean.addColorStop(0.5, '#072a57');
  ocean.addColorStop(1, '#0c3b6e');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, 1024, 512);

  // Stylized landmass patches
  const continents = [
    { x: 250, y: 185, r: 95, c: '#2e6f40' },
    { x: 310, y: 310, r: 65, c: '#357a48' },
    { x: 560, y: 180, r: 105, c: '#3d7d47' },
    { x: 640, y: 245, r: 85, c: '#8c7a4b' },
    { x: 780, y: 330, r: 55, c: '#7a6842' },
  ];
  continents.forEach((land) => {
    const g = ctx.createRadialGradient(land.x, land.y, 12, land.x, land.y, land.r);
    g.addColorStop(0, land.c);
    g.addColorStop(0.7, land.c);
    g.addColorStop(1, 'rgba(7, 42, 87, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(land.x, land.y, land.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Polar ice caps
  ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
  ctx.fillRect(0, 0, 1024, 24);
  ctx.fillRect(0, 488, 1024, 24);

  // Swirling atmospheric clouds
  let seed = 99;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 120; i++) {
    const x = rand() * 1024;
    const y = 30 + rand() * 452;
    const rx = 25 + rand() * 90;
    const ry = 8 + rand() * 20;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.12 + rand() * 0.28})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (rand() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createParachuteTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const stripes = 12;
  const sw = 512 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#f8fafc';
    ctx.fillRect(i * sw, 0, sw, 256);
  }
  // Horizontal reinforcement band
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.fillRect(0, 118, 512, 16);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
