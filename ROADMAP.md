# GULI Roadmap

## Completed

### GULI v1.2.0 — Dashboard 3.0

- [x] 完成首屏資訊層級、Market Command Center、市場情緒、市場廣度與 Heatmap 整合。
- [x] 完成 Official／Derived／Partial／Stale／Missing 資料語意與日期標示。
- [x] 完成 360px 至 2560px 響應式、鍵盤操作、reduced motion、44px 觸控區與無水平溢出驗收。
- [x] 保留 `guli-dashboard-widget-layout-v1` 與既有 Widget 排序相容性。
- [x] 完成單一 Widget 錯誤隔離、Loading／Empty／Error／Stale 狀態及 GitHub Pages 路由檢查。
- [x] Dashboard 3.0 已正式發布。

## Pre-release Archive

## GULI v1.2.0-beta.1 — Dashboard 3.0 Release Candidate

- [x] 完成首屏資訊層級、Market Command Center、市場情緒、廣度與 Heatmap 整合驗收。
- [x] 驗證 Official／Derived／Partial／Stale／Missing 資料語意與日期標示。
- [x] 驗證 12 組指定 viewport、鍵盤操作、reduced motion、44px 觸控區與無水平溢出。
- [x] 保留 `guli-dashboard-widget-layout-v1` 與既有 Widget 排序相容性。
- [x] 完成單一 Widget 錯誤隔離、Loading／Empty／Error／Stale 狀態與 GitHub Pages 路由檢查。
- [ ] 人工確認桌面、平板、手機截圖後，才可升級正式版本與合併 `main`。
- [ ] Stock Page 3.0 留待後續獨立 Sprint，本階段不開發。

## GULI v1.1.1

- [x] 建立 TWSE 歷史行情批次、限流、重試、續跑、驗證、Manifest 與報告基礎。
- [x] 建立技術索引完整重建與 94/92 缺口診斷，維持 `technical-v1.0` 分數權重。
- [x] 完成第一階段 20 檔實際回補與驗證。
- [ ] 第二階段擴大至累計 100 檔，先觀察官方端點限流與 Action 執行時間。
- [ ] 依序擴大至 300、600 與全部上市普通股；新上市股票維持 Partial，不補虛構資料。
- [ ] 完成全市場後，持續以每日增量更新歷史行情、技術索引、Screener 與 Heatmap 覆蓋率。

## GULI v1.1.0-beta.2

- [x] 單一全市場 Search Index 與 RepositoryHub 搜尋資料入口。
- [x] 五層固定排序規則、股票／功能命令搜尋及熱門搜尋管理。
- [x] Ctrl/⌘+K Command Palette、方向鍵、Tab、Enter、Escape 與焦點樣式。
- [x] 股票資訊卡、四項分數、Hover Quick Preview 與加入自選股。
- [x] 最近 10 筆搜尋跨首頁同步，僅由 SearchRepository 操作 LocalStorage。
- [x] Official Data、History、Technical、Decision 狀態與即時計算覆蓋率。
- [ ] 待官方英文公司名稱資料源可驗證後，再補齊英文名稱索引；目前不推測或虛構英文名稱。

## GULI v1.1.0-beta.1

- [x] Market Intelligence Dashboard 單一首頁資訊流與 Widget Layout。
- [x] `market-sentiment-v1`、固定規則今日摘要與完整來源揭露。
- [x] TWSE Official 熱門股票 Top 5、最近 10 筆搜尋與自選股盤後預覽。
- [x] 全部 Dashboard Widget 拖曳／按鈕排序及 LocalStorage 持久化。
- [x] Today Events Coming Soon，不虛構事件。
- [ ] 後續版本串接可驗證的官方事件與新聞來源；本版不推測事件內容。

## GULI v1.0.0-rc.1

- [x] 個股分析 2.0 單一路由與集中資料 hook。
- [x] 四項獨立分數、規則判讀、專業 K 線、價格結構、法人、產業、風險與 Decision Trace 完整資訊流。
- [x] 官方／推導／模擬／缺失來源與日期一致性揭露。
- [ ] 後續版本再評估除權息還原、更多法人歷史與 TPEX 行情；本版不變更既有分析權重。

## GULI v1.0.0-beta.4

- [x] 接入 TWSE 上市公司官方產業分類，保留 MOPS 官方 CSV 備援。
- [x] Heatmap、Industry Snapshot、Today Dashboard 與 Data Coverage 共用同一個官方 mapping Repository。
- [x] 將未分類、衍生群組、Technical 與 Decision 實際樣本數分開揭露。
- [x] 每日資料 Pull Request workflow 先同步產業分類，再產生下游快照與 Heatmap。
- [ ] 待上櫃官方分類來源納入後，再擴充 TPEX universe；本版只處理 TWSE 上市普通股。

