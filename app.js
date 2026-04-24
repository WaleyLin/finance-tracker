// ═══════════════════════════════════════════
//   FinanceBot — Personal Finance Tracker
//   app.js
// ═══════════════════════════════════════════

// ─── STATE ───────────────────────────────────
const state = {
  transactions: [],
  budgets: {},
  assets: [],
  liabilities: [],
  username: 'Traveler',
};

// Chart instances
let charts = {};

// Current active section / view
let currentSection = 'dashboard';
let currentView    = 'overview';
let modalType      = 'asset';

// ─── CATEGORY EMOJIS ─────────────────────────
const CAT_EMOJI = {
  Food: '🍔', Transport: '🚗', Housing: '🏠',
  Entertainment: '🎮', Health: '🏥', Shopping: '🛍️',
  Salary: '💼', Freelance: '💻', Investment: '📈', Other: '📦',
};

// ─── STORAGE ─────────────────────────────────
function save() {
  localStorage.setItem('fb_transactions', JSON.stringify(state.transactions));
  localStorage.setItem('fb_budgets',      JSON.stringify(state.budgets));
  localStorage.setItem('fb_assets',       JSON.stringify(state.assets));
  localStorage.setItem('fb_liabilities',  JSON.stringify(state.liabilities));
  localStorage.setItem('fb_username',     state.username);
}

function load() {
  try {
    state.transactions = JSON.parse(localStorage.getItem('fb_transactions') || '[]');
    state.budgets      = JSON.parse(localStorage.getItem('fb_budgets')      || '{}');
    state.assets       = JSON.parse(localStorage.getItem('fb_liabilities')  || '[]');
    state.liabilities  = JSON.parse(localStorage.getItem('fb_liabilities')  || '[]');
    // Fix: correct keys
    state.assets      = JSON.parse(localStorage.getItem('fb_assets')        || '[]');
    state.liabilities = JSON.parse(localStorage.getItem('fb_liabilities')   || '[]');
    state.username    = localStorage.getItem('fb_username') || 'Traveler';
  } catch(e) { /* fresh start */ }
}

// ─── FORMAT ──────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── NAVIGATION ──────────────────────────────
document.querySelectorAll('.server-icon[data-section]').forEach(icon => {
  icon.addEventListener('click', () => {
    const section = icon.dataset.section;
    switchSection(section);
  });
});

document.querySelectorAll('.channel-item').forEach(item => {
  item.addEventListener('click', () => {
    const view = item.dataset.view;
    if (view) switchView(view, currentSection);
  });
});

function switchSection(section) {
  currentSection = section;

  // Update server icons
  document.querySelectorAll('.server-icon[data-section]').forEach(i => {
    i.classList.toggle('active', i.dataset.section === section);
  });

  // Update channel groups
  document.querySelectorAll('.channel-group').forEach(g => {
    g.classList.toggle('hidden', g.dataset.for !== section);
  });

  // Sidebar title
  const titles = {
    dashboard: '💰 FinanceBot',
    transactions: '💸 Transactions',
    budgets: '🎯 Budgets',
    analytics: '📊 Analytics',
  };
  document.getElementById('sidebarTitle').textContent = titles[section] || '💰 FinanceBot';

  // Activate first channel in section
  const group = document.querySelector(`.channel-group[data-for="${section}"]`);
  if (group) {
    const first = group.querySelector('.channel-item');
    if (first) switchView(first.dataset.view, section);
  }
}

function switchView(viewId, section) {
  if (section && section !== currentSection) switchSection(section);
  currentView = viewId;

  // Deactivate all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');

  // Update channel items in active group
  const group = document.querySelector(`.channel-group[data-for="${currentSection}"]`);
  if (group) {
    group.querySelectorAll('.channel-item').forEach(i => {
      i.classList.toggle('active', i.dataset.view === viewId);
    });
  }

  refreshView(viewId);
}

