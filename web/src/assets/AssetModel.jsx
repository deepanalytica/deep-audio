import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { getAsset, resolveAssetUrl } from './assetRegistry.js';
import { directStudioMaterials } from '../visual/materialDirector.js';
import { useStudioStore } from '../store.js';

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
  const markCriticalAssetReady = useStudioStore((state) => state.markCriticalAssetReady);
  const directedScene = useMemo(() => cloneSceneWithMaterials(scene), [scene]);

  useEffect(() => {
    if (asset.category === 'room') markCriticalAssetReady(asset.id, 'glb');
  }, [asset.category, asset.id, markCriticalAssetReady]);

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
    this.props.onFailure?.();
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function UnavailableAsset({ asset, fallbackNode }) {
  const markCriticalAssetReady = useStudioStore((state) => state.markCriticalAssetReady);

  useEffect(() => {
    if (asset.category === 'room') markCriticalAssetReady(asset.id, 'procedural-fallback');
  }, [asset.category, asset.id, markCriticalAssetReady]);

  return fallbackNode;
}

export default function AssetModel({ assetId, fallback, ...props }) {
  const asset = getAsset(assetId);
  const markCriticalAssetReady = useStudioStore((state) => state.markCriticalAssetReady);
  const fallbackNode = <AssetFallback asset={asset}>{fallback}</AssetFallback>;

  if (!asset.available) {
    return <group {...props} name={`${asset.id}_mount`}>
      <UnavailableAsset asset={asset} fallbackNode={fallbackNode}/>
    </group>;
  }

  return <group {...props} name={`${asset.id}_mount`}>
    <AssetErrorBoundary
      asset={asset}
      fallback={fallbackNode}
      onFailure={() => {
        if (asset.category === 'room') markCriticalAssetReady(asset.id, 'error-fallback');
      }}
    >
      <React.Suspense fallback={null}>
        <LoadedAsset asset={asset}/>
      </React.Suspense>
    </AssetErrorBoundary>
  </group>;
}
