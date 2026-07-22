# 股勵 GULI

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
