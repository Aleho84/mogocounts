/**
 * Simplifica las deudas dentro de un grupo para minimizar las transacciones.
 * @param {Array} expenses - Lista de objetos de gastos { payer, amount, involved[] }
 * @param {Array} participants - Lista de nombres de todos los participantes
 * @returns {Array} - Transacciones optimizadas [{ from, to, amount }]
 */
function simplifyDebts(expenses, participants) {
    const balances = {};

    // Inicializar balances
    participants.forEach(p => balances[p] = 0);

    // Calcular balances netos
    expenses.forEach(expense => {
        const paidBy = expense.payer;
        const amount = expense.amount;
        const involved = expense.involved;

        if (involved.length === 0) return;

        const splitAmount = amount / involved.length;

        // El pagador recibe crédito +cantidad (pero técnicamente ya lo pagó, 
        // así que rastreamos lo que se les DEBE vs lo que DEBEN).
        // Lógica: El pagador pagó 'cantidad'. 
        // Son 'consumidores' de 'cantidadDividida' si están en 'involucrados'.
        // Efecto neto para el Pagador: +cantidad - (cantidadDividida si está involucrado)
        // Efecto neto para Otros: -cantidadDividida

        // Forma más fácil: 
        // Pagador +cantidad
        // Todos los involucrados -cantidadDividida

        if (!balances[paidBy]) balances[paidBy] = 0;
        balances[paidBy] += amount;

        involved.forEach(person => {
            if (!balances[person]) balances[person] = 0;
            balances[person] -= splitAmount;
        });
    });

    // Dividir en deudores y acreedores
    const debtors = [];
    const creditors = [];

    for (const person in balances) {
        const amount = balances[person];
        // Usar un pequeño epsilon para comparación de flotantes
        if (amount < -0.01) debtors.push({ person, amount });
        else if (amount > 0.01) creditors.push({ person, amount });
    }

    debtors.sort((a, b) => a.amount - b.amount); // Ascendente (más negativo primero)
    creditors.sort((a, b) => b.amount - a.amount); // Descendente (más positivo primero)

    const transactions = [];

    let i = 0; // Iterador para deudores
    let j = 0; // Iterador para acreedores

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // La cantidad a liquidar es el mínimo para evitar sobrepago
        // debtor.amount es negativo, así que tomamos -debtor.amount vs creditor.amount
        const amount = Math.min(-debtor.amount, creditor.amount);

        transactions.push({
            from: debtor.person,
            to: creditor.person,
            amount: Number(amount.toFixed(2))
        });

        // Actualizar balances restantes
        debtor.amount += amount;
        creditor.amount -= amount;

        // Si se liquidó, pasar al siguiente
        if (Math.abs(debtor.amount) < 0.01) i++;
        if (Math.abs(creditor.amount) < 0.01) j++;
    }

    return transactions;
}

module.exports = { simplifyDebts };
