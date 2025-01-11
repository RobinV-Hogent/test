export const generateId = (t) => {
    return t.getFullYear().toString() + t.getMonth().toString() + t.getDate().toString() + t.getHours().toString() + t.getMinutes().toString()
}


export const isValidHeikinAshi = (data, prevHa: CandleData | undefined = undefined): {valid: boolean, prev: CandleData} => {
    let haCandle: CandleData = composeHACandle(mergeCandleData(data), prevHa)
    let valid = false;

    const direction: Direction = decideDirection(haCandle.open, haCandle.close);
    if(direction == 'bullish') {
        valid = Math.min(haCandle.open, haCandle.close, haCandle.low, haCandle.high) == haCandle.open;
    } else {
        valid = Math.max(haCandle.open, haCandle.close, haCandle.low, haCandle.high) == haCandle.open;
    }

    console.log('new ha candle data:', {direction, valid, haCandle})
    return {valid, prev: haCandle}
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
