import { calculateLevels, checkOutOfTrade, checkTrades, endTrade, performSingleTrade, performTrades } from "./trading.ts";
import { setup1, setup2, setup3, setup4, setup5, setup6, setup7 } from "./trading-setup.ts";
import { mergeCandleData, validateHammer, validatePreviousCandle } from "./utilities.ts";

import { test } from 'node:test';
import assert from 'node:assert';

const baseAccount = {
    balance: 50000,
    trades: [],
    isTrading: false,
}

const hammerCandleTestCases: { direction: Direction, data: CandleData, result: boolean }[] = [
    { direction: 'bullish', data: { open: 94582.4, high: 94587.3, low: 94536.3, close: 94587.3 }, result: true },

    { direction: 'bearish', data: { open: 94582.4, high: 94587.3, low: 94536.3, close: 94587.3 }, result: false },
];

for (const { direction, data, result } of hammerCandleTestCases) {
    test('is valid hammer candle', async (t) => {
        const account = { id: 999, ...baseAccount, tradingSetup: setup1 }

        const res: boolean = validateHammer(data, direction, 'test_id')

        assert.ok(res == result, 'not valid hammer candle')

        await t.test('enters trade?', () => {
            if (!res) {
                assert.ok(res == false)
                return;
            };

            const entered = performSingleTrade(account, direction, data)
            assert.ok(entered);
        })

        await t.test('enter another trade?', () => {
            if (!res) {
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
            if (!res) {
                assert.ok(res == false)
                return;
            };

            const entered = performSingleTrade(account, direction, data)
            assert.ok(entered);
        })
    });
}

test('small candles merged rightly?', () => {

    // represents a 5 minute candle
    const data: CandleData[] = [
        { open: 10, close: 11, high: 15, low: 10 },
        { open: 11, close: 15, high: 16, low: 5 },
        { open: 15, close: 16, high: 20, low: 12 },
        { open: 16, close: 25, high: 30, low: 16 },
        { open: 25, close: 20, high: 26, low: 14 },
    ]

    const merged = mergeCandleData(data);

    assert.deepStrictEqual(merged, {
        open: 10,
        close: 20,
        high: 30,
        low: 5,
    }, JSON.stringify(merged))

})

const levelTestCases: { direction: Direction, setup: TradingSetup, data: CandleData, result: { sl: number, tp: number }, move: { price: number, where: "low" | "high" | "close" | "open" | string, outOfTrade: boolean} }[] = [
    {
        direction: 'bullish',
        setup: setup1,
        data: { open: 100, high: 120, low: 90, close: 115 },
        result: { sl: 90 - 50, tp: 115 + ((115 - Math.abs(90 - 50)) * 3) },

        move: { price: 115 + ((115 - Math.abs(90 - 50)) * 3) + 1, outOfTrade: true, where: "high" }
    },
    {
        direction: 'bearish',
        setup: setup6, // tp = 5rr
        data: { open: 1000, high: 1000, low: 900, close: 950 },
        result: { sl: 1000 + 50, tp: 950 - ((1050 - 950) * 5) },

        move: {
            price: 950 - ((1050 - 950) * 5) + 1,
            outOfTrade: false,
            where: "low"
        }
    },
    {
        direction: 'bearish',
        setup: setup6, // tp = 5rr
        data: { open: 1000, high: 1000, low: 900, close: 950 },
        result: { sl: 1000 + 50, tp: 950 - ((1050 - 950) * 5) },

        move: {
            price: 950 - ((1050 - 950) * 5) - 1, // DID TAKE TP
            outOfTrade: true,
            where: "x"
        }
    },
];

for (const { direction, setup, data, result, move } of levelTestCases) {
    test('calculate sl and tp', async (t) => {


        // direction: Direction, setup: TradingSetup, data: CandleData

        const { tp, sl } = calculateLevels(direction, setup, data);

        assert.deepStrictEqual({
            tp,
            sl,
        }, {
            tp: result.tp,
            sl: result.sl
        }, JSON.stringify({tp, sl}))

        const testAccount: TradingAccount = {
            id: -99,
            balance: 50000,
            trades: [],
            isTrading: true,
            tradingSetup: setup
        }

        await t.test('move trade (low not out of trade)', () => {
            if(!(move.where == 'low')) return;
            const res = checkOutOfTrade(
                {...data, low: move.price },
                {
                    type: 'bearish',
                    risk: 1500,
                    when: new Date(),
                    stoploss: sl,
                    takeprofit: tp,
                    entry: data.close
                } as Trade,
                testAccount
            )

            assert.ok(!res.outOfTrade);
            assert.equal(testAccount.balance, 50000)
        })

        await t.test('move trade (high and out of trade)', () => {
            if(!(move.where == 'high')) return;
            const res = checkOutOfTrade(
                {...data, high: move.price },
                {
                    type: 'bullish',
                    risk: 1500,
                    when: new Date(),
                    stoploss: sl,
                    takeprofit: tp,
                    entry: data.close
                } as Trade,
                testAccount
            )

            assert.ok(res.outOfTrade);
            assert.equal(testAccount.balance, 54500)
        })

        await t.test('6rr win?', () => {
            if(!(move.where == 'x')) return;
            const res = checkOutOfTrade(
                {...data, low: move.price },
                {
                    type: 'bearish',
                    risk: 1500,
                    when: new Date(),
                    stoploss: sl,
                    takeprofit: tp,
                    entry: data.close
                } as Trade,
                testAccount
            )

            assert.ok(res.outOfTrade);
            assert.equal(testAccount.balance, 57500, JSON.stringify(res.meta))
        })
    })


}


test('small candles merged rightly? (v2)', () => {

    // represents a 5 minute candle
    const data: CandleData[] = [
        { open: 96537.23, high: 96595.43, low: 96152.31, close: 96378.71 },
        { open: 96318.01, high: 96400, low: 96318.01, close: 96398 },
        { open: 96318.01, high: 96400, low: 96318.01, close: 96398 },
        { open: 96318.01, high: 96400, low: 96318.01, close: 96387.79 },
        { open: 96318.01, high: 96400, low: 96318.01, close: 96391.37 },
        { open: 96318.01, high: 96400, low: 96318.01, close: 96394.09 },
        { open: 96318.01, high: 96400, low: 96318.01, close: 96399.99 },
        { open: 96399.99, high: 96399.99, low: 96399.99, close: 96399.99 },
        { open: 96400, high: 96412.51, low: 96400, close: 96412.5 },
        { open: 96400, high: 96412.51, low: 96389.9, close: 96389.9 },
        { open: 96400, high: 96412.51, low: 96377.18, close: 96409.17 },
        { open: 96400, high: 96414.06, low: 96377.18, close: 96414.06 },
        { open: 96400, high: 96415.19, low: 96377.18, close: 96415.19 },
        { open: 96400, high: 96420.43, low: 96377.18, close: 96420.43 },
        { open: 96400, high: 96424.12, low: 96377.18, close: 96424.12 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96441.12 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96418.81 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96418.71 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96404.35 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96400.65 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96400.66 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96400.66 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96409.68 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96396.03 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96396.03 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96383.72 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96377.91 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96377.92 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96403.73 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96403.73 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96403.73 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96403.72 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96409.24 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96380.27 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96413.53 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96415.99 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96415.99 },
        { open: 96400, high: 96464.48, low: 96377.18, close: 96403.85 },
        { open: 96403.85, high: 96403.85, low: 96403.85, close: 96403.85 },
        { open: 96403.85, high: 96417.29, low: 96398, close: 96417.29 },
        { open: 96403.85, high: 96417.99, low: 96398, close: 96417.99 },
        { open: 96403.85, high: 96451.1, low: 96398, close: 96451.09 },
        { open: 96403.85, high: 96452.54, low: 96398, close: 96440.01 },
        { open: 96403.85, high: 96452.54, low: 96398, close: 96430.72 },
        { open: 96403.85, high: 96454.01, low: 96398, close: 96454.01 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96473.29 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96469.94 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96468.36 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96458.72 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96458.73 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96456 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96456.01 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96456 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96454.39 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96454.4 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96448.43 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96438.7 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96424.25 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96422.08 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96443.07 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96446.91 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96454.01 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96453.24 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96454 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96447.37 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96436.01 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96436.01 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96443.72 },
        { open: 96403.85, high: 96473.3, low: 96398, close: 96449.99 },
        { open: 96449.99, high: 96449.99, low: 96449.99, close: 96449.99 }
    ]

    const merged = mergeCandleData(data);

    assert.deepStrictEqual(merged, {
        open: 96537.23,
        close: 96449.99,
        high: 96595.43,
        low: 96152.31,
    }, JSON.stringify(merged))

})
