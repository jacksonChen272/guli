# 資料日期一致性

`DataDateAlignmentService` 比較市場、個股行情、法人、歷史行情、Snapshot、Decision 與 Technical Index 的交易日期。

- aligned：同一交易日，不扣 Screener Confidence。
- acceptable：差一個交易日且仍在允許範圍，Confidence 扣 8。
- mismatched：超過一個交易日，Confidence 扣 20。
- missing：至少一項日期缺失，Confidence 扣 25。

日期一致性只調整 Screener Confidence，不會修改 Technical Score、Decision v1.0、Health Score 或 Snapshot Score。
