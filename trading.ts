import { printCSV, printTradeExecutions } from "./logger.ts";
import { setup1, setup2, setup3, setup4, setup5, setup6, setup7 } from "./trading-setup.ts";

const baseAccount: TradingAccount = {
    balance: 50000,
    trades: [],
    isTrading: false,
}

const accounts: TradingAccount[] = [];

export const createTradingAccounts = () => {

    if(accounts.length > 0) return;

    console.log('Creating Trading Accounts')

    const tradingAccount1: TradingAccount = { id: 1, ...JSON.parse(JSON.stringify(baseAccount)), tradingSetup: setup1 };
    const tradingAccount2: TradingAccount = { id: 2, ...JSON.parse(JSON.stringify(baseAccount)), tradingSetup: setup2 };
    const tradingAccount3: TradingAccount = { id: 3, ...JSON.parse(JSON.stringify(baseAccount)), tradingSetup: setup3 };
    const tradingAccount4: TradingAccount = { id: 4, ...JSON.parse(JSON.stringify(baseAccount)), tradingSetup: setup4 };
    const tradingAccount5: TradingAccount = { id: 5, ...JSON.parse(JSON.stringify(baseAccount)), tradingSetup: setup5 };
    const tradingAccount6: TradingAccount = { id: 6, ...JSON.parse(JSON.stringify(baseAccount)), tradingSetup: setup6 };
    const tradingAccount7: TradingAccount = { id: 7, ...JSON.parse(JSON.stringify(baseAccount)), tradingSetup: setup7 };

    accounts.push(tradingAccount1, tradingAccount2, tradingAccount3, tradingAccount4, tradingAccount5, tradingAccount6, tradingAccount7)
}

export const performTrades = (data: CandleData, direction: Direction, acc: TradingAccount[] | undefined = undefined) => {


    let accountsList = acc ? acc : [...accounts];

    for (let i = 0; i < accountsList.length; i++) {
        performSingleTrade(accountsList[i], direction, data)
    }
}

export const performSingleTrade = (account: TradingAccount, direction: Direction, data: CandleData): boolean => {

    // Don't perform a new trade. There is an on-going one.
    if (account.isTrading) return false;
    if (!account.tradingSetup) return false;

    const {sl, tp} = calculateLevels(direction, account.tradingSetup, data);

    account.trades.push({
        type: direction,
        risk: account.balance * (account.tradingSetup.risk / 100),
        when: new Date(),
        stoploss: sl,
        takeprofit: tp,
        entry: data.close
    })

    const msg = `${direction == 'bullish' ? "🟢" : "🔴"}: Account ID-${account.id} - Entered ${direction.toUpperCase()} - Current Balance: ${account.balance}`;

    console.log(msg)
    printTradeExecutions(`${msg}: \n${account.balance}`, account)
    account.isTrading = true;
    return true;
}

export const calculateLevels = (direction: Direction, setup: TradingSetup, data: CandleData): {sl: number, tp: number} => {
    const sl = calculateSL(direction, setup, data);
    const tp = calculateTP(direction, setup, Math.abs(data.close - sl), data.close)

    return {sl, tp}
}

const calculateTP = (direction: Direction, setup: TradingSetup, oneR: number, entry: number) => {
    let chunk = oneR * setup.takeprofit.rr;
    return direction == "bearish" ? entry - chunk: entry + chunk;
}

const calculateSL = (direction: Direction, setup: TradingSetup, data: CandleData) => {
    let priceSL = {
        bullish: 0,
        bearish: 0,
    };

    if(setup.stoploss.from == 'outer') {
        priceSL.bullish = data.low - setup.stoploss.extra;
        priceSL.bearish = data.high + setup.stoploss.extra;
    }
    else {
        priceSL.bullish = Math.min(data.close, data.open) - setup.stoploss.extra;
        priceSL.bearish = Math.max(data.close, data.open) + setup.stoploss.extra;
    }

    return direction == 'bearish' ? priceSL.bearish : priceSL.bullish;
}

export const checkTrades = (data: CandleData) => {
    for (let i = 0; i < accounts.length; i++) {
        let account = accounts[i];
        const trade = account.trades[account.trades.length - 1];

        if (!account.isTrading) continue;
        if (!account.tradingSetup) continue;

        checkBreakEven(data, trade, account)
        checkOutOfTrade(data, trade, account);
    }
}

const checkBreakEven = (data: CandleData, trade: Trade, account: TradingAccount) => {

    if (!account.tradingSetup?.breakeven.apply)
        return;

    let valid: boolean;
    let oneR = Math.abs(trade.entry - trade.stoploss);

    if (trade.type == 'bullish') {
        valid = data.high >= (trade.entry + (oneR * account.tradingSetup?.breakeven.whenRR))
    } else {
        valid = data.low <= (trade.entry - (oneR * account.tradingSetup?.breakeven.whenRR))
    }

    if (valid) {
        if(!(trade.stoploss == trade.entry)) {
            trade.stoploss = trade.entry
            const msg = `🟠 - SL MOVED TO BREAKEVEN - ACCOUNT-${account.id}`;
            console.log(msg)
            printTradeExecutions(msg, account)
        }
    }


}

export const checkOutOfTrade = (data: CandleData, trade: Trade, account: TradingAccount): { outOfTrade: boolean, meta: {data: CandleData, trade: Trade, account: TradingAccount}} => {

    let outOfTrade = false;

    if (trade.type == 'bullish') {
        if (data.high >= trade.takeprofit) {
            account.balance += trade.risk * account.tradingSetup!.takeprofit.rr;
            endTrade(account, 'TP')
            outOfTrade = true;
        }
        if (data.low <= trade.stoploss) {
            account.balance -= (trade.entry == trade.stoploss) ? 0 : trade.risk;
            endTrade(account, 'SL')
            outOfTrade = true;
        }
    } else {
        if (data.high >= trade.stoploss) {
            account.balance -= (trade.entry == trade.stoploss) ? 0 : trade.risk;
            endTrade(account, 'SL')
            outOfTrade = true;
        }
        if (data.low <= trade.takeprofit) {
            account.balance += trade.risk * account.tradingSetup!.takeprofit.rr;
            endTrade(account, 'TP')
            outOfTrade = true;
        }
    }

    return {outOfTrade, meta: {data, trade,account} };
}


export const endTrade = (account: TradingAccount, reason: 'TP' | 'SL') => {
    account.isTrading = false;

    const msg = `🟠 A Trade on account ${account.id} has ended`;
    console.log(msg)
    printTradeExecutions(`${msg} - ${reason} HIT: \n BALANCE: ${account.balance}`, account)

    printCSV({t: account, type: reason});
}
