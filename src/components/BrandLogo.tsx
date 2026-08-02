import React, { useState } from 'react';

interface BrandLogoProps {
  customLogo?: string;
  className?: string;
  imgClassName?: string;
  alt?: string;
  showGlow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  customLogo,
  className = '',
  imgClassName = '',
  alt = 'KSM POS logo',
  showGlow = false,
}) => {
  const officialLogo = `${import.meta.env.BASE_URL}ksm-logo.png`;
  const initialSource = customLogo && /^(https?:\/\/|data:image\/|\/)/i.test(customLogo)
    ? customLogo
    : officialLogo;
  const [src, setSrc] = useState(initialSource);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {showGlow && <span className="absolute inset-1 rounded-[inherit] bg-blue-500/25 blur-xl" />}
      <img
        src={src}
        alt={alt}
        className={`relative z-10 w-full h-full object-contain ${imgClassName}`}
        onError={() => {
          if (src !== officialLogo) setSrc(officialLogo);
        }}
      />
    </div>
  );
};
