# GitHub 網頁版

儲存庫：https://github.com/t5566t5168-code/chu-ban

網頁版使用目前的 TXT（UTF-8、GBK／GB18030）、PDF、EPUB 閱讀功能與模擬翻譯介面。文件在瀏覽器內處理，不上傳至 GitHub；重新整理後不保留文件。

## 建置與下載

每次推送 `main` 或提出 PR 時，GitHub Actions 會執行型別檢查、測試與網頁建置。成功後可在該次執行的 Artifacts 下載 `quiet-reader-web`，保留 14 天。成品包含 PDF worker、CMap 及字體，不需要 Electron。

本機執行 `npm run build:web`，產物在 `out/web/`；使用 `npm run preview:web` 開啟 HTTP 預覽。請勿直接雙擊 HTML。Vite 使用相對資產路徑，支援 GitHub 專案網站的 `/chu-ban/` 子路徑。

## 啟用 Pages

2026-10-23 的儲存庫設定頁顯示：目前方案需升級或把儲存庫改成公開才能啟用 Pages。工作流程已備妥，但在此限制解除前不發布網站。

1. 保留私人程式碼並升級支援私人儲存庫 Pages 的 GitHub 方案，或在擁有者同意後將儲存庫改成公開。公開儲存庫會公開程式碼及提交歷史。
2. 在 Settings → Pages 將發布來源設為 GitHub Actions。一般 Pages 網站可由任何人瀏覽；私人儲存庫不代表網站也私人。
3. 在 Actions 選擇 `Build and deploy web reader`，Run workflow 選擇 `main` 並勾選 `deploy`。
4. 若要每次推送自動發布，在 Settings → Secrets and variables → Actions → Variables 建立 `PAGES_ENABLED`，值為 `true`。

首次部署成功後，以 deploy job 回傳的 URL 為準。預期網址為 `https://t5566t5168-code.github.io/chu-ban/`，啟用前不可當作已上線連結。

發布僅包含 `out/web/`；小說、轉碼副本、測試資料、桌面 EXE、Git 資料與開發依賴不會放入網站。

參考：[GitHub Pages 自訂工作流程](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
