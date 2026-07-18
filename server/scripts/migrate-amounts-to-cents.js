/**
 * Migración: convierte los montos existentes de PESOS (float) a CENTAVOS (entero).
 *
 * Contexto: a partir de la corrección del hallazgo #2 de la auditoría técnica, todos
 * los montos se almacenan y calculan en centavos enteros. Los datos creados ANTES de
 * ese cambio están en pesos (con posibles decimales) y deben multiplicarse por 100.
 *
 * Es IDEMPOTENTE: registra su ejecución en la colección `migrations` y NO se vuelve a
 * aplicar si ya corrió. Ejecutar una sola vez por base de datos:
 *
 *   cd server && node scripts/migrate-amounts-to-cents.js
 *
 * (Con Docker, ejecutarlo dentro del contenedor del server o apuntando MONGODB_URI a
 * la base correcta.)
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MIGRATION_NAME = 'expense-amounts-to-cents';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mogocounts';

async function run() {
    console.log('Conectando a MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    const migrations = db.collection('migrations');
    const already = await migrations.findOne({ name: MIGRATION_NAME });
    if (already) {
        console.log(`[skip] La migración "${MIGRATION_NAME}" ya fue aplicada (${already.appliedAt}).`);
        await mongoose.disconnect();
        return;
    }

    console.log(`[run] Aplicando migración "${MIGRATION_NAME}"...`);

    // 1. Gastos: amount (pesos) -> amount (centavos enteros)
    //    Usa una aggregation pipeline en updateMany (MongoDB 4.2+).
    const expenses = db.collection('expenses');
    const res = await expenses.updateMany({}, [
        { $set: { amount: { $round: [{ $multiply: ['$amount', 100] }, 0] } } }
    ]);
    console.log(`  - Gastos actualizados: ${res.modifiedCount}`);

    // 2. Grupos: invalidar la caché de deudas para que se recalcule en centavos
    //    a partir de los gastos ya migrados (evita migrar montos anidados).
    const groups = db.collection('groups');
    const gres = await groups.updateMany({}, {
        $set: { cachedDebts: [] },
        $unset: { debtsLastUpdated: '' }
    });
    console.log(`  - Cachés de grupo invalidadas: ${gres.modifiedCount}`);

    await migrations.insertOne({ name: MIGRATION_NAME, appliedAt: new Date() });
    console.log('[done] Migración aplicada y registrada.');

    await mongoose.disconnect();
}

run().catch(async (err) => {
    console.error('[error] Falló la migración:', err);
    try { await mongoose.disconnect(); } catch { /* noop */ }
    process.exit(1);
});
