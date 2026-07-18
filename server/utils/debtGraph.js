/**
 * Simplifica las deudas dentro de un grupo para minimizar las transacciones.
 *
 * IMPORTANTE: trabaja ÍNTEGRAMENTE en CENTAVOS ENTEROS (unidades menores).
 * Todos los `amount` de entrada y de salida son enteros (p. ej. $100,50 => 10050).
 * Esto elimina por completo los errores de redondeo de punto flotante: los balances
 * netos suman exactamente cero y las transacciones resultantes son exactas, sin
 * necesidad de epsilons ni `toFixed`.
 *
 * @param {Array} expenses - Lista de gastos { payer, amount (centavos enteros), involved[] }
 * @param {Array} participants - Lista de nombres de todos los participantes
 * @returns {Array} - Transacciones optimizadas [{ from, to, amount (centavos enteros) }]
 */
function simplifyDebts(expenses, participants) {
    const balances = {};

    // Inicializar balances de todos los participantes en 0
    participants.forEach(p => { balances[p] = 0; });

    // Calcular balances netos (todo en centavos enteros)
    expenses.forEach(expense => {
        const paidBy = expense.payer;
        const amount = Math.round(expense.amount); // defensivo: garantizar entero
        const involved = expense.involved;

        if (!involved || involved.length === 0) return;

        const n = involved.length;
        const base = Math.floor(amount / n); // parte entera por persona
        const remainder = amount - base * n; // centavos sobrantes (0..n-1)

        // El pagador adelantó el total.
        if (balances[paidBy] === undefined) balances[paidBy] = 0;
        balances[paidBy] += amount;

        // Repartir el gasto entre los involucrados de forma determinista: los
        // primeros `remainder` involucrados absorben 1 centavo extra, de modo que
        // la suma de las partes sea EXACTAMENTE igual a `amount`.
        involved.forEach((person, idx) => {
            if (balances[person] === undefined) balances[person] = 0;
            const share = base + (idx < remainder ? 1 : 0);
            balances[person] -= share;
        });
    });

    // Dividir en deudores y acreedores (comparación exacta, sin epsilon)
    const debtors = [];
    const creditors = [];

    for (const person in balances) {
        const balance = balances[person];
        if (balance < 0) debtors.push({ person, amount: balance });
        else if (balance > 0) creditors.push({ person, amount: balance });
    }

    debtors.sort((a, b) => a.amount - b.amount); // Ascendente (más negativo primero)
    creditors.sort((a, b) => b.amount - a.amount); // Descendente (más positivo primero)

    const transactions = [];

    let i = 0; // Iterador para deudores
    let j = 0; // Iterador para acreedores

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // debtor.amount es negativo; liquidamos el mínimo para no sobrepagar.
        const amount = Math.min(-debtor.amount, creditor.amount);

        if (amount > 0) {
            transactions.push({
                from: debtor.person,
                to: creditor.person,
                amount // centavos enteros, exacto
            });
        }

        // Actualizar balances restantes
        debtor.amount += amount;
        creditor.amount -= amount;

        // Si se liquidó exactamente, pasar al siguiente
        if (debtor.amount === 0) i++;
        if (creditor.amount === 0) j++;
    }

    return transactions;
}

module.exports = { simplifyDebts };
