# Changelog

## [1.0.0-beta.4]

- 新增 TWSE 上市公司基本資料同步腳本，產出可追溯、可驗證的官方產業分類靜態 JSON。
- 新增 `TWSEIndustryMappingProvider`、`IndustryMappingRepository`、正規化、驗證、合併與覆蓋率服務。
- Market Heatmap 與 Industry Snapshot 改為官方分類優先；缺值才使用明確標示的衍生群組，其他股票保留為未分類。
- Today Dashboard 熱門族群與 Data Coverage 顯示實際普通股總數、官方分類數、未分類數、樣本數與更新時間。
- Decision、Technical、Health、Market Snapshot 與 Stock Snapshot 的既有公式及權重未變更。

## [1.0.0-beta.3.1]

- GitHub Pages 部署固定由 `deploy-pages.yml` 上傳 `./dist`，不再修改 repository。
- 每日資料更新改寫入 `automation/data-updates` 並建立或更新 Pull Request，不再直接 push `main`。
- 歷史行情回補改為 artifact-only，不再 commit 或 rebase 遠端主分支。
- 新增 `git:check`，檢查 rebase、未合併路徑、JSON、conflict marker 與遠端同步狀態。
- 新增發布流程文件與 workflow 靜態保護測試；分析公式及 UI 商業功能未變更。

## [1.0.0-beta.3]

- 新增由每日靜態索引驅動的市場熱力圖，支援產業／個股、成交金額／成交量，以及漲跌幅／Technical／Decision 顏色切換。
- 新增 `MarketHeatmapRepository`、可重現生成腳本、JSON Guard、來源分層、樣本覆蓋率與每日資料 workflow 接線。
- 首頁市場摘要升級為 `today-narrative-v1.0` 固定規則，並加入「為什麼？」、今日操作環境及既有全域股票搜尋入口。
- 「今日推薦」更名為「今日觀察 Top 3」，完整揭露分數、信心、風險、資料日期與資料來源。
- 熱門族群、技術機會與資料完整度補上實際樣本數及規則推導標示；Decision Engine v1.0 與 Technical Score 權重未變更。

## [1.0.0-beta.1]

- 首頁升級為 Today Dashboard，依序呈現今日市場、推薦候選、熱門族群、技術機會、排行榜、最新消息與資料完整度。
- 首頁文案改為一般投資人易懂的市場判讀，並保留 TWSE、法人、Screener、產業與覆蓋率既有 Repository。

- 新增可續跑、可分批及具 checkpoint 的 TWSE 上市普通股歷史行情回補。
- 新增 technical-v1.0、全市場技術索引與十種固定規則 Preset。
- 新增智慧選股中心、Dashboard compact 預覽、股寶選股問答及 Data Coverage 進度。
- GitHub Actions 分離每日增量更新與全市場 backfill；資料驗證失敗即停止後續 build。
- Decision Engine v1.0、Health Score 與 Stock Snapshot Score 權重維持不變。

## [0.9.0-rc.1]

- 新增 TWSE 官方個股歷史行情同步、增量合併、原子寫入與公開 JSON 驗證。
- 新增 StockHistory Provider／Repository 與 250 個實際交易日覆蓋狀態。
- 新增 MA、EMA、RSI、KD、MACD、布林通道、ATR、量比、報酬與波動率固定公式。
- 個股頁導入 TradingView Lightweight Charts v5 K 線、成交量、均線與布林通道。
- Dashboard 與資料覆蓋率頁新增歷史行情技術快照；技術推導不外推至全市場。
- 新增日常增量同步與分批 backfill GitHub Actions，部署前強制驗證公開 JSON。
- Decision v1.0、健康分數與 Snapshot 既有權重及商業規則維持不變。

## [0.8.0-beta.1]

- 接入 TWSE BFI82U 與 T86 官方三大法人盤後資料，建立原子同步、歷史檔、Provider、Repository、快取與排行榜。
- Dashboard 新增外資及陸資、投信、自營商、三大法人合計與個股買賣超 Top 10；個股頁新增官方法人單日區塊。
- 將近似漲跌停改名為「漲幅 ≥ 9.5%」與「跌幅 ≤ -9.5%」，標示 Derived 並補充非官方統計說明。
- 建立 Public Beta Data Guard、資料可信度摘要、公開測試模式與 `/data-coverage` 覆蓋率頁面。
- Decision Trace 附加官方法人來源；`decision-v1.0` 權重與分數公式不變。
- GitHub Actions 依序同步市場、個股、法人，再產生 Snapshot、Decision、測試與建置。

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
