// import React, { useState, useEffect } from 'react';

// const COUNT = 64;

// const globalStyles = `
//   * {
//     box-sizing: border-box;
//     font-family: sans-serif;
//   }
// `;

// const containerStyle = {
//   '--size': 'min(40vw, 40vh)',
//   '--width': 'calc(var(--size) / 40)',
//   '--dist': 'calc(var(--width) * 9.8)',
//   '--count': COUNT,
//   '--bg': "url('https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/5eeea355389655.59822ff824b72.gif')",
//   height: '100vh',
//   width: '100%',
//   backgroundImage: 'linear-gradient(-45deg, #111, #222)',
//   overflow: 'hidden',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   gap: 'var(--width)',
// } as React.CSSProperties;

// // const tubeStyle: React.CSSProperties = {
// //   transformStyle: 'preserve-3d',
// //   display: 'flex',
// //   alignItems: 'center',
// //   justifyContent: 'center',
// //   animation: 'speen 6s infinite linear',
// //   width: 'calc(var(--dist) * 2)',
// //   height: 'var(--size)',
// // };

// // const stripStyle: React.CSSProperties = {
// //   transformStyle: 'preserve-3d',
// //   backgroundColor: 'white',
// //   height: 'var(--size)',
// //   width: 'var(--width)',
// //   position: 'absolute',
// //   backgroundImage: 'var(--bg)',
// //   backgroundSize: 'calc(var(--width) * var(--count)) auto',
// //   backgroundRepeat: 'no-repeat',
// //   backfaceVisibility: 'hidden',
// // };

// const keyframes = `
//   @keyframes speen {
//     0% { transform: perspective(400px) rotateY(0deg); }
//     100% { transform: perspective(400px) rotateY(360deg); }
//   }
// `;

// const progressBarStyle: React.CSSProperties = {
//   width: '60%',
//   height: '20px',
//   backgroundColor: '#333',
//   borderRadius: '10px',
//   overflow: 'hidden',
//   position: 'relative',
// };

// const progressStyle: React.CSSProperties = {
//   height: '100%',
//   backgroundColor: '#4CAF50',
//   transition: 'width 0.3s ease-in-out',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   color: 'white',
//   fontSize: '14px',
// };

// export function LoadingAnimation() {
//   const [progress, setProgress] = useState(0);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setProgress((prevProgress) => {
//         if (prevProgress >= 100) {
//           clearInterval(timer);
//           return 100;
//         }
//         return prevProgress + 1;
//       });
//     }, 50); // Adjust speed by changing this value

//     return () => clearInterval(timer);
//   }, []);

//   return (
//     <div style={containerStyle}>
//       <style>{globalStyles + keyframes}</style>
//       <div style={progressBarStyle}>
//         <div 
//           style={{
//             ...progressStyle,
//             width: `${progress}%`,
//           }}
//         >
//           {progress}%
//         </div>
//       </div>
//     </div>
//   );
// }
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export function LoadingAnimation() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer)
          return 100
        }
        return prevProgress + 1
      })
    }, 50) // Adjust speed by changing this value

    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full flex justify-center items-center"
    >
      <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="ml-4 text-white">{progress}%</span>
    </motion.div>
  )
}


