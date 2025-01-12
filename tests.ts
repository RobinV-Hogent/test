import { checkTrades, performSingleTrade, performTrades } from "./trading.ts";
import { setup1 } from "./trading-setup.ts";
import { validateHammer, validatePreviousCandle } from "./utilities.ts";

import { test } from 'node:test';
import assert from 'node:assert';

const baseAccount = {
    balance: 50000,
    trades: [],
    isTrading: false,
}

const hammerCandleTestCases: {direction: Direction, data: CandleData, result: boolean}[] = [
    { direction: 'bullish', data: { open: 94582.4, high: 94587.3, low: 94536.3, close: 94587.3 }, result: true },

    { direction: 'bearish', data: { open: 94582.4, high: 94587.3, low: 94536.3, close: 94587.3 }, result: false },
];

for(const {direction, data, result} of hammerCandleTestCases) {
    test('is valid hammer candle', async (t) => {
        const account = { id: 1, ...baseAccount, tradingSetup: setup1 }

        const res: boolean = validateHammer(data, direction, 'test_id')

        assert.ok(res == result, 'not valid hammer candle')

        await t.test('enters trade?', () => {
            if(!res) {
                assert.ok(res == false)
                return;
            };

            const entered = performSingleTrade(account, direction, data)
            assert.ok(entered);
        })

    });
}


// test('enter trades when hammerlike candle prints', () => {

//     const baseAccount: TradingAccount = {
//         balance: 50000,
//         trades: [],
//         isTrading: false,
//     }

//     const accounts = [{ id: 1, ...baseAccount, tradingSetup: setup1 }]

//     console.log(accounts[0].isTrading)

//     performTrades({open: 94582.4, high: 94587.3, low: 94536.3, close: 94587.3}, 'bullish', accounts);

//     expect(accounts[0].isTrading).toBe(true)
// });
