import { checkTrades, createTradingAccounts, performTrades } from './trading.ts';
import { generateId, isValidHeikinAshi, validatePreviousCandle } from './utilities.ts';


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


let haDirection: Direction | undefined = undefined; // initialize with right num (def: undefined)

let first = true;
let heikinFirst = true;
const t = new Date();
let lastId = generateId(t);

createTradingAccounts();

const messageReceived = (event) => {
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
    quarterData.push(currently);
    checkHA(time, 15);

    data[`${id}`] = currently;
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

const checkHA = (time: Date, checkEveryXminutes: number) => {
    if (time.getMinutes() % checkEveryXminutes == 0 && heikinFirst) {
        console.log('New Heikin Ashi Candle')
        const res = isValidHeikinAshi(quarterData, previousHaCandle);
        isValidHeikinAshiCandle = res.valid;
        previousHaCandle = res.prev;
        quarterData = [];
        heikinFirst = false;
    }

    if (!(time.getMinutes() % checkEveryXminutes == 0)) {
        heikinFirst = true;
    }
}



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
