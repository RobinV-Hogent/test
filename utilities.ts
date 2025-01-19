import { printHammerCandle, printValidHeikinAshiCandle } from "./logger.ts";
import { performTrades } from "./trading.ts";

export const generateId = (t: Date, withMinutes: boolean = true) => {
    let id = t.getFullYear().toString() + t.getMonth().toString() + t.getDate().toString() + t.getHours().toString() + (withMinutes ? t.getMinutes().toString() : "")

    return id;
}


export const isValidHeikinAshi = (data, prevHa: CandleData | undefined = undefined): { valid: boolean, prev: CandleData, direction: Direction } => {
    let haCandle: CandleData = composeHACandle(mergeCandleData(data), prevHa)

    return checkHAValidity(haCandle, prevHa);
}

export const checkHAValidity = (candle: CandleData, prev: CandleData | undefined = undefined): { valid: boolean, prev: CandleData, direction: Direction } => {
    const haCandle: CandleData = composeHACandle(candle, prev);
    return isOneSidedHA(haCandle);
}

export const isOneSidedHA = (haCandle: CandleData): { valid: boolean, prev: CandleData, direction: Direction } => {
    let valid = false;
    const direction: Direction = decideDirection(haCandle.open, haCandle.close);
    if (direction == 'bullish') {
        valid = Math.min(haCandle.open, haCandle.close, haCandle.low, haCandle.high) == haCandle.open;
    } else {
        valid = Math.max(haCandle.open, haCandle.close, haCandle.low, haCandle.high) == haCandle.open;
    }

    if (valid) {
        printValidHeikinAshiCandle(direction)
    }

    console.log(`${direction}: ${valid}`)

    return {valid, prev: haCandle, direction}
}


const decideDirection = (open: number, close: number): Direction => {
    const direction: Direction = close > open ? 'bullish' : 'bearish';
    return direction;
}

const composeHACandle = ({ open, high, low, close }: CandleData, prevHa: CandleData | undefined): CandleData => {

    console.log('composeHACandle: ', prevHa, { open, high, low, close })

    const haClose = (open + high + low + close) / 4;
    const haOpen = !prevHa ? (open + close) / 2 : (prevHa.open + prevHa.close) / 2;
    const haHigh = Math.max(high, haOpen, haClose);
    const haLow = Math.min(low, haOpen, haClose);

    const res = {
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
    };

    return res;
};

export const mergeCandleData = (data: CandleData[]): CandleData => {
    const merged = {
        open: data[0].open,
        high: data.reduce((prev, curr) => { return curr.high > prev ? curr.high : prev }, 0),
        low: data.reduce((prev, curr) => { return curr.low < prev ? curr.low : prev }, Number.MAX_VALUE),
        close: data[data.length - 1].close
    } as CandleData

    return merged;
}

export const validatePreviousCandle = (candleId, data, haDirection: Direction | undefined): boolean => {
    // check for hammer like candle
    const candleData = data[candleId];

    if (!candleData) {
        console.log('no candle data found for id: ' + candleId)
        return false;
    }


    if (!haDirection) return false;

    return validateHammer(candleData, haDirection, candleId);
}


export const validateHammer = (candleData: CandleData, haDirection: Direction, candleId: string): boolean => {

    const bodyRange = Math.abs(candleData.close - candleData.open);
    const thirdRangeValue = (candleData.high - candleData.low) / 3
    const midPrice = (candleData.low + candleData.high) / 2;
    const upperbound = candleData.high - thirdRangeValue;
    const lowerbound = candleData.low + thirdRangeValue;

    let valid = false;

    if (haDirection == 'bearish') {
        valid = checkValidBearish(candleData, midPrice, lowerbound);
    }

    if (haDirection == 'bullish') {
        valid = checkValidBullish(candleData, midPrice, upperbound);
    }

    if (valid) {
        console.log('🟢 found hammer like candle id: ' + candleId)
        printHammerCandle(candleId)
        performTrades(candleData, haDirection)
        return true;
    }

    return false;
}

const checkValidBearish = (candle: CandleData, midPrice: number, bound: number) => {
    if (!(candle.open < midPrice && candle.close < midPrice)) {
        return false;
    }

    const avgBody = Math.abs(candle.open + candle.close) / 2;
    const res = avgBody < bound ? true : false;

    if(res) console.log(`hammer like candle found`)

    return res;
}

const checkValidBullish = (candle: CandleData, midPrice: number, bound: number) => {
    if (!(candle.open > midPrice && candle.close > midPrice)) {
        return false;
    }

    const avgBody = Math.abs(candle.open + candle.close) / 2;
    console.log(avgBody, bound, avgBody > bound)
    const res = avgBody > bound ? true : false;

    if(res) console.log(`hammer like candle found`)

    return res;
}
