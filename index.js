const fs = require('fs');

const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1m");

const generateId = (t) => {
    return t.getFullYear().toString() + t.getMonth().toString() + t.getDate().toString() + t.getHours().toString() + t.getMinutes().toString()
}

const data = {}

let first = true;
const t = new Date(); // Convert timestamp to Date
let lastId = generateId(t);
const messageReceived = (event) => {
    // console.log(new Date().getDate().toString())

    const message = JSON.parse(event.data);
    const kline = message.k;
    // console.log(new Date(kline.t))
    // Parse candlestick data from the WebSocket message
    const time = new Date(kline.t); // Convert timestamp to Date
    const id = generateId(time)    // console.log(id)

    const open = parseFloat(kline.o);
    const high = parseFloat(kline.h);
    const low = parseFloat(kline.l);
    const close = parseFloat(kline.c);

    const currently = {
        open: open,
        high: high,
        low: low,
        close: close
    }

    data[`${id}`] = currently;

    if (first) {
        first = false
    }
    if (lastId !== id && !first) {
        validatePreviousCandle(lastId)
        lastId = id
    }
}

const validatePreviousCandle = (candleId) => {
    console.log('validating')
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
        console.log('down')
        wickSize1 = candleData.high - candleData.open
        wickSize2 = candleData.close - candleData.low
        bodySize = Math.abs(candleData.open - candleData.close)
    } else {
        console.log('up')
        wickSize1 = candleData.high - candleData.close
        wickSize2 = candleData.open - candleData.low
        bodySize = Math.abs(candleData.open - candleData.close)
    }


    const ratios = [wickSize1 / bodySize, wickSize2 / bodySize]
    console.log(ratios)
    const containsSmallerThan75 = ratios.find(e => e <= 0.75)
    const containsBiggerThan1 = ratios.find(e => e > 1)

    console.log(containsSmallerThan75)
    console.log(containsBiggerThan1)

    if (containsSmallerThan75 >= 0 && containsBiggerThan1 >= 0) {
        console.log('🟢 found hammer like candle id: ' + candleId)
        printToFile(candleId, (!(direction <= 0)) ? "DOWN" : "UP")
    }

    // bodysize positive = prive went up


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
