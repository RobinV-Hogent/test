import { printHammerCandle, printValidHeikinAshiCandle } from "./logger.ts";

export const generateId = (t: Date, withMinutes: boolean = true) => {
    let id = t.getFullYear().toString() + t.getMonth().toString() + t.getDate().toString() + t.getHours().toString() + (withMinutes ? t.getMinutes().toString() : "")

    return id;
}


export const isValidHeikinAshi = (data, prevHa: CandleData | undefined = undefined): {valid: boolean, prev: CandleData, direction: Direction} => {
    let haCandle: CandleData = composeHACandle(mergeCandleData(data), prevHa)
    let valid = false;

    const direction: Direction = decideDirection(haCandle.open, haCandle.close);
    if(direction == 'bullish') {
        valid = Math.min(haCandle.open, haCandle.close, haCandle.low, haCandle.high) == haCandle.open;
    } else {
        valid = Math.max(haCandle.open, haCandle.close, haCandle.low, haCandle.high) == haCandle.open;
    }

    if(valid) {
        printValidHeikinAshiCandle(direction)
    }

    console.log('new ha candle data:', {direction, valid, haCandle})
    return {valid, prev: haCandle, direction}
}



const decideDirection = (open: number, close: number): Direction => {
    const direction: Direction = close > open ? 'bullish' : 'bearish';
    return direction;
}

const composeHACandle = ({ open, high, low, close }: CandleData, prevHa: CandleData | undefined): CandleData => {
    return {
        open: prevHa ? (prevHa.open + prevHa.close) / 2 : (open + close) / 2,
        high: Math.max(open, close, low, close),
        low: Math.min(open, close, low, high),
        close: (open + close + low + high) / 4
    };
}

const mergeCandleData = (data: CandleData[]): CandleData => {
    const direction = decideDirection(data[0].open, data[data.length - 1].close)

    return {
        open: data[0].open,
        high: data.reduce((prev, curr) => { return curr.high > prev ? curr.high : prev }, 0),
        low: data.reduce((prev, curr) => { return curr.low < prev ? curr.low : prev }, Number.MAX_VALUE),
        close: data[data.length - 1].close
    } as CandleData
}

export const validatePreviousCandle = (candleId, data, haDirection: Direction | undefined): boolean => {
    // check for hammer like candle
    const candleData = data[candleId];

    if (!candleData) {
        console.log('no candle data found for id: ' + candleId)
        return false;
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

    const averagePrice = (candleData.high + candleData.low) / 2;
    let validClosePosition = false;
    if(haDirection == 'bearish') {
        validClosePosition = candleData.close < averagePrice;
    } else {
        validClosePosition = candleData.close > averagePrice;
    }


    const ratios = [wickSize1 / bodySize, wickSize2 / bodySize]
    const containsSmallerThan75: number | undefined = ratios.find(e => e <= 0.75)
    const containsBiggerThan1: number | undefined = ratios.find(e => e > 1)

    if (typeof containsBiggerThan1 == "number" && typeof containsSmallerThan75 == "number") {
        if (containsSmallerThan75 >= 0 && containsBiggerThan1 >= 0 && validClosePosition) {
            console.log('🟢 found hammer like candle id: ' + candleId)
            printHammerCandle(candleId, (!(direction <= 0)) ? "DOWN" : "UP")
            return true;
        }
    }
}
