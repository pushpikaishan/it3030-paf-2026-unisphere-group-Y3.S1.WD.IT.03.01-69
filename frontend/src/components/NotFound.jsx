import React, { useState, useEffect } from 'react';
import unisphere from '../assets/images/unisphere.png';

export default function NotFound404() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 15,
        y: (e.clientY / window.innerHeight) * 15,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <div className="not-found-container">
      {/* Animated Background Elements */}
      <div 
        className="animated-blur-orange" 
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
        }}
      ></div>
      <div 
        className="animated-blur-blue" 
        style={{
          transform: `translate(${-mousePosition.x * 0.5}px, ${-mousePosition.y * 0.5}px)`
        }}
      ></div>

      {/* Main Content - Centered */}
      <div className="content-wrapper">
        {/* Image Section */}
        <div className={`image-section ${isLoaded ? 'loaded' : ''}`}>
          <div className="image-frame">
            <img src={unisphere} alt="Unisphere" className="unisphere-image" />
            <div className="glow-ring-orange"></div>
            <div className="glow-ring-blue"></div>
          </div>
          <div className="floating-particles">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className={`particle ${i % 2 === 0 ? 'orange' : 'blue'}`}
                style={{
                  '--delay': `${i * 0.12}s`
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Text Section - Centered */}
        <div className={`text-section ${isLoaded ? 'loaded' : ''}`}>
          <div className="error-code">
            <span className="digit">4</span>
            <span className="digit zero">0</span>
            <span className="digit">4</span>
          </div>

          <h1 className="error-title">Page Not Found</h1>
          
          <p className="error-description">
            Oops! The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span className="crumb">Home</span>
            <span className="separator">/</span>
            <span className="crumb active">404</span>
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .not-found-container {
          --primary-orange: #e97b25;
          --primary-blue: #053769;
          --text-white: #ffffff;
          --text-dark: #1a1a1a;
          --text-gray: #6b7280;
          
          width: 100%;
          height: 100dvh;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Animated Background Blobs */
        .animated-blur-orange {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(233, 123, 37, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          top: -150px;
          right: -100px;
          filter: blur(60px);
          z-index: 1;
          transition: transform 0.3s ease-out;
        }

        .animated-blur-blue {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(5, 55, 105, 0.05) 0%, transparent 70%);
          border-radius: 50%;
          bottom: -200px;
          left: -150px;
          filter: blur(80px);
          z-index: 1;
          transition: transform 0.3s ease-out;
        }

        /* Content Layout - Centered Column */
        .content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          max-width: 760px;
          width: 100%;
          padding: 34px 24px;
          z-index: 10;
          position: relative;
          gap: 28px;
        }

        /* Image Section */
        .image-section {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          opacity: 0;
          animation: slideInDown 0.8s ease-out 0.2s forwards;
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .image-frame {
          position: relative;
          width: 210px;
          height: 210px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .unisphere-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          position: relative;
          z-index: 3;
          filter: drop-shadow(0 15px 40px rgba(5, 55, 105, 0.15));
          animation: float 5s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .glow-ring-orange {
          position: absolute;
          width: 248px;
          height: 248px;
          border: 2px solid var(--primary-orange);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: rotateSlow 10s linear infinite;
          opacity: 0.5;
          z-index: 2;
        }

        .glow-ring-blue {
          position: absolute;
          width: 286px;
          height: 286px;
          border: 1.5px dashed var(--primary-blue);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: rotateSlowReverse 12s linear infinite;
          opacity: 0.3;
          z-index: 1;
        }

        @keyframes rotateSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes rotateSlowReverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }

        .floating-particles {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          opacity: 0;
          animation: floatParticle 4s ease-in-out var(--delay) infinite;
        }

        .particle.orange {
          background: var(--primary-orange);
        }

        .particle.blue {
          background: var(--primary-blue);
        }

        .particle:nth-child(1) { left: 10%; top: 20%; }
        .particle:nth-child(2) { right: 15%; top: 10%; }
        .particle:nth-child(3) { left: 20%; bottom: 15%; }
        .particle:nth-child(4) { right: 10%; bottom: 20%; }
        .particle:nth-child(5) { left: 5%; top: 50%; }
        .particle:nth-child(6) { right: 5%; top: 60%; }
        .particle:nth-child(7) { left: 15%; top: 35%; }
        .particle:nth-child(8) { right: 20%; bottom: 35%; }

        @keyframes floatParticle {
          0% {
            opacity: 0;
            transform: translateY(0);
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-80px);
          }
        }

        /* Text Section - Centered */
        .text-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          opacity: 0;
          animation: fadeInUp 0.8s ease-out 0.3s forwards;
          max-width: 560px;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-code {
          display: flex;
          gap: 0;
          align-items: center;
          justify-content: center;
          font-size: 108px;
          font-weight: 900;
          letter-spacing: -5px;
          line-height: 1;
          animation: codeReveal 0.8s ease-out 0.4s both;
        }

        .digit {
          display: inline-block;
          color: var(--primary-blue);
        }

        .digit.zero {
          color: var(--primary-orange);
          animation: spinZero 3s linear infinite;
          transform-origin: center;
          animation-delay: 0.5s;
        }

        @keyframes spinZero {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }

        @keyframes codeReveal {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .error-title {
          font-size: 40px;
          font-weight: 700;
          color: var(--text-dark);
          letter-spacing: -0.5px;
          line-height: 1.2;
          animation: fadeInUp 0.8s ease-out 0.5s both;
          margin: 8px 0;
        }

        .error-description {
          font-size: 16px;
          color: var(--text-gray);
          line-height: 1.55;
          animation: fadeInUp 0.8s ease-out 0.6s both;
          max-width: 500px;
        }

        /* Status Badge */
        .status-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          background: linear-gradient(135deg, rgba(233, 123, 37, 0.08), rgba(5, 55, 105, 0.08));
          border-radius: 50px;
          border: 1px solid rgba(233, 123, 37, 0.2);
          animation: fadeInUp 0.8s ease-out 0.65s both;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: var(--primary-orange);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }

        .status-text {
          font-size: 13px;
          color: var(--text-gray);
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        /* Buttons */
        .cta-buttons {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
          animation: fadeInUp 0.8s ease-out 0.7s both;
          margin-top: 15px;
        }

        .btn {
          padding: 16px 40px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          border: none;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 14px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary-orange), #ff8c3d);
          color: var(--text-white);
          box-shadow: 0 10px 30px rgba(233, 123, 37, 0.25);
          border: 2px solid transparent;
        }

        .btn-primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(233, 123, 37, 0.35);
          background: linear-gradient(135deg, #d96a1a, #e97b25);
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          transition: left 0.3s ease;
          z-index: -1;
        }

        .btn-primary:hover::before {
          left: 100%;
        }

        .btn-secondary {
          background: transparent;
          color: var(--primary-blue);
          border: 2px solid var(--primary-blue);
          box-shadow: 0 5px 20px rgba(5, 55, 105, 0.1);
        }

        .btn-secondary:hover {
          background: linear-gradient(135deg, rgba(5, 55, 105, 0.08), rgba(233, 123, 37, 0.05));
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(5, 55, 105, 0.2);
          border-color: var(--primary-orange);
          color: var(--primary-orange);
        }

        /* Breadcrumb */
        .breadcrumb {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 8px;
          animation: fadeInUp 0.8s ease-out 0.75s both;
          padding-top: 12px;
          border-top: 1px solid rgba(5, 55, 105, 0.1);
        }

        .crumb {
          font-size: 13px;
          color: var(--text-gray);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .crumb:hover {
          color: var(--primary-orange);
        }

        .crumb.active {
          color: var(--primary-blue);
          font-weight: 600;
        }

        .separator {
          color: var(--primary-orange);
          font-weight: 300;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .content-wrapper {
            gap: 22px;
            padding: 26px 18px;
          }

          .error-code {
            font-size: 82px;
            letter-spacing: -4px;
          }

          .error-title {
            font-size: 32px;
          }

          .error-description {
            font-size: 15px;
          }

          .image-frame {
            width: 180px;
            height: 180px;
          }

          .glow-ring-orange {
            width: 212px;
            height: 212px;
          }

          .glow-ring-blue {
            width: 242px;
            height: 242px;
          }
        }

        @media (max-width: 480px) {
          .error-code {
            font-size: 60px;
            letter-spacing: -3px;
          }

          .error-title {
            font-size: 24px;
          }

          .error-description {
            font-size: 14px;
          }

          .image-frame {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
}