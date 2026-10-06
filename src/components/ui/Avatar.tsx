import React from 'react';

export interface AvatarProps {
  name: string;
  symbol?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({
  name,
  symbol,
  imageUrl,
  size = 'md',
  className = '',
}: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs rounded-lg',
    md: 'h-10 w-10 text-xs rounded-xl',
    lg: 'h-14 w-14 text-base rounded-2xl',
  };

  const displayText = symbol
    ? symbol.slice(0, 3)
    : name.slice(0, 2).toUpperCase();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} shrink-0 object-cover border border-neutral-200/80 bg-neutral-50 ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-mono font-bold text-neutral-800 bg-neutral-100 border border-neutral-200/60 ${sizeClasses[size]} ${className}`}
      aria-hidden="true"
    >
      {displayText}
    </div>
  );
}
