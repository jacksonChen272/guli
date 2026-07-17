# 專業行情圖表

個股頁使用官方 `lightweight-charts` v5 API，不使用非官方 React wrapper。

- 圖表元件只在個股頁 lazy load，Dashboard 初始 bundle 不下載圖表程式。
- 提供 K 線、成交量、MA5、MA20、MA60 與布林通道切換。
- 期間支援 1M、3M、6M、1Y、全部；期間以實際交易日筆數切片。
- 支援滑鼠滾輪、拖曳、觸控平移與 pinch zoom。
- 使用 ResizeObserver 調整尺寸，unmount 時 disconnect 並呼叫 `chart.remove()`。
- 台股顏色遵循紅漲、綠跌，並以文字與 Badge 輔助判讀。

TradingView attribution logo 保持開啟。使用者仍須遵守 Lightweight Charts 授權與 TradingView attribution 要求。

