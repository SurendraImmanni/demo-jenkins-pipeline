(function () {
  var products = [];
  var cart = {}; // { productId: quantity }

  var money = function (n) { return '₹' + n.toLocaleString('en-IN'); };
  var el = function (id) { return document.getElementById(id); };

  function loadCart() {
    try { cart = JSON.parse(localStorage.getItem('cart')) || {}; } catch (e) { cart = {}; }
  }
  function saveCart() {
    try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) { /* storage unavailable */ }
  }

  function setMessage(text, kind) {
    var m = el('message');
    m.textContent = text;
    m.className = 'message ' + (kind || '');
  }

  function renderProducts() {
    var grid = el('products');
    grid.textContent = '';
    products.forEach(function (p) {
      var card = document.createElement('article');
      card.className = 'card';

      var swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.background = p.color;
      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = p.tag;
      swatch.appendChild(tag);

      var body = document.createElement('div');
      body.className = 'body';
      var name = document.createElement('h3');
      name.textContent = p.name;
      var price = document.createElement('p');
      price.className = 'price';
      price.textContent = money(p.price);
      var btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Add to cart';
      btn.addEventListener('click', function () { change(p.id, 1); });

      body.append(name, price, btn);
      card.append(swatch, body);
      grid.appendChild(card);
    });
  }

  function change(id, delta) {
    var next = (cart[id] || 0) + delta;
    if (next <= 0) { delete cart[id]; } else { cart[id] = Math.min(next, 99); }
    saveCart();
    setMessage('');
    renderCart();
  }

  function renderCart() {
    var list = el('cart-items');
    list.textContent = '';
    var total = 0;
    var ids = Object.keys(cart).map(Number).filter(function (id) {
      return products.some(function (p) { return p.id === id; });
    });

    ids.forEach(function (id) {
      var p = products.find(function (x) { return x.id === id; });
      var qty = cart[id];
      total += p.price * qty;

      var li = document.createElement('li');
      var name = document.createElement('span');
      name.className = 'name';
      name.textContent = p.name;
      var line = document.createElement('span');
      line.className = 'line';
      line.textContent = money(p.price * qty);

      var qtyBox = document.createElement('div');
      qtyBox.className = 'qty';
      var minus = document.createElement('button');
      minus.textContent = '−';
      minus.setAttribute('aria-label', 'Remove one ' + p.name);
      minus.addEventListener('click', function () { change(id, -1); });
      var count = document.createElement('span');
      count.textContent = qty;
      var plus = document.createElement('button');
      plus.textContent = '+';
      plus.setAttribute('aria-label', 'Add one ' + p.name);
      plus.addEventListener('click', function () { change(id, 1); });
      qtyBox.append(minus, count, plus);

      li.append(name, line, qtyBox);
      list.appendChild(li);
    });

    el('cart-empty').hidden = ids.length > 0;
    el('cart-total').textContent = money(total);
    el('checkout').disabled = ids.length === 0;
  }

  function checkout() {
    var items = Object.keys(cart).map(function (id) { return { id: Number(id), qty: cart[id] }; });
    el('checkout').disabled = true;
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items })
    })
      .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
      .then(function (r) {
        if (!r.ok) { throw new Error(r.body.error || 'Order failed.'); }
        cart = {};
        saveCart();
        renderCart();
        setMessage('Order ' + r.body.orderId + ' placed. Total ' + money(r.body.total) + '.', 'ok');
      })
      .catch(function (err) {
        setMessage(err.message + ' Try again.', 'error');
        renderCart();
      });
  }

  el('checkout').addEventListener('click', checkout);

  loadCart();
  fetch('/api/products')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      products = data;
      renderProducts();
      renderCart();
    })
    .catch(function () {
      el('products').textContent = 'Could not load products. Refresh the page to try again.';
    });
})();
