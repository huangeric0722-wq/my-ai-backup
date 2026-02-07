# ISSUE_02: ELK Stack 優化策略研究報告

## 1. 前言
針對金融業高可靠性、高安全性與海量數據儲存的需求，ELK Stack 的優化至關重要。本報告聚焦於提升 Elasticsearch (ES) 的儲存密度、寫入穩定性與查詢響應速度，並提供具體的實作指引。

## 2. Index Lifecycle Management (ILM) 策略
金融日誌具有明顯的時間屬性，建議採用 Hot-Warm-Cold 架構：

### 2.1 節點角色配置
- **Hot 節點 (熱層)**:
    - **硬體**: 高性能 NVMe SSD, 高 CPU 核心數。
    - **職責**: 負責所有新日誌寫入 (Indexing) 與當日頻繁查詢。
    - **策略**: 建議保留 3-7 天。當索引達到 50GB 或超過 24 小時則觸發 Rollover。
- **Warm 節點 (溫層)**:
    - **硬體**: 大容量 SATA SSD 或 高轉速 HDD。
    - **職責**: 處理唯讀查詢，適合存放已結案或需回溯的近期數據。
    - **策略**: 進入 Warm 期後執行 `Shrink` (減少分片數) 與 `Force Merge` (合併至 1 個 Segment)，極大提升查詢效能。建議保留 7-30 天。
- **Cold 節點 (冷層)**:
    - **硬體**: 高容量、低成本 HDD。
    - **職責**: 滿足合規與法規審核需求，極少查詢。
    - **策略**: 移除 Replica 或使用 `Searchable Snapshots` (需授權) 以節省 50% 以上空間。保留 30-365+ 天。

## 3. Mapping 優化策略
錯誤的 Mapping 會導致索引體積膨脹及搜尋緩慢。

### 3.1 關鍵優化手段
- **Keyword vs Text**: 
    - 絕大多數日誌欄位 (如 `client_ip`, `status_code`, `service_name`) 應強制設為 `keyword`。
    - 僅對需要模糊搜尋的錯誤訊息 (如 `message`, `stack_trace`) 使用 `text`，並指定分詞器。
- **禁用 `_all` 欄位**: 在 ES 6.0 之後已預設禁用，應確保在自定義 Template 中不被誤啟，以減少空間占用。
- **嚴格控制欄位數量**: 
    - 使用 `dynamic: strict` 防止索引爆炸。
    - 金融業應定義標準 Schema (ECS - Elastic Common Schema)，避免欄位雜亂。
- **Doc Values**: 對於不需要排序或聚合的欄位，可設 `doc_values: false`。

## 4. 搜尋語法優化建議
- **Filter Over Query**: 
    - 搜尋時應優先使用 `filter` 子句而非 `must`。`filter` 不計算相關性分數 (Score) 且有內建緩存，速度極快。
- **避免前綴萬用字元**: 
    - 嚴禁搜尋 `*error`，這會導致全索引掃描。若有此需求，應在寫入時使用 `reverse` 處理或改用 `wildcard` 欄位類型。
- **Deep Paging 優化**: 
    - 禁止使用 `from` + `size` 獲取超過 10,000 條後的數據。應使用 `search_after` 或 `Scroll API` (用於背景導出)。

## 5. 給 Eric 的實作建議
1. **建立 Index Template**: 
   - 確保所有 `logs-*` 的索引在創建時自動綁定 ILM Policy 並應用優化後的 Mapping。
2. **Shard 規劃**: 
   - 單個 Shard 大小建議控制在 **30GB - 50GB**。
   - 分片數量過多會壓垮 Master Node，過少則無法充分利用多節點併發性能。
3. **寫入緩衝區調優**: 
   - 若寫入量極大，建議將 `index.refresh_interval` 從預設 1s 調高至 **30s**，這能顯著降低 IO 負載。
4. **使用日誌採集緩衝**: 
   - 在 Logstash 或 Filebeat 之後增加 Kafka 或 Redis 作為緩衝，防止流量暴漲壓垮 ES 集群。

---
**報告人**：基礎建設科長  
**日期**：2026-02-07  
**狀態**：提交審閱中