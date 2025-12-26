import { HTMLAttributes, forwardRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(({
    className,
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    ...props
}, ref) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="fixed inset-0 bg-brand-slate/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div
                ref={ref}
                className={cn(
                    "relative w-full max-w-lg transform overflow-hidden rounded-[32px] bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200",
                    className
                )}
                {...props}
            >
                <div className="p-6 md:p-8">
                    <header className="flex items-start justify-between mb-6">
                        <div>
                            {title && <h3 className="text-2xl font-black text-brand-slate tracking-tight leading-none">{title}</h3>}
                            {description && <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">{description}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 -mt-2 text-slate-300 hover:text-red-500 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <X size={24} />
                        </button>
                    </header>

                    <div className="overflow-y-auto custom-scrollbar max-h-[60vh] -mx-2 px-2">
                        {children}
                    </div>

                    {footer && (
                        <div className="mt-8 pt-6 border-t border-slate-50 flex justify-end gap-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
});
Modal.displayName = "Modal";

export { Modal };