## GULI v1.0.0-beta.3.1

- [x] GitHub Pages 與資料同步 workflow 完全分離。
- [x] 自動資料更新改由 `automation/data-updates` Pull Request 審查後合併。
- [x] 歷史資料回補改採 artifact 交付，停止 Actions 直接寫入 `main`。
- [x] 加入 Git push 前的 repository、JSON 與遠端同步安全檢查。

## GULI v1.0.0-beta.3

- [x] 每日市場熱力圖靜態索引、Repository、來源分層與 JSON Guard
- [x] 首頁產業／個股 Treemap、Tooltip、鑽取、返回上層與 100 檔上限
- [x] `today-narrative-v1.0` 固定規則摘要、Hero 操作環境與「為什麼？」依據
- [x] 今日觀察 Top 3、熱門族群、技術機會及資料完整度資訊升級
- [ ] 以正式產業分類來源逐批提高目前產業 mapping 覆蓋率
- [ ] 持續回補全市場歷史行情，提高 Technical Index 實際樣本數

## GULI v1.0.0-beta.1

- [x] Today Dashboard 首頁資訊流與 375px 響應式改版
- [x] 今日推薦、熱門族群、技術機會、排行榜、新聞預留區與資料完整度整合

- [x] 全市場分批歷史行情回補基礎
- [x] Technical Index 與 Technical Score technical-v1.0
- [x] 智慧選股規則、Repository、UI 與 CSV 匯出
- [x] Dashboard、股寶與 Data Coverage 整合
- [ ] 以多批 GitHub Actions 持續完成全部上市普通股 250 日覆蓋
- [ ] 公開測試後評估櫃買市場與更長週期資料

## 0.9.0-rc.1

- 已完成 TWSE 上市普通股歷史行情資料層與優先股票 250 日基礎。
- 已完成固定公式技術指標、固定規則技術訊號與專業 K 線圖表。
- 已完成按股票載入、Repository Cache、圖表 lazy chunk 與 JSON 發布保護。
- 下一階段：擴大歷史行情覆蓋、接入 TPEx 歷史行情、加入還原權息與企業行動資料。

## 0.8.0-beta.1

- 完成 TWSE 官方三大法人盤後市場金額與上市普通股買賣超資料。
- 完成 Public Beta Data Guard、資料覆蓋率與 Missing／Stale／Fallback 呈現規則。
- 維持 `decision-v1.0` 權重；官方法人資料先納入 Trace 與來源揭露。
- 下一階段：累積多交易日官方法人歷史、建立正式產業 mapping，經版本化評估後再決定是否新增 Decision 法人因子。

## 0.7.2

- 完成 Professional Trading Workspace 的資訊密度、工作流程與響應式掃讀體驗。
- 維持 Decision、Health、Snapshot 與資料平台規則不變，集中處理 ViewModel 與顯示格式。
- 下一階段建議：累積多交易日 Decision／Snapshot 歷史，以啟用更完整的變化排行與回測視圖。

## 0.7.1

- 完成 UI 2.0 可讀性、資訊層級、共用資料表與手機操作品質。
- 保持 Decision、Health、Snapshot 公式與 Repository／Provider／Cache 資料流程不變。
- 下一階段：以真實裝置與使用者測試持續校準高資訊密度畫面的掃讀效率。

## 0.6.0

- 可解釋市場、產業、個股與自選股決策。
- Decision Trace、來源分層、缺值正規化與信心扣分。
- 下一階段：官方產業 mapping、更多實際歷史、決策回測與公式版本遷移。

## 0.5.5-alpha.2

- TWSE 上市個股 Stock Snapshot、Diff 與實際歷史 Memory。
- 分頁快照排行與資料來源分層；不混用既有健康分數。
- 下一階段：累積更多交易日、官方產業 mapping、TPEX 與正式長期因子。

## 0.5.5-alpha.1

- TWSE 上市股票每日盤後 OHLC、成交量值與本益比正式資料 Alpha。
- 正式報價與 Mock 法人／Derived 健康分數分層。

## 0.5.4

- Industry Snapshot Engine、產業強弱頁、產業記憶與 Market Snapshot 同日整合。

## 建議後續

- 建立正式產業分類與成分股映射來源。
- 串接官方或授權的產業成交、法人與歷史行情資料。
- 累積足夠交易日後補強產業趨勢與輪動回測。
- 對快照 JSON 建立正式 JSON Schema 與跨版本遷移工具。
