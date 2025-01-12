import { setup1, setup2, setup3, setup4, setup5, setup6, setup7 } from "./trading-setup";

const baseAccount: TradingAccount = {
    balance: 50000,
    trades: [],
    isTrading: false,
}

const accounts: TradingAccount[] = [];

const createTradingAccounts = () => {
    const tradingAccount1: TradingAccount = { id: 1, ...baseAccount, tradingSetup: setup1 };
    const tradingAccount2: TradingAccount = { id: 2, ...baseAccount, tradingSetup: setup2 };
    const tradingAccount3: TradingAccount = { id: 3, ...baseAccount, tradingSetup: setup3 };
    const tradingAccount4: TradingAccount = { id: 4, ...baseAccount, tradingSetup: setup4 };
    const tradingAccount5: TradingAccount = { id: 5, ...baseAccount, tradingSetup: setup5 };
    const tradingAccount6: TradingAccount = { id: 6, ...baseAccount, tradingSetup: setup6 };
    const tradingAccount7: TradingAccount = { id: 7, ...baseAccount, tradingSetup: setup7 };

    accounts.push(tradingAccount1, tradingAccount2, tradingAccount3, tradingAccount4, tradingAccount5, tradingAccount6, tradingAccount7)
}

export const performTrades = (data: CandleData, direction: Direction) => {
    for (let i = 0; i < accounts.length; i++) {
        let account = accounts[i];

        if (account.isTrading) continue;
        if (!account.tradingSetup) continue;

        const sl = account.tradingSetup.stoploss;
        const slval: number = (direction == 'bearish' ? (sl.from == 'outer' ? (data.high + sl.extra) : (data.close + sl.extra)) : /* bullish */ (sl.from == 'outer' ? (data.low - sl.extra) : (data.close - sl.extra)));

        const tp: number = (direction == 'bearish' ? data.close - ((slval - data.close) * account.tradingSetup.risk) : data.close + ((data.close - slval) * account.tradingSetup.risk))

        account.trades.push({
            type: direction,
            risk: account.balance * (account.tradingSetup.risk / 100),
            when: new Date(),
            stoploss: slval,
            takeprofit: tp,
            entry: data.close
        })

        console.log(`${direction == 'bullish' ? "🟢" : "🔴"}: Account ID-${account.id} - Entered ${direction.toUpperCase()}`)
    }
}

export const checkTrades = (data: CandleData) => {
    for(let i = 0; i < accounts.length; i++) {
        let account = accounts[0];

        if(!account.isTrading) continue;
        if(!account.tradingSetup) continue;

        const trade = account.trades[account.trades.length - 1];

        if(trade.type == 'bullish') {
            if(data.high >= trade.takeprofit) {
                account.balance += trade.risk * account.tradingSetup?.risk
                account.isTrading = false
            }
            if(data.low <= trade.stoploss) {
                account.balance -= trade.risk
                account.isTrading = false
            }
        } else {
            if(data.high >= trade.stoploss) {
                account.balance -= trade.risk
                account.isTrading = false
            }
            if(data.low <= trade.takeprofit) {
                account.balance += trade.risk * account.tradingSetup?.risk
                account.isTrading = false
            }
        }
    }
}
