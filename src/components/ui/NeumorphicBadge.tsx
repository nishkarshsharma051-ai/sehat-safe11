
import React from 'react';

interface NeumorphicBadgeProps {
    children: React.ReactNode;
    variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
    className?: string;
}

export const NeumorphicBadge: React.FC<NeumorphicBadgeProps> = ({
    children,
    variant = 'neutral',
    className = ""
}) => {
    const variants = {
        neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
        warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800",
        error: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-100 dark:border-rose-800",
        info: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800"
    };

    return (
        <span className={`
            px-3 py-1 
            rounded-full 
            text-xs font-semibold 
            border
            shadow-inner
            inline-flex items-center gap-1.5
            backdrop-blur-sm
            ${variants[variant]}
            ${variant === 'neutral' ? 'border-slate-200 dark:border-slate-700' : ''}
            ${className}
        `}>
            {/* Status Dot */}
            <span className={`w-1.5 h-1.5 rounded-full ${variant === 'neutral' ? 'bg-slate-400' :
                    variant === 'success' ? 'bg-emerald-500' :
                        variant === 'warning' ? 'bg-amber-500' :
                            variant === 'error' ? 'bg-rose-500' :
                                'bg-blue-500'
                }`} />
            {children}
        </span>
    );
};
