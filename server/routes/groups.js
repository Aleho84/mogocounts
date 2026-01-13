const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const { simplifyDebts } = require('../utils/debtGraph');

// Middleware de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Crear Grupo
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

// Obtener Detalles del Grupo
router.get('/:id', async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json({ error: 'Group not found (Invalid ID)' });
        }
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Actualizar Título del Grupo
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

// Agregar Participante
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

// Eliminar Participante
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

// Obtener Gastos del Grupo
router.get('/:id/expenses', async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json({ error: 'Group not found (Invalid ID)' });
        }
        const expenses = await Expense.find({ groupId: req.params.id }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Obtener Balance
router.get('/:id/balance', async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json({ error: 'Group not found (Invalid ID)' });
        }

        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Verificar caché usando marca de tiempo
        if (group.debtsLastUpdated && group.cachedDebts) {
            return res.json({ debts: group.cachedDebts });
        }

        const expenses = await Expense.find({ groupId: req.params.id });
        const debts = simplifyDebts(expenses, group.participants);

        // Actualizar caché
        group.cachedDebts = debts;
        group.debtsLastUpdated = new Date();
        await group.save();

        res.json({ debts });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
