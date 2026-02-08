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

## 4. 研究筆記 (2026-02-08)
- **[當前進修計畫]**：
    1. **觀測性研究：第三階段攻堅**：鑽研全鏈路追蹤 (Trace Analysis) 與 OpenTelemetry 實作。
    2. **APISIX Gateway 專題**：研究如何透過 APISIX 作為 ELK/APM 的源頭，實作 Port 443 反向代理架構。
    3. **財務自動化：從理論到實作**：改寫 `scripts/finance_monitor.py`，導入實質的 Pandas 分類邏輯。
    3. **MCP 工具開發特訓**：研究自定義 MCP 伺服器架構，提升數據存取安全性與速度。
    4. **技術雷達掃描**：追蹤華邦電、南亞科週末財報與市場趨勢。
- **[2026-02-08 成果] 階段性進展**：
    - 更新 `memory/FINANCE_LEDGER.csv`，新增測試數據並模擬分類。
    - 複習了 `memory/UIPATH_SECURITY_CHECKLIST.md` 確保符合 Eric 的環境需求。
    - 已初步梳理 OpenTelemetry 的四大信號，準備產出 Phase 3 的首份報告。
