import { messageReceived } from "./index.ts";

let ws;

function connect() {
    ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1m");

    ws.onopen = function () {
        console.log("WebSocket connection established");
    };

    ws.onmessage = (event) => {
        messageReceived(event)
    }

    ws.onclose = function () {
        console.log("WebSocket connection closed");
        setTimeout(connect, 1000); // Reconnect after 1 second
        console.log("WebSocket restarted");
    };

    ws.onerror = function (error) {
        console.error("WebSocket error:", error);
    };
}

export {connect};
