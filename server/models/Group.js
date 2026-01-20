const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    participants: [{
        type: String,
        trim: true
    }],
    currency: {
        type: String,
        default: 'ARS'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    cachedDebts: [{
        from: String,
        to: String,
        amount: Number
    }],
    debtsLastUpdated: Date
});

module.exports = mongoose.model('Group', GroupSchema);
