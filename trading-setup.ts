export const setup1: TradingSetup = {
    risk: 3,
    stoploss: {
        from: 'outer',
        extra: 50,
    },
    takeprofit: {
        rr: 3,
    },
    breakeven: {
        apply: true,
        whenRR: 2,
    }
}

export const setup2: TradingSetup = {
    risk: 3,
    stoploss: {
        from: 'outer',
        extra: 50,
    },
    takeprofit: {
        rr: 3,
    },
    breakeven: {
        apply: false,
        whenRR: 0,
    }
}

export const setup3: TradingSetup = {
    risk: 3,
    stoploss: {
        from: 'outer',
        extra: 50,
    },
    takeprofit: {
        rr: 1,
    },
    breakeven: {
        apply: false,
        whenRR: 0,
    }
}

export const setup4: TradingSetup = {
    risk: 3,
    stoploss: {
        from: 'outer',
        extra: 50,
    },
    takeprofit: {
        rr: 2,
    },
    breakeven: {
        apply: false,
        whenRR: 0,
    }
}

export const setup5: TradingSetup = {
    risk: 3,
    stoploss: {
        from: 'outer',
        extra: 50,
    },
    takeprofit: {
        rr: 2,
    },
    breakeven: {
        apply: true,
        whenRR: 1,
    }
}

export const setup6: TradingSetup = {
    risk: 3,
    stoploss: {
        from: 'outer',
        extra: 50,
    },
    takeprofit: {
        rr: 5,
    },
    breakeven: {
        apply: false,
        whenRR: 0,
    }
}

export const setup7: TradingSetup = {
    risk: 3,
    stoploss: {
        from: 'outer',
        extra: 50,
    },
    takeprofit: {
        rr: 3,
    },
    breakeven: {
        apply: true,
        whenRR: 1.5,
    }
}
