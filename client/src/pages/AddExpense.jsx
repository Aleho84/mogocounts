import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, AlignLeft, Users, Check } from 'lucide-react';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Card from '../components/ui/card';
import { PageTransition } from '../components/ui/PageTransition';
import { toast } from 'sonner';

const AddExpense = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentGroup, addExpense, updateExpense, fetchGroup, currentUser } = useStore();

    // Check if we are editing
    const expenseToEdit = location.state?.expenseToEdit;
    const isEditing = !!expenseToEdit;

    const [amount, setAmount] = useState(expenseToEdit?.amount || '');
    const [description, setDescription] = useState(expenseToEdit?.description || '');
    const [payer, setPayer] = useState(expenseToEdit?.payer || '');
    const [involved, setInvolved] = useState(expenseToEdit?.involved || []);
    const [showSplitModal, setShowSplitModal] = useState(false);

    useEffect(() => {
        if (!currentGroup || currentGroup._id !== id) fetchGroup(id);
    }, [id]);

    useEffect(() => {
        // Init involved if empty and not editing
        if (!isEditing && currentGroup && currentGroup.participants.length > 0 && involved.length === 0) {
            setInvolved(currentGroup.participants);
        }
    }, [currentGroup, isEditing]);

    useEffect(() => {
        // Only set default payer if NOT editing and payer is empty
        if (!isEditing && currentGroup && currentGroup.participants.length > 0 && !payer) {
            if (currentUser && currentGroup.participants.includes(currentUser)) {
                setPayer(currentUser);
            } else {
                setPayer(currentGroup.participants[0]);
            }
        }
    }, [currentGroup, currentUser, isEditing]);

    const handleToggleInvolved = (person) => {
        if (involved.includes(person)) {
            setInvolved(involved.filter(p => p !== person));
        } else {
            setInvolved([...involved, person]);
        }
    };

    const handleSelectAll = () => {
        if (involved.length === currentGroup.participants.length) {
            setInvolved([]);
        } else {
            setInvolved(currentGroup.participants);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !description || !payer) return;

        if (involved.length === 0) {
            toast.error('Debes seleccionar al menos una persona para dividir el gasto.');
            return;
        }

        const expenseData = {
            groupId: id,
            description,
            amount: parseFloat(amount),
            payer,
            involved: involved
        };

        try {
            if (isEditing) {
                await updateExpense(expenseToEdit._id, expenseData);
                toast.success('Gasto actualizado correctamente');
            } else {
                await addExpense(expenseData);
                toast.success('Gasto creado exitosamente');
            }
            navigate(`/group/${id}/expenses`);
        } catch (error) {
            toast.error('Ocurrió un error al guardar el gasto');
        }
    };

    if (!currentGroup) return <div className="p-4 text-center text-slate-400">Cargando...</div>;

    return (
        <PageTransition className="min-h-screen bg-slate-900 pb-10">
            {/* Split Modal */}
            {showSplitModal && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSplitModal(false)} />
                    <div className="relative bg-slate-900 w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 pb-8 border-t border-slate-800 shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">¿Para quién es?</h3>
                            <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-indigo-400">
                                {involved.length === currentGroup.participants.length ? 'Deseleccionar todos' : 'Todos'}
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto mb-6">
                            {currentGroup.participants.map(p => (
                                <div
                                    key={p}
                                    onClick={() => handleToggleInvolved(p)}
                                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${involved.includes(p) ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800 border-transparent hover:bg-slate-700'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${involved.includes(p) ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                            {p.charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`font-medium ${involved.includes(p) ? 'text-white' : 'text-slate-400'}`}>{p}</span>
                                    </div>
                                    {involved.includes(p) && <Check size={20} className="text-indigo-400" />}
                                </div>
                            ))}
                        </div>

                        <Button
                            className="w-full py-4 text-lg bg-indigo-500 hover:bg-indigo-600 text-white"
                            onClick={() => setShowSplitModal(false)}
                        >
                            Listo ({involved.length})
                        </Button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-slate-100 font-semibold tracking-wide">{isEditing ? 'Editar Gasto' : 'Nuevo Gasto'}</h1>
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            <form onSubmit={handleSubmit} className="px-6 space-y-8 animate-fade-in">

                {/* Amount Input */}
                <div className="flex flex-col items-center justify-center py-6">
                    <p className="text-slate-400 text-sm font-medium mb-2">Monto total</p>
                    <div className="relative flex items-center justify-center">
                        <span className="text-3xl text-indigo-400 font-light mr-1">$</span>
                        <input
                            type="number"
                            placeholder="0"
                            autoFocus
                            className="bg-transparent text-5xl font-display font-bold text-center text-white focus:outline-none placeholder-slate-700 w-full max-w-[200px]"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-6">
                    <Input
                        label="DESCRIBE EL GASTO"
                        icon={AlignLeft}
                        placeholder="Ej. Cervezas, Uber, Super..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-slate-800 border-none text-lg py-4"
                        containerClassName="shadow-lg shadow-black/20 rounded-xl"
                        required
                    />

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-3 ml-1 uppercase tracking-wider">
                            ¿Quién pagó?
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {currentGroup.participants.map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPayer(p)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap
                                        ${payer === p
                                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                        }
                                    `}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${payer === p ? 'bg-white text-indigo-500' : 'bg-slate-600 text-slate-200'}`}>
                                        {p.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium">{p}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Card
                        className="bg-slate-800/40 border-slate-700/50 cursor-pointer hover:bg-slate-800/60 transition-colors"
                        onClick={() => setShowSplitModal(true)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">
                                        {involved.length === currentGroup.participants.length ? 'Para todos' :
                                            involved.length === 1 && involved[0] === currentUser ? 'Solo para ti' :
                                                `Para ${involved.length} personas`}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {involved.length === currentGroup.participants.length
                                            ? `${currentGroup.participants.length} personas`
                                            : involved.join(', ')}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300" type="button">
                                Cambiar
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Submit */}
                <div className="mt-12 mb-32">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full text-lg shadow-xl shadow-indigo-500/20 py-4"
                    >
                        {isEditing ? 'Guardar Cambios' : 'Guardar Gasto'}
                        <Check size={20} className="ml-2" />
                    </Button>
                </div>

            </form>
        </PageTransition>
    );
};

export default AddExpense;
