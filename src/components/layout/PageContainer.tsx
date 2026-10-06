import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 ${className}`}>
      {children}
    </div>
  );
}
