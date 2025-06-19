/**
 * Animated Text Components
 * Advanced text animation effects for labels, titles, and values
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { 
  createTypewriterEffect, 
  createRevealAnimation, 
  createPulseAnimation,
  EasingFunctions,
  RevealEffect 
} from '../utils/AnimationUtils';
import { TextAnimationConfig } from '../types';

export interface AnimatedTextProps {
  text: string;
  animation?: TextAnimationConfig;
  style?: React.CSSProperties;
  delay?: number;
  className?: string;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  animation = { type: 'none' },
  style = {},
  delay = 0,
  className,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const renderAnimatedText = () => {
    switch (animation.type) {
      case 'typewriter':
        return (
          <TypewriterText
            text={text}
            duration={animation.duration || 2}
            delay={delay}
            frame={frame}
            fps={fps}
            style={style}
            className={className}
          />
        );

      case 'reveal':
        return (
          <RevealText
            text={text}
            effect={animation.effect || 'fade'}
            duration={animation.duration || 1}
            delay={delay}
            frame={frame}
            fps={fps}
            style={style}
            className={className}
          />
        );

      case 'glow':
        return (
          <GlowText
            text={text}
            duration={animation.duration || 2}
            delay={delay}
            frame={frame}
            fps={fps}
            style={style}
            className={className}
          />
        );

      case 'bounce':
        return (
          <BounceText
            text={text}
            duration={animation.duration || 1}
            delay={delay}
            frame={frame}
            fps={fps}
            style={style}
            className={className}
          />
        );

      default:
        return (
          <span style={style} className={className}>
            {text}
          </span>
        );
    }
  };

  return renderAnimatedText();
};

const TypewriterText: React.FC<{
  text: string;
  duration: number;
  delay: number;
  frame: number;
  fps: number;
  style?: React.CSSProperties;
  className?: string;
}> = ({ text, duration, delay, frame, fps, style, className }) => {
  const displayText = createTypewriterEffect(frame, fps, text, duration, delay);
  
  // Add cursor effect
  const showCursor = frame >= delay * fps && displayText.length < text.length;
  const cursorBlink = Math.floor((frame - delay * fps) / (fps * 0.5)) % 2 === 0;
  
  return (
    <span style={style} className={className}>
      {displayText}
      {showCursor && cursorBlink && (
        <span style={{ 
          opacity: 0.8,
          animation: 'none',
          borderRight: '2px solid currentColor',
          marginLeft: '2px',
        }}>
          |
        </span>
      )}
    </span>
  );
};

const RevealText: React.FC<{
  text: string;
  effect: RevealEffect;
  duration: number;
  delay: number;
  frame: number;
  fps: number;
  style?: React.CSSProperties;
  className?: string;
}> = ({ text, effect, duration, delay, frame, fps, style, className }) => {
  const revealAnimation = createRevealAnimation(frame, fps, effect, duration, delay);
  
  return (
    <span
      style={{
        ...style,
        opacity: revealAnimation.opacity,
        transform: revealAnimation.transform,
      }}
      className={className}
    >
      {text}
    </span>
  );
};

const GlowText: React.FC<{
  text: string;
  duration: number;
  delay: number;
  frame: number;
  fps: number;
  style?: React.CSSProperties;
  className?: string;
}> = ({ text, duration, delay, frame, fps, style, className }) => {
  const startFrame = delay * fps;
  const animationFrame = Math.max(0, frame - startFrame);
  
  const glowIntensity = createPulseAnimation(animationFrame, fps, 0.3, 0.7, 1.5);
  const color = style?.color || '#FFFFFF';
  
  // Create multiple shadow layers for intense glow
  const shadows = [
    `0 0 ${Math.abs(glowIntensity) * 10}px ${color}`,
    `0 0 ${Math.abs(glowIntensity) * 20}px ${color}`,
    `0 0 ${Math.abs(glowIntensity) * 30}px ${color}`,
    `0 0 ${Math.abs(glowIntensity) * 40}px ${color}88`,
  ].join(', ');
  
  const opacity = interpolate(
    animationFrame,
    [0, duration * fps * 0.2],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  return (
    <span
      style={{
        ...style,
        textShadow: shadows,
        opacity,
        filter: `brightness(${1 + Math.abs(glowIntensity) * 0.5})`,
      }}
      className={className}
    >
      {text}
    </span>
  );
};

const BounceText: React.FC<{
  text: string;
  duration: number;
  delay: number;
  frame: number;
  fps: number;
  style?: React.CSSProperties;
  className?: string;
}> = ({ text, duration, delay, frame, fps, style, className }) => {
  const startFrame = delay * fps;
  const animationFrame = Math.max(0, frame - startFrame);
  
  const letters = text.split('');
  const letterDelay = 0.05; // seconds between each letter
  
  return (
    <span style={style} className={className}>
      {letters.map((letter, index) => {
        const letterStartFrame = (letterDelay * index) * fps;
        const letterAnimationFrame = Math.max(0, animationFrame - letterStartFrame);
        
        if (letterAnimationFrame === 0) {
          return (
            <span key={index} style={{ opacity: 0 }}>
              {letter}
            </span>
          );
        }
        
        const bounceProgress = Math.min(letterAnimationFrame / (duration * fps), 1);
        const bounceValue = EasingFunctions.easeOutBounce(bounceProgress);
        
        const scale = interpolate(bounceValue, [0, 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        
        const translateY = interpolate(bounceValue, [0, 1], [20, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        
        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              transform: `translateY(${translateY}px) scale(${scale})`,
              transformOrigin: 'bottom center',
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        );
      })}
    </span>
  );
};

// Word-by-word reveal animation
export const WordRevealText: React.FC<{
  text: string;
  duration: number;
  delay?: number;
  effect?: RevealEffect;
  style?: React.CSSProperties;
  className?: string;
}> = ({ text, duration, delay = 0, effect = 'fade', style, className }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const words = text.split(' ');
  const wordDelay = duration / words.length;
  
  return (
    <span style={style} className={className}>
      {words.map((word, index) => {
        const wordStartDelay = delay + (wordDelay * index);
        
        return (
          <React.Fragment key={index}>
            <RevealText
              text={word}
              effect={effect}
              duration={wordDelay * 0.8}
              delay={wordStartDelay}
              frame={frame}
              fps={fps}
            />
            {index < words.length - 1 && <span> </span>}
          </React.Fragment>
        );
      })}
    </span>
  );
};

// Morphing text effect
export const MorphingText: React.FC<{
  texts: string[];
  switchDuration: number;
  morphDuration: number;
  style?: React.CSSProperties;
  className?: string;
}> = ({ texts, switchDuration, morphDuration, style, className }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const totalCycleDuration = switchDuration + morphDuration;
  const cycleFrame = frame % (totalCycleDuration * fps);
  const currentIndex = Math.floor(frame / (totalCycleDuration * fps)) % texts.length;
  const nextIndex = (currentIndex + 1) % texts.length;
  
  const currentText = texts[currentIndex];
  const nextText = texts[nextIndex];
  
  // During switch period, show current text
  if (cycleFrame < switchDuration * fps) {
    return (
      <span style={style} className={className}>
        {currentText}
      </span>
    );
  }
  
  // During morph period, animate between texts
  const morphFrame = cycleFrame - (switchDuration * fps);
  const morphProgress = morphFrame / (morphDuration * fps);
  
  // Character-by-character morphing
  const maxLength = Math.max(currentText.length, nextText.length);
  const morphedText = Array.from({ length: maxLength }, (_, i) => {
    const currentChar = currentText[i] || '';
    const nextChar = nextText[i] || '';
    
    if (currentChar === nextChar) return currentChar;
    
    // Randomly switch characters during morph
    const charProgress = Math.max(0, morphProgress - (i / maxLength) * 0.3);
    return charProgress > 0.5 ? nextChar : currentChar;
  }).join('');
  
  const opacity = interpolate(
    morphProgress,
    [0, 0.2, 0.8, 1],
    [1, 0.3, 0.3, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  return (
    <span
      style={{
        ...style,
        opacity,
        filter: `blur(${(1 - Math.abs(morphProgress - 0.5) * 2) * 2}px)`,
      }}
      className={className}
    >
      {morphedText}
    </span>
  );
};

// Shimmer text effect
export const ShimmerText: React.FC<{
  text: string;
  speed?: number;
  colors?: string[];
  style?: React.CSSProperties;
  className?: string;
}> = ({ text, speed = 2, colors = ['#FFFFFF', '#FFD700', '#FFFFFF'], style, className }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const shimmerProgress = (frame / fps * speed) % 2;
  const gradientPos = shimmerProgress * 100;
  
  const gradient = `linear-gradient(90deg, ${colors.join(', ')})`;
  const shimmerGradient = `linear-gradient(90deg, 
    transparent ${gradientPos - 20}%, 
    ${colors[1]} ${gradientPos}%, 
    transparent ${gradientPos + 20}%
  )`;
  
  return (
    <span
      style={{
        ...style,
        background: gradient,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        position: 'relative',
      }}
      className={className}
    >
      {text}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: shimmerGradient,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {text}
      </span>
    </span>
  );
};

export default AnimatedText;