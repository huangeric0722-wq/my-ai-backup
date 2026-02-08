#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json

def check_event_status():
    with open("memory/GOOGLE_CALENDAR_TOKEN.json", "r") as f:
        creds = json.load(f)
    
    # 1. Refresh Access Token
    refresh_data = urllib.parse.urlencode({
        "client_id": creds["client_id"],
        "client_secret": creds["client_secret"],
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token"
    }).encode("utf-8")
    
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=refresh_data)
    with urllib.request.urlopen(req) as f:
        access_token = json.load(f)["access_token"]

    # 2. List Events to find the latest one (or specific ID)
    # We'll just look for the event we just created.
    req = urllib.request.Request(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=updated",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    with urllib.request.urlopen(req) as f:
        events = json.load(f).get("items", [])
        for event in events:
            if "Jarvis 測試行程" in event.get("summary", ""):
                print(f"Event: {event['summary']}")
                for attendee in event.get("attendees", []):
                    if attendee['email'] == "hung800722@gmail.com":
                        print(f"Status for {attendee['email']}: {attendee.get('responseStatus')}")

if __name__ == "__main__":
    check_event_status()
