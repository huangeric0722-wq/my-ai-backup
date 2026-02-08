import sys
import json

def get_stock_advice(stock_id, current_price):
    support_levels = {
        "2344": 85.0,
        "2408": 240.0,
        "2431": 15.0
    }
    
    # 檢查是否為週末 (UTC 時間)
    from datetime import datetime
    now = datetime.utcnow()
    if now.weekday() >= 5: # 5: Saturday, 6: Sunday
        return None
    
    support = support_levels[stock_id]
    gap = ((current_price - support) / support) * 100
    
    if gap <= 5: # 恢復原來的 5% 警戒範圍
        return f"🚨 *投資警戒* 🚨\n標的：{stock_id}\n現價：{current_price}\n支撐：{support}\n差距：{round(gap, 2)}%\n建議：已接近底部，請留意佈局時機！"
    return None

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        advice = get_stock_advice(sys.argv[1], float(sys.argv[2]))
        if advice:
            print(advice)
