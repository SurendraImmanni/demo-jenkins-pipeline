const express = require('express');
const path = require('path');
const { version } = require('./package.json');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Prices are whole rupees. In a real app these would live in a database.
const products = [
  { id: 1, name: 'Walnut monitor riser', price: 3499, tag: 'Furniture', color: '#8a5a3c' },
  { id: 2, name: 'Wool felt desk mat', price: 1999, tag: 'Desk', color: '#4b5563' },
  { id: 3, name: 'Brass pen set', price: 1299, tag: 'Writing', color: '#b08d3c' },
  { id: 4, name: 'Ceramic pour-over mug', price: 899, tag: 'Kitchen', color: '#d9d4c7' },
  { id: 5, name: 'Under-desk cable tray', price: 1499, tag: 'Organisers', color: '#1f2937' },
  { id: 6, name: 'Adjustable laptop stand', price: 2799, tag: 'Desk', color: '#0f766e' }
];

// Used by the Jenkins "Verify" stage after every deploy.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version });
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

// Mock checkout: the server recalculates the total, never trusting the browser.
app.post('/api/checkout', (req, res) => {
  const items = Array.isArray(req.body && req.body.items) ? req.body.items : [];
  if (items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  let total = 0;
  for (const item of items) {
    const product = products.find((p) => p.id === item.id);
    const qty = Number(item.qty);
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res.status(400).json({ error: 'Invalid item in cart.' });
    }
    total += product.price * qty;
  }

  const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
  res.status(201).json({ orderId, total });
});

const port = process.env.PORT || 3000;

// Only start listening when run directly, so tests can import the app.
if (require.main === module) {
  app.listen(port, () => console.log(`Shop listening on port ${port}`));
}

module.exports = app;
