const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const { simplifyDebts } = require('../utils/debtGraph');
const ApiResponse = require('../utils/ApiResponse');

// Middleware de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(ApiResponse.error(errors.array()[0].msg));
    }
    next();
};

// Crear Grupo
router.post('/', [
    check('title', 'Title is required').not().isEmpty().escape(),
    check('currency', 'Currency is required').optional().isLength({ min: 3, max: 3 }).escape()
], validate, async (req, res, next) => {
    try {
        const { title, currency } = req.body;
        const group = new Group({ title, currency });
        await group.save();
        res.json(ApiResponse.success(group));
    } catch (err) {
        next(err);
    }
});

// Obtener Detalles del Grupo
router.get('/:id', async (req, res, next) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json(ApiResponse.error('Group not found (Invalid ID)'));
        }
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json(ApiResponse.error('Group not found'));
        res.json(ApiResponse.success(group));
    } catch (err) {
        next(err);
    }
});

// Actualizar Título del Grupo
router.put('/:id', [
    check('title', 'Title is required').not().isEmpty().escape()
], validate, async (req, res, next) => {
    try {
        const { title } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { title },
            { new: true }
        );
        if (!group) return res.status(404).json(ApiResponse.error('Group not found'));
        res.json(ApiResponse.success(group));
    } catch (err) {
        next(err);
    }
});

// Agregar Participante
router.post('/:id/participants', [
    check('name', 'Name is required').not().isEmpty().escape()
], validate, async (req, res, next) => {
    try {
        const { name } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json(ApiResponse.error('Group not found'));

        if (!group.participants.includes(name)) {
            group.participants.push(name);
            await group.save();
        }
        res.json(ApiResponse.success(group));
    } catch (err) {
        next(err);
    }
});

// Eliminar Participante
router.delete('/:id/participants', [
    check('name', 'Name is required').not().isEmpty().escape()
], validate, async (req, res, next) => {
    try {
        const { name } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json(ApiResponse.error('Group not found'));

        group.participants = group.participants.filter(p => p !== name);
        await group.save();
        res.json(ApiResponse.success(group));
    } catch (err) {
        next(err);
    }
});

// Obtener Gastos del Grupo
router.get('/:id/expenses', async (req, res, next) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json(ApiResponse.error('Group not found (Invalid ID)'));
        }
        const expenses = await Expense.find({ groupId: req.params.id }).sort({ date: -1 });
        res.json(ApiResponse.success(expenses));
    } catch (err) {
        next(err);
    }
});

// Obtener Balance
router.get('/:id/balance', async (req, res, next) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json(ApiResponse.error('Group not found (Invalid ID)'));
        }

        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json(ApiResponse.error('Group not found'));

        if (group.debtsLastUpdated && group.cachedDebts) {
            return res.json(ApiResponse.success({ debts: group.cachedDebts }));
        }

        const expenses = await Expense.find({ groupId: req.params.id });
        const debts = simplifyDebts(expenses, group.participants);

        group.cachedDebts = debts;
        group.debtsLastUpdated = new Date();
        await group.save();

        res.json(ApiResponse.success({ debts }));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
