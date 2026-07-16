# GULI UI Design System 2.1

> v0.7.2 更新：新增 Professional Workspace 資訊密度、`spacious` Card、集中格式化與行動搜尋／safe-area 規範；資料與決策商業邏輯維持不變。

本文件定義 GULI v0.7.1 的可讀性與資訊層級規範。所有變更只影響呈現層，不改動 Decision、Health、Snapshot、Repository、Provider 或 Cache 邏輯。

## Typography scale

| Token | Desktop | 用途 |
| --- | ---: | --- |
| `display` | 40px | 品牌級主數值 |
| `pageTitle` | 34px；手機 28px | 頁面標題 |
| `sectionTitle` | 24px | 區塊標題 |
| `cardTitle` | 20px | 卡片標題 |
| `bodyLarge` | 18px | 重要摘要 |
| `body` | 16px；手機最低 15px | 主要內容 |
| `bodySmall` | 14px | 次要說明 |
| `label` | 13px | 欄位標籤、eyebrow |
| `caption` | 12px | 時間、來源等輔助資訊 |
| `tableHeader` | 14px | 表格欄名 |
| `tableCell` | 15px | 表格資料 |
| `badge` | 13px | 狀態與來源 |
| `metricLarge` | 34–40px | 首要分數或行情 |
| `metricMedium` | 24–28px | 次要分數 |

數字使用 `tabular-nums`；中英文正文行高為 1.6–1.7。12px 僅用於 caption，重要資訊不得使用 10px 或 11px。

## Spacing scale

統一使用 4、8、12、16、20、24、32、40、48px。標準卡片桌面內距 24px、手機 16–20px；區塊間距 24–32px。

## Card variants

- `standard`：多段內容，標準 20–24px 內距。
- `compact`：單一指標或短摘要，16–20px 內距，不固定高度。
- `spacious`：Decision Trace、因子說明等高資訊量內容，桌面 32–40px、手機 20px 內距。
- `interactive`：僅做輕微位移、邊框與陰影變化。
- `state`：`loading`、`empty`、`error` 透過 `data-state` 提供一致狀態掛點。
- 標題至少 20px、副標至少 13–14px；Footer 與內容區以細邊框分隔。

## Table rules

- Header 14px、Cell 15px、一般列高至少 60px，自選股列高至少 72px。
- Header 可 sticky；數值欄靠右並使用 tabular numbers。
- 股票名稱與代號分兩層；漲跌使用正負號或箭頭加上台股紅漲綠跌。
- 高風險使用圖示與文字，不只使用顏色。
- 手機優先使用資料卡片；桌面表格才允許必要的水平捲動。

## Badge rules

Badge 字級 13px、最小高度 28px。狀態需有文字；風險與漲跌不可只靠色彩。來源 Badge 使用 `official`、`mock`、`fallback` 或 `derived` 等明確名稱。

## Responsive rules

- 1440px 以上主內容最大寬度 1640px，避免文字段落過度拉寬。
- 1366px 保持核心區塊可見，工具列可換行。
- 平板卡片改兩欄，圖表全寬。
- 375px 手機正文至少 15px、頁面標題 28px、操作區至少 44px；自選股與決策排行使用卡片。
- Drawer 手機全螢幕並保留 `safe-area-inset-bottom`。

## Accessibility rules

- 所有 icon-only button 必須有 `aria-label`。
- Drawer 支援焦點圈限、Escape 關閉與關閉後焦點回復。
- Tabs、表格互動列與搜尋支援鍵盤操作。
- 動畫時間 150–300ms，並以 `prefers-reduced-motion` 停用非必要動畫。
- 風險、方向與漲跌同時提供圖示、文字或正負號，不只依賴顏色。
