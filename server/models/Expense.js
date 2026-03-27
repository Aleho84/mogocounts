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
    isSettlement: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Invalidar caché del grupo cuando un gasto se crea, actualiza o elimina
const invalidateGroupCache = async function(doc) {
    if (doc) {
        // En findOneAndUpdate el doc enviado es la versión del modelo modificado (o antes, dependiendo de las opciones, pero tenemos el _id / groupId)
        // doc.groupId está disponible.
        await mongoose.model('Group').findByIdAndUpdate(doc.groupId, { $unset: { debtsLastUpdated: 1 } });
    }
};

ExpenseSchema.post('save', invalidateGroupCache);
ExpenseSchema.post('findOneAndUpdate', invalidateGroupCache);
ExpenseSchema.post('findOneAndDelete', invalidateGroupCache);

module.exports = mongoose.model('Expense', ExpenseSchema);
