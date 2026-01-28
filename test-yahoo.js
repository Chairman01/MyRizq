const { default: YahooFinance } = require('yahoo-finance2');

async function test() {
    try {
        const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

        console.log('=== Testing fundamentalsTimeSeries for MSFT ===\n');

        // The module parameter is required - use 'all' for all data
        const fundamentals = await yf.fundamentalsTimeSeries('MSFT', {
            period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'quarterly',
            module: 'all'
        });

        console.log('Number of periods returned:', fundamentals.length);

        if (fundamentals.length > 0) {
            const latest = fundamentals[fundamentals.length - 1];
            console.log('\nLatest data date:', latest.date);

            console.log('\n=== Key Balance Sheet Data ===');
            console.log('accountsReceivable:', latest.accountsReceivable);
            console.log('receivables:', latest.receivables);
            console.log('totalAssets:', latest.totalAssets);
            console.log('cashAndCashEquivalents:', latest.cashAndCashEquivalents);
            console.log('otherShortTermInvestments:', latest.otherShortTermInvestments);
            console.log('totalDebt:', latest.totalDebt);
        }
    } catch (e) {
        console.error('Error:', e.message);
        console.log('\nTrying without type...');

        try {
            const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
            const fundamentals = await yf.fundamentalsTimeSeries('MSFT', {
                period1: '2024-01-01',
                module: 'all'
            });
            console.log('Alternative result count:', fundamentals.length);
            if (fundamentals.length > 0) {
                const latest = fundamentals[fundamentals.length - 1];
                console.log('accountsReceivable:', latest.accountsReceivable);
                console.log('totalAssets:', latest.totalAssets);
            }
        } catch (e2) {
            console.error('Alternative failed:', e2.message);
        }
    }
}
test();
