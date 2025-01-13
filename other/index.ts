// Create a new WebSocket connection to the Binance stream
const socket = new WebSocket('wss://stream.binance.com:9443/stream?streams=btcusdt@trade');

// Event listener for when the connection is established
socket.addEventListener('open', () => {
  console.log('Connected to Binance WebSocket stream');
});

// Event listener for receiving messages from the WebSocket
socket.addEventListener('message', (event) => {
  // Parse the incoming JSON data
  const data = JSON.parse(event.data);

  // Extract the trade data
  const tradeData = data.data;
  const price = tradeData.p; // Trade price
  const quantity = tradeData.q; // Trade quantity
  const timestamp = tradeData.T; // Trade timestamp

  // Log the trade details
  console.log(`Trade occurred at price: ${price}, quantity: ${quantity}, time: ${new Date(timestamp)}`);
});

// Event listener for errors
socket.addEventListener('error', (error) => {
  console.error('WebSocket Error:', error);
});

// Event listener for when the connection is closed
socket.addEventListener('close', () => {
  console.log('WebSocket connection closed');
});
