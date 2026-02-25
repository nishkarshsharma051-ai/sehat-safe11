import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function InitialLoader() {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{
                opacity: 0,
                scale: 1.1,
                transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
            }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-white dark:bg-black overflow-hidden"
        >
            {/* Aurora Background Effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 2 }}
                className="absolute inset-0 pointer-events-none"
            >
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
            </motion.div>

            <div className="relative flex flex-col items-center">
                {/* Logo Icon "Pop" */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -10 }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        rotate: 0,
                        transition: {
                            type: "spring",
                            damping: 12,
                            stiffness: 100,
                            delay: 0.2
                        }
                    }}
                    className="relative mb-6"
                >
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-[2rem] shadow-2xl shadow-blue-500/30">
                        <motion.div
                            animate={{
                                scale: [1, 1.15, 1],
                                transition: {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                        >
                            <Heart className="w-12 h-12 text-white" fill="white" />
                        </motion.div>
                    </div>

                    {/* Subtle Glow Ring */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.5
                        }}
                        className="absolute inset-0 border-2 border-blue-400 rounded-[2rem] blur-md"
                    />
                </motion.div>

                {/* Text Animation */}
                <div className="overflow-hidden py-2 px-4">
                    <motion.div
                        initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
                        animate={{
                            y: 0,
                            opacity: 1,
                            filter: "blur(0px)",
                            transition: {
                                duration: 0.8,
                                delay: 0.6,
                                ease: [0.22, 1, 0.36, 1]
                            }
                        }}
                        className="flex flex-col items-center"
                    >
                        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">
                            Sehat Safe
                        </h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 1 }}
                            className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mt-2 ml-1"
                        >
                            Premium Health Portal
                        </motion.p>
                    </motion.div>
                </div>

                {/* Smooth Loading Bar */}
                <div className="absolute -bottom-24 w-48 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                            duration: 2.5,
                            ease: "easeInOut",
                            repeat: 0
                        }}
                        className="w-full h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                    />
                </div>
            </div>
        </motion.div>
    );
}
