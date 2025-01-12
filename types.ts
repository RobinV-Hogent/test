interface CandleData {
    open: number;
    high: number;
    low: number;
    close: number;
}

type Direction = 'bearish' | 'bullish'

interface TradingAccount {
    id?: number;
    balance: number,
    trades: Trade[],
    isTrading: boolean,

    tradingSetup?: TradingSetup
}

interface Trade {
    type: Direction,
    risk: number,
    when: Date,
    stoploss: number,
    takeprofit: number,
    entry: number
}

interface TradingSetup {
    risk: number, // % Risk (1, 2, 3, ..., x%)
    stoploss: {
        from: 'outer' | 'inner',
        extra: number,
    },
    takeprofit: {
        rr: number,
    },
    breakeven: {
        apply: boolean,
        whenRR: number,
    }
}
