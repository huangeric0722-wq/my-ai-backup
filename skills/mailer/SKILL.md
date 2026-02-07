# Mailer Skill

Allows Jarvis to send HTML reports and notifications via Email.

## Requirements
- `nodemailer` package (installed)
- SMTP Configuration (Set via Env Vars or manually in `send_email.js`)

## Usage

### Run from CLI
```bash
node skills/mailer/send_email.js "eric@example.com" "Daily Report" "<h1>Hello</h1><p>Here is your update.</p>"
```

### Configuration
Set the following environment variables in Zeabur:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Or edit `skills/mailer/send_email.js` directly.
