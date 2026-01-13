const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    payer: {
        type: String,
        required: true
    },
    involved: [{
        type: String, // Nombres de los participantes involucrados en este gasto
        required: true
    }],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
