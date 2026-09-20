import React from 'react';
import { createRoot } from 'react-dom/client';
import { useGLTF } from '@react-three/drei';
import App from './App.jsx';
import { getAsset, resolveAssetUrl } from './assets/assetRegistry.js';
import './styles.css';

const initialRoomAsset = getAsset('practice_room_001');
if (initialRoomAsset.available) {
  useGLTF.preload(resolveAssetUrl(initialRoomAsset));
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
