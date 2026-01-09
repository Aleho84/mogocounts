const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const { simplifyDebts } = require('../utils/debtGraph');

// Create Group
router.post('/groups', async (req, res) => {
    try {
        const { title, currency } = req.body;
        const group = new Group({ title, currency });
        await group.save();
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Group Details
router.get('/groups/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Participant
router.post('/groups/:id/participants', async (req, res) => {
    try {
        const { name } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        if (!group.participants.includes(name)) {
            group.participants.push(name);
            await group.save();
        }
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Group Title
router.put('/groups/:id', async (req, res) => {
    try {
        const { title } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { title },
            { new: true }
        );
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove Participant
router.delete('/groups/:id/participants', async (req, res) => {
    try {
        const { name } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        group.participants = group.participants.filter(p => p !== name);
        await group.save();
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/expenses', async (req, res) => {
    try {
        const { groupId, description, amount, payer, involved } = req.body;
        const expense = new Expense({
            groupId,
            description,
            amount,
            payer,
            involved
        });
        await expense.save();
        res.json(expense);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Expenses for Group
router.get('/groups/:id/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find({ groupId: req.params.id }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Balance (Simplified Debts)
router.get('/groups/:id/balance', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        const expenses = await Expense.find({ groupId: req.params.id });

        // Calculate balances
        const debts = simplifyDebts(expenses, group.participants);

        res.json({ debts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Expense
router.put('/expenses/:id', async (req, res) => {
    try {
        const { description, amount, payer, involved } = req.body;
        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            { description, amount, payer, involved },
            { new: true }
        );
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        res.json(expense);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Expense
router.delete('/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
