/**
 * Simplifies debts within a group to minimize transactions.
 * @param {Array} expenses - List of expense objects { payer, amount, involved[] }
 * @param {Array} participants - List of all participant names
 * @returns {Array} - Optimized transactions [{ from, to, amount }]
 */
function simplifyDebts(expenses, participants) {
    const balances = {};

    // Initialize balances
    participants.forEach(p => balances[p] = 0);

    // Calculate net balances
    expenses.forEach(expense => {
        const paidBy = expense.payer;
        const amount = expense.amount;
        const involved = expense.involved;

        if (involved.length === 0) return;

        const splitAmount = amount / involved.length;

        // Payer gets credit +amount (but technically they already paid it, 
        // so we track what they are OWED vs what they OWE).
        // Logic: Payer paid 'amount'. 
        // They are 'consumer' of 'splitAmount' if they are in 'involved'.
        // Net effect for Payer: +amount - (splitAmount if involved)
        // Net effect for Others: -splitAmount

        // Easier way: 
        // Payer +amount
        // Everyone involved -splitAmount

        if (!balances[paidBy]) balances[paidBy] = 0;
        balances[paidBy] += amount;

        involved.forEach(person => {
            if (!balances[person]) balances[person] = 0;
            balances[person] -= splitAmount;
        });
    });

    // Split into debtors and creditors
    const debtors = [];
    const creditors = [];

    for (const person in balances) {
        const amount = balances[person];
        // Use a small epsilon for float comparison
        if (amount < -0.01) debtors.push({ person, amount });
        else if (amount > 0.01) creditors.push({ person, amount });
    }

    debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
    creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    const transactions = [];

    let i = 0; // Iterator for debtors
    let j = 0; // Iterator for creditors

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // The amount to settle is the minimum of avoiding overpayment
        // debtor.amount is negative, so we take -debtor.amount vs creditor.amount
        const amount = Math.min(-debtor.amount, creditor.amount);

        transactions.push({
            from: debtor.person,
            to: creditor.person,
            amount: Number(amount.toFixed(2))
        });

        // Update remaining balances
        debtor.amount += amount;
        creditor.amount -= amount;

        // If settled, move to next
        if (Math.abs(debtor.amount) < 0.01) i++;
        if (Math.abs(creditor.amount) < 0.01) j++;
    }

    return transactions;
}

module.exports = { simplifyDebts };
