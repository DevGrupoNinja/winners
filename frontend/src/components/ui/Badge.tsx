import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary';
    size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
        <span
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded-full font-black uppercase tracking-widest",
                {
                    'bg-orange-50 text-brand-orange border border-orange-100': variant === 'default',
                    'bg-emerald-50 text-emerald-600 border border-emerald-100': variant === 'success',
                    'bg-yellow-50 text-yellow-600 border border-yellow-100': variant === 'warning',
                    'bg-red-50 text-red-600 border border-red-100': variant === 'danger',
                    'bg-white text-slate-500 border border-slate-200': variant === 'outline',
                    'bg-slate-100 text-slate-500 border border-slate-200': variant === 'secondary',
                    'px-2 py-0.5 text-[9px]': size === 'sm',
                    'px-3 py-1 text-[10px]': size === 'md',
                },
                className
            )}
            {...props}
        />
    );
});
Badge.displayName = "Badge";

export { Badge };
