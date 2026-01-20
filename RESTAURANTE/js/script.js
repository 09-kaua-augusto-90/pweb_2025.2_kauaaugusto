const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const tbody = document.getElementById("transactions-body");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const clearBtn = document.getElementById("clear-transactions");

const STORAGE_KEY = "fintrack_transactions";

// Estado
let transactions = [];

// Utils
function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

// LocalStorage
function loadTransactions() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  try {
    transactions = JSON.parse(data);
  } catch (e) {
    console.error("Erro ao parsear localStorage", e);
    transactions = [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Render
function renderTransactions() {
  tbody.innerHTML = "";

  if (transactions.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "Nenhuma transação cadastrada ainda.";
    td.style.textAlign = "center";
    td.style.color = "#9ca3af";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  transactions.forEach((t) => {
    const tr = document.createElement("tr");

    const descTd = document.createElement("td");
    descTd.textContent = t.description;

    const dateTd = document.createElement("td");
    dateTd.textContent = formatDate(t.date);

    const amountTd = document.createElement("td");
    amountTd.textContent = formatCurrency(t.amount);
    amountTd.classList.add(
      t.amount >= 0 ? "amount-positive" : "amount-negative"
    );

    const actionTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("btn-delete");
    deleteBtn.innerHTML = "&#10005;";
    deleteBtn.addEventListener("click", () => deleteTransaction(t.id));
    actionTd.appendChild(deleteBtn);

    tr.appendChild(descTd);
    tr.appendChild(dateTd);
    tr.appendChild(amountTd);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });
}

function renderSummary() {
  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income + expense;

  balanceEl.textContent = formatCurrency(balance);
  incomeEl.textContent = formatCurrency(income);
  expenseEl.textContent = formatCurrency(expense);
}

function syncUI() {
  renderTransactions();
  renderSummary();
}

// Actions
function addTransaction({ description, amount, date }) {
  const transaction = {
    id: Date.now(),
    description,
    amount,
    date,
  };
  transactions.unshift(transaction);
  saveTransactions();
  syncUI();
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  syncUI();
}

function clearAll() {
  if (!confirm("Tem certeza que deseja apagar todas as transações?")) return;
  transactions = [];
  saveTransactions();
  syncUI();
}

// Events
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value;

  if (!description || !date || Number.isNaN(amount)) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  addTransaction({ description, amount, date });

  form.reset();
});

clearBtn.addEventListener("click", clearAll);

// Init
loadTransactions();
syncUI();
