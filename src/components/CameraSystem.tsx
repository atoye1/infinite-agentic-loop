/**
 * Advanced Camera System
 * Smooth camera movements, zoom effects, and cinematic transitions
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { createAdvancedAnimation, EasingFunctions } from '../utils/AnimationUtils';

export interface CameraKeyframe {
  frame: number;
  position: { x: number; y: number };
  zoom: number;
  rotation: number;
  duration?: number;
  easing?: keyof typeof EasingFunctions;
}

export interface CameraConfig {
  enabled: boolean;
  followLeader: boolean;
  smoothness: number; // 0-1, higher = smoother
  keyframes: CameraKeyframe[];
  autoZoom: {
    enabled: boolean;
    onOvertake: boolean;
    onRecord: boolean;
    intensity: number; // 0-1
    duration: number; // seconds
  };
  shake: {
    enabled: boolean;
    intensity: number;
    frequency: number;
    triggers: ('overtake' | 'record' | 'milestone')[];
  };
  cinematicEffects: {
    depthOfField: boolean;
    vignette: boolean;
    chromaticAberration: boolean;
    filmGrain: boolean;
  };
}

interface CameraSystemProps {
  config: CameraConfig;
  containerWidth: number;
  containerHeight: number;
  children: React.ReactNode;
  leaderPosition?: { x: number; y: number };
  isOvertaking?: boolean;
  isNewRecord?: boolean;
  milestoneTriggered?: boolean;
}

export const CameraSystem: React.FC<CameraSystemProps> = ({
  config,
  containerWidth,
  containerHeight,
  children,
  leaderPosition,
  isOvertaking = false,
  isNewRecord = false,
  milestoneTriggered = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!config.enabled) {
    return <div style={{ width: containerWidth, height: containerHeight }}>{children}</div>;
  }

  // Calculate camera position and zoom
  const cameraTransform = calculateCameraTransform(
    config,
    frame,
    fps,
    containerWidth,
    containerHeight,
    leaderPosition,
    isOvertaking,
    isNewRecord,
    milestoneTriggered
  );

  return (
    <div
      style={{
        width: containerWidth,
        height: containerHeight,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Camera viewport */}
      <div
        style={{
          width: containerWidth,
          height: containerHeight,
          transform: `
            translate(${cameraTransform.x}px, ${cameraTransform.y}px) 
            scale(${cameraTransform.zoom}) 
            rotate(${cameraTransform.rotation}deg)
          `,
          transformOrigin: 'center center',
          transition: config.smoothness > 0 ? `transform ${config.smoothness}s ease-out` : 'none',
        }}
      >
        {children}
      </div>

      {/* Cinematic effects overlay */}
      {config.cinematicEffects && (
        <CinematicEffects
          config={config.cinematicEffects}
          frame={frame}
          fps={fps}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          intensity={cameraTransform.effectsIntensity}
        />
      )}
    </div>
  );
};

const calculateCameraTransform = (
  config: CameraConfig,
  frame: number,
  fps: number,
  containerWidth: number,
  containerHeight: number,
  leaderPosition?: { x: number; y: number },
  isOvertaking: boolean = false,
  isNewRecord: boolean = false,
  milestoneTriggered: boolean = false
) => {
  let baseTransform = {
    x: 0,
    y: 0,
    zoom: 1,
    rotation: 0,
    effectsIntensity: 0,
  };

  // Apply keyframe animations
  if (config.keyframes.length > 0) {
    baseTransform = applyKeyframeAnimation(config.keyframes, frame, fps);
  }

  // Follow leader logic
  if (config.followLeader && leaderPosition) {
    const followTransform = calculateFollowTransform(
      leaderPosition,
      containerWidth,
      containerHeight,
      config.smoothness
    );
    
    baseTransform.x += followTransform.x;
    baseTransform.y += followTransform.y;
  }

  // Auto zoom effects
  if (config.autoZoom.enabled) {
    const zoomEffect = calculateAutoZoom(
      config.autoZoom,
      frame,
      fps,
      isOvertaking,
      isNewRecord
    );
    
    baseTransform.zoom *= zoomEffect;
    baseTransform.effectsIntensity = Math.max(baseTransform.effectsIntensity, zoomEffect - 1);
  }

  // Shake effects
  if (config.shake.enabled) {
    const shakeEffect = calculateShakeEffect(
      config.shake,
      frame,
      fps,
      isOvertaking,
      isNewRecord,
      milestoneTriggered
    );
    
    baseTransform.x += shakeEffect.x;
    baseTransform.y += shakeEffect.y;
    baseTransform.effectsIntensity = Math.max(baseTransform.effectsIntensity, shakeEffect.intensity);
  }

  return baseTransform;
};

