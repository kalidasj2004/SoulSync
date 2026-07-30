import React, { useRef, useEffect } from 'react';
import lottie from 'lottie-web';
import mascotAnimation from '../assets/login_mascot.json';

export default function AnimatedCompanion({ 
  state = 'idle',            // 'idle' | 'success' | 'loading'
  activeField = '',          // Kept for prop compatibility
  passwordVisible = false 
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Load vanilla Lottie instance on container mount
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: mascotAnimation,
    });

    // Clean up animation on unmount
    return () => {
      anim.destroy();
    };
  }, []);

  // Adjust container width to preserve the mascot's native 280x200 aspect ratio (approx 1.4)
  const height = 112;
  const width = height * (280 / 200);

  return (
    <div className="flex flex-col items-center justify-center select-none pointer-events-none">
      <div 
        ref={containerRef}
        className="overflow-hidden flex items-center justify-center animate-float-slow"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      <span className="sr-only">
        AI Companion Mascot Playing
      </span>
    </div>
  );
}
