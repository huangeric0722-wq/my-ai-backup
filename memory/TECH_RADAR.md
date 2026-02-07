# Personal Tech Radar

*Managed by Jarvis. Updated based on research and user feedback.*

## 🟢 Adopt (成熟/推薦使用)
> 技術成熟，適合直接投入生產環境。

*   **Model Context Protocol (MCP)**: 已成為 Agent 串接外部工具的工業標準。生態系極其豐富 (AWS, Azure, Git, DBs)。建議所有新工具整合皆優先採用 MCP 標準。

## 🔵 Trial (測試/試點)
> 值得在小專案或非核心模組中試用。

*   **AgentRPC**: 解決跨網路/私有雲呼叫的 RPC 層。適合分散式 Agent 架構。
*   **Stagehand (Browserbase)**: 混合 AI/Code 的瀏覽器自動化框架。具備 Self-healing 能力，適合高維護成本的爬蟲專案。
*   **Generative World Models (for Simulation)**: Waymo 已經證明可行，適合用於生成測試資料或邊緣案例模擬。

## 🟡 Assess (評估/觀察)
> 有潛力但還需更多研究，或目前風險較高。

*   **Monty (Pydantic)**: Rust-based Python interpreter for Agents. 解決 Agent 執行程式碼的安全性與冷啟動問題。
*   **LiteBox (Microsoft)**: Library OS for Sandboxing. 適合高安全性/隔離需求的架構。
*   **OpenCiv3**: 開源重製版遊戲引擎 (參考其架構模式)。

## 🔴 Hold (暫緩/不推薦)
> 技術尚未成熟，或與目前架構不相容。

*   (待填)
