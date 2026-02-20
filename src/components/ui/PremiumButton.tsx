
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PremiumButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = "",
    isLoading = false,
    icon,
    disabled,
    ...props
}) => {
    const baseStyles = "relative overflow-hidden rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group";

    const variants = {
        primary: `
            bg-gradient-to-br from-indigo-500 to-violet-600 
            hover:from-indigo-400 hover:to-violet-500
            text-white 
            shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] 
            hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] 
            border border-white/20 border-t-white/40
        `,
        secondary: `
            bg-white/80 dark:bg-slate-800/80
            hover:bg-white dark:hover:bg-slate-700
            text-slate-700 dark:text-slate-200
            border border-slate-200 dark:border-slate-700
            shadow-sm hover:shadow-md
            backdrop-blur-sm
        `,
        ghost: `
            bg-transparent 
            hover:bg-slate-100 dark:hover:bg-slate-800/50 
            text-slate-600 dark:text-slate-400
            hover:text-slate-900 dark:hover:text-slate-200
        `,
        danger: `
            bg-gradient-to-br from-red-500 to-rose-600
            text-white
            shadow-[0_4px_14px_0_rgba(244,63,94,0.39)]
            hover:shadow-[0_6px_20px_rgba(244,63,94,0.23)]
            border border-white/20
        `
    };

    const sizes = {
        sm: "px-4 py-1.5 text-sm",
        md: "px-6 py-2.5 text-base",
        lg: "px-8 py-3.5 text-lg"
    };

    return (
        <motion.button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : icon}
            {children}
            {/* Glossy overlay */}
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-white/5 to-white/20 pointer-events-none" />
            )}
        </motion.button>
    );
};
