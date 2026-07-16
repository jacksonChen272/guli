# GULI Professional Trading Workspace

GULI v0.7.2 僅調整呈現層與 ViewModel，不改動 Decision、Health、Snapshot、Repository、Provider、Cache 或資料同步商業邏輯。

## Dashboard 工作流

桌面依序呈現資料平台狀態、市場一句話、GULI Decision、自選股摘要、市場 Snapshot、產業輪動、個股 Snapshot、市場溫度與其他研究工具。手機將市場一句話置於資料狀態前，讓使用者先取得結論，再視需要展開資料警示。

Decision 摘要使用四個緊湊 KPI：市場分數、方向、Confidence 與高風險候選，並顯示前期比較、前三項正向因子與前三項壓力因子。只有一個交易日時明確顯示「尚無前期資料」。

## 智慧自選股

桌面清單採 80px 交易工作區列高，股票名稱、代號、群組與 Observation Status 分層呈現；數字欄靠右並使用 tabular numbers。Decision、Confidence 與 Snapshot 有文字數值與可存取迷你進度條。手機改用資料卡，避免水平爆版。

Dashboard 自選股預覽包含今日最佳、最高風險、平均 Decision、提醒數與五項快速洞察；點擊有對應股票的項目會在同頁開啟 Detail Drawer。

## 決策中心與個股頁

決策中心市場卡以雙欄呈現分數／方向／公式與正向／壓力因子；個股雷達提供 Top、Bottom、低 Confidence 與最大變化四組摘要。只有單一交易日時，變化排行使用 EmptyState 說明資料限制。

個股頁將 GULI Decision、健康分數與單日 Snapshot 分開呈現，三者各自標示用途、來源與更新日期。Decision 因子與 Trace 統一顯示名稱、分數、權重、貢獻、方向、來源與說明。

## 顯示與可存取性

- Decision 固定一位小數；Confidence 使用整數百分比；健康與 Snapshot 使用整數。
- 股價依價格級距顯示 0–2 位小數，漲跌固定正負號與兩位小數。
- 日期顯示 `YYYY/MM/DD`、時間顯示 `HH:mm`。
- 狀態不只使用顏色，並搭配圖示、方向箭頭、正負號或文字。
- 行動版 Header 操作區至少 44px；搜尋為全螢幕並支援 Escape、返回與關閉。
- Drawer、Modal 與頁尾預留 `safe-area-inset-bottom`。

## Card density 與表格

- `compact`：KPI、狀態列與短摘要。
- `standard`：一般資訊與具標題、內容、Footer 的主要卡片。
- `spacious`：Decision 因子、Trace 與需要長說明的分析內容。
- 桌面資料表採 sticky header、數值靠右、80px 自選股列高；手機一律切換為資料卡。

## Mobile Header 與 Safe Area

手機 Header 為 76px，左側保留 Menu 與頁名，右側保留搜尋、通知及使用者入口。搜尋預設收合，開啟後為全螢幕 Overlay，支援 Escape、返回與關閉。頁尾、Drawer 與搜尋面板皆使用 safe-area 環境變數。

## Empty State 規則

排行與摘要不得以空白卡片代替狀態。讀取時顯示 Loading skeleton、無資料顯示原因與下一步、錯誤顯示友善訊息；Stale 與 Partial 必須保留 Badge 或可展開警示，且不得把 Mock／Fallback 隱藏。