function refreshView(viewId) {
  switch (viewId) {
    case 'overview':          renderOverview();       break;
    case 'networth':          renderNetWorth();       break;
    case 'all-transactions':  renderTransactions();   break;
    case 'budget-overview':   renderBudgets();        break;
    case 'spending-chart':    renderSpendingChart();  break;
    case 'trend-chart':       renderTrendChart();     break;
  }
}

// ─── TRANSACTIONS ────────────────────────────
let txType = 'income';

function setType(t) {
  txType = t;
  document.getElementById('typeIncome').classList.toggle('active', t === 'income');
  document.getElementById('typeExpense').classList.toggle('active', t === 'expense');
}

function addTransaction() {
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date   = document.getElementById('txDate').value;
  const desc   = document.getElementById('txDesc').value.trim();
  const cat    = document.getElementById('txCat').value;

  if (!amount || amount <= 0)     return showFeedback('txFeedback', 'Enter a valid amount.', 'error');
  if (!date)                       return showFeedback('txFeedback', 'Pick a date.', 'error');
  if (!desc)                       return showFeedback('txFeedback', 'Add a description.', 'error');

  const tx = {
    id:     Date.now(),
    type:   txType,
    amount,
    date,
    desc,
    cat,
  };

  state.transactions.unshift(tx);
  save();
  clearForm();
  showFeedback('txFeedback', `✅ Posted: ${desc} (${fmt(amount)})`, 'success');
  updateCatFilter();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  save();
  renderTransactions();
  renderOverview();
}

function clearForm() {
  document.getElementById('txAmount').value = '';
  document.getElementById('txDate').value   = '';
  document.getElementById('txDesc').value   = '';
  document.getElementById('txCat').value    = 'Food';
  setType('income');
}

function showFeedback(elId, msg, type) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className   = `tx-feedback ${type}`;
  setTimeout(() => { el.className = 'tx-feedback hidden'; }, 3000);
}

// ─── RENDER OVERVIEW ─────────────────────────
function renderOverview() {
  const now      = new Date();
  const month    = now.getMonth();
  const year     = now.getFullYear();

  const monthly = state.transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const income   = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = income - expenses;
  const rate     = income > 0 ? Math.round((balance / income) * 100) : 0;

  document.getElementById('totalIncome').textContent   = fmt(income);
  document.getElementById('totalExpenses').textContent = fmt(expenses);
  document.getElementById('totalBalance').textContent  = fmt(balance);
  document.getElementById('savingsRate').textContent   = rate + '%';
  document.getElementById('totalBalance').style.color  = balance >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('savingsRate').style.color   = rate >= 20 ? 'var(--green)' : rate >= 0 ? 'var(--gold)' : 'var(--red)';

  // Recent list (last 5)
  const recent = state.transactions.slice(0, 5);
  renderTxItems('recentList', recent, false);

  // Overview donut
  renderDonut(monthly);
}

function renderTxItems(containerId, txs, showDelete = true) {
  const el = document.getElementById(containerId);
  if (!txs.length) {
    el.innerHTML = '<div class="empty-state">No transactions here yet.</div>';
    return;
  }
  el.innerHTML = txs.map(t => `
    <div class="tx-item">
      <div class="tx-emoji ${t.type}-icon">${CAT_EMOJI[t.cat] || '📦'}</div>
      <div class="tx-body">
        <div class="tx-desc">${escHtml(t.desc)}</div>
        <div class="tx-meta">${fmtDate(t.date)} &nbsp;·&nbsp; <span class="cat-pill">${t.cat}</span></div>
      </div>
      <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div>
      ${showDelete ? `<button class="tx-delete" onclick="deleteTransaction(${t.id})" title="Delete">✕</button>` : ''}
    </div>
  `).join('');
}

// ─── RENDER TRANSACTIONS LIST ─────────────────
function renderTransactions() {
  const search  = (document.getElementById('txSearch')?.value || '').toLowerCase();
  const typeF   = document.getElementById('txFilter')?.value  || 'all';
  const catF    = document.getElementById('txCatFilter')?.value || 'all';

  let txs = state.transactions.filter(t => {
    const matchSearch = t.desc.toLowerCase().includes(search) || t.cat.toLowerCase().includes(search);
    const matchType   = typeF === 'all' || t.type === typeF;
    const matchCat    = catF  === 'all' || t.cat  === catF;
    return matchSearch && matchType && matchCat;
  });

  renderTxItems('txList', txs, true);
}

