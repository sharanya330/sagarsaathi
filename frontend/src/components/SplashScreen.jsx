import React, { useEffect, useState } from 'react';
import '../styles/SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show splash for 3 seconds, then fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500); // Wait for fade animation to complete
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <video
          autoPlay
          muted
          playsInline
          className="splash-video"
          onEnded={() => {
            setFadeOut(true);
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 500);
          }}
        >
          <source src="/assets/logo-animation.mp4" type="video/mp4" />
          {/* Fallback to static logo if video fails */}
          <img src="/assets/logo.png" alt="SagarSaathi Logo" className="splash-logo" />
        </video>
        <h1 className="splash-tagline">Where every journey feels like home</h1>
      </div>
    </div>
  );
};

export default SplashScreen;
