# Changelog

## [0.7.2]

- 將 Dashboard 重排為資料狀態、市場結論、Decision、自選股、Snapshot 與產業／個股工作流。
- 壓縮 Decision 與資料平台卡片，新增前期比較、正負因子、警示折疊與明確 Loading／Empty／Error／Stale／Partial 狀態。
- 升級智慧自選股預覽與桌面表格，加入迷你進度、群組／Observation metadata、同頁 Drawer 與手機資料卡。
- 決策中心新增市場決策雙欄卡與四組個股雷達排行；個股頁與 Decision Trace 統一因子卡格式。
- 新增集中 formatter、Card `spacious` 密度、全螢幕行動搜尋、safe area 與工作區可存取性規範。

## [0.7.1]

- 建立 Typography、Spacing、Card、Badge 與 DataTable UI 2.0 共用規範。
- 重整智慧自選股為資料狀態、今日工作台、快速洞察與響應式清單四層結構。
- 依市場結論、決策、快照、統計、產業與自選股重新排列 Dashboard 資訊層級。
- 個股頁新增三分數 Score Overview，決策中心與股寶強化 Decision／Confidence／Trace 可讀性。
- 補強手機資料卡、Drawer safe area、44px 觸控區、ARIA 與 reduced-motion 測試。

## [0.7.0]

- 將自選股升級為智慧觀察中心，新增四大摘要、Today Action、完整排序篩選與同頁 Detail Drawer。
- 新增 Watchlist Score、Observation Status、快速標籤、風險排行與 Observation Timeline 固定規則。
- 新增 WatchlistDashboardRepository 與 Decision／Snapshot／Watchlist 指紋快取。
- Dashboard 新增自選股摘要，股寶新增五項引用 DecisionResult 的自選股問答。
- 新增 38 項智慧觀察中心規則、Repository、Cache 與 Drawer 測試。

## [0.6.0]

- 新增 deterministic AI Decision Engine 與 `decision-v1.0` 公式版本。
- 新增市場、產業、個股及自選股 DecisionResult、Confidence 與 Decision Trace。
- 新增決策中心、Dashboard 決策摘要、個股決策面板與股寶規則問答。
- 新增靜態決策產檔、Repository Cache、GitHub Actions 步驟及 28 項規則測試。

## [0.5.5-alpha.2]

- 新增 TWSE 上市個股 Stock Snapshot Engine、日期索引與單股歷史檔。
- 新增價格強度、流動性、估值風險與快照總分的 deterministic 規則。
- 新增個股快照總覽、Dashboard 預覽、個股頁快照／Diff／Memory 面板。
- 更新 Repository、GitHub Actions 產生順序與規則測試。

## [0.5.5-alpha.1]

- 新增 TWSE `STOCK_DAY_ALL` 與 `BWIBBU_ALL` 上市個股盤後資料同步。
- 新增股票資料正規化、驗證、商品分類、Provider、Repository fallback 與資料狀態頁。
- 個股健檢正式報價採 TWSE，法人與健康分析維持 Mock／derived 並顯示來源 Badge。
- 更新 GitHub Actions 資料同步順序與資料集 commit。

## [0.5.3]

- 新增 Market Snapshot 1.0 schema、產生器、Storage、Repository、Diff 與 Market Memory。
- 新增單一真實交易日歷史 JSON、Dashboard 今日快照及 `/history` 市場回顧頁。
- 新增 1200×630 分享卡預覽、摘要複製與列印提示。
- GitHub Actions 在 TWSE 同步後自動產生並提交 Snapshot history。
- 官方、Mock、Derived、Fallback 來源均保留明確標示。

## [0.5.2]

- 接入 TWSE 官方盤後加權指數、漲跌、成交金額與可取得的漲跌家數。
- 新增 Node.js 官方資料同步腳本與 GitHub Actions 平日盤後排程。
- 新增 TWSE Provider、資料正規化、驗證、品質評分、Cache 與 Mock fallback。
- Dashboard 與 Settings 支援逐欄來源標示與 TWSE／Mock 切換。
- 保留 GitHub Pages `/guli/` base path 與既有功能。
# Changelog

## [0.5.4]

- 新增 Industry Snapshot Engine、Repository、Diff 與 Industry Memory。
- 新增產業總覽、產業明細、Dashboard 產業輪動預覽與市場歷史產業記憶。
- Market Snapshot 優先引用同交易日 Industry Snapshot，失敗時明確回退。
- GitHub Actions 依序更新 TWSE、Industry Snapshot、Market Snapshot、測試與建置。
