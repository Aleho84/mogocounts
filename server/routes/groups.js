const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const { simplifyDebts } = require('../utils/debtGraph');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Create Group
router.post('/', [
    check('title', 'Title is required').not().isEmpty(),
    check('currency', 'Currency is required').optional().isLength({ min: 3, max: 3 })
], validate, async (req, res) => {
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
router.get('/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Group Title
router.put('/:id', [
    check('title', 'Title is required').not().isEmpty()
], validate, async (req, res) => {
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

// Add Participant
router.post('/:id/participants', [
    check('name', 'Name is required').not().isEmpty()
], validate, async (req, res) => {
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

// Remove Participant
router.delete('/:id/participants', [
    check('name', 'Name is required').not().isEmpty()
], validate, async (req, res) => {
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

// Get Expenses for Group
router.get('/:id/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find({ groupId: req.params.id }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Balance
router.get('/:id/balance', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Check cache using timestamp
        if (group.debtsLastUpdated && group.cachedDebts) {
            return res.json({ debts: group.cachedDebts });
        }

        const expenses = await Expense.find({ groupId: req.params.id });
        const debts = simplifyDebts(expenses, group.participants);

        // Update cache
        group.cachedDebts = debts;
        group.debtsLastUpdated = new Date();
        await group.save();

        res.json({ debts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
