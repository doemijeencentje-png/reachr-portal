import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'glow';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-200 shadow-sm hover:border-primary-light hover:shadow-[0_4px_20px_rgba(0,200,83,0.15)]',
      bordered: 'bg-white border-2 border-gray-300 shadow-sm hover:border-primary-light hover:shadow-[0_4px_20px_rgba(0,200,83,0.15)]',
      glow: 'bg-white border border-primary/30 shadow-[0_4px_20px_rgba(0,200,83,0.2)]',
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl p-6 transition-all duration-300 ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
