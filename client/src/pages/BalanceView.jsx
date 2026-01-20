import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MoveRight, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/card';
import Button from '../components/ui/button';

import { PageTransition } from '../components/ui/PageTransition';
import GroupNotFound from './GroupNotFound';

const BalanceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { balance, fetchBalance, currentGroup, fetchGroup, error } = useStore();

    useEffect(() => {
        if (id) {
            if (!currentGroup || currentGroup._id !== id) fetchGroup(id);
            fetchBalance(id);
        }
    }, [id, currentGroup, fetchGroup, fetchBalance]);

    if (error === 'GROUP_NOT_FOUND') return <GroupNotFound />;

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
                    <Card className="border-dashed border-2 bg-transparent border-slate-700 p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
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
                            <Card key={idx} className="bg-slate-800/80 border-l-4 border-l-indigo-500 hover:bg-slate-800 transition-colors">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold mb-1">
                                                {debt.from.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">{debt.from}</span>
                                        </div>

                                        <div className="flex-1 flex flex-col items-center px-2">
                                            <span className="text-xs text-indigo-400 font-medium mb-5 block">envía</span>
                                            <div className="w-full h-0.5 bg-slate-700 relative">
                                                <MoveRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-600 bg-slate-800 px-1" size={24} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold mb-1">
                                                {debt.to.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-indigo-300">{debt.to}</span>
                                        </div>
                                    </div>

                                    <div className="ml-4 pl-4 border-l border-slate-700/50">
                                        <span className="font-display text-xl text-emerald-400 font-bold block">
                                            ${debt.amount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-8 bg-slate-800/50 p-4 rounded-xl text-center max-w-xs mx-auto backdrop-blur-sm border border-slate-700/30">
                    <p className="text-xs text-slate-500">
                        Este cálculo minimiza las transacciones necesarias, no sean retrasados y paguen tal como lo indica.
                    </p>
                </div>
            </div>
        </PageTransition>
    );
};

export default BalanceView;
