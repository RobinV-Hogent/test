import { checkTrades, performTrades } from './trading.ts';
import { generateId, isValidHeikinAshi, validatePreviousCandle } from './utilities.ts';


// const fs = require('fs');

const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1m");

const data = {}
let quarterData: CandleData[] = [];
let isValidHeikinAshiCandle: boolean = false;
let previousHaCandle: undefined | CandleData = undefined;
let haDirection: Direction;

let first = true;
let heikinFirst = true;
const t = new Date();
let lastId = generateId(t);


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
