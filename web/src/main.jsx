import React from 'react';
import { createRoot } from 'react-dom/client';
import { useGLTF } from '@react-three/drei';
import App from './App.jsx';
import { getAsset, resolveAssetUrl } from './assets/assetRegistry.js';
import './styles.css';

[
  'practice_room_001',
  'recording_room_001',
  'mix_room_001',
  'mastering_room_001'
].forEach((assetId)=>{
  const asset=getAsset(assetId);
  if(asset.available)useGLTF.preload(resolveAssetUrl(asset));
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
