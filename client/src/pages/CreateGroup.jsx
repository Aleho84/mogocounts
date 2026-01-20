import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Users, ArrowRight, Plus, X } from 'lucide-react';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Card from '../components/ui/card';

import { PageTransition } from '../components/ui/PageTransition';

const CreateGroup = () => {
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [participants, setParticipants] = useState([]);
    const [newParticipant, setNewParticipant] = useState('');

    const { createGroup, loading } = useStore();
    const navigate = useNavigate();

    const handleAddParticipant = (e) => {
        e.preventDefault();
        if (newParticipant.trim()) {
            if (!participants.includes(newParticipant.trim()) && newParticipant.trim() !== username) {
                setParticipants([...participants, newParticipant.trim()]);
            }
            setNewParticipant('');
        }
    };

    const handleRemoveParticipant = (name) => {
        setParticipants(participants.filter(p => p !== name));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !username) return;

        try {
            const group = await createGroup(title, 'ARS', username, participants);
            navigate(`/group/${group._id}/expenses`);
        } catch {
            alert('Error creating group');
        }
    };

    return (
        <PageTransition className="min-h-[100dvh] bg-slate-900 flex flex-col justify-center p-6 relative overflow-hidden">
            {/* Decoraciones de fondo */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

            <div className="max-w-md mx-auto w-full relative z-10">
                <div className="text-center mb-8 animate-slide-up">
                    <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl mb-6 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/20">
                        <img src="/logo.png" alt="Logo" className="w-[120px] h-[120px] object-contain" />
                    </div>
                    <div className="block">
                        <div className="relative inline-block">
                            <h1 className="text-4xl font-display font-bold text-white mb-3 tracking-tight">
                                Mogo<span className="text-indigo-400">Counts</span>
                            </h1>
                            <span className="absolute -bottom-0 -right-6 rotate-[-15deg] bg-rose-500/10 border border-rose-500/50 text-rose-500 text-[8px] font-bold px-1.5 rounded uppercase tracking-wider">
                                Beta
                            </span>
                        </div>
                    </div>
                    <div className="text-slate-400 leading-relaxed">
                        <p className="text-lg mb-2">
                            Dividir gastos nunca fue tan fácil.
                        </p>
                        <p className="text-sm opacity-80">
                            Ahora es tan fácil de usar que hasta el mas retrasado de tu amigo lo va a manejar sin problemas.
                        </p>
                    </div>
                </div>

                <Card glass className="p-6 backdrop-blur-xl animate-scale-up" style={{ animationDelay: '100ms' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                label="NOMBRE DEL GRUPO"
                                placeholder="Ej. Asado en lo de Clau"
                                icon={Users}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />

                            <Input
                                label="TU APODO"
                                placeholder="Ej. El tio Chicho"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />

                            {/* Sección de Participantes */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    PARTICIPANTES (OPCIONAL)
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Nombre de amigo"
                                            value={newParticipant}
                                            onChange={(e) => setNewParticipant(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddParticipant(e);
                                                }
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleAddParticipant}
                                        className="h-[50px] w-[50px] p-0 flex items-center justify-center shrink-0"
                                        disabled={!newParticipant.trim()}
                                    >
                                        <Plus size={24} />
                                    </Button>
                                </div>

                                {participants.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        {participants.map((p, idx) => (
                                            <div key={idx} className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-500/30">
                                                <span>{p}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveParticipant(p)}
                                                    className="hover:text-white transition-colors p-0.5"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full text-lg py-4 shadow-xl shadow-indigo-500/25 mt-4"
                            disabled={loading || !title || !username}
                            isLoading={loading}
                        >
                            Comenzar <ArrowRight size={20} className="ml-2" />
                        </Button>
                    </form>
                </Card>

                <p className="text-center text-slate-500 text-xs mt-8">
                    Sin necesidad de registro. Simple y rápido.
                </p>
            </div>
        </PageTransition>
    );
};

export default CreateGroup;
