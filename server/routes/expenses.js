const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const ApiResponse = require('../utils/ApiResponse');

// Middleware de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(ApiResponse.error(errors.array()[0].msg));
    }
    next();
};

// Crear Gasto
router.post('/', [
    check('groupId', 'Group ID is required').not().isEmpty().escape(),
    check('description', 'Description is required').not().isEmpty().escape(),
    check('amount', 'Amount is required and must be a number').isNumeric(),
    check('payer', 'Payer is required').not().isEmpty().escape(),
    check('involved', 'Involved participants are required').isArray({ min: 1 })
], validate, async (req, res, next) => {
    try {
        const { groupId, description, amount, payer, involved, isSettlement } = req.body;
        
        // Sanitizar array de involved
        const sanitizedInvolved = involved.map(p => String(p).trim());

        const expense = new Expense({
            groupId,
            description,
            amount,
            payer,
            involved: sanitizedInvolved,
            isSettlement: isSettlement || false
        });
        await expense.save();
        
        // Esperamos explícitamente a que el caché se invalide antes de responder al cliente
        // Esto evita una "condición de carrera" (race condition) donde el frontend pedía
        // los balances antes de que el hook post-save en MongoDB terminara de impactar.
        await require('../models/Group').findByIdAndUpdate(groupId, { $unset: { debtsLastUpdated: 1 } });

        res.json(ApiResponse.success(expense));
    } catch (err) {
        next(err);
    }
});

// Actualizar Gasto
router.put('/:id', [
    check('description', 'Description is required').optional().not().isEmpty().escape(),
    check('amount', 'Amount must be a number').optional().isNumeric(),
    check('involved', 'Involved participants must be an array').optional().isArray()
], validate, async (req, res, next) => {
    try {
        const { description, amount, payer, involved, isSettlement } = req.body;
        const updateData = {};
        if (description) updateData.description = description;
        if (amount) updateData.amount = amount;
        if (payer) updateData.payer = payer;
        if (typeof isSettlement === 'boolean') updateData.isSettlement = isSettlement;
        
        if (involved) {
            updateData.involved = involved.map(p => String(p).trim());
        }

        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        if (!expense) return res.status(404).json(ApiResponse.error('Expense not found'));

        // Caché invalidado por el hook pre/post update

        res.json(ApiResponse.success(expense));
    } catch (err) {
        next(err);
    }
});

// Eliminar Gasto
router.delete('/:id', async (req, res, next) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json(ApiResponse.error('Expense not found'));

        res.json(ApiResponse.success({ message: 'Expense deleted' }));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
