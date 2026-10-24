# GitHub 網頁版

儲存庫：https://github.com/t5566t5168-code/chu-ban

網頁版使用目前的 TXT（UTF-8、GBK／GB18030）、PDF、EPUB 閱讀功能與 Chrome 裝置內翻譯功能。文件在瀏覽器內處理，不上傳至 GitHub；重新整理後不保留文件。

## 建置與下載

每次推送 `main` 或提出 PR 時，GitHub Actions 會執行型別檢查、測試與網頁建置。成功後可在該次執行的 Artifacts 下載 `quiet-reader-web`，保留 14 天。成品包含 PDF worker、CMap 及字體，不需要 Electron。

本機執行 `npm run build:web`，產物在 `out/web/`；使用 `npm run preview:web` 開啟 HTTP 預覽。請勿直接雙擊 HTML。Vite 使用相對資產路徑，支援 GitHub 專案網站的 `/chu-ban/` 子路徑。

## Pages 發布

儲存庫已經擁有者授權改為公開，Pages 來源設為 GitHub Actions。程式碼及提交歷史可公開瀏覽。

每次推送 `main` 會在檢查與建置成功後自動發布；PR 只檢查與建置，不部署。也可在 Actions 選擇 `Build and deploy web reader` → Run workflow → `main` 手動重新發布，無須設定額外變數。

網站：[留白閱讀器](https://t5566t5168-code.github.io/chu-ban/)。發布結果可在 [Actions](https://github.com/t5566t5168-code/chu-ban/actions) 查看；部署失敗時應先修正該次工作流程錯誤。

發布僅包含 `out/web/`；小說、轉碼副本、測試資料、桌面 EXE、Git 資料與開發依賴不會放入網站。

參考：[GitHub Pages 自訂工作流程](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

翻譯需支援 Translator API 的桌面 Chrome；首次使用需連線下載模型，手機目前不支援。選取段落最多 2,000 字，手動選擇原文語言。文字不會上傳；不支援或下載失敗時會顯示提示並允許重試。官方說明：https://developer.chrome.com/docs/ai/translator-api
