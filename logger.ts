import fs from 'fs'
import { generateId } from './utilities.ts';


export const printHammerCandle = async (time, direction = "") => {
    const filePath = `./hammer-candles.txt`;

    fs.appendFile(filePath, time + " - " + direction + "\n", (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        }
    });
}


export const printValidHeikinAshiCandle = async (direction: Direction) => {
    const filePath = `./hammer-candles.txt`;

    fs.appendFile(filePath, `---------- VALID ${direction.toUpperCase()} HEIKIN ASHI CANDLE ----------` + "\n", (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        }
    });
}

export const printTradeExecutions = async (text: string, account: TradingAccount) => {
    const filePath = `./accounts/trading-account-${account.id}-trades.txt`;

    fs.appendFile(filePath, `${text}` + "\n", (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        }
    });
}

// export const printCSV = async (csvline: {
//     t: TradingAccount,
//     type: 'TP' | 'SL'
// }) => {

//     const account = csvline.t;
//     const won = csvline.type == 'TP';
//     const lastTrade: Trade = account.trades[account.trades.length - 1]
//     const filePath = `all-data.csv`;

//     fs.appendFile(filePath, `${account.id}, ${lastTrade.when}, ${lastTrade.type}, ${won ? account.tradingSetup?.takeprofit.rr: (lastTrade.entry == lastTrade.stoploss ? 0 : -1)}` + "\n", (err) => {
//         if (err) {
//             console.error('Error appending to file:', err);
//         }
//     });
// }

export const printCSV = async (csvline: {
    t: TradingAccount;
    type: 'TP' | 'SL';
}) => {
    const account = csvline.t;
    const won = csvline.type === 'TP';
    const lastTrade: Trade = account.trades[account.trades.length - 1];
    const filePath = 'all-data.csv';

    const dataLine = `${account.id}, ${lastTrade.when}, ${lastTrade.type}, ${
        won ? account.tradingSetup?.takeprofit.rr : (lastTrade.entry === lastTrade.stoploss ? 0 : -1)
    }\n`;

    try {
        await fs.promises.appendFile(filePath, dataLine);
    } catch (err) {
        console.error('Error appending to file:', err);
    }
};
