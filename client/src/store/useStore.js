import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
            const res = await axios.post(`${API_URL}/groups`, { title, currency });
            const group = res.data;

            // 2. Agregar Creador al Grupo
            let finalGroupState = await axios.post(`${API_URL}/groups/${group._id}/participants`, { name: participantName });

            // 3. Agregar otros participantes
            if (otherParticipants.length > 0) {
                const addPromises = otherParticipants.map(name =>
                    axios.post(`${API_URL}/groups/${group._id}/participants`, { name })
                );
                // Esperar a que todos terminen, usar la última respuesta como estado final o volver a buscar
                const results = await Promise.all(addPromises);
                if (results.length > 0) {
                    finalGroupState = results[results.length - 1];
                }
            }

            set({ currentGroup: finalGroupState.data, loading: false });
            return finalGroupState.data;
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message;
            console.error("Error creating group:", errorMessage, err);
            set({ error: errorMessage, loading: false });
            throw err;
        }
    },

    fetchGroup: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await axios.get(`${API_URL}/groups/${id}`);
            set({ currentGroup: res.data, loading: false });
        } catch (err) {
            if (err.response && (err.response.status === 404 || err.response.status === 400 || err.response.status === 500)) {
                set({ error: 'GROUP_NOT_FOUND', loading: false, currentGroup: null });
            } else {
                set({ error: err.message, loading: false });
            }
        }
    },

    addParticipant: async (groupId, name) => {
        try {
            const res = await axios.post(`${API_URL}/groups/${groupId}/participants`, { name });
            set({ currentGroup: res.data });
        } catch (err) {
            console.error(err);
        }
    },

    removeParticipant: async (groupId, name) => {
        try {
            const res = await axios.delete(`${API_URL}/groups/${groupId}/participants`, { data: { name } });
            set({ currentGroup: res.data });
        } catch (err) {
            console.error(err);
            alert('Error al eliminar participante: ' + err.message);
        }
    },

    updateGroup: async (groupId, title) => {
        try {
            const res = await axios.put(`${API_URL}/groups/${groupId}`, { title });
            set({ currentGroup: res.data });
        } catch (err) {
            console.error(err);
            alert('Error al actualizar grupo: ' + err.message);
        }
    },

    addExpense: async (expenseData) => {
        try {
            await axios.post(`${API_URL}/expenses`, expenseData);
            // Actualizar gastos
            const res = await axios.get(`${API_URL}/groups/${expenseData.groupId}/expenses`);
            set({ expenses: res.data });
        } catch (err) {
            console.error(err);
        }
    },

    updateExpense: async (id, expenseData) => {
        try {
            await axios.put(`${API_URL}/expenses/${id}`, expenseData);
            // Actualizar gastos
            const res = await axios.get(`${API_URL}/groups/${expenseData.groupId}/expenses`);
            set({ expenses: res.data });
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    deleteExpense: async (expenseId, groupId) => {
        // Actualización optima
        set((state) => ({
            expenses: state.expenses.filter(e => e._id !== expenseId)
        }));

        try {
            await axios.delete(`${API_URL}/expenses/${expenseId}`);
            // No es necesario volver a buscar si tiene éxito, la actualización optima se mantiene. 
            // Pero volver a buscar el balance podría ser bueno.
            // Por ahora, volvamos a buscar los gastos para asegurarnos de la sincronización.
            const res = await axios.get(`${API_URL}/groups/${groupId}/expenses`);
            set({ expenses: res.data });
        } catch (err) {
            console.error(err);
            alert('Error al eliminar gasto: ' + err.message);
            // Revertir buscando de nuevo
            const res = await axios.get(`${API_URL}/groups/${groupId}/expenses`);
            set({ expenses: res.data });
        }
    },

    fetchExpenses: async (groupId) => {
        set({ loading: true });
        try {
            const res = await axios.get(`${API_URL}/groups/${groupId}/expenses`);
            set({ expenses: res.data, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    fetchBalance: async (groupId) => {
        try {
            const res = await axios.get(`${API_URL}/groups/${groupId}/balance`);
            set({ balance: res.data.debts });
        } catch (err) {
            console.error(err);
        }
    }
}), {
    name: 'mogocounts-storage',
    partialize: (state) => ({
        currentUser: state.currentUser,
        currentGroup: state.currentGroup
    }),
}));
