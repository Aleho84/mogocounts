async function test() {
    try {
        const groupId = '69c5bd1419161016501e7377';
        console.log('Testing GET balance...');
        let res = await fetch(`http://localhost:3001/api/groups/${groupId}/balance`);
        let data = await res.json();
        console.log('Balance:', JSON.stringify(data, null, 2));

        if (data.data && data.data.debts && data.data.debts.length > 0) {
            const debt = data.data.debts[0];
            console.log('Attempting to settle debt:', debt);
            
            const settleRes = await fetch(`http://localhost:3001/api/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupId,
                    description: `Saldado de deuda (${debt.from} a ${debt.to}) - TEST`,
                    amount: debt.amount,
                    payer: debt.from,
                    involved: [debt.to],
                    isSettlement: true
                })
            });
            const settleData = await settleRes.json();
            console.log('Settle Response:', JSON.stringify(settleData, null, 2));

            res = await fetch(`http://localhost:3001/api/groups/${groupId}/balance`);
            data = await res.json();
            console.log('Balance After:', JSON.stringify(data, null, 2));
        } else {
            console.log('No debts found or invalid format');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
