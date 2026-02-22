import { Shield, Stethoscope, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ViewSwitcherProps {
    currentRole: 'admin' | 'doctor' | 'patient';
    onRoleChange: (role: 'admin' | 'doctor' | 'patient') => void;
}

export default function ViewSwitcher({ currentRole, onRoleChange }: ViewSwitcherProps) {
    const views = [
        { id: 'admin' as const, label: 'Admin', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100' },
        { id: 'doctor' as const, label: 'Doctor', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-100' },
        { id: 'patient' as const, label: 'Patient', icon: UserIcon, color: 'text-green-600', bg: 'bg-green-100' },
    ];

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-card p-2 flex items-center space-x-2 shadow-2xl border border-white/40"
            >
                {views.map((view) => {
                    const Icon = view.icon;
                    const isActive = currentRole === view.id;

                    return (
                        <button
                            key={view.id}
                            onClick={() => onRoleChange(view.id)}
                            className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive
                                    ? 'bg-white shadow-md'
                                    : 'hover:bg-white/50 text-gray-500'
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg ${isActive ? view.bg : 'bg-transparent'}`}>
                                <Icon className={`w-4 h-4 ${isActive ? view.color : 'text-gray-400'}`} />
                            </div>
                            <span className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                {view.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 border-2 border-blue-400/20 rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    );
                })}
            </motion.div>
        </div>
    );
}
