import { motion } from 'framer-motion';
import React from 'react';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 10,
        filter: "blur(5px)"
    },
    animate: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.4,
            ease: [0.25, 1, 0.5, 1] as const // Cubic bezier for "Apple-like" feel
        },
        transitionEnd: {
            transform: "none",
            filter: "none"
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        filter: "blur(5px)",
        transition: {
            duration: 0.3,
            ease: "easeIn" as const
        }
    }
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = "" }) => {
    return (
        <motion.div
            className={className}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
        >
            {children}
        </motion.div>
    );
};
