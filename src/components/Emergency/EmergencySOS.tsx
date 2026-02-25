import { useState } from 'react';
import { Phone, X, AlertTriangle, Ambulance, ChevronRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmergencySOS() {
    const [isOpen, setIsOpen] = useState(false);

    const emergencyNumbers = [
        { label: 'Ambulance', number: '102', icon: Ambulance, color: 'bg-rose-500' },
        { label: 'Emergency', number: '112', icon: AlertTriangle, color: 'bg-orange-500' },
        { label: 'Helpline', number: '108', icon: Phone, color: 'bg-indigo-500' },
    ];

    const handleCall = (number: string) => {
        window.location.href = `tel:${number}`;
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* iOS-style Dimmed Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-[998]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Action Sheet Panel */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-24 right-6 z-[999] w-80"
                        >
                            <GlassCard className="overflow-hidden border-0 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 !bg-white/80 dark:!bg-slate-900/80 !backdrop-blur-xl">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg tracking-tight">
                                        Emergency SOS
                                    </h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>

                                {/* List */}
                                <div className="p-2 space-y-1">
                                    {emergencyNumbers.map((item, index) => {
                                        const Icon = item.icon;
                                        return (
                                            <motion.button
                                                key={item.number}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                onClick={() => handleCall(item.number)}
                                                className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                                            >
                                                {/* iOS-style Icon Container */}
                                                <div className={`${item.color} p-2 rounded-lg text-white shadow-sm mr-4 group-hover:scale-105 transition-transform`}>
                                                    <Icon className="w-5 h-5 fill-current" />
                                                </div>

                                                <div className="flex-1 text-left">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100 text-[15px]">
                                                        {item.label}
                                                    </p>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                                                        Call {item.number}
                                                    </p>
                                                </div>

                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="p-3 bg-gray-50/50 dark:bg-white/5 text-center border-t border-gray-200/50 dark:border-white/10">
                                    <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        India Emergency Services
                                    </p>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating SOS Button - "Breathing" Animation */}
            <motion.button
                layout
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[999] group outline-none focus:outline-none w-16 h-16"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Emergency SOS"
            >
                <div className="relative flex items-center justify-center">
                    {/* Ripple Effect (Breathing) */}
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-red-500 rounded-full"
                    />

                    {/* Main Button */}
                    <div className={`
                        relative w-16 h-16 rounded-full flex items-center justify-center
                        bg-gradient-to-b from-red-500 to-red-600 
                        shadow-[0_10px_20px_rgba(239,68,68,0.4),0_6px_6px_rgba(239,68,68,0.2),inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)]
                        transition-all duration-300
                        ${isOpen ? 'rotate-90 bg-gray-700 !from-gray-700 !to-gray-800' : ''}
                    `}>
                        {isOpen ? (
                            <X className="w-8 h-8 text-white drop-shadow-sm" />
                        ) : (
                            <span className="text-white font-black text-lg tracking-wider drop-shadow-sm">
                                SOS
                            </span>
                        )}
                    </div>
                </div>
            </motion.button>
        </>
    );
}
