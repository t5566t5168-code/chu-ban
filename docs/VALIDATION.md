# MVP 驗收紀錄

日期：2026-10-19（Asia/Taipei）。

## 測試環境與工具

- Windows 10.0.26200、Intel Core i7-14650HX、24 個邏輯處理器、32 GB RAM。
- Node.js 24.22.0、npm 11.19.1。
- Electron 42.11.15、Electron Forge 8.0.1、Vite 8.3.4、Vitest 5.0.5。精確依賴由 `package-lock.json` 固定。
- `npm run typecheck` 通過；`npm test` 的 18 項測試通過。
- `npm audit`：0 項已知漏洞（本次安裝時的 registry 回應，不代表永久保證）。
- `npm run make` 成功產出 `out/make/zip/win32/x64/Quiet Reader-win32-x64-1.0.0.zip`。
- `npm start` 可啟動開發版。正式版與開發版同時執行時曾出現 Chromium 快取鎖定訊息；開發時應先關閉另一個版本。

## 已通過的行為

單元與 DOM 測試涵蓋中英文、標點、Emoji、LF / CRLF、BOM、空檔、純空白、無效 UTF-8、大小寫副檔名、目錄及消失檔案。重複選檔被阻止，成功才替換內容並回頂端，取消及失敗保留檔名、原文、捲動位置，IPC 例外後按鈕恢復。

`npm run test:desktop` 以 Playwright 啟動打包後的 EXE，僅替換原生選檔的回傳值，其餘使用正式 preload、IPC、檔案讀取與 Chromium 渲染。已驗證：

- UTF-8 BOM 中文檔的原文完整顯示，HTML 標記只以文字呈現。
- 空白檔、無效編碼、缺失檔案、不支援副檔名與取消的實際介面行為。
- 480px 視窗及 150% 縮放下，20,000 字無空格長行不產生水平溢出。
- 渲染程序無 `require`，橋接只有 `openTextFile`，sandbox 與 context isolation 啟用，Node integration 停用。
- 在瀏覽器 context 設為離線時仍可開啟檔案，測試期間未觀察到 HTTP 請求或頁面 JavaScript 錯誤。
- 連續換檔後仍能回到小檔；關閉 EXE 再啟動回到首頁且內容為空。
- 已檢視正式首頁及閱讀頁截圖，確認文字、留白、固定更換入口正常。

另外使用 Windows computer-use 啟動正式 EXE，以 Ctrl+O 確認真實的 Windows「開啟 TXT 檔案」對話框與 UTF-8 文字檔篩選器出現。原生對話框內完整選取與取消流程尚未完成可靠的 UI 自動化驗證；相關結果處理已由上述端到端測試覆蓋。

## 長文實測

完整小說來自 [Project Gutenberg《War and Peace》](https://www.gutenberg.org/ebooks/2600)，使用該頁的 UTF-8 純文字版本，僅保留於本機被忽略的測試目錄，不納入應用。另用程式生成中文長文作壓力測試。

| 資料 | 大小（bytes） | Unicode 字元數 | 開啟至兩次動畫影格完成 | 捲動平均 / 最大影格間隔 |
| --- | ---: | ---: | ---: | ---: |
| 完整 War and Peace | 3,359,610 | 3,293,655 | 359 ms | 6 / 8 ms |
| 合成中文長文 | 11,400,000 | 4,000,000 | 672 ms | 7 / 19 ms |

開啟耗時包含自動化點擊、IPC、讀檔、解碼、DOM 替換及渲染等待，不包含使用者在原生對話框選檔的時間。捲動以 120 個 requestAnimationFrame 週期，每次前進 160px 測量；這是單次本機實測，並非所有機器或任意檔案的效能保證。本次未觀察到需要改用虛擬捲動的停頓，因此維持技術方案的簡單純文字渲染。

原始結果及截圖：`test-results/desktop-report.json`、`welcome.png`、`reading.png`。可依 README 重新執行。

## 交付範圍與限制

Windows x64 可執行資料夾與 ZIP 已完成。ASAR 檢查確認只包含建置後程式及 package.json，不包含原型、測試資料、小說或開發工具。

尚未在另一台「完全未安裝開發工具」的乾淨 Windows 機器驗證；目前驗收是在這台開發機直接啟動封裝 EXE。尚未簽章，未測 macOS / Linux，未提供安裝器。沒有加入產品範圍外的閱讀位置保存、書架、章節、搜尋、主題設定或編碼轉換。
