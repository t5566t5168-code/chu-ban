# 多格式閱讀與模擬翻譯

日期：2026-10-22

## 架構

- Chrome 使用 `createBrowserAPI` 取得本機 File，Electron 維持受限 IPC 原生選檔。選檔 API 名稱保留 `openTextFile` 以維持相容性；PDF / EPUB 傳回二進位資料。
- `documents.ts` 共用解析：PDF.js 以隨附 worker 擷取頁面文字；JSZip 解壓 EPUB，以 container → package manifest → spine 順序讀取內容。EPUB HTML 不插入頁面，只輸出文字。
- 文件在解析成功後才替換；取消與錯誤不清除舊文件或捲動位置。空白 TXT 是有效文件，顯示空白提示。
- 翻譯選取限制在閱讀區、最多 2,000 字；更換文件清除面板。輸入或目標語言變更會取消過期的模擬結果。
- 靜態網站由 `npm run build:web` 建置至 `out/web`，無後端與真實翻譯網路請求。

## 限制

PDF / EPUB 為純文字模式，不保留圖片、表格或原排版。密碼 PDF、圖片掃描 OCR、DRM 內容不支援。繁複 PDF 多欄排序仍可能需要後續改善。翻譯僅提供預設示範句譯文，其他文字顯示明確佔位說明。

## 參考

- [PDF.js API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html)
- [EPUB 3.3 格式](https://www.w3.org/TR/epub-33/)
- [JSZip API](https://stuk.github.io/jszip/documentation/api_zipobject/async.html)

## 驗證

單元測試涵蓋 EPUB 順序、缺章與損毀、TXT 編碼、二進位傳遞、取消、翻譯選取／重設／模擬結果。另使用 `scripts/make-reading-fixtures.cjs` 建立不含使用者資料的 TXT、PDF、EPUB，供瀏覽器手動驗證。

本次結果：

- `npm run typecheck` 通過；`npm test` 共 28 項通過。
- `npm run build:web` 與 `npm run make` 通過，包含本機 PDF worker、CMap 與字體資產。
- 內建瀏覽器實際開啟測試 PDF、EPUB，確認閱讀順序、文字選取帶入面板、示範譯文、換檔清除翻譯，以及無文字 PDF 錯誤後保留原文件。沒有瀏覽器錯誤紀錄。
- 已更新原本的私人 Sites 網站。
- 此環境未提供可控制的 Chrome；Chrome 專屬實機驗證尚未完成。Windows ZIP 已產出，但本次未重新執行桌面端到端測試，不沿用舊版報告作為新版驗證結果。
