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
    }
});

module.exports = mongoose.model('Group', GroupSchema);
