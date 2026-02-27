'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal dialog with overlay, header, body, footer. Closes on Escape and overlay click.
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div
                className="mx-4 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-transform focus:outline-none sm:mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="text-lg font-semibold tracking-tight text-card-foreground">{title}</h2>
                    <button
                        className="rounded-full bg-transparent p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6 text-card-foreground">
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center justify-end gap-2 border-t border-border bg-secondary/30 px-6 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
