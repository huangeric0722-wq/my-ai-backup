# 學習日誌 (Learning Log)

## 2026-02-07

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