function updateCatFilter() {
  const sel  = document.getElementById('txCatFilter');
  if (!sel) return;
  const cats = [...new Set(state.transactions.map(t => t.cat))].sort();
  const cur  = sel.value;
  sel.innerHTML = '<option value="all">All Categories</option>' +
    cats.map(c => `<option value="${c}" ${c === cur ? 'selected' : ''}>${CAT_EMOJI[c] || ''} ${c}</option>`).join('');
}

// ─── BUDGETS ──────────────────────────────────
function setBudget() {
  const cat = document.getElementById('budgetCat').value;
  const amt = parseFloat(document.getElementById('budgetAmt').value);
  if (!amt || amt <= 0) return showFeedback('budgetFeedback', 'Enter a valid amount.', 'error');
  state.budgets[cat] = amt;
  save();
  showFeedback('budgetFeedback', `✅ Budget set: ${cat} → ${fmt(amt)}/mo`, 'success');
  renderBudgets();
}

function deleteBudget(cat) {
  delete state.budgets[cat];
  save();
  renderBudgets();
}

function renderBudgets() {
  const el = document.getElementById('budgetCards');
  const cats = Object.keys(state.budgets);
  if (!cats.length) {
    el.innerHTML = '<div class="empty-state">No budgets set. Go to <strong>+set-budget</strong> to create one.</div>';
    return;
  }

  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  el.innerHTML = cats.map(cat => {
    const limit = state.budgets[cat];
    const spent = state.transactions
      .filter(t => t.type === 'expense' && t.cat === cat)
      .filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((s, t) => s + t.amount, 0);

    const pct  = Math.min((spent / limit) * 100, 100);
    const cls  = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok';
    const remaining = limit - spent;

    return `
      <div class="budget-card">
        <div class="budget-card-header">
          <span class="budget-cat-name">${CAT_EMOJI[cat] || '📦'} ${cat}</span>
          <button class="budget-delete" onclick="deleteBudget('${cat}')" title="Remove budget">✕</button>
        </div>
        <div class="budget-amounts">
          <span class="spent">${fmt(spent)}</span> / ${fmt(limit)}
          &nbsp;·&nbsp; ${remaining >= 0 ? fmt(remaining) + ' left' : fmt(-remaining) + ' over'}
        </div>
        <div class="progress-track">
          <div class="progress-fill ${cls}" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── NET WORTH ────────────────────────────────
function openAssetModal(type) {
  modalType = type;
  document.getElementById('modalTitle').textContent = type === 'asset' ? '🏠 Add Asset' : '💳 Add Liability';
  document.getElementById('modalName').value  = '';
  document.getElementById('modalValue').value = '';
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

function saveAsset() {
  const name  = document.getElementById('modalName').value.trim();
  const value = parseFloat(document.getElementById('modalValue').value);
  if (!name || !value || value <= 0) return;

  const item = { id: Date.now(), name, value };
  if (modalType === 'asset') {
    state.assets.push(item);
  } else {
    state.liabilities.push(item);
  }
  save();
  closeModal();
  renderNetWorth();
}

function renderNetWorth() {
  const totalAssets = state.assets.reduce((s, a) => s + a.value, 0);
  const totalLiab   = state.liabilities.reduce((s, l) => s + l.value, 0);
  const net         = totalAssets - totalLiab;

  document.getElementById('totalAssets').textContent      = fmt(totalAssets);
  document.getElementById('totalLiabilities').textContent = fmt(totalLiab);
  document.getElementById('netWorth').textContent         = fmt(net);
  document.getElementById('netWorth').style.color         = net >= 0 ? 'var(--green)' : 'var(--red)';

  renderAssetItems('assetList', state.assets, 'asset');
  renderAssetItems('liabilityList', state.liabilities, 'liability');
}

function renderAssetItems(elId, items, type) {
  const el = document.getElementById(elId);
  if (!items.length) {
    el.innerHTML = `<div class="empty-state">No ${type === 'asset' ? 'assets' : 'liabilities'} added yet.</div>`;
    return;
  }
  el.innerHTML = items.map(item => `
    <div class="tx-item">
      <div class="tx-emoji ${type === 'asset' ? 'income-icon' : 'expense-icon'}">${type === 'asset' ? '🏦' : '💳'}</div>
      <div class="tx-body"><div class="tx-desc">${escHtml(item.name)}</div></div>
      <div class="tx-amount ${type === 'asset' ? 'income' : 'expense'}">${fmt(item.value)}</div>
      <button class="tx-delete" onclick="deleteAsset(${item.id}, '${type}')" title="Delete">✕</button>
    </div>
  `).join('');
}

function deleteAsset(id, type) {
  if (type === 'asset')     state.assets      = state.assets.filter(a => a.id !== id);
  else                      state.liabilities = state.liabilities.filter(l => l.id !== id);
  save();
  renderNetWorth();
}

// ─── CHARTS ───────────────────────────────────
const CHART_COLORS = [
  '#5865f2','#23a55a','#f23f43','#f0b232','#1abc9c',
  '#eb459e','#3ba55c','#faa61a','#00a8fc','#b9bbbe',
];

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function renderDonut(txs) {
  destroyChart('overviewDonut');
  const expenses = txs.filter(t => t.type === 'expense');
  const catTotals = {};
  expenses.forEach(t => { catTotals[t.cat] = (catTotals[t.cat] || 0) + t.amount; });

  const labels = Object.keys(catTotals);
  const data   = Object.values(catTotals);

  if (!labels.length) {
    const ctx = document.getElementById('overviewDonut');
    if (ctx) {
      const c = ctx.getContext('2d');
      c.clearRect(0, 0, ctx.width, ctx.height);
    }
    return;
  }

  charts['overviewDonut'] = new Chart(document.getElementById('overviewDonut'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: CHART_COLORS, borderWidth: 2, borderColor: '#2b2d31' }],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { position: 'right', labels: { color: '#b5bac1', font: { family: 'Nunito', size: 13 }, padding: 14 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` } },
      },
    },
  });
}

