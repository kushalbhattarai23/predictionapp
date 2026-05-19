
import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  value: number | null;
  onChange: (rating: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export const RatingInput: React.FC<RatingInputProps> = ({ value, onChange, max = 10, size = 'md', readonly = false }) => {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          className={cn('transition-colors', readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110')}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= (value || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
      {value && <span className="ml-2 text-sm font-medium text-muted-foreground">{value}/{max}</span>}
    </div>
  );
};

export default RatingInput;
