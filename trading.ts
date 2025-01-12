import { printTradeExecutions } from "./logger.ts";
import { setup1, setup2, setup3, setup4, setup5, setup6, setup7 } from "./trading-setup.ts";

const baseAccount: TradingAccount = {
    balance: 50000,
    trades: [],
    isTrading: false,
}

const accounts: TradingAccount[] = [];

export const createTradingAccounts = () => {

    console.log('Creating Trading Accounts')

    const tradingAccount1: TradingAccount = { id: 1, ...baseAccount, tradingSetup: setup1 };
    const tradingAccount2: TradingAccount = { id: 2, ...baseAccount, tradingSetup: setup2 };
    const tradingAccount3: TradingAccount = { id: 3, ...baseAccount, tradingSetup: setup3 };
    const tradingAccount4: TradingAccount = { id: 4, ...baseAccount, tradingSetup: setup4 };
    const tradingAccount5: TradingAccount = { id: 5, ...baseAccount, tradingSetup: setup5 };
    const tradingAccount6: TradingAccount = { id: 6, ...baseAccount, tradingSetup: setup6 };
    const tradingAccount7: TradingAccount = { id: 7, ...baseAccount, tradingSetup: setup7 };

    accounts.push(tradingAccount1, tradingAccount2, tradingAccount3, tradingAccount4, tradingAccount5, tradingAccount6, tradingAccount7)
}

export const performTrades = (data: CandleData, direction: Direction, acc: TradingAccount[] | undefined = undefined) => {


    let accountsList = acc ? acc : [...accounts];

    for (let i = 0; i < accountsList.length; i++) {
        performSingleTrade(accountsList[i], direction, data)
    }
}

export const performSingleTrade = (account: TradingAccount, direction: Direction, data: CandleData): boolean => {

    // Don't perform a new trade. There is an ongoing one.
    if (account.isTrading) return false;
    if (!account.tradingSetup) return false;

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

    const msg = `${direction == 'bullish' ? "🟢" : "🔴"}: Account ID-${account.id} - Entered ${direction.toUpperCase()}`;

    console.log(msg)
    printTradeExecutions(`${msg}: \n${account.balance}`, account)
    return true;
}

export const checkTrades = (data: CandleData) => {
    for(let i = 0; i < accounts.length; i++) {
        let account = accounts[0];

        if(!account.isTrading) continue;
        if(!account.tradingSetup) continue;

        const trade = account.trades[account.trades.length - 1];

        checkBreakEven(data, trade, account)
        checkOutOfTrade(data, trade, account);
    }
}


const checkBreakEven = (data: CandleData, trade: Trade, account: TradingAccount) => {

    if(!account.tradingSetup?.breakeven.apply)
        return;

    let valid: boolean;

    if(trade.type == 'bullish') {
        valid = data.high > (trade.entry + ((trade.entry - trade.stoploss) * account.tradingSetup?.breakeven.whenRR))
    } else {
        valid = data.low < (trade.entry - ((trade.stoploss - trade.entry) * account.tradingSetup?.breakeven.whenRR))
    }

    if(valid) { trade.stoploss = trade.entry }

    const msg = `🟠 - SL MOVED TO BREAKEVEN - ACCOUNT-${account.id}`;
    console.log(msg)
    printTradeExecutions(msg, account)
}

const checkOutOfTrade = (data: CandleData, trade: Trade, account: TradingAccount) => {
    if(trade.type == 'bullish') {
        if(data.high >= trade.takeprofit) {
            account.balance += trade.risk * account.tradingSetup!.risk
            endTrade(account, 'TP')
        }
        if(data.low <= trade.stoploss) {
            account.balance -= trade.risk
            endTrade(account, 'SL')
        }
    } else {
        if(data.high >= trade.stoploss) {
            account.balance -= trade.risk
            endTrade(account, 'SL')
        }
        if(data.low <= trade.takeprofit) {
            account.balance += trade.risk * account.tradingSetup!.risk
            endTrade(account, 'TP')
        }
    }
}


const endTrade = (account: TradingAccount, reason: 'TP' | 'SL') => {
    account.isTrading = false;

    const msg = `🟠 A Trade on account ${account.id} has ended`;
    console.log(msg)
    printTradeExecutions(`${msg} - ${reason} HIT: \n${account.balance}`, account)
}
