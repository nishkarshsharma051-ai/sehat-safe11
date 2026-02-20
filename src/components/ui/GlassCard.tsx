
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = "",
    hoverEffect = true,
    ...props
}) => {
    return (
        <motion.div
            className={`
                bg-white/60 dark:bg-slate-900/60 
                backdrop-blur-xl 
                border border-white/40 dark:border-white/10 
                border-t-white/60 dark:border-t-white/20
                shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]
                rounded-3xl 
                p-6 
                ${className}
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            whileHover={hoverEffect ? {
                y: -4,
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                borderColor: "rgba(255,255,255,0.8)"
            } : {}}
            {...props}
        >
            {children}
        </motion.div>
    );
};
