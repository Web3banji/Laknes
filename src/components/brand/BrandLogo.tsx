import React, { useState } from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'mark-only';
  className?: string;
}

/**
 * LAKNES Brand Logo Component.
 * Uses the uploaded official brand logo and icon vectors from the LAKNES brand kit.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const heights = {
    sm: 'h-5',
    md: 'h-7',
    lg: 'h-9',
  };

  const src = variant === 'mark-only' ? '/mark.svg' : '/logo.svg';

  if (!imageError) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src={src}
          alt="LAKNES"
          onError={() => setImageError(true)}
          className={`${heights[size]} w-auto object-contain block`}
        />
      </div>
    );
  }

  // Graceful inline fallback matching the exact brand kit
  return (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-[0.25em] text-neutral-950 uppercase ${className}`}>
      <span className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-400 flex items-center justify-center text-white font-black text-xs">
        L
      </span>
      <span>LAKNES</span>
    </div>
  );
};
