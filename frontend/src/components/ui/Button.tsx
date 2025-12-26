import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    disabled,
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
                "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange disabled:pointer-events-none disabled:opacity-50 active:scale-95",
                {
                    'bg-brand-orange text-white hover:bg-orange-600 shadow-lg shadow-orange-200 hover:shadow-orange-300': variant === 'primary',
                    'bg-brand-slate text-white hover:bg-slate-700 shadow-lg shadow-slate-200': variant === 'secondary',
                    'border border-gray-200 bg-white hover:bg-gray-50 text-slate-700 hover:border-gray-300': variant === 'outline',
                    'hover:bg-gray-100 text-slate-600': variant === 'ghost',
                    'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200': variant === 'danger',
                    'h-8 px-3 text-xs': size === 'sm',
                    'h-11 px-5 text-sm': size === 'md',
                    'h-14 px-8 text-base': size === 'lg',
                    'h-10 w-10 p-0': size === 'icon',
                },
                className
            )}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});
Button.displayName = "Button";

export { Button };
