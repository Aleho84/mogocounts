import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { groupsApi, expensesApi } from '../lib/api';

export const useStore = create(persist((set) => ({
    currentGroup: null,
    expenses: [],
    loading: false,
    error: null,
    balance: [],
    currentUser: null,

    setCurrentUser: (user) => set({ currentUser: user }),

    createGroup: async (title, currency, participantName, otherParticipants = []) => {
        set({ loading: true, error: null });
        try {
            // 1. Crear Grupo
            const group = await groupsApi.create(title, currency);

            // 2. Agregar Creador al Grupo
            let finalGroupState = await groupsApi.addParticipant(group._id, participantName);

            // 3. Agregar otros participantes
            if (otherParticipants.length > 0) {
                const addPromises = otherParticipants.map(name =>
                    groupsApi.addParticipant(group._id, name)
                );
                // Esperar a que todos terminen, usar la última respuesta como estado final
                const results = await Promise.all(addPromises);
                if (results.length > 0) {
                    finalGroupState = results[results.length - 1];
                }
            }

            set({ currentGroup: finalGroupState, loading: false });
            return finalGroupState;
        } catch (err) {
            console.error("Error creating group:", err);
            set({ error: err.message, loading: false });
            toast.error(err.message || 'Error creando grupo');
            throw err;
        }
    },

    fetchGroup: async (id) => {
        set({ loading: true, error: null });
        try {
            const group = await groupsApi.getById(id);
            set({ currentGroup: group, loading: false });
        } catch (err) {
            set({ error: 'GROUP_NOT_FOUND', loading: false, currentGroup: null });
        }
    },

    addParticipant: async (groupId, name) => {
        try {
            const group = await groupsApi.addParticipant(groupId, name);
            set({ currentGroup: group });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Error agregando participante');
        }
    },

    removeParticipant: async (groupId, name) => {
        try {
            const group = await groupsApi.removeParticipant(groupId, name);
            set({ currentGroup: group });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Error al eliminar participante');
        }
    },

    updateGroup: async (groupId, title) => {
        try {
            const group = await groupsApi.update(groupId, title);
            set({ currentGroup: group });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Error al actualizar grupo');
        }
    },

    addExpense: async (expenseData) => {
        try {
            await expensesApi.create(expenseData);
            // Actualizar gastos tras agregar
            const expenses = await groupsApi.getExpenses(expenseData.groupId);
            set({ expenses });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Error al añadir gasto');
        }
    },

    updateExpense: async (id, expenseData) => {
        try {
            await expensesApi.update(id, expenseData);
            // Actualizar gastos tras editar
            const expenses = await groupsApi.getExpenses(expenseData.groupId);
            set({ expenses });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Error calculando actualización');
            throw err;
        }
    },

    deleteExpense: async (expenseId, groupId) => {
        // Actualización optima
        set((state) => ({
            expenses: state.expenses.filter(e => e._id !== expenseId)
        }));

        try {
            await expensesApi.delete(expenseId);
            const expenses = await groupsApi.getExpenses(groupId);
            set({ expenses });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Error al eliminar gasto');
            // Revertir
            const expenses = await groupsApi.getExpenses(groupId);
            set({ expenses });
        }
    },

    fetchExpenses: async (groupId) => {
        set({ loading: true });
        try {
            const expenses = await groupsApi.getExpenses(groupId);
            set({ expenses, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    fetchBalance: async (groupId) => {
        try {
            const balanceData = await groupsApi.getBalance(groupId);
            set({ balance: balanceData.debts });
        } catch (err) {
            console.error(err);
        }
    },

    settleDebt: async (groupId, debtor, creditor, amount) => {
        try {
            const settlementData = {
                groupId,
                description: `Saldado de deuda (${debtor} a ${creditor})`,
                amount,
                payer: debtor,
                involved: [creditor],
                isSettlement: true
            };
            await expensesApi.create(settlementData);
            toast.success(`La deuda de ${debtor} fue saldada exitosamente`);
            
            // Actualizar dependencias
            const expenses = await groupsApi.getExpenses(groupId);
            const balanceData = await groupsApi.getBalance(groupId);
            
            set({ expenses, balance: balanceData.debts });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Error al saldar la deuda');
        }
    }
}), {
    name: 'mogocounts-storage',
    partialize: (state) => ({
        currentUser: state.currentUser,
        currentGroup: state.currentGroup
    }),
}));
