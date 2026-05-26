#!/usr/bin/env python3
"""
One-shot script: creates the 3 Praali products with color/size variants,
uploads variant photos from /assets, creates a Homepage Featured collection,
and publishes everything to the Online Store sales channel.

Requires Python 3.8+ and the `requests` library.
Install requests:  pip3 install --user requests

Run from repo root:  python3 scripts/setup_products.py
"""

import os
import sys
import time
import json
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Missing dependency. Run: pip3 install --user requests")

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

# Load .env (simple parser, no dependency)
env = {}
env_path = ROOT / ".env"
if not env_path.exists():
    sys.exit("Missing .env. Copy .env.example to .env and fill it in.")
for raw in env_path.read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    env[k.strip()] = v.strip().strip('"').strip("'")

SHOP = env.get("SHOPIFY_SHOP_DOMAIN")
TOKEN = env.get("SHOPIFY_ACCESS_TOKEN")
API_VERSION = "2024-10"

if not SHOP or not TOKEN or TOKEN.startswith("paste-"):
    sys.exit("SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN must be set in .env")

GQL_URL = f"https://{SHOP}/admin/api/{API_VERSION}/graphql.json"
HEADERS = {
    "X-Shopify-Access-Token": TOKEN,
    "Content-Type": "application/json",
}


def gql(query, variables=None):
    r = requests.post(GQL_URL, headers=HEADERS,
                      json={"query": query, "variables": variables or {}}, timeout=30)
    r.raise_for_status()
    data = r.json()
    if "errors" in data:
        raise RuntimeError("GraphQL error: " + json.dumps(data["errors"], indent=2))
    return data["data"]


PRODUCTS = [
    {"title": "The Allie Top",        "price": "65.00",  "image_prefix": "top"},
    {"title": "The Allie Capri Pants", "price": "55.00",  "image_prefix": "capri"},
    {"title": "The Allie Set",         "price": "120.00", "image_prefix": "set"},
]
DESCRIPTION = "Finally, yoga clothing with embroidery and cute prints!"
COLORS = [
    {"name": "Cayenne",    "slug": "cayenne"},
    {"name": "Lilac",      "slug": "lilac"},
    {"name": "Sage Green", "slug": "sage"},
]
SIZES = ["XS", "S", "M", "L", "XL"]


def create_product(p):
    print(f"\n[+] Creating \"{p['title']}\"")

    variants = []
    for color in COLORS:
        for size in SIZES:
            variants.append({
                "optionValues": [
                    {"optionName": "Color", "name": color["name"]},
                    {"optionName": "Size",  "name": size},
                ],
                "price": p["price"],
                "inventoryItem": {"tracked": False},
            })

    data = gql("""
        mutation productSet($input: ProductSetInput!) {
          productSet(synchronous: true, input: $input) {
            product { id title handle }
            userErrors { field message }
          }
        }
    """, {
        "input": {
            "title": p["title"],
            "descriptionHtml": f"<p>{DESCRIPTION}</p>",
            "status": "ACTIVE",
            "productOptions": [
                {"name": "Color", "values": [{"name": c["name"]} for c in COLORS]},
                {"name": "Size",  "values": [{"name": s} for s in SIZES]},
            ],
            "variants": variants,
        },
    })

    errs = data["productSet"]["userErrors"]
    if errs:
        raise RuntimeError("productSet errors: " + json.dumps(errs, indent=2))
    product = data["productSet"]["product"]
    print(f"    created {product['id']}")
    return product


def upload_image(filename):
    filepath = ASSETS / filename
    file_bytes = filepath.read_bytes()
    mime = "image/jpeg"

    staged = gql("""
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets { url resourceUrl parameters { name value } }
            userErrors { field message }
          }
        }
    """, {
        "input": [{
            "filename": filename,
            "mimeType": mime,
            "httpMethod": "POST",
            "resource": "IMAGE",
            "fileSize": str(len(file_bytes)),
        }],
    })

    errs = staged["stagedUploadsCreate"]["userErrors"]
    if errs:
        raise RuntimeError("stagedUploadsCreate: " + json.dumps(errs))
    target = staged["stagedUploadsCreate"]["stagedTargets"][0]

    form = [(p["name"], (None, p["value"])) for p in target["parameters"]]
    form.append(("file", (filename, file_bytes, mime)))
    resp = requests.post(target["url"], files=form, timeout=60)
    if not resp.ok:
        raise RuntimeError(f"Staged upload failed ({resp.status_code}): {resp.text[:400]}")
    return target["resourceUrl"]


