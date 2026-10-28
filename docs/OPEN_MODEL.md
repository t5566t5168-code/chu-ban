# 開源翻譯試用

## Hy-MT2

新增 [Tencent Hy-MT2-1.8B-GGUF](https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF) Q4_K_M，固定 revision `a0c709d`，原作者 Tencent，模型授權 Apache-2.0，未修改權重。下載約 1.13 GB，另含約 9 MB WASM；並非需要專用 STQ 核心的 440 MB 版本。

以 MIT 授權的 `@wllama/wllama` 3.8.1 在背景 Worker 內執行，使用單執行緒 CPU，不需要 GitHub Pages 不提供的跨來源隔離標頭。執行程式隨網站部署；關閉遠端相容性套件載入。CSP 允許庫建立 blob Worker。模型僅在按下翻譯時下載，原文不傳送至服務端。

介面提供繁體中文、英文、日文目標語言，最多 500 字，輸出最多 768 tokens。達到輸出上限會回報未完成，不將截斷結果顯示為完整翻譯。建議記憶體充足的桌面電腦；手機不保證可用，CPU 翻譯可能需數分鐘。下載與模型快取需要額外磁碟空間；停止會終止背景工作，已完成的快取可供下次使用。

PowerShell 執行 `$env:MODEL_ENGINE='hy'; node scripts/open-model-smoke.cjs` 可進行需要網路的大模型實測；可能下載超過 1.13 GB，不納入日常 CI。

2026-10-28 桌面 Chrome 實測通過：首次下載、載入與英文轉日文共約 183 秒（速度依裝置與網路而異）；`The weather is nice today.` 譯為 `今日は天気が良いです。`。重用模型將 `今天的天氣很好，我想去公園散步。` 譯為 `The weather is great today. I want to go for a walk in the park.`。測試亦確認開始前沒有模型請求、外部請求僅為 GET/HEAD、運算中頁面可回應，以及停止後續翻譯。此為短句功能驗證，不代表完整翻譯品質評測。

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
