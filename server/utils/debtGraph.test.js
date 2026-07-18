const { test } = require('node:test');
const assert = require('node:assert/strict');
const { simplifyDebts } = require('./debtGraph');

/**
 * Implementación de referencia, independiente del greedy, que calcula los balances
 * netos con la misma regla de reparto (centavos enteros, resto a los primeros
 * involucrados). Se usa para validar que las transacciones generadas por
 * simplifyDebts cancelan EXACTAMENTE esos balances (sin deriva de centavos).
 */
function netBalances(expenses, participants) {
    const b = {};
    participants.forEach(p => { b[p] = 0; });
    for (const e of expenses) {
        const n = e.involved.length;
        if (!n) continue;
        const base = Math.floor(e.amount / n);
        const rem = e.amount - base * n;
        b[e.payer] = (b[e.payer] || 0) + e.amount;
        e.involved.forEach((p, idx) => {
            b[p] = (b[p] || 0) - (base + (idx < rem ? 1 : 0));
        });
    }
    return b;
}

function assertSettles(expenses, participants) {
    const tx = simplifyDebts(expenses, participants);
    // Todas las transacciones son enteros positivos.
    tx.forEach(t => assert.ok(Number.isInteger(t.amount) && t.amount > 0, `tx no entera o <=0: ${JSON.stringify(t)}`));
    // Aplicar las transacciones a los balances netos debe dejar todo en cero.
    const applied = { ...netBalances(expenses, participants) };
    for (const t of tx) {
        applied[t.from] = (applied[t.from] || 0) + t.amount;
        applied[t.to] = (applied[t.to] || 0) - t.amount;
    }
    Object.entries(applied).forEach(([person, v]) => {
        assert.equal(v, 0, `${person} quedó con saldo ${v} (debería ser 0)`);
    });
    return tx;
}

test('reparto exacto divisible', () => {
    // $90 entre 3 = $30 c/u
    const tx = assertSettles([{ payer: 'A', amount: 9000, involved: ['A', 'B', 'C'] }], ['A', 'B', 'C']);
    const total = tx.reduce((s, t) => s + t.amount, 0);
    assert.equal(total, 6000); // B y C le devuelven 3000 c/u a A
});

test('reparto NO divisible: el resto se reparte al centavo, la suma cierra', () => {
    // $100 entre 3 -> 10000 centavos / 3 = 3334 + 3333 + 3333
    const tx = assertSettles([{ payer: 'A', amount: 10000, involved: ['A', 'B', 'C'] }], ['A', 'B', 'C']);
    const total = tx.reduce((s, t) => s + t.amount, 0);
    // A puso 10000, su parte 3334 -> recupera 6666 (3333 + 3333)
    assert.equal(total, 6666);
});

test('el centavo indivisible (1 centavo entre 4) no se pierde ni se duplica', () => {
    assertSettles([{ payer: 'A', amount: 1, involved: ['A', 'B', 'C', 'D'] }], ['A', 'B', 'C', 'D']);
});

test('múltiples gastos cruzados liquidan a cero exacto', () => {
    const participants = ['A', 'B', 'C', 'D'];
    const expenses = [
        { payer: 'A', amount: 10000, involved: ['A', 'B', 'C', 'D'] },
        { payer: 'B', amount: 7777, involved: ['A', 'B', 'C'] },
        { payer: 'C', amount: 333, involved: ['C', 'D'] },
        { payer: 'D', amount: 1, involved: ['A', 'B', 'C', 'D'] }
    ];
    assertSettles(expenses, participants);
});

test('un settlement (pago directo) reduce la deuda correctamente', () => {
    const participants = ['A', 'B'];
    const expenses = [
        { payer: 'A', amount: 10000, involved: ['A', 'B'] }, // B le debe 5000 a A
        { payer: 'B', amount: 5000, involved: ['A'], isSettlement: true } // B le paga 5000 a A
    ];
    const tx = assertSettles(expenses, participants);
    assert.equal(tx.length, 0); // queda todo saldado
});

test('sin deudas relevantes devuelve lista vacía', () => {
    const tx = simplifyDebts([], ['A', 'B']);
    assert.deepEqual(tx, []);
});

test('ignora gastos sin involucrados', () => {
    const tx = simplifyDebts([{ payer: 'A', amount: 5000, involved: [] }], ['A', 'B']);
    assert.deepEqual(tx, []);
});
