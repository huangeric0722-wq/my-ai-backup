# ISSUE_09: Exception 深度捕獲與分析研究報告

**文件狀態**：草案  
**作者**：應用整合科長  
**日期**：2026-02-07  
**目標**：建立一套自動化的異常捕獲機制，確保在錯誤發生時能記錄完整的上下文（Context），大幅縮短工程師在生產環境定位問題的時間。

---

## 1. 研究目標
傳統的日誌僅記錄 `Exception.Message`，這在複雜的分布式系統或深度嵌套的呼叫鏈中往往不足以還原現場。本研究旨在透過自動化工具與模式，實現：
- **完整性**：記錄所有層級的 Inner Exception。
- **結構化**：將特定類型的錯誤（如 SQL 錯誤）解構為可檢索的欄位。
- **上下文感知**：自動附加觸發錯誤時的 Request Body、User ID 及關鍵局部變數。

---

## 2. Serilog 配置：Stack Trace 與 Inner Exception
Serilog 預設就會記錄 Exception 對象，但在輸出到特定 Sink（如 Elasticsearch 或 Seq）時，需確保配置正確以呈現完整細節。

### 配置範例 (appsettings.json)
```json
{
  "Serilog": {
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "{Timestamp:HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}{Data}{NewLine}"
        }
      }
    ],
    "Enrich": [ "FromLogContext", "WithThreadId", "WithMachineName" ]
  }
}
```
*註：`{Exception}` 標籤會觸發 Serilog 調用 `Exception.ToString()`，這在 .NET 中預設包含完整的 Stack Trace 與所有 Inner Exceptions。*

---

## 3. 使用 Serilog.Exceptions 擴展套件
針對 `SqlException` 或 `DbUpdateException`，標準的 `ToString()` 可能漏掉關鍵資訊（如 SQL 錯誤代碼或違反約束的細節）。

### 安裝
```bash
dotnet add package Serilog.Exceptions
dotnet add package Serilog.Exceptions.SqlServer
dotnet add package Serilog.Exceptions.EntityFrameworkCore
```

### 配置代碼
```csharp
var logger = new LoggerConfiguration()
    .Enrich.WithExceptionDetails(new DestructuringOptionsBuilder()
        .WithDefaultDestructurers()
        .WithDestructurers(new[] { 
            new SqlExceptionDestructurer(), 
            new DbUpdateExceptionDestructurer() 
        }))
    .WriteTo.Elasticsearch(...)
    .CreateLogger();
```
**優點**：它會將 `SqlException.Number`, `SqlException.LineNumber` 等屬性拆解為獨立的 JSON 欄位，方便後續在日誌系統中進行聚合分析。

---

## 4. 全局異常過濾器與 Middleware 整合
建議使用 **Middleware** 來攔截所有未處理的異常，因為它能接觸到最原始的 `HttpContext`。

### Middleware 範例
```csharp
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // 捕獲 Request Body (見下節)
        var requestBody = context.Items["RequestBody"]?.ToString();
        
        _logger.LogError(exception, "Unhandled exception occurred. RequestBody: {RequestBody}", requestBody);
        
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        return context.Response.WriteAsync(new { Error = "Internal Server Error" }.ToString());
    }
}
```

---

## 5. 實作「關鍵變數快照」：Request Body 捕獲
由於 `Request.Body` 是唯讀串流且只能讀取一次，需透過預讀（Pre-read）機制將其暫存。

### 策略：自定義 Middleware 讀取 Body
```csharp
public async Task Invoke(HttpContext context)
{
    context.Request.EnableBuffering(); // 允許重複讀取串流

    using (var reader = new StreamReader(context.Request.Body, leaveOpen: true))
    {
        var body = await reader.ReadToEndAsync();
        context.Items["RequestBody"] = body; // 存入 Items 供後續 Exception Handler 使用
        context.Request.Body.Position = 0; // 重置指針
    }

    await _next(context);
}
```

---

## 6. 給 Eric 的實作建議：PII 個人隱私資訊脫敏
在記錄 `RequestBody` 或 `Exception.Data` 時，必須防止洩露身分證號、信用卡或密碼等資訊。

### 建議措施：
1. **Destructuring 策略**：使用 Serilog 的 `Destructure.ByTransforming` 針對 User 模型進行脫敏。
2. **Regex 過濾器**：在日誌寫入 Sink 之前，透過全局 Filter 對字串進行正則替換（例如：將符合 `\d{4}-\d{4}-\d{4}-\d{4}` 的內容替換為 `****-****-****-****`）。
3. **屬性標記 (Attribute)**：自定義 `[SensitiveData]` 特性，在解構對象時若偵測到該特性，則將其值覆蓋為 `[REDACTED]`。
4. **Eric 執行重點**：優先在 `ExceptionHandlingMiddleware` 中實施 PII 檢查，確保進入日誌系統的所有資料皆已合規。

---

## 7. 結論
透過 Serilog.Exceptions 與自定義 Middleware 的配合，我們能將異常從單純的「錯誤訊息」提升為「診斷快照」。這不僅能減少來回確認 Bug 的時間，更為後續的自動化告警提供了高品質的數據基礎。
