# GULI 發布與資料更新流程

## 基本原則

- `main` 只接受功能開發 push 與人工審查後合併的 Pull Request。
- GitHub Actions 不得直接 commit 或 push `main`。
- GitHub Pages 的 Source 必須設定為 **GitHub Actions**，不可使用 **Deploy from a branch**。
- 網站部署、每日市場資料更新與歷史行情回補是三條獨立流程。
- 自動化資料 commit 只能包含明確允許的 `public/data/**` 路徑。

## A. 每次開始開發

```powershell
cd C:\Users\owen9\guli-stock
npm run git:check
git pull --rebase origin main
```

`git:check` 只執行檢查與 `git fetch origin`，不會自動 pull、rebase、commit、reset 或 push。

## B. 完成功能後

```powershell
npm run data:validate
npm run test:run
npm run build
npm run git:check
git add .
git commit -m "feat: ..."
git pull --rebase origin main
git push origin main
```

提交前應確認 `git status` 與 `git diff --cached`，避免把不相關檔案或本機產物加入 commit。

## C. GitHub Pages

- `main` push 會自動啟動 `deploy-pages.yml`。
- 部署流程只安裝依賴、驗證 JSON、測試、build、建立 SPA fallback 並部署 `./dist`。
- 部署 workflow 不會修改 Git、不會重新產生市場資料，也不會上傳 repository root。
- Actions 成功後再檢查正式網站的版本及 `/guli/assets/` 資源路徑。

## D. 資料更新

- 排程更新提交到 `automation/data-updates`。
- Workflow 只會 stage `public/data/**`。
- 有新資料時建立或更新同一個 Pull Request；沒有變更時不 commit、不 push、不更新 PR。
- 資料由 Pull Request 人工審查後合併，不直接修改 `main`。
- 歷史回補使用 `automation/history-backfill`，只允許歷史行情、Technical Index、Screener 與 Heatmap 路徑。

資料 workflow 不得修改 `src/**`、`scripts/**`、`docs/**`、`package.json`、`package-lock.json`、Sidebar、Settings、`CHANGELOG.md` 或 `ROADMAP.md`。

## E. 發生 non-fast-forward

1. 不要使用 force push。
2. 執行 `git status`。
3. 執行 `npm run git:check`，確認沒有未完成的 rebase 或 merge。
4. 執行 `git pull --rebase origin main`。
5. 若發生衝突，確認每一個檔案的正確內容後執行 `git add <file>`。
6. 執行 `git rebase --continue`。
7. 再次執行測試與 `npm run git:check` 後 push。

若不確定如何解決，不要執行 `git reset --hard` 或 force push。

## F. 發生大量 JSON 衝突

- 先停止目前 rebase，避免在不清楚資料來源時繼續處理。
- 不要逐檔任意選擇 ours 或 theirs。
- 先確認交易日期、資料來源、產生腳本版本與對應的資料 Pull Request。
- 必要時從已確認的原始資料重新產生 JSON。
- 執行 `npm run data:validate`，確認無 conflict marker 且每個 JSON 都可解析。
- 完成資料驗證與相關測試後，再重新開始 rebase 或建立乾淨 commit。
