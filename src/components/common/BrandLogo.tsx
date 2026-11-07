import React from 'react';

interface BrandLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function BrandLogo({
  size = 32,
  className = '',
  showText = true,
  textClassName = 'yo-display text-xl tracking-tight text-[var(--yo-ink)] font-bold',
}: BrandLogoProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Laknes Emblem Logo */}
      <img
        src="/assets/aistudio/Q67f93M1_400x400_24a7b710.jpg"
        alt="Laknes Logo"
        style={{ width: pixelSize, height: pixelSize }}
        className="rounded-[2px] object-cover border-[1.5px] border-[var(--yo-ink)] shadow-[2px_2px_0_var(--yo-ink)] shrink-0 bg-black"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/laknes-logo.jpg';
        }}
      />

      {showText && (
        <span className={`flex items-center tracking-tight ${textClassName}`}>
          <span>LAKNES</span>
        </span>
      )}
    </div>
  );
}
