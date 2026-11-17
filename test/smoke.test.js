const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test('GET /health returns ok', async () => {
  const res = await fetch(`${base}/health`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'ok');
});

test('GET /api/products returns a product list', async () => {
  const res = await fetch(`${base}/api/products`);
  assert.strictEqual(res.status, 200);
  const products = await res.json();
  assert.ok(products.length > 0);
  assert.ok(products[0].name && products[0].price > 0);
});

test('POST /api/checkout calculates the total on the server', async () => {
  const res = await fetch(`${base}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ id: 3, qty: 2 }, { id: 4, qty: 1 }] })
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.strictEqual(body.total, 1299 * 2 + 899);
  assert.ok(body.orderId.startsWith('ORD-'));
});

test('POST /api/checkout rejects an empty cart', async () => {
  const res = await fetch(`${base}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [] })
  });
  assert.strictEqual(res.status, 400);
});
