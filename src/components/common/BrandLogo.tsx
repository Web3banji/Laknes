/**
 * LAKNES Official Brand Logo Component
 * Incorporates the authentic brand kit golden emblem on obsidian background.
 */

import React from 'react';

interface BrandLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function BrandLogo({
  size = 36,
  className = '',
  showText = false,
  textClassName = 'font-headline-sm text-headline-sm tracking-tight text-on-surface font-bold',
}: BrandLogoProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official LAKNES Orange Emblem */}
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className="relative shrink-0 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-surface-container-low border border-outline-variant/40 group-hover:border-primary-container shadow-[0_0_14px_rgba(255,87,34,0.35)] transition-all duration-200"
      >
        <img
          src="/laknes-brand-emblem.png"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBbCx-Ngfnb-71P9gWXiRQl9QYfJXesChsUORwVa8lQAmx74wJCLYHmRCtrhvhOxkbempTZ0hlp3FvhidOnFAOYl1TcCMVFrdHxBcWgq6OhoWY4tb-8laDiOHFQztpVebLwdlgdRnT-N2_QtStLeD-PsP7BRsJ95I6u2EFNclu1zI9zBuYgjfDf2Lpg9HiT1vGR8EsiBz34GPWhUYyTotU9-H2vvchOMlDYiZFDr3x6RmkS9obxDnq6';
          }}
          alt="LAKNES Emblem"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <span className={`${textClassName} group-hover:text-primary transition-colors flex items-center tracking-tight`}>
          <span>LAKNES</span>
        </span>
      )}
    </div>
  );
}
