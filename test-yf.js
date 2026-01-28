const YahooFinance = require('yahoo-finance2').default;

async function test() {
    try {
        console.log("Attempting to instantiate YahooFinance...");
        const yf = new YahooFinance();

        // Suppress notices might be needed on the instance
        // yf.suppressNotices(['yahooSurvey']);

        console.log("Fetching GOOGL...");
        const quote = await yf.quote('GOOGL');
        console.log("Success:", quote);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
