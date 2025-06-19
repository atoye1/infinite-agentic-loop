/**
 * Animated Background System
 * Dynamic background patterns, themes, and atmospheric effects
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { createAnimatedGradient, createPulseAnimation } from '../utils/AnimationUtils';
import { BackgroundLayerConfig } from '../types';

export interface AnimatedBackgroundConfig extends BackgroundLayerConfig {
  animation?: {
    type: 'static' | 'gradient' | 'particles' | 'waves' | 'geometric' | 'matrix' | 'nebula';
    speed: number; // 0-5
    intensity: number; // 0-1
    colors?: string[];
    direction?: number; // degrees
    complexity?: number; // 1-5
  };
  atmosphere?: {
    fog: boolean;
    rays: boolean;
    sparkles: boolean;
    depth: boolean;
  };
}

interface AnimatedBackgroundProps {
  config: AnimatedBackgroundConfig;
  containerWidth: number;
  containerHeight: number;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  config,
  containerWidth,
  containerHeight,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const renderBackground = () => {
    if (!config.animation || config.animation.type === 'static') {
      return <StaticBackground config={config} />;
    }

    switch (config.animation.type) {
      case 'gradient':
        return (
          <GradientBackground
            config={config}
            frame={frame}
            fps={fps}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
          />
        );
      case 'particles':
        return (
          <ParticlesBackground
            config={config}
            frame={frame}
            fps={fps}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
          />
        );
      case 'waves':
        return (
          <WavesBackground
            config={config}
            frame={frame}
            fps={fps}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
          />
        );
      case 'geometric':
        return (
          <GeometricBackground
            config={config}
            frame={frame}
            fps={fps}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
          />
        );
      case 'matrix':
        return (
          <MatrixBackground
            config={config}
            frame={frame}
            fps={fps}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
          />
        );
      case 'nebula':
        return (
          <NebulaBackground
            config={config}
            frame={frame}
            fps={fps}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
          />
        );
      default:
        return <StaticBackground config={config} />;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerWidth,
        height: containerHeight,
        overflow: 'hidden',
        zIndex: -1,
      }}
    >
      {renderBackground()}
      
      {/* Atmospheric effects layer */}
      {config.atmosphere && (
        <AtmosphericEffects
          config={config}
          frame={frame}
          fps={fps}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )}
    </div>
  );
};

const StaticBackground: React.FC<{ config: AnimatedBackgroundConfig }> = ({ config }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      backgroundColor: config.color,
      opacity: config.opacity / 100,
      backgroundImage: config.image ? `url(${config.image.path})` : undefined,
      backgroundSize: config.image?.cropping || 'cover',
      backgroundPosition: 'center',
    }}
  />
);

const GradientBackground: React.FC<{
  config: AnimatedBackgroundConfig;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ config, frame, fps, containerWidth, containerHeight }) => {
  const colors = config.animation?.colors || [config.color, '#000000'];
  const direction = config.animation?.direction || 45;
  const speed = config.animation?.speed || 1;
  
  const animatedGradient = createAnimatedGradient(
    frame,
    fps,
    colors,
    4 / speed,
    direction
  );
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: animatedGradient,
        opacity: config.opacity / 100,
      }}
    />
  );
};

const ParticlesBackground: React.FC<{
  config: AnimatedBackgroundConfig;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ config, frame, fps, containerWidth, containerHeight }) => {
  const particleCount = Math.floor((config.animation?.complexity || 3) * 50);
  const speed = config.animation?.speed || 1;
  const colors = config.animation?.colors || [config.color];
  
  const particles = React.useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * containerWidth,
      y: Math.random() * containerHeight,
      vx: (Math.random() - 0.5) * speed * 20,
      vy: (Math.random() - 0.5) * speed * 20,
      size: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, [particleCount, containerWidth, containerHeight, speed, colors]);
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: config.color,
        opacity: config.opacity / 100,
        position: 'relative',
      }}
    >
      {particles.map((particle) => {
        const time = frame / fps;
        const x = (particle.x + particle.vx * time) % containerWidth;
        const y = (particle.y + particle.vy * time) % containerHeight;
        
        return (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: '50%',
              opacity: particle.opacity,
            }}
          />
        );
      })}
    </div>
  );
};

const WavesBackground: React.FC<{
  config: AnimatedBackgroundConfig;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ config, frame, fps, containerWidth, containerHeight }) => {
  const waveCount = config.animation?.complexity || 3;
  const speed = config.animation?.speed || 1;
  const colors = config.animation?.colors || [config.color];
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: config.color,
        opacity: config.opacity / 100,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: waveCount }, (_, i) => {
        const waveHeight = containerHeight / (waveCount + 1);
        const amplitude = waveHeight * 0.3;
        const frequency = 0.01 + i * 0.002;
        const phaseOffset = (frame / fps) * speed * (i + 1) * 0.5;
        
        const points = [];
        for (let x = 0; x <= containerWidth; x += 5) {
          const y = containerHeight - waveHeight * (i + 1) +
                    Math.sin(x * frequency + phaseOffset) * amplitude +
                    Math.sin(x * frequency * 2 + phaseOffset * 1.5) * amplitude * 0.5;
          points.push(`${x},${y}`);
        }
        
        const pathData = `M0,${containerHeight} L${points.join(' L')} L${containerWidth},${containerHeight} Z`;
        
        return (
          <svg
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <path
              d={pathData}
              fill={colors[i % colors.length]}
              opacity={0.3 - i * 0.05}
            />
          </svg>
        );
      })}
    </div>
  );
};

