require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a la Base de Datos
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mogocounts';
console.log('Attempting to connect to MongoDB at:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Rutas
app.use('/api/groups', require('./routes/groups'));
app.use('/api/expenses', require('./routes/expenses'));

// Ruta Básica
app.get('/', (req, res) => {
    res.send('CuentasClaras API is running');
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
