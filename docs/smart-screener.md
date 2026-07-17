# 智慧選股中心

`npm run screener:generate` 將 Technical Index 與目前可取得的 Decision、Stock Snapshot、TWSE 官方法人資料依代號與日期合併，輸出 `public/data/screener/latest.json`、日期歷史檔與索引。

前端透過 `ScreenerRepository` 讀取結果，提供預設策略切換、搜尋、AND 篩選、排序、每頁 25 筆、桌面 DataTable、手機卡片、CSV 匯出與快速分析 Drawer。Drawer 才會透過 `StockHistoryRepository` 載入單一股票 K 線。

所有理由與風險由固定規則產生，可重跑、可追溯；未呼叫生成式 AI。頁面會顯示實際樣本數，不把部分覆蓋描述為全市場結果。
