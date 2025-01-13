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
