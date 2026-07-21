# Stock Analysis 2.0

`/stock/:symbol` 只有一個實際頁面入口：`StockDetailWithSnapshot`。頁面透過 `useStockAnalysisData` 集中取得官方行情、官方歷史、法人、官方產業分類、Decision、Technical、Health、Stock Snapshot 與自選股狀態，避免各卡片重複讀取 Repository。

畫面順序固定為資料可信度、股票摘要、四項分數、今日判讀、K 線與技術指標、價格結構、法人、產業比較、風險、Decision Trace、資料來源與免責聲明。

行情與法人均為盤後資料。Derived 表示由固定規則推導；Health 目前仍含集中管理的模擬因子。缺值不會以零或虛構數值補齊。