const applyKeyframeAnimation = (
  keyframes: CameraKeyframe[],
  frame: number,
  fps: number
) => {
  // Sort keyframes by frame
  const sortedKeyframes = [...keyframes].sort((a, b) => a.frame - b.frame);
  
  // Find current keyframe segment
  let currentKeyframe = sortedKeyframes[0];
  let nextKeyframe = sortedKeyframes[1];
  
  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    if (frame >= sortedKeyframes[i].frame && frame <= sortedKeyframes[i + 1].frame) {
      currentKeyframe = sortedKeyframes[i];
      nextKeyframe = sortedKeyframes[i + 1];
      break;
    }
  }
  
  if (!nextKeyframe) {
    return {
      x: currentKeyframe.position.x,
      y: currentKeyframe.position.y,
      zoom: currentKeyframe.zoom,
      rotation: currentKeyframe.rotation,
      effectsIntensity: 0,
    };
  }
  
  // Calculate interpolation progress
  const segmentDuration = nextKeyframe.frame - currentKeyframe.frame;
  const segmentProgress = (frame - currentKeyframe.frame) / segmentDuration;
  
  // Apply easing
  const easing = currentKeyframe.easing || 'easeInOutCubic';
  const easedProgress = EasingFunctions[easing](Math.max(0, Math.min(1, segmentProgress)));
  
  return {
    x: interpolate(easedProgress, [0, 1], [currentKeyframe.position.x, nextKeyframe.position.x]),
    y: interpolate(easedProgress, [0, 1], [currentKeyframe.position.y, nextKeyframe.position.y]),
    zoom: interpolate(easedProgress, [0, 1], [currentKeyframe.zoom, nextKeyframe.zoom]),
    rotation: interpolate(easedProgress, [0, 1], [currentKeyframe.rotation, nextKeyframe.rotation]),
    effectsIntensity: 0,
  };
};

const calculateFollowTransform = (
  leaderPosition: { x: number; y: number },
  containerWidth: number,
  containerHeight: number,
  smoothness: number
) => {
  // Calculate offset to keep leader in center
  const targetX = containerWidth / 2 - leaderPosition.x;
  const targetY = containerHeight / 2 - leaderPosition.y;
  
  // Apply smoothness (in a real implementation, this would use previous frame data)
  const followX = targetX * (1 - smoothness);
  const followY = targetY * (1 - smoothness);
  
  return { x: followX, y: followY };
};

const calculateAutoZoom = (
  autoZoomConfig: CameraConfig['autoZoom'],
  frame: number,
  fps: number,
  isOvertaking: boolean,
  isNewRecord: boolean
) => {
  let zoomMultiplier = 1;
  
  if ((autoZoomConfig.onOvertake && isOvertaking) || (autoZoomConfig.onRecord && isNewRecord)) {
    const zoomDuration = autoZoomConfig.duration * fps;
    const zoomProgress = Math.min(1, frame / zoomDuration);
    
    // Create zoom-in then zoom-out effect
    const zoomCurve = Math.sin(zoomProgress * Math.PI);
    zoomMultiplier = 1 + (autoZoomConfig.intensity * zoomCurve);
  }
  
  return zoomMultiplier;
};

const calculateShakeEffect = (
  shakeConfig: CameraConfig['shake'],
  frame: number,
  fps: number,
  isOvertaking: boolean,
  isNewRecord: boolean,
  milestoneTriggered: boolean
) => {
  let shouldShake = false;
  let shakeIntensity = 0;
  
  // Check if any trigger conditions are met
  if (shakeConfig.triggers.includes('overtake') && isOvertaking) {
    shouldShake = true;
    shakeIntensity = 0.7;
  }
  
  if (shakeConfig.triggers.includes('record') && isNewRecord) {
    shouldShake = true;
    shakeIntensity = 1.0;
  }
  
  if (shakeConfig.triggers.includes('milestone') && milestoneTriggered) {
    shouldShake = true;
    shakeIntensity = 0.5;
  }
  
  if (!shouldShake) {
    return { x: 0, y: 0, intensity: 0 };
  }
  
  // Generate shake offset
  const time = frame / fps;
  const frequency = shakeConfig.frequency;
  const intensity = shakeConfig.intensity * shakeIntensity;
  
  const shakeX = Math.sin(time * frequency * 2 * Math.PI) * intensity;
  const shakeY = Math.cos(time * frequency * 2.5 * Math.PI) * intensity * 0.7;
  
  return {
    x: shakeX,
    y: shakeY,
    intensity: shakeIntensity,
  };
};

