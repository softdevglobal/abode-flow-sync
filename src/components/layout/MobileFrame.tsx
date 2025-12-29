import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="mobile-frame-container">
      <div className="mobile-frame-device">
        {/* Notch */}
        <div className="mobile-frame-notch" />
        
        {/* App Content */}
        <div className="mobile-frame-content">
          {children}
        </div>
        
        {/* Home Indicator */}
        <div className="mobile-frame-home-indicator" />
      </div>
    </div>
  );
};

export default MobileFrame;
