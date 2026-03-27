import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MoveRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Avatar from '../components/ui/avatar';

import { PageTransition } from '../components/ui/PageTransition';
import GroupNotFound from './GroupNotFound';
import { toast } from 'sonner';

const BalanceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { balance, fetchBalance, currentGroup, fetchGroup, error, settleDebt } = useStore();
    const [settlingIdx, setSettlingIdx] = useState(null);

    useEffect(() => {
        if (id) {
            if (!currentGroup || currentGroup._id !== id) fetchGroup(id);
            fetchBalance(id);
        }
    }, [id, currentGroup, fetchGroup, fetchBalance]);

    if (error === 'GROUP_NOT_FOUND') return <GroupNotFound />;

    const handleSettle = async (debt, idx) => {
        setSettlingIdx(idx);
        await settleDebt(id, debt.from, debt.to, debt.amount);
        setSettlingIdx(null);
    };

    return (
        <PageTransition className="min-h-[100dvh] bg-slate-900 pb-24">
            {/* Encabezado */}
            <div className="p-6 flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="mr-2 text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-2xl font-bold text-slate-100">Balance de Deudas</h1>
            </div>

            <div className="px-6">
                {balance.length === 0 ? (
                    <Card className="border-dashed border-2 bg-transparent border-slate-700 p-8 text-center mt-8">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="text-emerald-400 font-medium text-lg mb-1">¡Todo saldado!</p>
                        <p className="text-slate-500 text-sm">No hay deudas pendientes en el grupo.</p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="h-px bg-slate-800 flex-1"></div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pagos sugeridos</p>
                            <div className="h-px bg-slate-800 flex-1"></div>
                        </div>

                        {balance.map((debt, idx) => (
                            <Card key={idx} className="bg-slate-800/80 border-l-4 border-l-indigo-500 hover:bg-slate-800 transition-colors flex flex-col">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex flex-col items-center">
                                            <Avatar name={debt.from} isActive={false} className="mb-1" />
                                            <span className="text-xs font-bold text-slate-400">{debt.from}</span>
                                        </div>

                                        <div className="flex-1 flex flex-col items-center px-2">
                                            <span className="text-xs text-indigo-400 font-medium mb-5 block">envía</span>
                                            <div className="w-full h-0.5 bg-slate-700 relative">
                                                <MoveRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-600 bg-slate-800 px-1" size={24} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <Avatar name={debt.to} isActive={true} className="mb-1" />
                                            <span className="text-xs font-bold text-indigo-300">{debt.to}</span>
                                        </div>
                                    </div>

                                    <div className="ml-4 pl-4 border-l border-slate-700/50 flex flex-col items-end gap-2">
                                        <span className="font-display text-xl text-emerald-400 font-bold block">
                                            ${debt.amount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-4 pb-4 pt-0">
                                    <Button 
                                        onClick={() => handleSettle(debt, idx)} 
                                        disabled={settlingIdx !== null}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-500/20 disabled:scale-100 disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={16} className="mr-2" />
                                        {settlingIdx === idx ? 'Saldando...' : 'Marcar como Saldado'}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-8 bg-slate-800/50 p-4 rounded-xl text-center max-w-xs mx-auto backdrop-blur-sm border border-slate-700/30">
                    <p className="text-xs text-slate-500">
                        Este cálculo minimiza las transacciones necesarias. Marcar como saldado para asentar el pago.
                    </p>
                </div>
            </div>
        </PageTransition>
    );
};

export default BalanceView;
