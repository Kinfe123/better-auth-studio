import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-white text-black hover:bg-white',
        secondary:
          'border-transparent bg-gray-800 text-white hover:bg-gray-800 border border-gray-600',
        destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
        outline: 'text-gray-300 border-gray-600',
        success: 'border-transparent bg-green-900 text-green-300',
        warning: 'border-transparent bg-yellow-900 text-yellow-300',
        error: 'border-transparent bg-red-900 text-red-300',
        info: 'border-transparent bg-gray-800 text-white border border-gray-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
