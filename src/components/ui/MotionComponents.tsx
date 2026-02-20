import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';

// ─── Variants ───────────────────────────────────────

export const fadeIn = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3 }
};

export const containerStagger = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1 // seamless delay
        }
    }
};

export const itemFadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 50,
            damping: 15
        } as const
    }
};

// ─── Components ─────────────────────────────────────

// 1. Motion Card: Adds depth and lift on hover
interface MotionCardProps extends HTMLMotionProps<"div"> {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}
export const MotionCard: React.FC<MotionCardProps> = ({ children, className = "", ...props }) => {
    return (
        <motion.div
            className={className}
            whileHover={{
                y: -5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// 2. Motion Button: Tactile press effect
interface MotionButtonProps extends HTMLMotionProps<"button"> {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}
export const MotionButton: React.FC<MotionButtonProps> = ({ children, className = "", onClick, ...props }) => {
    return (
        <motion.button
            className={className}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.button>
    );
};

// 3. Stagger Container: Wraps lists to animate children sequentially
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
    className?: string;
    children: React.ReactNode;
}
export const StaggerContainer: React.FC<StaggerContainerProps> = ({ children, className = "", ...props }) => {
    return (
        <motion.div
            variants={containerStagger}
            initial="hidden"
            animate="show"
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// 4. Motion Item: Direct child of StaggerContainer
export const MotionItem: React.FC<HTMLMotionProps<"div">> = ({ children, className, ...props }) => (
    <motion.div variants={itemFadeUp} className={className} {...props}>
        {children}
    </motion.div>
);
