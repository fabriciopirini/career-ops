#!/bin/bash

companies=(
  "https://www.shopify.com/careers"
  "https://careers.bigcommerce.com"
  "https://www.optimizely.com/careers"
  "https://www.unleash.io/careers"
  "https://www.factorialhr.com/careers"
  "https://www.personio.de/careers"
  "https://wise.com/careers"
  "https://www.revolut.com/careers"
)

for url in "${companies[@]}"; do
  echo "=== Checking $url ==="
  curl -s "$url" | grep -i "greenhouse\|ashby\|lever\|workable" | head -5
  echo ""
done
