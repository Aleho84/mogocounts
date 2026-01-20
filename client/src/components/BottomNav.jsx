import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Receipt, Scale, Settings, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';

const BottomNav = () => {
    const { currentGroup, error } = useStore();
    const location = useLocation();

    if (location.pathname === '/' || error) return null;

    if (!currentGroup) return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6">
            <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-2 shadow-2xl shadow-black/50 h-[66px] animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/50 mx-1"></div>
                <div className="w-18 h-18 rounded-full bg-slate-800/50 -mt-8 border-4 border-slate-900"></div>
                <div className="w-12 h-12 rounded-2xl bg-slate-800/50 mx-1"></div>
                <div className="w-12 h-12 rounded-2xl bg-slate-800/50 mx-1"></div>
            </div>
        </div>
    );

    const navItemClasses = ({ isActive }) => `
        relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
        ${isActive
            ? 'text-indigo-400 bg-indigo-500/10 scale-110'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }
    `;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6">
            <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-2 shadow-2xl shadow-black/50">
                <NavLink
                    to={`/group/${currentGroup._id}/expenses`}
                    className={navItemClasses}
                >
                    <Receipt size={24} strokeWidth={1.5} />
                </NavLink>


                <NavLink
                    to={`/group/${currentGroup._id}/add`}
                    className={({ isActive }) => `
                        flex items-center justify-center w-14 h-14 bg-indigo-500 rounded-full text-white shadow-lg shadow-indigo-500/40 transition-all duration-300
                        ${isActive ? 'scale-125 ring-4 ring-slate-900' : 'active:scale-95 hover:scale-110'}
                    `}
                >
                    <Plus size={32} />
                </NavLink>


                <NavLink
                    to={`/group/${currentGroup._id}/balance`}
                    className={navItemClasses}
                >
                    <Scale size={24} strokeWidth={1.5} />
                </NavLink>

                <NavLink
                    to={`/group/${currentGroup._id}/settings`}
                    className={navItemClasses}
                >
                    <Settings size={24} strokeWidth={1.5} />
                </NavLink>
            </div>
        </div>
    );
};

export default BottomNav;