const CinematicEffects: React.FC<{
  config: CameraConfig['cinematicEffects'];
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
  intensity: number;
}> = ({ config, frame, fps, containerWidth, containerHeight, intensity }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Vignette effect */}
      {config.vignette && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle, transparent 30%, rgba(0,0,0,${0.3 + intensity * 0.4}) 100%)`,
            opacity: 0.7 + intensity * 0.3,
          }}
        />
      )}
      
      {/* Depth of field blur on edges */}
      {config.depthOfField && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '20%',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1), transparent)',
              filter: `blur(${2 + intensity * 3}px)`,
              opacity: 0.5 + intensity * 0.3,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '20%',
              background: 'linear-gradient(0deg, rgba(0,0,0,0.1), transparent)',
              filter: `blur(${2 + intensity * 3}px)`,
              opacity: 0.5 + intensity * 0.3,
            }}
          />
        </>
      )}
      
      {/* Film grain */}
      {config.filmGrain && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.03 + intensity * 0.02,
            background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 ${containerWidth} ${containerHeight}' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
      )}
      
      {/* Chromatic aberration */}
      {config.chromaticAberration && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: intensity * 0.1,
            background: 'linear-gradient(45deg, #ff000020, transparent, #0000ff20)',
            mixBlendMode: 'screen',
            filter: `blur(${intensity * 0.5}px)`,
          }}
        />
      )}
    </div>
  );
};

// Preset camera configurations
export const CameraPresets = {
  static: {
    enabled: false,
    followLeader: false,
    smoothness: 0,
    keyframes: [],
    autoZoom: {
      enabled: false,
      onOvertake: false,
      onRecord: false,
      intensity: 0,
      duration: 0,
    },
    shake: {
      enabled: false,
      intensity: 0,
      frequency: 0,
      triggers: [],
    },
    cinematicEffects: {
      depthOfField: false,
      vignette: false,
      chromaticAberration: false,
      filmGrain: false,
    },
  } as CameraConfig,

  followLeader: {
    enabled: true,
    followLeader: true,
    smoothness: 0.8,
    keyframes: [],
    autoZoom: {
      enabled: true,
      onOvertake: true,
      onRecord: true,
      intensity: 0.2,
      duration: 2,
    },
    shake: {
      enabled: true,
      intensity: 5,
      frequency: 8,
      triggers: ['overtake', 'record'],
    },
    cinematicEffects: {
      depthOfField: false,
      vignette: true,
      chromaticAberration: false,
      filmGrain: false,
    },
  } as CameraConfig,

  cinematic: {
    enabled: true,
    followLeader: false,
    smoothness: 0.9,
    keyframes: [
      { frame: 0, position: { x: 0, y: 0 }, zoom: 1, rotation: 0, easing: 'easeInOutCubic' },
      { frame: 900, position: { x: -100, y: -50 }, zoom: 1.2, rotation: 2, easing: 'easeInOutCubic' },
      { frame: 1800, position: { x: 100, y: 0 }, zoom: 0.9, rotation: -1, easing: 'easeInOutCubic' },
      { frame: 2700, position: { x: 0, y: 50 }, zoom: 1.1, rotation: 0, easing: 'easeInOutCubic' },
    ],
    autoZoom: {
      enabled: true,
      onOvertake: true,
      onRecord: true,
      intensity: 0.3,
      duration: 3,
    },
    shake: {
      enabled: true,
      intensity: 8,
      frequency: 12,
      triggers: ['record', 'milestone'],
    },
    cinematicEffects: {
      depthOfField: true,
      vignette: true,
      chromaticAberration: true,
      filmGrain: true,
    },
  } as CameraConfig,

  dramatic: {
    enabled: true,
    followLeader: true,
    smoothness: 0.6,
    keyframes: [],
    autoZoom: {
      enabled: true,
      onOvertake: true,
      onRecord: true,
      intensity: 0.4,
      duration: 1.5,
    },
    shake: {
      enabled: true,
      intensity: 12,
      frequency: 15,
      triggers: ['overtake', 'record', 'milestone'],
    },
    cinematicEffects: {
      depthOfField: true,
      vignette: true,
      chromaticAberration: false,
      filmGrain: true,
    },
  } as CameraConfig,
};

export default CameraSystem;