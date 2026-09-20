import React from 'react';
import { createRoot } from 'react-dom/client';
import { useGLTF } from '@react-three/drei';
import App from './App.jsx';
import { getAsset, resolveAssetUrl } from './assets/assetRegistry.js';
import './styles.css';

const initialAsset=getAsset('practice_room_001');
if(initialAsset.available)useGLTF.preload(resolveAssetUrl(initialAsset));

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
