import React from 'react';

const COUNT = 64;

const globalStyles = `
  * {
    box-sizing: border-box;
    font-family: sans-serif;
  }
`;

const containerStyle = {
  '--size': 'min(40vw, 40vh)',
  '--width': 'calc(var(--size) / 40)',
  '--dist': 'calc(var(--width) * 9.8)',
  '--count': COUNT,
  '--bg': "url('https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/5eeea355389655.59822ff824b72.gif')",
  height: '100vh',
  width: '100%',
  backgroundImage: 'linear-gradient(-45deg, #111, #222)',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--width)',
} as React.CSSProperties;

const tubeStyle: React.CSSProperties = {
  transformStyle: 'preserve-3d',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'speen 6s infinite linear',
  width: 'calc(var(--dist) * 2)',
  height: 'var(--size)',
};

const stripStyle: React.CSSProperties = {
  transformStyle: 'preserve-3d',
  backgroundColor: 'white',
  height: 'var(--size)',
  width: 'var(--width)',
  position: 'absolute',
  backgroundImage: 'var(--bg)',
  backgroundSize: 'calc(var(--width) * var(--count)) auto',
  backgroundRepeat: 'no-repeat',
  backfaceVisibility: 'hidden',
};

const keyframes = `
  @keyframes speen {
    0% { transform: perspective(400px) rotateY(0deg); }
    100% { transform: perspective(400px) rotateY(360deg); }
  }
`;

export function LoadingAnimation() {
  return (
    <div style={containerStyle}>
      <style>{globalStyles + keyframes}</style>
      {[0, 1, 2].map((tubeIndex) => (
        <div key={tubeIndex} style={{...tubeStyle, animationDelay: `${-2.5 * (tubeIndex + 1)}s`}}>
          {[...Array(COUNT)].map((_, stripIndex) => (
            <div
              key={stripIndex}
              style={{
                ...stripStyle,
                transform: `rotateY(calc(1turn * ${stripIndex + 1} / var(--count))) translateZ(var(--dist))`,
                backgroundPosition: `calc(var(--width) * -${stripIndex}) center`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
