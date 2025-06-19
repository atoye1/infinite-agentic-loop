import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { BackgroundLayerProps } from './types';

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ config }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: config.color,
        opacity: config.opacity / 100,
      }}
    >
      {config.image && (
        <Img
          src={config.image.path}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: config.image.opacity / 100,
            objectFit: config.image.cropping === 'cover' ? 'cover' : config.image.cropping === 'contain' ? 'contain' : 'fill',
            objectPosition: 'center',
          }}
        />
      )}
    </AbsoluteFill>
  );
};