# GULI Roadmap

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
