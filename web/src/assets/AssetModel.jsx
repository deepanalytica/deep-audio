import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { getAsset, resolveAssetUrl } from './assetRegistry.js';
import { directStudioMaterials } from '../visual/materialDirector.js';

export function AssetFallback({ asset, children }) {
  return <group
    name={`${asset.id}_fallback`}
    userData={{ assetId: asset.id, assetVersion: asset.version, source: 'procedural-fallback' }}
  >
    {children}
  </group>;
}

function cloneSceneWithMaterials(scene) {
  const clone = scene.clone(true);
  directStudioMaterials(clone);
  return clone;
}

function LoadedAsset({ asset }) {
  const { scene } = useGLTF(resolveAssetUrl(asset));
  const directedScene = useMemo(() => cloneSceneWithMaterials(scene), [scene]);

  return <primitive
    object={directedScene}
    name={asset.id}
    dispose={null}
  />;
}

class AssetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn(`[AssetModel] Falling back for ${this.props.asset.id}`, error);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export default function AssetModel({ assetId, fallback, ...props }) {
  const asset = getAsset(assetId);
  const fallbackNode = <AssetFallback asset={asset}>{fallback}</AssetFallback>;

  return <group {...props} name={`${asset.id}_mount`}>
    {!asset.available
      ? fallbackNode
      : <AssetErrorBoundary asset={asset} fallback={fallbackNode}>
          <React.Suspense fallback={fallbackNode}>
            <LoadedAsset asset={asset}/>
          </React.Suspense>
        </AssetErrorBoundary>}
  </group>;
}
