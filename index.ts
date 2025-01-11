import { generateId, isValidHeikinAshi } from './utilities.ts';
import fs from 'fs'

// const fs = require('fs');

const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1m");

const data = {}
let quarterData: CandleData[] = [];
let isValidHeikinAshiCandle: boolean = false;
let previousHaCandle: undefined | CandleData = undefined;

let first = true;
let heikinFirst = true;
const t = new Date();
let lastId = generateId(t);


const messageReceived = (event) => {
    const message = JSON.parse(event.data);
    const kline = message.k;
    const time = new Date(kline.t);
    const id = generateId(time);

    checkHA(time, 3);

    const currently: CandleData = {
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c)
    }
    quarterData.push(currently);

    data[`${id}`] = currently;
    checkHammerLikeCandle(id);
}

const checkHammerLikeCandle = (id: number) => {
 if (first) {
        first = false
    }
    if (lastId !== id && !first && isValidHeikinAshiCandle) {
        validatePreviousCandle(lastId)
        lastId = id
    }
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

const validatePreviousCandle = (candleId) => {
    // check for hammer like candle
    const candleData = data[candleId];

    if (!candleData) {
        console.log('no candle data found for id: ' + candleId)
        return;
    }
    console.log(candleData)
    const direction = candleData.open - candleData.close;


    let wickSize1, wickSize2, bodySize
    // bodysize negative = price went down
    if (!(direction <= 0)) {
        wickSize1 = candleData.high - candleData.open
        wickSize2 = candleData.close - candleData.low
        bodySize = Math.abs(candleData.open - candleData.close)
    } else {
        wickSize1 = candleData.high - candleData.close
        wickSize2 = candleData.open - candleData.low
        bodySize = Math.abs(candleData.open - candleData.close)
    }


    const ratios = [wickSize1 / bodySize, wickSize2 / bodySize]
    console.log(ratios)
    const containsSmallerThan75: number | undefined = ratios.find(e => e <= 0.75)
    const containsBiggerThan1: number | undefined = ratios.find(e => e > 1)

    if (typeof containsBiggerThan1 == "number" && typeof containsSmallerThan75 == "number") {
        if (containsSmallerThan75 >= 0 && containsBiggerThan1 >= 0) {
            console.log('🟢 found hammer like candle id: ' + candleId)
            printToFile(candleId, (!(direction <= 0)) ? "DOWN" : "UP")
        }
    }

}

const printToFile = (time, direction) => {
    const filePath = `./hammer-candles${generateId(new Date())}.txt`;

    fs.appendFile(filePath, time + " - " + direction + "\n", (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        }
    });
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
