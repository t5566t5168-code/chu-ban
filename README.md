# 留白 · TXT 閱讀器

依照 [產品設計](PRODUCT_DESIGN.md) 與 [技術方案](docs/TECHNICAL_PLAN.md) 實作的離線 Windows 桌面閱讀器。

## 使用

將 `out/make/zip/win32/x64/` 裡的 ZIP 完整解壓，執行 `QuietReader.exe`。也可以直接執行 `out/Quiet Reader-win32-x64/QuietReader.exe`；請保留同資料夾的其他檔案，不能只移動 EXE。

點選「開啟 TXT 檔案」或按 `Ctrl+O`，選擇 UTF-8 `.txt` 檔案。閱讀時可用滾輪、方向鍵、Page Up / Page Down 捲動，頂端按鈕可更換檔案。成功換檔後回到頂端；取消或失敗會保留原內容及位置。

支援 UTF-8 BOM、中文、英文、Emoji 與原始換行；不支援 Big5、GBK、PDF 或 EPUB。空白檔案會顯示提示。檔案不會上傳，不保存檔案副本、閱讀位置或書架，重新開啟程式時回到首頁。

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

所有應用依賴都在建置期使用。正式介面採系統字體，關閉 Node integration，啟用 context isolation、sandbox，使用限制性 CSP，阻擋新視窗、非預期導覽及權限請求。開發時才放寬樣式與本機 WebSocket 的 CSP，供 Vite 熱更新使用。

驗證結果與限制見 [驗收紀錄](docs/VALIDATION.md)。
