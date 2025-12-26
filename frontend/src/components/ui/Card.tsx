import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden",
                className
            )}
            {...props}
        />
    );
});
Card.displayName = "Card";

export { Card };
