---
layout: post
title: "Cloudflare Bypass with Playwright-MCP and Stealth Browser"
date: 2026-03-14 20:35:00 +0530
categories: security research
---

## Overview

Cloudflare's bot protection is one of the most widely deployed WAF/anti-bot solutions on the internet. It uses a combination of JavaScript fingerprinting, TLS fingerprinting (JA3/JA4), browser behaviour analysis, and CAPTCHA challenges to distinguish humans from automated clients. In this post, we explore how to bypass Cloudflare's protections using **Playwright-MCP** combined with a **stealth browser** setup.

---

## Why Standard Playwright Gets Blocked

Out-of-the-box Playwright is trivially detected by Cloudflare because:

- **navigator.webdriver** is exposed as `true`
- Chrome DevTools Protocol (CDP) artifacts are present
- Missing or inconsistent browser APIs (e.g. `chrome` object, `plugins`)
- TLS fingerprint differs from a real Chrome build
- Headless renderer leaks (e.g. missing GPU info)

---

## The Stealth Setup

The goal is to make Playwright look indistinguishable from a real user's Chrome browser.

### 1. Use a Real Chrome Build

Instead of the bundled Chromium, point Playwright to an actual Chrome (or Chromium with patches) binary:

```python
browser = playwright.chromium.launch(
    executable_path="/usr/bin/google-chrome",
    headless=False,  # or use xvfb for true headless
    args=[
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-dev-shm-usage",
    ]
)
```

### 2. Apply Stealth Patches

Use `playwright-stealth` or manually inject stealth scripts before navigation:

```python
from playwright_stealth import stealth_async

page = await browser.new_page()
await stealth_async(page)
await page.goto("https://target.com")
```

Key patches applied by stealth:
- Removes `navigator.webdriver`
- Spoofs `navigator.plugins` and `navigator.languages`
- Patches `window.chrome` to appear as a real browser
- Fixes `Permissions.query` to return realistic results

### 3. Playwright-MCP Integration

**Playwright-MCP** (Model Context Protocol) allows an AI agent to control a stealth browser session via structured tool calls. This is useful for autonomous web research tasks where Cloudflare-protected pages need to be accessed.

Configure the MCP server with stealth options:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--browser", "chrome", "--executable-path", "/usr/bin/google-chrome"]
    }
  }
}
```

The AI agent can then issue high-level navigation commands that transparently go through the stealth browser.

---

## Handling JS Challenges

Cloudflare's JS challenge (formerly "I'm Under Attack Mode") injects a challenge page that runs heavy JavaScript before redirecting. With a real browser + stealth:

1. Navigate to the target URL.
2. Wait for the challenge to resolve (typically 5–10 seconds).
3. Detect completion by checking for the absence of a `cf-mitigated` header or the presence of target page content.

```python
await page.goto("https://target.com", wait_until="networkidle")
await page.wait_for_timeout(6000)
# Now you're past the JS challenge
```

---

## Handling Turnstile (CAPTCHA)

Cloudflare Turnstile is trickier. Options:
- **Passive mode**: With a sufficiently human-like browser fingerprint, Turnstile may pass automatically without user interaction.
- **2captcha / CapMonster**: External CAPTCHA solving services that return a token.
- **Cookie reuse**: After one successful manual solve, extract and reuse `cf_clearance` cookies for subsequent automated requests.

---

## Responsible Disclosure

This research is intended for educational purposes and authorised penetration testing. Always ensure you have explicit permission before testing against any target. Unauthorised bypassing of security controls may be illegal.

---

## References

- [Playwright Documentation](https://playwright.dev)
- [playwright-stealth](https://github.com/AtuboDad/playwright_stealth)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Cloudflare Bot Management](https://developers.cloudflare.com/bots/)
