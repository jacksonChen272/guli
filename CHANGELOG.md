# Changelog

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
