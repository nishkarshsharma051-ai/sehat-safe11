
import { motion } from 'framer-motion';
import { User, Stethoscope, ArrowRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface RoleSelectionProps {
    onSelect: (role: 'patient' | 'doctor') => void;
}

export default function RoleSelection({ onSelect }: RoleSelectionProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Welcome to Sehat Safe
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        Choose your role to continue
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Patient Card */}
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('patient')}
                        className="cursor-pointer group"
                    >
                        <GlassCard className="h-full p-8 border-2 border-transparent hover:border-blue-500 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20"></div>

                            <div className="relative z-10 flex flex-col h-full items-center text-center">
                                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    I am a Patient
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 flex-grow">
                                    Access your health records, prescriptions, and consult with doctors easily.
                                </p>

                                <button className="w-full py-3 px-6 rounded-xl bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/30 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                                    Continue as Patient
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* Doctor Card */}
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('doctor')}
                        className="cursor-pointer group"
                    >
                        <GlassCard className="h-full p-8 border-2 border-transparent hover:border-emerald-500 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-emerald-500/20"></div>

                            <div className="relative z-10 flex flex-col h-full items-center text-center">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Stethoscope className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    I am a Doctor
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 flex-grow">
                                    Manage appointments, view patient history, and provide better care efficiently.
                                </p>

                                <button className="w-full py-3 px-6 rounded-xl bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
                                    Continue as Doctor
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>

                <p className="text-center text-gray-500 text-sm mt-12">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
