# ISSUE_07: LogContext 自動注入 (Enrichment) 深度研究報告

**報告人：** 應用整合科長  
**日期：** 2026-02-07  
**狀態：** 已完成

---

## 1. 研究目標
在不改動業務代碼（Business Logic）的前提下，透過 Serilog 的 Enrichment 機制與 ASP.NET Core Middleware，實現日誌上下文資訊的自動注入，提升系統的可觀測性（Observability）與排錯效率。

---

## 2. LogContext 原理詳解

Serilog 的 `LogContext` 是一個強大的工具，允許在執行範圍內動態地為日誌添加屬性。其核心原理如下：

- **AsyncLocal 存儲**：`LogContext` 利用 .NET 的 `AsyncLocal<T>` 來管理屬性堆疊。這意味著屬性在非同步呼叫鏈（Async Call Stack）中是安全傳遞的，適合 Web 應用的並發環境。
- **堆疊機制 (Stack-based)**：透過 `LogContext.PushProperty(name, value)` 將屬性壓入堆疊，並返回一個 `IDisposable` 物件。當該物件被釋放（Dispose）時，該屬性會從當前上下文中移除。
- **Enricher 讀取**：當日誌事件觸發時，`FromLogContext` Enricher 會自動檢查 `LogContext` 中的所有屬性，並將其合併到該筆日誌的 `Properties` 字典中。

---

## 3. Middleware 自動注入 HTTP 請求資訊

為了在不干擾業務邏輯的情況下收集請求資訊，我們定義一個自定義 Middleware：

```csharp
public class LogEnrichmentMiddleware
{
    private readonly RequestDelegate _next;

    public LogEnrichmentMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        
        // 使用 LogContext 注入基礎資訊
        using (LogContext.PushProperty("ClientIP", clientIp))
        using (LogContext.PushProperty("RequestMethod", context.Request.Method))
        using (LogContext.PushProperty("RequestPath", context.Request.Path))
        {
            await _next(context);
        }
    }
}
```

---

## 4. 分散式環境下的 CorrelationID 透傳

在微服務架構中，Trace ID (或 CorrelationID) 是串聯多個服務請求的關鍵。

### A. 接收與注入
在 Middleware 中讀取 Header，若無則生成新 ID：

```csharp
var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() 
                    ?? Guid.NewGuid().ToString();
context.Response.Headers["X-Correlation-ID"] = correlationId;

using (LogContext.PushProperty("CorrelationId", correlationId))
{
    await _next(context);
}
```

### B. 轉發 (Outgoing Requests)
當服務呼叫下游 API 時，需透過 `DelegatingHandler` 自動將 `CorrelationId` 帶入 Header 中，確保全鏈路追蹤不中斷。

---

## 5. 自定義屬性注入：從 JWT 提取 UserID

這通常放在身份驗證（Authentication）Middleware 之後執行：

```csharp
public async Task InvokeAsync(HttpContext context)
{
    string userId = "Anonymous";
    if (context.User?.Identity?.IsAuthenticated == true)
    {
        userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
    }

    using (LogContext.PushProperty("UserId", userId))
    {
        await _next(context);
    }
}
```

---

## 6. 給 Eric 的實作建議（針對大規模請求下的性能考量）

針對大規模（High Throughput）環境，實作時需注意以下幾點：

1.  **優先使用結構化數據**：避免在 Enricher 中進行複雜的字串拼接或物件序列化。`LogContext` 屬性應盡量保持為簡單類型（Scalar values）。
2.  **避免重複計算**：如 `ClientIP` 或 `UserID` 等資訊，應在 Middleware 中提取一次後重用，不要在自定義的 `ILogEventEnricher` 中重複執行耗時邏輯。
3.  **注意 AsyncLocal 開銷**：雖然 `AsyncLocal` 性能良好，但過度頻繁地調用 `PushProperty`（如在循環中）會增加 GC 壓力。在 Middleware 層級調用一次是最佳實踐。
4.  **善用 Serilog.AspNetCore**：建議直接使用 `app.UseSerilogRequestLogging()` 並透過 `EnrichDiagnosticContext` 擴展屬性。這比純 Middleware 方案更輕量，因為它減少了日誌事件的生成次數，將請求資訊整合在單條「Request Completed」日誌中。
    - *範例：*
      ```csharp
      options.EnrichDiagnosticContext = (diagnosticContext, httpContext) => {
          diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress);
      };
      ```
5.  **日誌過濾 (Filtering)**：在大規模環境下，確保不記錄無意義的健康檢查（Health Check）路徑，以節省磁碟與處理效能。

---

## 7. 結論

透過 `LogContext` 與 Middleware 的結合，我們能以最小的侵入性（Non-invasive）實現極高的可觀測性。這套機制不僅能幫助開發者快速定位問題，更為後續的 ELK/Grafana 分析提供了標準化的元數據基礎。
