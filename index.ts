import { checkTrades, createTradingAccounts, performTrades } from './trading.ts';
import { checkHAValidity, generateId, isOneSidedHA, isValidHeikinAshi, validatePreviousCandle } from './utilities.ts';
import { connect } from './websocket.ts';

import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

connect();

const data = {}
let isValidHeikinAshiCandle: boolean = false;
let previousHaCandle: CandleData | undefined = undefined;
const CHECK_EVERY_X_MIN = 15;
let haDirection: Direction | undefined = undefined;

let first = true;
let heikinFirst = true;
const t = new Date();
let lastId = generateId(t);

createTradingAccounts();

const initializeHeikinAshi = async () => {
    // INPUT MANUALLY
    setTimeout(async () => {
        previousHaCandle = {
            open: parseFloat(await read('O: ') as string),
            high: parseFloat(await read('H: ') as string),
            low: parseFloat(await read('L: ') as string),
            close: parseFloat(await read('C: ') as string),
        }
        rl.close();

        const res = isOneSidedHA(previousHaCandle)
        isValidHeikinAshiCandle = res.valid;
        previousHaCandle = res.prev;
        haDirection = res.direction;
    }, 5000);
}

const read = (question: string) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

export const messageReceived = async (event) => {
    const message = JSON.parse(event.data);
    const kline = message.k;
    const time = new Date(kline.t);
    const id = generateId(time);



    const currently: CandleData = {
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c)
    }

    data[`${id}`] = currently;

    checkHA(time, CHECK_EVERY_X_MIN);

    checkHammerLikeCandle(id);
    checkTrades(currently);
}

const checkHammerLikeCandle = (id: string): boolean => {
    let valid = false;
    if (first) {
        first = false
    }
    if (lastId !== id && !first && isValidHeikinAshiCandle) {
        valid = validatePreviousCandle(lastId, data, haDirection)
        lastId = id
    }
    return valid;
}

const checkHA = async (time: Date, checkEveryXminutes: number) => {
    setTimeout(async () => {
        if (time.getMinutes() % checkEveryXminutes == 0 && heikinFirst) {
            console.log('New Heikin Ashi Candle')

            await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${checkEveryXminutes}m&limit=2`).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            }).then(resp => {
                // 0 = the candle before the current one that has opened
                const [__, n_open, n_high, n_low, n_close] = resp[0];

                const candle: CandleData = {
                    open: parseFloat(n_open),
                    close: parseFloat(n_close),
                    high: parseFloat(n_high),
                    low: parseFloat(n_low)
                }

                const res = checkHAValidity(candle, previousHaCandle);
                console.log(previousHaCandle, candle, res.prev)
                isValidHeikinAshiCandle = res.valid;
                previousHaCandle = res.prev;
                haDirection = res.direction;
                heikinFirst = false;
            }
            )
                .catch(error => {
                    console.error('Error:', error);
                });
        }

        if (!(time.getMinutes() % checkEveryXminutes == 0)) {
            heikinFirst = true;
        }
    }, 3000);
}

initializeHeikinAshi();