function renderSpendingChart() {
  destroyChart('spendingBar');

  const catTotals = {};
  state.transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.cat] = (catTotals[t.cat] || 0) + t.amount;
  });

  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(e => e[0]);
  const data   = sorted.map(e => e[1]);

  // Category table
  const tableEl = document.getElementById('categoryTable');
  if (!labels.length) {
    tableEl.innerHTML = '<div class="empty-state">No expense data yet.</div>';
    destroyChart('spendingBar');
    return;
  }

  tableEl.innerHTML = sorted.map(([cat, amt], i) => `
    <div class="tx-item">
      <div class="tx-emoji expense-icon">${CAT_EMOJI[cat] || '📦'}</div>
      <div class="tx-body"><div class="tx-desc">${cat}</div></div>
      <div class="tx-amount expense">${fmt(amt)}</div>
    </div>
  `).join('');

  charts['spendingBar'] = new Chart(document.getElementById('spendingBar'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spending',
        data,
        backgroundColor: CHART_COLORS,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } },
      },
      scales: {
        x: { ticks: { color: '#b5bac1' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#b5bac1', callback: v => fmt(v) }, grid: { color: 'rgba(255,255,255,0.06)' } },
      },
    },
  });
}

function renderTrendChart() {
  destroyChart('trendLine');

  // Build last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), month: d.getMonth(), year: d.getFullYear() });
  }

  const incomeData  = months.map(m =>
    state.transactions.filter(t => { const d = new Date(t.date+'T00:00:00'); return t.type==='income'  && d.getMonth()===m.month && d.getFullYear()===m.year; }).reduce((s,t)=>s+t.amount, 0)
  );
  const expenseData = months.map(m =>
    state.transactions.filter(t => { const d = new Date(t.date+'T00:00:00'); return t.type==='expense' && d.getMonth()===m.month && d.getFullYear()===m.year; }).reduce((s,t)=>s+t.amount, 0)
  );

  charts['trendLine'] = new Chart(document.getElementById('trendLine'), {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#23a55a',
          backgroundColor: 'rgba(35,165,90,0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#23a55a',
          pointRadius: 5,
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#f23f43',
          backgroundColor: 'rgba(242,63,67,0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#f23f43',
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: '#b5bac1', font: { family: 'Nunito', size: 13 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` } },
      },
      scales: {
        x: { ticks: { color: '#b5bac1' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#b5bac1', callback: v => fmt(v) }, grid: { color: 'rgba(255,255,255,0.06)' } },
      },
    },
  });
}

// ─── UTILS ────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function editUsername() {
  const name = prompt('Enter your name:', state.username);
  if (name && name.trim()) {
    state.username = name.trim();
    document.getElementById('userName').textContent = state.username;
    save();
  }
}

// ─── SEED DATA ────────────────────────────────
function seedDemo() {
  if (state.transactions.length > 0) return; // don't overwrite real data

  const now  = new Date();
  const m    = now.getMonth();
  const y    = now.getFullYear();
  const pad  = n => String(n).padStart(2, '0');
  const d    = (day, monthOffset = 0) => {
    const date = new Date(y, m + monthOffset, day);
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  };

  const demos = [
    { type:'income',  amount:3500, date:d(1),  desc:'Monthly Salary',      cat:'Salary'        },
    { type:'income',  amount:450,  date:d(5),  desc:'Freelance Project',    cat:'Freelance'     },
    { type:'expense', amount:1200, date:d(3),  desc:'Rent Payment',         cat:'Housing'       },
    { type:'expense', amount:85,   date:d(6),  desc:'Grocery Run',          cat:'Food'          },
    { type:'expense', amount:42,   date:d(8),  desc:'Netflix + Spotify',    cat:'Entertainment' },
    { type:'expense', amount:60,   date:d(10), desc:'Gas',                  cat:'Transport'     },
    { type:'expense', amount:120,  date:d(12), desc:'Doctor Visit',         cat:'Health'        },
    { type:'expense', amount:200,  date:d(14), desc:'New Shoes',            cat:'Shopping'      },
    { type:'expense', amount:55,   date:d(16), desc:'Dinner Out',           cat:'Food'          },
    { type:'income',  amount:3500, date:d(1,-1), desc:'Monthly Salary',     cat:'Salary'        },
    { type:'expense', amount:1200, date:d(3,-1), desc:'Rent Payment',       cat:'Housing'       },
    { type:'expense', amount:95,   date:d(7,-1), desc:'Groceries',          cat:'Food'          },
    { type:'expense', amount:180,  date:d(15,-1),'desc':'Shopping Haul',    cat:'Shopping'      },
    { type:'income',  amount:3500, date:d(1,-2), desc:'Monthly Salary',     cat:'Salary'        },
    { type:'expense', amount:1200, date:d(3,-2), desc:'Rent Payment',       cat:'Housing'       },
    { type:'expense', amount:300,  date:d(20,-2), desc:'Flight Tickets',    cat:'Transport'     },
  ];

  demos.forEach((t, i) => state.transactions.push({ id: Date.now() + i, ...t }));

  state.budgets = { Food: 300, Housing: 1300, Transport: 150, Entertainment: 100, Shopping: 250, Health: 200 };
  state.assets      = [{ id: 1, name: 'Savings Account', value: 8000 }, { id: 2, name: 'Investments', value: 3200 }];
  state.liabilities = [{ id: 3, name: 'Student Loan', value: 12000 }, { id: 4, name: 'Credit Card', value: 800 }];

  save();
}

// ─── INIT ─────────────────────────────────────
function init() {
  load();
  seedDemo();

  // Set today's date as default
  document.getElementById('txDate').value = new Date().toISOString().split('T')[0];

  // Set username
  document.getElementById('userName').textContent = state.username;

  // Populate category filter
  updateCatFilter();

  // Render initial view
  renderOverview();
}

init();
