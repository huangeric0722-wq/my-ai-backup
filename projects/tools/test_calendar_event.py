#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
from datetime import datetime, timedelta

def create_event():
    with open("memory/GOOGLE_CALENDAR_TOKEN.json", "r") as f:
        creds = json.load(f)
    
    # 1. Refresh Access Token (standard procedure)
    refresh_data = urllib.parse.urlencode({
        "client_id": creds["client_id"],
        "client_secret": creds["client_secret"],
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token"
    }).encode("utf-8")
    
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=refresh_data)
    with urllib.request.urlopen(req) as f:
        new_tokens = json.load(f)
        access_token = new_tokens["access_token"]

    # 2. Create Event
    # Test Event: 2026-02-11 19:00:00 (Wed) 1 hour
    start_time = "2026-02-11T19:00:00+08:00"
    end_time = "2026-02-11T20:00:00+08:00"
    
    event = {
        "summary": "🤖 Jarvis 測試行程: 兄弟健身時間",
        "description": "這是由 Jarvis 自動排定的測試行程。確認代理人邀請功能是否正常。",
        "start": {"dateTime": start_time, "timeZone": "Asia/Taipei"},
        "end": {"dateTime": end_time, "timeZone": "Asia/Taipei"},
        "attendees": [
            {"email": "hung800722@gmail.com"}
        ],
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 30}
            ]
        }
    }
    
    event_data = json.dumps(event).encode("utf-8")
    req = urllib.request.Request(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
        data=event_data,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as f:
            result = json.load(f)
            print(f"SUCCESS: {result.get('htmlLink')}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    create_event()
