import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  clickable?: boolean;
  padded?: boolean;
  selected?: boolean;
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  clickable = false,
  padded = true,
  selected = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`rounded-lg bg-white border transition-all duration-150 ${
        padded ? 'p-5 sm:p-6' : ''
      } ${
        selected
          ? 'border-neutral-900 ring-1 ring-neutral-900 shadow-2xs'
          : 'border-neutral-200/90'
      } ${
        hoverable || clickable
          ? 'hover:border-neutral-300 hover:shadow-2xs active:border-neutral-400'
          : ''
      } ${clickable ? 'cursor-pointer select-none' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`flex items-start justify-between gap-4 mb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3 className={`text-base font-semibold text-neutral-900 tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p className={`text-sm text-neutral-500 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between gap-3 text-xs text-neutral-500 ${className}`} {...props}>
    {children}
  </div>
);
