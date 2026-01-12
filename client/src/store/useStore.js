import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
            // 1. Create Group
            const res = await axios.post(`${API_URL}/groups`, { title, currency });
            const group = res.data;

            // 2. Add Creator to Group
            let finalGroupState = await axios.post(`${API_URL}/groups/${group._id}/participants`, { name: participantName });

            // 3. Add other participants
            if (otherParticipants.length > 0) {
                const addPromises = otherParticipants.map(name =>
                    axios.post(`${API_URL}/groups/${group._id}/participants`, { name })
                );
                // Wait for all to finish, use the last response as final state or fetch again
                const results = await Promise.all(addPromises);
                if (results.length > 0) {
                    finalGroupState = results[results.length - 1];
                }
            }

            set({ currentGroup: finalGroupState.data, loading: false });
            return finalGroupState.data;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    fetchGroup: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await axios.get(`${API_URL}/groups/${id}`);
            set({ currentGroup: res.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
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
            // Refresh expenses
            const res = await axios.get(`${API_URL}/groups/${expenseData.groupId}/expenses`);
            set({ expenses: res.data });
        } catch (err) {
            console.error(err);
        }
    },

    updateExpense: async (id, expenseData) => {
        try {
            await axios.put(`${API_URL}/expenses/${id}`, expenseData);
            // Refresh expenses
            const res = await axios.get(`${API_URL}/groups/${expenseData.groupId}/expenses`);
            set({ expenses: res.data });
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    deleteExpense: async (expenseId, groupId) => {
        // Optimistic update
        set((state) => ({
            expenses: state.expenses.filter(e => e._id !== expenseId)
        }));

        try {
            await axios.delete(`${API_URL}/expenses/${expenseId}`);
            // No need to re-fetch if successful, optimistic update holds. 
            // But re-fetching balance might be good.
            // For now, let's re-fetch expenses to be sure of sync.
            const res = await axios.get(`${API_URL}/groups/${groupId}/expenses`);
            set({ expenses: res.data });
        } catch (err) {
            console.error(err);
            alert('Error al eliminar gasto: ' + err.message);
            // Revert by fetching again
            const res = await axios.get(`${API_URL}/groups/${groupId}/expenses`);
            set({ expenses: res.data });
        }
    },

    fetchExpenses: async (groupId) => {
        set({ loading: true });
        try {
            const res = await axios.get(`${API_URL}/groups/${groupId}/expenses`);
            set({ expenses: res.data, loading: false });
        } catch (err) {
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
    name: 'cococounts-storage',
    partialize: (state) => ({
        currentUser: state.currentUser,
        currentGroup: state.currentGroup
    }),
}));
