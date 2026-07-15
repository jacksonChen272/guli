# Decision Trace

每個 `DecisionResult` 都包含以下追溯資料：

- `formulaVersion`：目前為 `decision-v1.0`。
- `availableWeight`／`missingWeight`：有效與缺少因子的原始權重。
- `normalizationApplied`：是否重新正規化。
- `totalPositiveContribution`／`totalNegativeContribution`：相對中性基準 50 的正負貢獻。
- `calculationSteps`：實際計算步驟。
- 每個 Factor 的 raw value、normalized score、weight、contribution、來源與 evidence。

計分採中性基準 50：

```text
signed contribution = (factor score - 50) × normalized available weight
decision score = clamp(50 + Σ signed contribution, 0, 100)
```

所有 Factor contribution 加總必須與 Trace 的 totalContribution 一致，並由 `DecisionValidationService` 驗證。UI 的 Drawer 只顯示追溯資訊，不在 render 階段重新計算。