def attach_media(product_id, resource_url, alt):
    data = gql("""
        mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
          productCreateMedia(productId: $productId, media: $media) {
            media { ... on MediaImage { id status } }
            mediaUserErrors { field message }
          }
        }
    """, {
        "productId": product_id,
        "media": [{"alt": alt, "mediaContentType": "IMAGE", "originalSource": resource_url}],
    })
    errs = data["productCreateMedia"]["mediaUserErrors"]
    if errs:
        raise RuntimeError("productCreateMedia: " + json.dumps(errs))
    return data["productCreateMedia"]["media"][0]["id"]


def wait_media_ready(product_id, media_id):
    for _ in range(30):
        data = gql("""
            query($id: ID!) {
              product(id: $id) {
                media(first: 50) { nodes { ... on MediaImage { id status } } }
              }
            }
        """, {"id": product_id})
        for node in data["product"]["media"]["nodes"]:
            if node.get("id") == media_id and node.get("status") == "READY":
                return
        time.sleep(1)
    print(f"    [!] media {media_id} not READY after 30s, continuing")


def link_media_to_color_variants(product_id, media_id, color_name):
    data = gql("""
        query($id: ID!) {
          product(id: $id) {
            variants(first: 100) {
              nodes { id selectedOptions { name value } }
            }
          }
        }
    """, {"id": product_id})

    variant_ids = [
        v["id"] for v in data["product"]["variants"]["nodes"]
        if any(o["name"] == "Color" and o["value"] == color_name for o in v["selectedOptions"])
    ]
    if not variant_ids:
        return

    res = gql("""
        mutation productVariantAppendMedia(
          $productId: ID!,
          $variantMedia: [ProductVariantAppendMediaInput!]!
        ) {
          productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) {
            userErrors { field message }
          }
        }
    """, {
        "productId": product_id,
        "variantMedia": [{"variantId": vid, "mediaIds": [media_id]} for vid in variant_ids],
    })
    errs = res["productVariantAppendMedia"]["userErrors"]
    if errs:
        print(f"    [!] variant linking: {json.dumps(errs)}")


def create_collection(product_ids):
    print("\n[+] Creating Homepage Featured collection")
    data = gql("""
        mutation collectionCreate($input: CollectionInput!) {
          collectionCreate(input: $input) {
            collection { id title handle }
            userErrors { field message }
          }
        }
    """, {
        "input": {
            "title": "Homepage Featured",
            "handle": "homepage-featured",
            "products": product_ids,
        },
    })
    errs = data["collectionCreate"]["userErrors"]
    if errs:
        raise RuntimeError("collectionCreate: " + json.dumps(errs))
    coll = data["collectionCreate"]["collection"]
    print(f"    created {coll['id']}")
    return coll


def publish_to_online_store(product_ids):
    print("\n[+] Publishing to Online Store sales channel")
    pubs = gql("{ publications(first: 25) { nodes { id name } } }")
    online_store = next((p for p in pubs["publications"]["nodes"] if p["name"] == "Online Store"), None)
    if not online_store:
        print("    [!] Online Store sales channel not found, skipping publish")
        return

    for pid in product_ids:
        res = gql("""
            mutation publish($id: ID!, $input: [PublicationInput!]!) {
              publishablePublish(id: $id, input: $input) {
                userErrors { field message }
              }
            }
        """, {"id": pid, "input": [{"publicationId": online_store["id"]}]})
        errs = res["publishablePublish"]["userErrors"]
        if errs:
            print(f"    [!] publish {pid}: {json.dumps(errs)}")
    print(f"    published {len(product_ids)} products")


def main():
    print(f"Setting up products on {SHOP}")
    product_ids = []

    for p in PRODUCTS:
        product = create_product(p)
        product_ids.append(product["id"])

        for color in COLORS:
            filename = f"{p['image_prefix']}-{color['slug']}-front.jpg"
            print(f"    uploading {filename}")
            try:
                resource_url = upload_image(filename)
                media_id = attach_media(product["id"], resource_url, f"{p['title']} - {color['name']}")
                wait_media_ready(product["id"], media_id)
                link_media_to_color_variants(product["id"], media_id, color["name"])
            except Exception as e:
                print(f"    [!] {color['name']} image failed: {e}")

    coll = create_collection(product_ids)
    publish_to_online_store(product_ids)

    print(f"""
Done.

Next steps:
  1. https://{SHOP}/admin/products
     verify the 3 products look right
  2. https://{SHOP}/admin/collections
     find Homepage Featured ({coll['handle']})
  3. Online Store -> Themes -> Customize -> Featured products section
     set "Collection to display" to "Homepage Featured", save
  4. Preview the storefront; the homepage should now show real products
     instead of placeholder cards.
""")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n[!] Script failed: {e}", file=sys.stderr)
        sys.exit(1)
