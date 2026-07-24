# 股勵 GULI

<<<<<<< HEAD
目前版本：**GULI v1.2.0**

GULI 是以 React、TypeScript、Vite 建立的台股盤後資料與規則分析平台。網站部署於 GitHub Pages，Vite `base` 固定為 `/guli/`，React Router `basename` 固定為 `/guli`。

## Dashboard 3.0

Dashboard 3.0 已正式發布，以每日市場判讀為首屏主軸，讓使用者依序掌握資料可信度、Market Overview、市場情緒、市場廣度、Heatmap、今日機會與個人化 Widgets。所有資料仍由 `RepositoryHub` 統一提供；Dashboard 元件不直接讀取公開 JSON 或呼叫外部 API。

- Market Command Center 集中顯示指數、成交值、市場方向、情緒、廣度與規則式摘要。
- 資料狀態清楚區分 Official、Mixed、Partial、Stale、Missing，規則推導資訊另以 Derived 標示。
- Market Breadth 與 Heatmap 提供市場多空結構及產業／個股強弱觀察。
- 固定首屏區塊維持一致資訊層級；既有 Widgets 沿用 `guli-dashboard-widget-layout-v1` 保存排序。
- 單一 Widget 讀取或渲染失敗時，只影響該區塊，並提供 Loading、Empty、Error、Stale 與重試狀態。
- 響應式支援 360px 至 2560px，並包含鍵盤操作、焦點樣式、44px 觸控區及 `prefers-reduced-motion`。
- GitHub Pages 維持 Vite `base: '/guli/'` 與 React Router `basename="/guli"`。

本版本不調整 Decision、Technical、Health、Snapshot 公式，也不包含 Stock Page 3.0。

## 發布歷程

=======
>>>>>>> origin/main
## Dashboard 3.0 Release Candidate

Dashboard 3.0 以每日市場判讀為首屏主軸，依序呈現資料可信度、Market Overview、市場情緒、市場廣度、Heatmap、今日機會與既有個人化 Widgets。所有資料仍由 `RepositoryHub` 統一提供；Dashboard 元件不直接讀取公開 JSON 或呼叫外部 API。

- 資料狀態明確區分 Official、Mixed、Partial、Stale、Missing，推導資訊另以 Derived 標示。
- 固定首屏區塊不可拖曳；原有 Widgets 沿用 `guli-dashboard-widget-layout-v1` 保存排序。
- 單一 Widget 讀取或渲染失敗時，僅顯示該區塊錯誤與重試操作，不造成整頁白畫面。
- 響應式驗收涵蓋 360px 至 2560px，並支援鍵盤、焦點樣式及 `prefers-reduced-motion`。
- GitHub Pages 維持 Vite `base: '/guli/'` 與 React Router `basename="/guli"`。

此發布候選不調整 Decision、Technical、Health、Snapshot 公式，也不包含 Stock Page 3.0。正式版本與 Sidebar 版本字樣需待人工驗收後再更新。

GULI 是以 React、TypeScript、Vite 建立的台股盤後資料與規則分析平台。網站部署於 GitHub Pages，Vite `base` 固定為 `/guli/`，React Router `basename` 固定為 `/guli`。

## GULI v1.1.1 — TWSE Data Completion

歷史行情沿用單一正式資料路徑 `public/data/twse-stock-history/stocks/{symbol}.json`，來源為 TWSE `STOCK_DAY`。資料包含 OHLC、成交股數、成交金額、漲跌價差與成交筆數，依交易日升冪排列並去重。ETF、ETN、權證及非四碼普通股不納入回補。

### 資料指令

```powershell
npm run data:history:backfill -- --start-symbol=1108 --limit=20 --batch-size=20 --target-days=300
npm run data:history:validate
npm run data:technical:rebuild
npm run data:update-daily
```

回補支援 `--symbol`、`--symbols`、`--start-symbol`、`--start-month`、`--dry-run`、`--force-refresh`、`--retry-failed-only`、`--batch-size`、`--request-delay`、`--batch-delay` 與 `--max-retries`。正式大規模回補採 20 → 100 → 300 → 600 → 全市場分階段執行；每階段先檢查 TWSE 限流、失敗率、JSON 體積與技術索引結果。

### 狀態與報告

- 回補進度：`data/history/history-progress.json`
- 歷史 Manifest：`public/data/history/history-manifest.json`
- 技術 Manifest：`public/data/technical/technical-manifest.json`
- 回補、驗證與技術報告：`reports/*.json`

Manifest 狀態為 `complete`、`partial`、`failed`、`pending` 或 `unsupported`。新上市股票不足 300 日會標記 `partial`；只要資料通過驗證且達技術最低需求，仍可產生部分技術結果。缺值不以 0 或模擬值補入。

## 開發與驗證

```powershell
npm ci
npm run data:validate
npm run test:run
npm run build
npm audit --audit-level=high
```

Decision、Technical、Health 與 Snapshot 既有分數公式未在 v1.1.1 變更。所有行情為盤後資料，分析結果僅供資訊參考，不構成投資建議。