const GeometricBackground: React.FC<{
  config: AnimatedBackgroundConfig;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ config, frame, fps, containerWidth, containerHeight }) => {
  const shapeCount = Math.floor((config.animation?.complexity || 3) * 10);
  const speed = config.animation?.speed || 1;
  const colors = config.animation?.colors || [config.color];
  
  const shapes = React.useMemo(() => {
    return Array.from({ length: shapeCount }, (_, i) => ({
      id: i,
      x: Math.random() * containerWidth,
      y: Math.random() * containerHeight,
      size: Math.random() * 100 + 20,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * speed * 2,
      type: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.1 + 0.05,
    }));
  }, [shapeCount, containerWidth, containerHeight, speed, colors]);
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: config.color,
        opacity: config.opacity / 100,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {shapes.map((shape) => {
        const time = frame / fps;
        const rotation = shape.rotation + shape.rotationSpeed * time * 180 / Math.PI;
        
        return (
          <div
            key={shape.id}
            style={{
              position: 'absolute',
              left: shape.x - shape.size / 2,
              top: shape.y - shape.size / 2,
              width: shape.size,
              height: shape.size,
              transform: `rotate(${rotation}deg)`,
              opacity: shape.opacity,
            }}
          >
            {shape.type === 'circle' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: shape.color,
                  borderRadius: '50%',
                }}
              />
            )}
            {shape.type === 'square' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: shape.color,
                  borderRadius: '10%',
                }}
              />
            )}
            {shape.type === 'triangle' && (
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: `${shape.size / 2}px solid transparent`,
                  borderRight: `${shape.size / 2}px solid transparent`,
                  borderBottom: `${shape.size}px solid ${shape.color}`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const MatrixBackground: React.FC<{
  config: AnimatedBackgroundConfig;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ config, frame, fps, containerWidth, containerHeight }) => {
  const columnCount = Math.floor(containerWidth / 20);
  const speed = config.animation?.speed || 1;
  const intensity = config.animation?.intensity || 0.5;
  
  const columns = React.useMemo(() => {
    return Array.from({ length: columnCount }, (_, i) => ({
      id: i,
      x: i * 20,
      drops: Array.from({ length: Math.floor(containerHeight / 20) }, () => ({
        char: String.fromCharCode(0x30A0 + Math.random() * 96),
        opacity: Math.random(),
        speed: Math.random() * speed + 0.5,
      })),
    }));
  }, [columnCount, containerHeight, speed]);
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: config.color,
        opacity: config.opacity / 100,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#00FF00',
      }}
    >
      {columns.map((column) => (
        <div
          key={column.id}
          style={{
            position: 'absolute',
            left: column.x,
            top: 0,
            width: 20,
            height: '100%',
          }}
        >
          {column.drops.map((drop, dropIndex) => {
            const time = frame / fps;
            const y = ((dropIndex * 20 + time * drop.speed * 100) % (containerHeight + 100)) - 100;
            const opacity = drop.opacity * intensity * 
                           Math.max(0, 1 - Math.abs(y - containerHeight / 2) / (containerHeight / 2));
            
            return (
              <div
                key={dropIndex}
                style={{
                  position: 'absolute',
                  top: y,
                  opacity,
                  textShadow: '0 0 5px currentColor',
                }}
              >
                {drop.char}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const NebulaBackground: React.FC<{
  config: AnimatedBackgroundConfig;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ config, frame, fps, containerWidth, containerHeight }) => {
  const colors = config.animation?.colors || ['#FF0080', '#8000FF', '#0080FF'];
  const speed = config.animation?.speed || 1;
  const complexity = config.animation?.complexity || 3;
  
  const cloudCount = Math.floor(complexity * 5);
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: config.color,
        opacity: config.opacity / 100,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: cloudCount }, (_, i) => {
        const time = frame / fps;
        const offsetX = Math.sin(time * speed * 0.1 + i) * 50;
        const offsetY = Math.cos(time * speed * 0.15 + i * 1.5) * 30;
        const scale = 0.8 + Math.sin(time * speed * 0.2 + i * 2) * 0.4;
        const rotation = time * speed * 5 + i * 30;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 30) % 120 - 10 + offsetX}%`,
              top: `${(i * 25) % 100 - 10 + offsetY}%`,
              width: `${20 + i * 5}%`,
              height: `${15 + i * 3}%`,
              background: `radial-gradient(ellipse, ${colors[i % colors.length]}44, transparent)`,
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              filter: 'blur(2px)',
              opacity: 0.6,
            }}
          />
        );
      })}
    </div>
  );
};

const AtmosphericEffects: React.FC<{
  config: AnimatedBackgroundConfig;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ config, frame, fps, containerWidth, containerHeight }) => {
  if (!config.atmosphere) return null;
  
  return (
    <>
      {/* Fog effect */}
      {config.atmosphere.fog && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(180deg, transparent 0%, ${config.color}22 50%, transparent 100%)`,
            opacity: 0.5,
            filter: 'blur(3px)',
          }}
        />
      )}
      
      {/* Light rays */}
      {config.atmosphere.rays && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `conic-gradient(from ${(frame / fps) * 10}deg, transparent, ${config.color}11, transparent)`,
            opacity: 0.3,
          }}
        />
      )}
      
      {/* Ambient particles */}
      {config.atmosphere.sparkles && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {Array.from({ length: 20 }, (_, i) => {
            const x = (Math.sin(frame / fps * 0.5 + i) * 0.5 + 0.5) * containerWidth;
            const y = (Math.cos(frame / fps * 0.3 + i * 1.5) * 0.5 + 0.5) * containerHeight;
            const twinkle = createPulseAnimation(frame, fps, 0.2, 0.8, 2 + i * 0.1);
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: 2,
                  height: 2,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  opacity: Math.abs(twinkle),
                  filter: 'blur(0.5px)',
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

export default AnimatedBackground;