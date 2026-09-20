import * as THREE from 'three';

const textureCache = new Map();

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function canvasTexture(key, painter, { color = false, repeat = [3, 3] } = {}) {
  if (textureCache.has(key)) return textureCache.get(key);

  const size = 384;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha: false });
  painter(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 8;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;

  textureCache.set(key, texture);
  return texture;
}

function paintWood(ctx, size, palette, seed, dense = false) {
  const rand = seeded(seed);
  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let y = 0; y < size; y += 1) {
    const macro = Math.sin(y * 0.092 + Math.sin(y * 0.017) * 3.4) * 0.5 + 0.5;
    for (let x = 0; x < size; x += 1) {
      const drift = Math.sin((x * 0.012) + (y * 0.004)) * 4.5;
      const grain = Math.sin((y + drift) * (dense ? 0.72 : 0.46) + Math.sin(y * 0.021) * 4.0) * 0.5 + 0.5;
      const fine = (rand() - 0.5) * 0.16;
      const value = Math.max(0, Math.min(1, grain * 0.52 + macro * 0.32 + fine + 0.16));
      const i = (y * size + x) * 4;
      data[i] = palette[0] + (palette[3] - palette[0]) * value;
      data[i + 1] = palette[1] + (palette[4] - palette[1]) * value;
      data[i + 2] = palette[2] + (palette[5] - palette[2]) * value;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  ctx.globalAlpha = 0.13;
  for (let i = 0; i < 92; i += 1) {
    const y = rand() * size;
    ctx.strokeStyle = rand() > 0.5 ? '#0a0705' : '#d4a16f';
    ctx.lineWidth = 0.4 + rand() * 1.1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 22) {
      ctx.lineTo(x, y + Math.sin(x * 0.026 + rand() * 2.5) * (2 + rand() * 4));
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function paintRoughness(ctx, size, seed, min = 86, max = 198, direction = 'organic') {
  const rand = seeded(seed);
  const image = ctx.createImageData(size, size);
  const data = image.data;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const wave = direction === 'brushed'
        ? Math.sin(y * 0.36 + Math.sin(x * 0.015) * 1.5) * 0.5 + 0.5
        : Math.sin((x + y) * 0.035 + Math.sin(y * 0.022) * 2.5) * 0.5 + 0.5;
      const v = Math.round(min + (max - min) * Math.max(0, Math.min(1, wave * 0.64 + rand() * 0.36)));
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function paintFabric(ctx, size, warm = false) {
  ctx.fillStyle = warm ? '#4f3529' : '#24282b';
  ctx.fillRect(0, 0, size, size);

  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 4) {
    ctx.strokeStyle = warm ? 'rgba(225,184,145,.11)' : 'rgba(255,255,255,.08)';
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.strokeStyle = warm ? 'rgba(30,16,10,.20)' : 'rgba(0,0,0,.24)';
    ctx.beginPath(); ctx.moveTo(0, i + 1); ctx.lineTo(size, i + 1); ctx.stroke();
  }
}

function paintFabricBump(ctx, size) {
  const image = ctx.createImageData(size, size);
  const data = image.data;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const weave = ((x % 4) < 2 ? 42 : -28) + ((y % 4) < 2 ? 32 : -24);
      const value = Math.max(20, Math.min(235, 128 + weave));
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function studioMaps() {
  return {
    walnut: canvasTexture('walnut-color', (ctx, size) => paintWood(ctx, size, [41, 19, 10, 110, 63, 35], 11), { color: true, repeat: [3.2, 4.8] }),
    walnutRough: canvasTexture('walnut-rough', (ctx, size) => paintRoughness(ctx, size, 12, 104, 176), { repeat: [3.2, 4.8] }),
    walnutBump: canvasTexture('walnut-bump', (ctx, size) => paintRoughness(ctx, size, 13, 82, 170), { repeat: [3.2, 4.8] }),

    oak: canvasTexture('oak-color', (ctx, size) => paintWood(ctx, size, [92, 49, 22, 185, 122, 70], 21, true), { color: true, repeat: [3.6, 5.2] }),
    oakRough: canvasTexture('oak-rough', (ctx, size) => paintRoughness(ctx, size, 22, 118, 196), { repeat: [3.6, 5.2] }),
    oakBump: canvasTexture('oak-bump', (ctx, size) => paintRoughness(ctx, size, 23, 88, 176), { repeat: [3.6, 5.2] }),

    fabric: canvasTexture('fabric-color', (ctx, size) => paintFabric(ctx, size, false), { color: true, repeat: [7, 7] }),
    fabricWarm: canvasTexture('fabric-warm-color', (ctx, size) => paintFabric(ctx, size, true), { color: true, repeat: [7, 7] }),
    fabricBump: canvasTexture('fabric-bump', paintFabricBump, { repeat: [7, 7] }),
    fabricRough: canvasTexture('fabric-rough', (ctx, size) => paintRoughness(ctx, size, 32, 205, 245), { repeat: [7, 7] }),

    brushedRough: canvasTexture('brushed-rough', (ctx, size) => paintRoughness(ctx, size, 42, 62, 138, 'brushed'), { repeat: [1.2, 5.8] }),
    brushedBump: canvasTexture('brushed-bump', (ctx, size) => paintRoughness(ctx, size, 43, 102, 150, 'brushed'), { repeat: [1.2, 5.8] }),
    rubberRough: canvasTexture('rubber-rough', (ctx, size) => paintRoughness(ctx, size, 52, 190, 242), { repeat: [5, 5] }),
    rubberBump: canvasTexture('rubber-bump', (ctx, size) => paintRoughness(ctx, size, 53, 92, 156), { repeat: [5, 5] })
  };
}

function prepareMap(texture, rotation = 0) {
  if (!texture) return texture;
  texture.center.set(0.5, 0.5);
  texture.rotation = rotation;
  return texture;
}

function tuneMaterial(material, objectName = '') {
  const maps = studioMaps();
  const name = (material.name || '').toLowerCase();
  const object = objectName.toLowerCase();
  const clone = material.clone();

  clone.envMapIntensity = 1.15;

  if (name.includes('walnut') || object.includes('diffuser') || object.includes('wood_floor')) {
    clone.map = maps.walnut;
    clone.roughnessMap = maps.walnutRough;
    clone.bumpMap = maps.walnutBump;
    clone.bumpScale = 0.022;
    clone.color.set('#ffffff');
    clone.roughness = 0.48;
    clone.metalness = 0.02;
    if ('clearcoat' in clone) {
      clone.clearcoat = 0.12;
      clone.clearcoatRoughness = 0.52;
    }
  } else if (name.includes('oak')) {
    clone.map = maps.oak;
    clone.roughnessMap = maps.oakRough;
    clone.bumpMap = maps.oakBump;
    clone.bumpScale = 0.018;
    clone.color.set('#ffffff');
    clone.roughness = 0.54;
    clone.metalness = 0.01;
  } else if (name.includes('fabric_warm')) {
    clone.map = maps.fabricWarm;
    clone.roughnessMap = maps.fabricRough;
    clone.bumpMap = maps.fabricBump;
    clone.bumpScale = 0.035;
    clone.color.set('#ffffff');
    clone.roughness = 0.97;
    clone.metalness = 0;
  } else if (name.includes('fabric')) {
    clone.map = maps.fabric;
    clone.roughnessMap = maps.fabricRough;
    clone.bumpMap = maps.fabricBump;
    clone.bumpScale = 0.032;
    clone.color.set('#ffffff');
    clone.roughness = 0.98;
    clone.metalness = 0;
  } else if (name.includes('brushed')) {
    clone.roughnessMap = prepareMap(maps.brushedRough, Math.PI * 0.5);
    clone.bumpMap = prepareMap(maps.brushedBump, Math.PI * 0.5);
    clone.bumpScale = 0.008;
    clone.metalness = 0.82;
    clone.roughness = 0.27;
    if ('clearcoat' in clone) clone.clearcoat = 0.08;
  } else if (name.includes('metal_anodized') || (name.includes('metal') && !name.includes('brushed'))) {
    clone.roughnessMap = maps.brushedRough;
    clone.bumpMap = maps.brushedBump;
    clone.bumpScale = 0.004;
    clone.metalness = 0.76;
    clone.roughness = 0.31;
  } else if (name.includes('rubber')) {
    clone.roughnessMap = maps.rubberRough;
    clone.bumpMap = maps.rubberBump;
    clone.bumpScale = 0.018;
    clone.roughness = 0.9;
    clone.metalness = 0;
  } else if (name.includes('studio_glass') || name.includes('glass')) {
    clone.roughness = 0.09;
    clone.metalness = 0.02;
    clone.transparent = true;
    clone.opacity = Math.min(clone.opacity ?? 1, 0.42);
    clone.depthWrite = false;
    if ('transmission' in clone) {
      clone.transmission = 0.78;
      clone.ior = 1.46;
      clone.thickness = 0.025;
    }
  } else if (name.includes('screen')) {
    clone.roughness = 0.16;
    clone.metalness = 0.22;
    clone.emissive = new THREE.Color('#071f24');
    clone.emissiveIntensity = 0.35;
    if ('clearcoat' in clone) clone.clearcoat = 0.2;
  } else if (name.includes('led_')) {
    clone.toneMapped = false;
    clone.emissiveIntensity = Math.max(clone.emissiveIntensity || 1, 2.2);
  } else if (name.includes('ceramic')) {
    clone.roughness = 0.4;
    clone.metalness = 0.04;
    if ('clearcoat' in clone) clone.clearcoat = 0.08;
  } else if (name.includes('ash')) {
    clone.map = maps.walnut;
    clone.roughnessMap = maps.walnutRough;
    clone.bumpMap = maps.walnutBump;
    clone.bumpScale = 0.012;
    clone.color.set('#625a55');
    clone.roughness = 0.66;
    clone.metalness = 0.01;
  }

  clone.needsUpdate = true;
  return clone;
}

export function directStudioMaterials(scene) {
  scene.traverse((object) => {
    if (!object.isMesh) return;

    object.castShadow = object.castShadow !== false;
    object.receiveShadow = true;

    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => tuneMaterial(material, object.name));
    } else if (object.material) {
      object.material = tuneMaterial(object.material, object.name);
    }

    const n = object.name.toLowerCase();
    if (n.includes('glass') || n.includes('led') || n.includes('screen')) {
      object.castShadow = false;
    }
  });

  return scene;
}
