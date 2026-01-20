// Dados fake de produtos (poderia vir de uma API como FakeStore) [web:55][web:58]
const products = [
  {
    id: 1,
    title: "Headset Gamer RGB",
    price: 249.9,
    category: "Periféricos",
    emoji: "🎧",
  },
  {
    id: 2,
    title: "Teclado Mecânico",
    price: 399.9,
    category: "Periféricos",
    emoji: "⌨️",
  },
  {
    id: 3,
    title: "Mouse Wireless",
    price: 159.9,
    category: "Periféricos",
    emoji: "🖱️",
  },
  {
    id: 4,
    title: "Monitor 27\" 144Hz",
    price: 1899.9,
    category: "Monitores",
    emoji: "🖥️",
  },
  {
    id: 5,
    title: "Notebook Dev 16GB RAM",
    price: 4899.9,
    category: "Notebooks",
    emoji: "💻",
  },
  {
    id: 6,
    title: "Cadeira Ergonômica",
    price: 1299.9,
    category: "Escritório",
    emoji: "🪑",
  },
];

const productsGrid = document.getElementById("products-grid");
const categoryList = document.getElementById("category-list");
const searchInput = document.getElementById("search-input");

const cartButton = document.getElementById("cart-button");
const cartPanel = document.getElementById("cart-panel");
const cartOverlay = document.getElementById("cart-overlay");
const closeCartBtn = document.getElementById("close-cart");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartCountEl = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout-btn");

let activeCategory = "Todos";
let cart = [];

// Utils
function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Render categorias
function renderCategories() {
  const categories = ["Todos", ...new Set(products.map((p) => p.category))];

  categoryList.innerHTML = "";

  categories.forEach((cat) => {
    const li = document.createElement("li");
    li.textContent = cat;
    if (cat === activeCategory) li.classList.add("active");
    li.addEventListener("click", () => {
      activeCategory = cat;
      renderCategories();
      renderProducts();
    });
    categoryList.appendChild(li);
  });
}

// Render produtos
function renderProducts() {
  const term = searchInput.value.toLowerCase().trim();

  const filtered = products.filter((p) => {
    const matchCategory =
      activeCategory === "Todos" || p.category === activeCategory;
    const matchSearch =
      p.title.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term);
    return matchCategory && matchSearch;
  });

  productsGrid.innerHTML = "";

  if (filtered.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "Nenhum produto encontrado.";
    msg.style.color = "#9ca3af";
    productsGrid.appendChild(msg);
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.classList.add("product-card");

    card.innerHTML = `
      <div class="product-image">${product.emoji}</div>
      <div class="product-info">
        <div class="product-title">${product.title}</div>
        <div class="product-category">${product.category}</div>
      </div>
      <div class="product-bottom">
        <span class="product-price">${formatCurrency(product.price)}</span>
      </div>
    `;

    const addBtn = document.createElement("button");
    addBtn.classList.add("btn-add");
    addBtn.textContent = "Adicionar";
    addBtn.addEventListener("click", () => addToCart(product.id));

    card.querySelector(".product-bottom").appendChild(addBtn);
    productsGrid.appendChild(card);
  });
}

// Cart logic
function addToCart(productId) {
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    const product = products.find((p) => p.id === productId);
    cart.push({ ...product, qty: 1 });
  }
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  renderCart();
}

function changeQty(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
  } else {
    renderCart();
  }
}

function calcTotal() {
  return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
}

function renderCart() {
  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Seu carrinho está vazio.";
    p.style.color = "#9ca3af";
    cartItemsEl.appendChild(p);
  } else {
    cart.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("cart-item");

      const info = document.createElement("div");
      info.innerHTML = `
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">
          ${formatCurrency(item.price)} • Subtotal:
          ${formatCurrency(item.price * item.qty)}
        </div>
      `;

      const actions = document.createElement("div");
      actions.classList.add("cart-item-actions");

      const minusBtn = document.createElement("button");
      minusBtn.classList.add("qty-btn");
      minusBtn.textContent = "-";
      minusBtn.addEventListener("click", () => changeQty(item.id, -1));

      const qtySpan = document.createElement("span");
      qtySpan.classList.add("qty");
      qtySpan.textContent = item.qty;

      const plusBtn = document.createElement("button");
      plusBtn.classList.add("qty-btn");
      plusBtn.textContent = "+";
      plusBtn.addEventListener("click", () => changeQty(item.id, 1));

      const removeBtn = document.createElement("button");
      removeBtn.classList.add("remove-btn");
      removeBtn.textContent = "Remover";
      removeBtn.addEventListener("click", () => removeFromCart(item.id));

      actions.appendChild(minusBtn);
      actions.appendChild(qtySpan);
      actions.appendChild(plusBtn);
      actions.appendChild(removeBtn);

      div.appendChild(info);
      div.appendChild(actions);

      cartItemsEl.appendChild(div);
    });
  }

  const total = calcTotal();
  cartTotalEl.textContent = formatCurrency(total);
  const count = cart.reduce((acc, item) => acc + item.qty, 0);
  cartCountEl.textContent = count;
}

// Abrir/fechar carrinho
function openCart() {
  cartPanel.classList.add("open");
  cartOverlay.classList.add("open");
}

function closeCart() {
  cartPanel.classList.remove("open");
  cartOverlay.classList.remove("open");
}

cartButton.addEventListener("click", () => {
  openCart();
});

closeCartBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// Buscar
searchInput?.addEventListener("input", () => {
  renderProducts();
});

// Checkout fake
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Seu carrinho está vazio.");
    return;
  }
  alert("Checkout fake concluído! (aqui você integraria um backend/Stripe)");
});

// Init
renderCategories();
renderProducts();
renderCart();
