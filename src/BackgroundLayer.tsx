import React from 'react';
import { AbsoluteFill } from 'remotion';
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
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: config.image.opacity / 100,
            backgroundImage: `url(${config.image.path})`,
            backgroundSize: config.image.cropping,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </AbsoluteFill>
  );
};