import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Users, Save, Trash2, Plus, Edit2 } from 'lucide-react';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Card from '../components/ui/card';
import GroupNotFound from './GroupNotFound';
import { PageTransition } from '../components/ui/PageTransition';
import { toast } from 'sonner';

const GroupSettings = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentGroup, fetchGroup, updateGroup, addParticipant, removeParticipant, error } = useStore();

    const [title, setTitle] = useState('');
    const [newParticipant, setNewParticipant] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!currentGroup || currentGroup._id !== id) {
            fetchGroup(id);
        }
    }, [id, currentGroup, fetchGroup]);

    const handleUpdateTitle = async () => {
        if (title.trim() === '') return;
        try {
            await updateGroup(id, title);
            setIsEditingTitle(false);
            toast.success('Nombre del grupo actualizado');
        } catch {
            toast.error('Error al actualizar nombre');
        }
    };

    const handleAddParticipant = async (e) => {
        e.preventDefault();
        if (newParticipant.trim() === '') return;
        try {
            await addParticipant(id, newParticipant);
            setNewParticipant('');
            toast.success(`${newParticipant} agregado al grupo`);
        } catch {
            toast.error('Error al agregar participante');
        }
    };

    // Removed unused local handleRemoveParticipant

    if (!currentGroup && !error) return <div className="p-4 text-center text-slate-400">Cargando...</div>;

    if (error === 'GROUP_NOT_FOUND') return <GroupNotFound />;

    return (
        <div className="min-h-[100dvh] bg-slate-900 pb-32">
            {/* Encabezado */}
            <div className="flex items-center gap-4 p-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/group/${id}/expenses`)}
                    className="text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-bold text-white">Configuración del Grupo</h1>
            </div>

            <div className="px-6 space-y-8">
                {/* Sección de Título */}
                <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Nombre del Grupo</h2>
                    <div className="flex items-center gap-3">
                        {isEditingTitle ? (
                            <div className="flex-1 flex gap-2 animate-fade-in">
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-slate-800 border-none text-lg"
                                    autoFocus
                                />
                                <Button size="icon" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleUpdateTitle}>
                                    <Save size={20} />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                <span className="text-xl font-display font-bold text-white">{currentGroup.title}</span>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-400" onClick={() => { setTitle(currentGroup.title); setIsEditingTitle(true); }}>
                                    <Edit2 size={18} />
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sección de Participantes */}
                <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Participantes ({currentGroup.participants.length})</h2>

                    {/* Formulario para Agregar Participante */}
                    <form onSubmit={handleAddParticipant} className="mb-6 flex gap-2">
                        <Input
                            placeholder="Agregar persona..."
                            value={newParticipant}
                            onChange={(e) => setNewParticipant(e.target.value)}
                            className="bg-slate-800 border-slate-700"
                            containerClassName="flex-1"
                            icon={Users}
                        />
                        <Button type="submit" size="icon" className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 shrink-0 w-12 h-12 rounded-xl">
                            <Plus size={24} />
                        </Button>
                    </form>

                    {/* Lista de Participantes */}
                    <div className="space-y-3">
                        {currentGroup.participants.map(participant => (
                            <Card key={participant} className="bg-slate-800/40 border-slate-700/30 flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                        {participant.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-slate-200">{participant}</span>
                                </div>

                                <div className="flex gap-1">
                                    {confirmDeleteId === participant ? (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeParticipant(id, participant);
                                                    setConfirmDeleteId(null);
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
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDeleteId(participant);
                                            }}
                                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default GroupSettings;
