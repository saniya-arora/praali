#!/usr/bin/env python3
"""
Get an Admin API access token for the Praali setup app.

Tries two paths:
  1. Client credentials grant (no browser, no user input).
  2. Falls back to authorization code grant (browser, paste callback URL).

On success, writes SHOPIFY_ACCESS_TOKEN into .env.

Requires in .env:
  SHOPIFY_SHOP_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET
"""

import sys
import secrets
import urllib.parse
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Missing dependency. Run: pip3 install --user requests")

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"

if not ENV_PATH.exists():
    sys.exit("Missing .env. Create it from .env.example first.")

env = {}
env_lines = ENV_PATH.read_text().splitlines()
for raw in env_lines:
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    env[k.strip()] = v.strip().strip('"').strip("'")

SHOP = env.get("SHOPIFY_SHOP_DOMAIN")
CLIENT_ID = env.get("SHOPIFY_CLIENT_ID")
CLIENT_SECRET = env.get("SHOPIFY_CLIENT_SECRET")

missing = [k for k, v in [
    ("SHOPIFY_SHOP_DOMAIN", SHOP),
    ("SHOPIFY_CLIENT_ID", CLIENT_ID),
    ("SHOPIFY_CLIENT_SECRET", CLIENT_SECRET),
] if not v or v.startswith("paste-")]
if missing:
    sys.exit(f"Missing in .env: {', '.join(missing)}")


def write_token(access_token):
    new_lines = []
    found = False
    for raw in env_lines:
        if raw.strip().startswith("SHOPIFY_ACCESS_TOKEN="):
            new_lines.append(f"SHOPIFY_ACCESS_TOKEN={access_token}")
            found = True
        else:
            new_lines.append(raw)
    if not found:
        new_lines.append(f"SHOPIFY_ACCESS_TOKEN={access_token}")
    ENV_PATH.write_text("\n".join(new_lines) + "\n")
    print(f"\n[+] Updated SHOPIFY_ACCESS_TOKEN in {ENV_PATH}")
    print("\nNow run: python3 scripts/setup_products.py")


def try_client_credentials():
    """Try the client_credentials grant (no browser)."""
    print("[1/2] Trying client_credentials grant (no browser)...")
    url = f"https://{SHOP}/admin/oauth/access_token"
    body = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    resp = requests.post(url, json=body, timeout=30)
    if resp.ok:
        data = resp.json()
        token = data.get("access_token")
        if token:
            print(f"    success — token starts with {token[:10]}...")
            print(f"    granted scopes: {data.get('scope', '?')}")
            return token
    print(f"    didn't work ({resp.status_code}): {resp.text[:300]}")
    return None


def try_authorization_code():
    """Fallback: authorization code grant (requires browser step)."""
    print("\n[2/2] Falling back to authorization code grant (needs browser)...\n")

    scopes = "write_products,read_products,write_files,write_inventory,write_publications"
    redirect = "https://example.com/callback"
    state = secrets.token_urlsafe(16)

    install_url = (
        f"https://{SHOP}/admin/oauth/authorize?"
        + urllib.parse.urlencode({
            "client_id": CLIENT_ID,
            "scope": scopes,
            "redirect_uri": redirect,
            "state": state,
        })
    )

    print("=== Step 1: Open this URL in your browser ===\n")
    print(install_url)
    print("\nAfter you approve, your browser will redirect to:")
    print(f"  {redirect}?code=...&state=...&shop={SHOP}\n")
    print("(example.com won't load — that's expected.)")
    print("Copy the full URL from your browser's address bar.\n")
    print("=== Step 2: Paste the redirect URL here, then press Enter ===\n")

    callback_url = input("Callback URL: ").strip()
    parsed = urllib.parse.urlparse(callback_url)
    params = dict(urllib.parse.parse_qsl(parsed.query))

    code = params.get("code")
    returned_state = params.get("state")
    shop_param = params.get("shop")

    if not code:
        sys.exit("No 'code' parameter found in the URL.")
    if returned_state != state:
        sys.exit("State mismatch — re-run the script.")
    if shop_param and shop_param != SHOP:
        sys.exit(f"Shop mismatch (got {shop_param}, expected {SHOP}).")

    print("\nExchanging code for access token...")
    resp = requests.post(
        f"https://{SHOP}/admin/oauth/access_token",
        json={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
        },
        timeout=30,
    )
    if not resp.ok:
        print(f"\nError {resp.status_code}: {resp.text}")
        sys.exit(1)

    data = resp.json()
    token = data.get("access_token")
    if not token:
        sys.exit("No access_token in response: " + str(data))
    print(f"    granted scopes: {data.get('scope', '?')}")
    return token


token = try_client_credentials() or try_authorization_code()
write_token(token)
