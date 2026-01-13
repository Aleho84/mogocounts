const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Expense = require('../models/Expense');

// Middleware de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Crear Gasto
router.post('/', [
    check('groupId', 'Group ID is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('amount', 'Amount is required and must be a number').isNumeric(),
    check('payer', 'Payer is required').not().isEmpty(),
    check('involved', 'Involved participants are required').isArray({ min: 1 })
], validate, async (req, res) => {
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

        // Invalidar Caché del Grupo
        await require('../models/Group').findByIdAndUpdate(groupId, { $unset: { debtsLastUpdated: 1 } });

        res.json(expense);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar Gasto
router.put('/:id', [
    check('description', 'Description is required').optional().not().isEmpty(),
    check('amount', 'Amount must be a number').optional().isNumeric(),
    check('involved', 'Involved participants must be an array').optional().isArray()
], validate, async (req, res) => {
    try {
        const { description, amount, payer, involved } = req.body;
        const updateData = {};
        if (description) updateData.description = description;
        if (amount) updateData.amount = amount;
        if (payer) updateData.payer = payer;
        if (involved) updateData.involved = involved;

        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        if (!expense) return res.status(404).json({ error: 'Expense not found' });

        // Invalidar Caché del Grupo (usando expense.groupId que no cambió, o buscándolo si es necesario)
        // Dado que hicimos findByIdAndUpdate, 'expense' es el nuevo documento (new: true).
        await require('../models/Group').findByIdAndUpdate(expense.groupId, { $unset: { debtsLastUpdated: 1 } });

        res.json(expense);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar Gasto
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ error: 'Expense not found' });

        // Invalidar Caché del Grupo
        await require('../models/Group').findByIdAndUpdate(expense.groupId, { $unset: { debtsLastUpdated: 1 } });

        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
