const apiFetch = async () => {
    return await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m&limit=1").then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            }).then(resp => {
                const [__, n_open, n_high, n_low, n_close] = resp[0];
                console.log({n_open, n_high, n_low, n_close})
            }).catch(e => console.log('err'));
}

apiFetch();
