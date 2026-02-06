#!/bin/bash
# Backup script
cd /home/node/.openclaw/workspace
git add .
git commit -m "Daily backup: $(date +'%Y-%m-%d %H:%M:%S')"
git push origin main || git push origin master
echo "Backup completed."
