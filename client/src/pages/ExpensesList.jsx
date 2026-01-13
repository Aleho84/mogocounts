import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Share2, Users, Calendar, ArrowLeft, LogOut, Home, Pencil, Trash2 } from 'lucide-react';
import Card from '../components/ui/card';
import Button from '../components/ui/button';

import { PageTransition } from '../components/ui/PageTransition';
import GroupNotFound from './GroupNotFound';
import { toast } from 'sonner';

const ExpensesList = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentGroup, expenses, fetchGroup, fetchExpenses, loading, currentUser, setCurrentUser, deleteExpense, error } = useStore();
    // const [showUserSelect, setShowUserSelect] = useState(false); // Derived from currentUser
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const showUserSelect = currentGroup && !currentUser;

    useEffect(() => {
        if (id) {
            if (!currentGroup || currentGroup._id !== id) fetchGroup(id);
            fetchExpenses(id);
        }
    }, [id, fetchGroup, fetchExpenses, currentGroup]);

    // Moved error check down


    // Removed useEffect for showUserSelect as it is derived state

    const handleUserSelect = (user) => {
        setCurrentUser(user);
        // setShowUserSelect(false); // Auto update
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('¡Enlace copiado al portapapeles!');
    };

    if (error === 'GROUP_NOT_FOUND') {
        return <GroupNotFound />;
    }

    if (!currentGroup) return (
        <div className="flex items-center justify-center min-h-[100dvh] text-slate-400">
            <div className="animate-pulse">Cargando grupo...</div>
        </div>
    );

    // Modal de Selección de Usuario
    if (showUserSelect) {
        return (
            <PageTransition className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-6 relative">
                <div className="absolute top-0 left-0 w-full h-full bg-slate-900/50 backdrop-blur-sm z-0"></div>
                <div className="relative z-10 w-full max-w-md">
                    <h2 className="text-3xl font-display font-bold text-white mb-2 text-center">¿Quién eres?</h2>
                    <p className="text-slate-400 text-center mb-8">Selecciona tu usuario para continuar</p>

                    <div className="grid gap-3">
                        {currentGroup.participants.map((participant, idx) => (
                            <Button
                                key={idx}
                                variant="secondary"
                                className="w-full justify-start text-lg py-6 bg-slate-800 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all"
                                onClick={() => handleUserSelect(participant)}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm mr-4 shrink-0">
                                    {participant.charAt(0).toUpperCase()}
                                </div>
                                {participant}
                            </Button>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <Button variant="ghost" className="text-slate-500 hover:text-white" onClick={() => navigate('/')}>
                            <Home size={18} className="mr-2" /> Volver al Inicio
                        </Button>
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition className="min-h-[100dvh] pb-32">
            {/* Encabezado / Banner */}
            <div className="relative bg-gradient-to-b from-indigo-900/20 to-slate-900 pt-6 pb-6 px-6 rounded-b-[3rem] border-b border-indigo-500/10">
                {/* Navegación Superior */}
                <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-400 hover:text-white hover:bg-slate-800">
                        <Home size={24} />
                    </Button>

                    {currentUser && (
                        <div className="flex items-center bg-slate-800/80 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-slate-700/50 cursor-pointer hover:border-indigo-500/50 transition-colors group" onClick={() => setCurrentUser(null)}>
                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white mr-2">
                                {currentUser.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-slate-300 group-hover:text-white mr-2">{currentUser}</span>
                            <LogOut size={12} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h1 className="text-4xl font-display font-black tracking-tighter mb-2 drop-shadow-lg">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                                {currentGroup.title}
                            </span>
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center text-indigo-200 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-full w-fit backdrop-blur-md shadow-sm">
                                <Users size={14} className="mr-1.5 text-indigo-400" />
                                <span className="text-xs font-semibold">{currentGroup.participants.length} amigos</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyLink}
                        className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 shadow-lg shadow-indigo-500/10 mb-1"
                    >
                        <Share2 size={20} />
                    </Button>
                </div>
            </div>

            {/* Lista de Gastos */}
            <div className="px-4 -mt-2 space-y-3">
                {loading && expenses.length === 0 ? (
                    <div className="space-y-3 mt-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="glass-card p-8 rounded-3xl text-center mt-6 mx-2">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            💸
                        </div>
                        <p className="text-white font-medium text-lg mb-1">Todo tranquilo</p>
                        <p className="text-sm text-slate-400">No hay gastos registrados aún.</p>
                    </div>
                ) : (
                    expenses.map((expense, index) => (
                        <Card
                            key={expense._id}
                            className="bg-slate-800/60 hover:bg-slate-800 border-none transition-all duration-200 animate-slide-up group relative"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20 text-shadow-sm">
                                        {expense.payer.charAt(0).toUpperCase()}
                                    </div>
                                    <div onClick={() => navigate(`/group/${id}/add`, { state: { expenseToEdit: expense } })} className="cursor-pointer">
                                        <h3 className="font-medium text-slate-100 text-lg leading-tight mb-0.5 group-hover:text-indigo-300 transition-colors">
                                            {expense.description}
                                        </h3>
                                        <div className="flex items-center text-xs text-slate-400">
                                            <span className={`font-medium mr-1 ${expense.payer === currentUser ? 'text-indigo-400' : 'text-slate-300'}`}>
                                                {expense.payer === currentUser ? 'Tú' : expense.payer}
                                            </span>
                                            pagó
                                            <span className="mx-1.5 opacity-30">|</span>
                                            <Calendar size={10} className="mr-1" />
                                            {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 block">
                                        ${expense.amount.toLocaleString()}
                                    </span>
                                    {/* Acciones */}
                                    <div className="flex items-center gap-1 mt-1 z-20 relative">
                                        {confirmDeleteId === expense._id ? (
                                            <>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await deleteExpense(expense._id, id);
                                                            toast.success('Gasto eliminado');
                                                            setConfirmDeleteId(null);
                                                        } catch {
                                                            toast.error('Error al eliminar');
                                                        }
                                                    }}
                                                    className="p-1.5 text-white bg-rose-500 rounded-lg shadow-lg hover:bg-rose-600 transition-colors animate-fade-in"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteId(null);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                >
                                                    <ArrowLeft size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/group/${id}/add`, { state: { expenseToEdit: expense } }); }}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteId(expense._id);
                                                    }}
                                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </PageTransition>
    );
};

export default ExpensesList;
