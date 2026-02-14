# Cloudflare Security Rules (LINKCONNECT)

Below are recommended Cloudflare-side controls for `t.lingben.top`.

## 1) WAF Custom Rule: Challenge suspicious websocket upgrade
Expression:
```
(http.request.uri.path starts_with "/ws")
and (http.request.headers["upgrade"][0] eq "websocket")
and (not cf.client.bot)
```
Action: `Managed Challenge`

## 2) WAF Custom Rule: Block non-browser UA on websocket
Expression:
```
(http.request.uri.path starts_with "/ws")
and (not lower(http.user_agent) contains "mozilla")
and (not cf.client.bot)
```
Action: `Block`

## 3) Rate Limit Rule: websocket handshake burst
Target: `t.lingben.top/ws*`
Threshold: `30 requests / 1 minute` per IP
Action: `Managed Challenge` (or `Block` if under attack)

## 4) Rate Limit Rule: API check probing
Target: `t.lingben.top/api/check*`
Threshold: `120 requests / 1 minute` per IP
Action: `Throttle`

## 5) Bot Fight Mode
Enable Bot Fight Mode on the zone.

## 6) Turnstile (Optional)
For strict anti-bot, put the chat page behind Turnstile before websocket connect.

## 7) Logging
Enable Security Events + Logpush (if available) to review abusive IPs.

