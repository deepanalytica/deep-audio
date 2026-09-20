const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const ASSET_REGISTRY = Object.freeze({
  practice_room_001: {
    id: 'practice_room_001',
    name: 'Practice Room 001',
    category: 'room',
    version: '2.0.0',
    glb: 'models/practice/room/practice_room_001.glb',
    available: true
  },
  recording_room_001: {
    id: 'recording_room_001',
    name: 'Recording Room 001',
    category: 'room',
    version: '2.0.0',
    glb: 'models/recording/room/recording_room_001.glb',
    available: true
  },
  production_room_001: {
    id: 'production_room_001',
    name: 'Production Room 001',
    category: 'room',
    version: '2.0.0',
    glb: 'models/production/room/production_room_001.glb',
    available: true
  },
  mix_room_001: {
    id: 'mix_room_001',
    name: 'Mix Room 001',
    category: 'room',
    version: '2.0.0',
    glb: 'models/mix/room/mix_room_001.glb',
    available: true
  },
  mastering_room_001: {
    id: 'mastering_room_001',
    name: 'Mastering Room 001',
    category: 'room',
    version: '1.0.0',
    glb: 'models/mastering/room/mastering_room_001.glb',
    available: true
  },
  mastering_console_001: {
    id: 'mastering_console_001',
    name: 'Deep Reference Mastering Console',
    category: 'console',
    version: '0.1.0',
    glb: 'models/mastering/console/mastering_console_001.glb',
    available: false
  },
  mastering_monitor_001: {
    id: 'mastering_monitor_001',
    name: 'Deep Reference Main Monitor',
    category: 'monitors',
    version: '0.1.0',
    glb: 'models/mastering/monitors/mastering_monitor_001.glb',
    available: false
  },
  mastering_rack_eq_001: {
    id: 'mastering_rack_eq_001',
    name: 'Deep Precision EQ Rack',
    category: 'racks',
    version: '0.1.0',
    glb: 'models/mastering/racks/mastering_rack_eq_001.glb',
    available: false
  },
  mastering_rack_dynamics_001: {
    id: 'mastering_rack_dynamics_001',
    name: 'Deep Dynamics and Limiter Rack',
    category: 'racks',
    version: '0.1.0',
    glb: 'models/mastering/racks/mastering_rack_dynamics_001.glb',
    available: false
  },
  mastering_chair_001: {
    id: 'mastering_chair_001',
    name: 'Deep Listening Chair',
    category: 'furniture',
    version: '0.1.0',
    glb: 'models/mastering/furniture/mastering_chair_001.glb',
    available: false
  }
});

export function getAsset(assetId) {
  const asset = ASSET_REGISTRY[assetId];
  if (!asset) throw new Error(`Unknown studio asset: ${assetId}`);
  return asset;
}

export function resolveAssetUrl(asset) {
  return `${baseUrl}${asset.glb}`;
}
