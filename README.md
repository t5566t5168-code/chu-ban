# 留白 · 閱讀器

## GitHub 版本

直接開啟 [GitHub 網頁版閱讀器](https://t5566t5168-code.github.io/chu-ban/)。程式碼位於公開儲存庫 [chu-ban](https://github.com/t5566t5168-code/chu-ban)。GitHub Actions 在每次推送 main 後自動測試、建置並部署至 Pages。詳見 [GitHub 網頁版建置與發布說明](docs/GITHUB_VERSION.md)。

## 2026-10-22 更新：Chrome、PDF / EPUB 與翻譯 Demo

Chrome 可直接開啟 [線上閱讀器](https://quiet-txt-reader.glassygoat32.chatgpt.site)，網站仍為私人存取。也可以在專案目錄執行 `npm run web`，將終端顯示的本機網址貼到 Chrome。

- 支援 UTF-8、GBK／GB18030 TXT、有文字層的 PDF、無 DRM 的 EPUB；PDF 按頁、EPUB 按書籍閱讀順序擷取純文字，不保留圖片與原版面。複雜 PDF 的欄位與換行順序可能不同於原稿。
- 檔案在瀏覽器內處理、不上傳。上限為單檔 50 MB、PDF 1,000 頁、EPUB 解壓文字 20 MB；不支援掃描 OCR、密碼 PDF、DRM、Big5。
- 選取閱讀文字會開啟翻譯面板；也可按「文字翻譯 · Demo」貼上原文，選擇繁中、英文或日文。
- **翻譯為模擬功能，未串接 API。**「填入示範句」提供預設譯文；任意原文只顯示流程佔位提示，不假裝已完成翻譯。換檔會清除原文與結果。
- 取消或讀取失敗保留目前文件；重新載入不保存文件、進度與翻譯。

瀏覽器發行版：`npm run build:web` 產生 `out/web/`，`npm run preview:web` 啟動本機預覽。請透過 HTTP/HTTPS 開啟，不要直接雙擊建置後的 HTML（PDF worker 需要網頁來源）。Windows 版仍可用 `npm run make` 建置，使用相同閱讀與翻譯介面。

下方為原始桌面 MVP 說明；格式支援以本節為準。

依照 [產品設計](PRODUCT_DESIGN.md) 與 [技術方案](docs/TECHNICAL_PLAN.md) 實作的離線 Windows 桌面閱讀器。

## 使用

將 `out/make/zip/win32/x64/` 裡的 ZIP 完整解壓，執行 `QuietReader.exe`。也可以直接執行 `out/Quiet Reader-win32-x64/QuietReader.exe`；請保留同資料夾的其他檔案，不能只移動 EXE。

點選「開啟 TXT 檔案」或按 `Ctrl+O`，選擇 UTF-8 或 GBK／GB18030 `.txt` 檔案。閱讀時可用滾輪、方向鍵、Page Up / Page Down 捲動，頂端按鈕可更換檔案。成功換檔後回到頂端；取消或失敗會保留原內容及位置。

TXT 支援 UTF-8 BOM、中文、英文、Emoji 與原始換行；空白檔案會顯示提示。檔案不會上傳，不保存檔案副本、閱讀位置或書架，重新開啟程式時回到首頁。

這是未簽章的 Windows x64 試用版本，Windows 可能顯示信任提示；目前沒有安裝器與自動更新。執行成品不需要 Node.js。

## 開發

使用 Node.js 22.13+ 或 24.x（本次建置使用 24.22.0），以及 npm。初次安裝與打包需要網路下載工具；打包成品離線運作。

```powershell
npm ci
npm start
npm run typecheck
npm test
npm run make
npm run test:desktop
```

`npm run package` 只建立可執行資料夾，`npm run make` 同時產出 Windows x64 ZIP。桌面測試應在 `make` 後執行，使用已打包的程式，測試截圖、資料及 JSON 報告寫入已被 Git 忽略的 `test-results/`。

若要重現完整小說測試，先把 UTF-8 小說存為 `test-results/war-and-peace.txt`；桌面測試會自動納入此檔案。未提供小說時仍會測試自動生成的大型中文檔。

## 程式結構

- `src/main/`：視窗、受限 IPC、原生選檔與嚴格 UTF-8 讀取。
- `src/preload/`：只公開 `window.reader.openTextFile()`。
- `src/renderer/`：純文字閱讀、換檔、錯誤提示及樣式。
- `src/shared/`：結果型別與中文錯誤訊息。
- `tests/`：解碼、檔案驗證與介面狀態測試。
- `scripts/desktop-smoke.cjs`：正式產物端到端與效能檢查。
- `demo/`：原始瀏覽器原型，未打包到正式產品。

PDF.js 與 JSZip 隨應用打包；PDF worker、CMap 與標準字體資料使用本機資產。正式介面採系統字體，關閉 Node integration，啟用 context isolation、sandbox，阻擋新視窗、非預期導覽及權限請求。CSP 僅允許同來源資產與 worker；開發時額外允許 Vite 本機 WebSocket。

驗證結果與限制見 [驗收紀錄](docs/VALIDATION.md)。
