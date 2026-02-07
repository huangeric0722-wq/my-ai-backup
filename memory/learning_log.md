# 學習日誌 (Learning Log)

## 2026-02-07

### [10:35 台灣時間] 研究：高效能瀏覽器自動化 (Stagehand)
*   **來源:** GitHub (Browserbase/Stagehand)
*   **主題:** AI 瀏覽器自動化、反偵測、自動修復 (Self-healing)
*   **重點發現:**
    *   **Stagehand (v3):** Browserbase 推出的 AI 瀏覽器自動化框架。
    *   **混合模式:** 允許開發者自由切換「自然語言控制」(AI) 和「傳統程式碼」(Code)。
        *   *場景:* 在不熟悉的頁面用 AI 探索，在固定的流程用 Code 執行 (省 Token)。
    *   **自動修復 (Self-healing):** 這是最大的亮點。當網站 UI 改版導致原本的 Selector 失效時，Stagehand 會自動啟用 LLM 去尋找新的對應元素，讓自動化流程不會輕易崩潰。
    *   **效能優化:** 內建自動快取 (Auto-caching)，對於重複的動作可以直接重播，不需要每次都 Call LLM，大幅降低成本與延遲 (v3 宣稱快 20-40%)。
*   **對 Eric 的關聯性:**
    *   如果你有需要爬取動態網站或需要登入的資料，Stagehand 是目前比 Selenium/Puppeteer 更現代化的選擇。
    *   我們可以考慮把 OpenClaw 的 `browser` 工具底層邏輯參考 Stagehand 的模式進行優化，特別是「自動修復」的概念。

### [10:30 台灣時間] 研究：Model Context Protocol (MCP) 生態系趨勢
*   **來源:** GitHub (modelcontextprotocol/servers) & AgentRPC
*   **主題:** MCP (Model Context Protocol) 伺服器生態、跨語言 RPC、企業級整合
*   **重點發現:**
    *   **MCP 快速普及:** 官方維護的 Reference Server 涵蓋了 Filesystem, Git, Memory 等基礎設施。
    *   **生態系爆炸:** 第三方支援已經非常廣泛，包括：
        *   **雲端整合:** AWS, Azure, Google Drive, Cloudflare。
        *   **資料庫:** PostgreSQL, SQLite, ClickHouse, Apache Doris/IoTDB。
        *   **開發工具:** GitHub, GitLab, Sentry, Postman, BrowserStack。
        *   **生產力:** Slack, Google Maps, Notion (via official/community servers)。
    *   **架構模式創新:**
        *   **AgentRPC:** 解決了「跨網路邊界」(Cross-Network Boundaries) 的痛點。允許 Agent 呼叫部署在私有 VPC 或 K8s 內部的 Function，透過一個通用的 RPC 層中轉。這對於企業級部署非常關鍵。
        *   **Observation:** AgentOps, Arize Phoenix 等觀測工具也開始支援 MCP，讓 Agent 的行為可被追蹤。
*   **對 Eric 的關聯性:**
    *   MCP 已成為標準。若要擴充 OpenClaw 能力，優先尋找或撰寫 MCP Server 是最標準化的路徑。
    *   **AgentRPC** 值得評估，如果我們未來要把一些 Heavy Computation 放到其他機器上跑，AgentRPC 提供了一個乾淨的介面。

### [09:28 台灣時間] 研究：Agentic AI 與安全執行環境
*   **來源:** Hacker News & GitHub
*   **主題:** AI 安全執行、Agent 工具鏈、Library OS
*   **重點發現:**
    *   **Monty (Pydantic):** 一個專為 AI Agent 設計的 Rust 極簡 Python 直譯器。
        *   *為什麼重要:* 解決了「讓 Agent 寫 code」的兩難（Docker 太重 vs 直接跑太危險）。啟動速度極快（微秒級）。
        *   *應用場景:* 安全地執行 Agent 生成的邏輯。
    *   **LiteBox (Microsoft):** 微軟開源的安全性 Library OS。
        *   *為什麼重要:* 透過縮減與 Host 的接觸面，大幅降低被攻擊的風險。
        *   *應用場景:* 需要極高隔離性的沙箱環境。
    *   **Agent Slack (Stably AI):** 專為 Agent 優化的 Slack CLI 工具。
        *   *為什麼重要:* 輸出格式省 Token (精簡 JSON)，並且幫 Agent 處理好了認證、Thread 和檔案下載。

### [08:45 台灣時間] 架構趨勢：生成式世界模型 (Waymo)
*   **來源:** [Waymo Blog: The Waymo World Model](https://waymo.com/blog/2026/02/the-waymo-world-model-a-new-frontier-for-autonomous-driving-simulation)
*   **主題:** 自動駕駛、生成式 AI、模擬架構
*   **重點發現:**
    *   **Gen-AI 用於模擬:** Waymo 使用 DeepMind 的 "Genie 3" 模型，從影片或文字生成 3D/Lidar 世界。
    *   **極端案例訓練:** 解決了罕見事件（如龍捲風、動物衝出）數據不足的問題，透過 *幻覺生成 (Hallucination)* 逼真的場景來訓練車輛。
    *   **架構模式:** "Video-to-Simulation" 管道。利用基礎模型合成原本不存在的感測器數據 (Lidar)。
*   **對 Eric 的關聯性:**
    *   適合作為 "AI System Design" 的設計模式參考。
    *   展示了模擬技術從傳統「遊戲引擎」(Unity/Unreal) 轉向「生成式模型」的趨勢。
