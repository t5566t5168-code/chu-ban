# 開源翻譯試用

## 模型與授權

- 原模型：[Helsinki-NLP/opus-mt-zh-en](https://huggingface.co/Helsinki-NLP/opus-mt-zh-en)，Helsinki-NLP／OPUS-MT 團隊，模型卡標示 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。本產品提供來源與授權連結，不表示作者為本產品背書。
- 瀏覽器權重：[Xenova/opus-mt-zh-en](https://huggingface.co/Xenova/opus-mt-zh-en)，Xenova 提供的 ONNX 量化轉換；本程式固定 revision `39d480d`，使用 q8 encoder（約 52.9 MB）及 merged decoder（約 60.2 MB）。本專案未修改模型權重。
- 執行庫：`@huggingface/transformers` 4.3.1；ONNX Runtime 的 WebAssembly 執行檔由 npm 套件複製到網站，不依賴遠端執行腳本。模型權重按需從 Hugging Face 下載，並未提交到 Git 儲存庫。

## 使用與限制

開啟文件後選擇「開源模型 · 中文 → 英文（試用）」，輸入最多 500 字，再按翻譯。第一次約需 113 MB 權重加執行檔下載；會逐檔顯示進度，不把單一檔案進度當成總進度。瀏覽器會嘗試快取，儲存空間不足、私人瀏覽或清除網站資料可能導致再次下載。

翻譯於模組 Web Worker 內使用單執行緒 WASM，無需 GPU、API 金鑰、雲端翻譯服務或跨來源隔離標頭，可部署至 GitHub Pages。下載站會收到一般下載請求，但原文不附於請求。網站 CSP 僅新增 WASM 編譯及 Hugging Face 模型下載來源。

短句先以句末標點分段，長句再以最多 80 個 Unicode 字元切分，以限制模型輸入長度，並依序翻譯。分段可能影響語氣、連貫性與專有名詞；輸出長度亦設有上限，請以短句試用，勿當作完整文件翻譯工具。

停止、改文、換語言或換頁會取消進行中的背景工作；關閉面板與更換文件亦釋放模型。成功完成後保留背景模型供下一次翻譯，避免每次重新初始化。沒有伺服器備援，下載或記憶體失敗會明確顯示錯誤。

其他語言保留 Chrome 內建模式，其裝置支援限制與本開源模式不同。手機可用性取決於瀏覽器及記憶體，不作保證。

## 驗證

`npm run typecheck`、`npm test`、`npm run build:web`。

`node scripts/open-model-smoke.cjs` 在本機啟動預覽並用已安裝的 Chrome 實際下載模型、翻譯中文及停止後續工作。此測試需要網路，可能下載超過 140 MB，不放入日常 CI。測試確認按下翻譯前沒有模型下載，外部請求僅為 GET 下載，並在運算期間持續操作頁面以確認主執行緒可回應；輸出截圖存於忽略的 `test-results/open-model.png`。
