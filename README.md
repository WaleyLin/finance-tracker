# 💰 FinanceBot — Personal Finance Tracker

A personal finance tracker built with vanilla HTML, CSS, and JavaScript — styled like Discord. Track income and expenses, set budgets, monitor net worth, and visualize spending trends. All data saved locally in the browser with no backend or sign-up required.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)

---

## Features

- **Discord-inspired UI** — server rail, channel sidebar, dark theme, and the whole vibe
- **Transaction logging** — log income and expenses with category, date, and description
- **Budget tracking** — set monthly spending limits per category with live progress bars that turn red when you're over
- **Net worth tracker** — add assets and liabilities, see your net worth calculated automatically
- **Spending breakdown** — bar chart showing total spend per category across all time
- **Monthly trend chart** — line chart comparing income vs expenses over the last 6 months
- **Search and filter** — filter transactions by type, category, or keyword
- **Demo data included** — loads sample transactions on first open so it doesn't look empty
- **Persistent storage** — everything saved to `localStorage`, survives page refreshes and restarts
- **Zero dependencies** — just Chart.js loaded from CDN, nothing else to install

---

## Getting Started

1. Clone or download this repo
2. Open `index.html` in any modern browser — Chrome, Firefox, Edge, Safari all work
3. No build step, no `npm install`, no server needed

```bash
git clone https://github.com/YOUR_USERNAME/finance-tracker.git
cd finance-tracker
open index.html   # macOS
# or just double-click index.html on Windows
```

---

## How to Use

### Adding Transactions
Go to **Transactions → #add-transaction**, pick Income or Expense, fill in the amount, date, description, and category, then hit **Post Transaction**.

### Setting Budgets
Go to **Budgets → +set-budget**, pick a category and set a monthly dollar limit. The budget overview shows a progress bar for each category — green when you're under, yellow at 80%, red when over.

### Net Worth
Go to **Dashboard → #net-worth**, add your assets (savings, investments, etc.) and liabilities (loans, credit cards, etc.). Net worth = assets minus liabilities.

### Analytics
Go to **Analytics** for two charts:
- **#spending-breakdown** — bar chart of total spend per category
- **#monthly-trend** — income vs expenses over the last 6 months

### Clearing Demo Data
Open your browser's DevTools (`F12`), go to **Application → Local Storage**, and clear the entries starting with `fb_`. Refresh the page and it starts fresh.

---

## Project Structure

```
finance-tracker/
├── index.html    # App structure and layout
├── style.css     # Discord-inspired dark theme, all styling
├── app.js        # All logic — state, storage, rendering, charts
└── README.md
```

Everything is split across three files. No frameworks, no build tools, no package.json. Just open and run.

---

## Built With

| Technology | Usage |
|---|---|
| HTML5 | Structure and layout |
| CSS3 | Discord-style dark theme, CSS variables, animations |
| Vanilla JavaScript | State management, DOM rendering, localStorage |
| Chart.js (CDN) | Doughnut, bar, and line charts |
| localStorage API | Persistent client-side data storage |
| Google Fonts | Nunito + Inconsolata typography |

---

## What I Learned

- Building a multi-view single-page app without any framework by managing state and re-rendering manually
- Designing a navigation system (server icons → channel sidebar → views) inspired by a real production UI
- Using Chart.js to render dynamic data visualizations that update as data changes
- Managing persistent state with `localStorage` including serialization and safe loading
- Writing CSS custom properties for a consistent design system across many components
- Building reusable render functions that keep the UI in sync with the data layer
