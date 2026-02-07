# 財務科工具清單 (learning_log.md)

## 1. MCP Servers (Model Context Protocol)
- **Filesystem**: [Reference Implementation](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) - 讀取本地財務數據。
- **PostgreSQL/SQLite**: 存儲歷史對帳紀錄。
- **AlphaVantage MCP**: 獲取即時金融市場數據 (需 API Key)。
- **Fetch**: 用於抓取網頁上的最新匯率或股價資訊。

## 2. Python 財務分析庫
- **Pandas**: 處理 CSV/Excel 對帳的核心工具。
- **yfinance**: 免費獲取美股/台股歷史與即時數據。
- **FinMind**: 專為台灣市場設計的金融數據 API。
- **Pytesseract / EasyOCR**: 圖片帳單 (OCR) 辨識。

## 3. 自動化與通知
- **OpenClaw `message` tool**: 跨平台通知發送。
- **Cron**: 定時執行投資追蹤腳本。

## 4. 研究筆記 (2026-02-07)
- 發現 MCP 生態目前較多基礎設施類 (Git, Filesystem)，財務專用工具尚待整合。
- 專款專用分配可透過設定「帳戶映射表」結合 LLM 處理。
- **[新發現] UiPath CLI 23.4+ 增強分析技能**：研究了 `uipcli` 的 `scan` 指令，可用於在部署前進行靜態代碼分析 (Workflow Analysis)，這對 Eric 公司這種對安全性要求高的環境非常實用，可以自動檢查硬編碼密碼或未處理的異常。
- **[進修目標] 深度對帳與 MCP 工具整合**：研究如何將 `pandas` 的進階分析邏輯封裝進一個專屬的 Python 模組，並嘗試撰寫一個針對 `FINANCE_LEDGER.csv` 的「自動分類器」。
- **[技術雷達] 強化靜態代碼分析 (UIPath)**：更深入研究 `uipcli scan` 的 rules 定義檔，為 Eric 準備一份預設的「金融業安全檢查清單」。
