import { checkTrades, endTrade, performSingleTrade, performTrades } from "./trading.ts";
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
        const account = { id: 999, ...baseAccount, tradingSetup: setup1 }

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

        await t.test('enter another trade?', () => {
            if(!res) {
                assert.ok(res == false)
                return;
            };

            const entered = performSingleTrade(account, direction, data)
            // not entered because already in trade
            assert.ok(!entered);
        })

        await t.test('end trade', () => {
            const wasEnded = endTrade(account, 'TP')
            assert.ok(!account.isTrading);
        })

        await t.test('can trade again?', () => {
            if(!res) {
                assert.ok(res == false)
                return;
            };

            const entered = performSingleTrade(account, direction, data)
            assert.ok(entered);
        })
    });
}
