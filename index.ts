import { checkTrades, createTradingAccounts, performTrades } from './trading.ts';
import { checkHAValidity, generateId, isValidHeikinAshi, validatePreviousCandle } from './utilities.ts';


const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1m");

const data = {}
let quarterData: CandleData[] = [];
let isValidHeikinAshiCandle: boolean = false; // initialize with right bool (def: false)

// previousHaCandle = Default = undefined
let previousHaCandle: CandleData | undefined = undefined;
// let previousHaCandle: undefined | CandleData = {
//     open: 94179.5,
//     high: 94316.7,
//     low: 94179.5,
//     close: 94263.9
// };

const CHECK_EVERY_X_MIN = 5;

let haDirection: Direction | undefined = undefined; // initialize with right num (def: undefined)

let first = true;
let heikinFirst = true;
const t = new Date();
let lastId = generateId(t);

createTradingAccounts();

const initializeHeikinAshi = async () => {
    // get heikinashi candles
    const data = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${CHECK_EVERY_X_MIN}m&limit=10`).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
        .catch(error => {
            console.error('Error:', error);
        });

    // -1 cuz last item is current candle
    for (let i = 0; i < data.length - 2; i++) {

        const [_, c_open, c_high, c_low, c_close] = data[i]

        const minute15candle = {
            open: parseFloat(c_open),
            close: parseFloat(c_close),
            high: parseFloat(c_high),
            low: parseFloat(c_low)
        }

        const res = checkHAValidity(minute15candle, previousHaCandle)

        isValidHeikinAshiCandle = res.valid;
        previousHaCandle = res.prev;
        haDirection = res.direction;
    }

    const [__, n_open, n_high, n_low, n_close] = data[data.length - 1]
}


const messageReceived = async (event) => {

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
    if (time.getMinutes() % checkEveryXminutes == 0 && heikinFirst) {
        console.log('New Heikin Ashi Candle')

        await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${checkEveryXminutes}m&limit=2`).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        }).then(resp => {
            const [__, n_open, n_high, n_low, n_close] = resp[0];

            const candle: CandleData = {
                open: parseFloat(n_open),
                close: parseFloat(n_close),
                high: parseFloat(n_high),
                low: parseFloat(n_low)
            }


            const res = checkHAValidity(candle, previousHaCandle);
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
}

initializeHeikinAshi();


// Listen for WebSocket messages
ws.onmessage = (event) => messageReceived(event)


// Handle WebSocket errors
ws.onerror = function (error) {
    console.error("WebSocket Error:", error);
};

// Handle WebSocket close event
ws.onclose = function () {
    console.log("WebSocket connection closed");
};
