#!/bin/bash
# Read the listing's own main photo from a real browser session for ASINs whose
# image the ASIN image service cannot resolve, validate the bytes, and append a
# proof line in the same shape scripts/fetch-list-page-images.mjs writes.
# Usage: browser-images.sh <asin-list-file> <proof-jsonl>
set -u
LIST="$1"
PROOF="$2"
while read -r ASIN; do
  [ -z "$ASIN" ] && continue
  agent-browser open "https://www.amazon.com/dp/$ASIN" >/dev/null 2>&1
  sleep 1
  URL=$(agent-browser eval "(()=>{var i=document.getElementById('landingImage');if(!i)return '';var h=i.getAttribute('data-old-hires');return h||i.src||'';})()" 2>/dev/null | tr -d '"' | tail -1)
  if [ -z "$URL" ]; then
    echo "{\"asin\":\"$ASIN\",\"url\":null,\"path\":\"none\",\"status\":0,\"contentType\":null,\"bytes\":0,\"tried\":[{\"path\":\"browser\",\"reason\":\"no landingImage on the page\"}]}" >> "$PROOF"
    echo "$ASIN NO-IMAGE"
    continue
  fi
  CODE=$(curl -s -m 25 -o /tmp/check-img.jpg -w "%{http_code}|%{content_type}|%{size_download}" "$URL")
  BYTES=$(echo "$CODE" | cut -d'|' -f3)
  CTYPE=$(echo "$CODE" | cut -d'|' -f2)
  STATUS=$(echo "$CODE" | cut -d'|' -f1)
  if [ "$STATUS" = "200" ] && [ "${CTYPE#image/}" != "$CTYPE" ] && [ "$BYTES" -ge 5000 ]; then
    echo "{\"asin\":\"$ASIN\",\"url\":\"$URL\",\"path\":\"live-page-browser\",\"status\":200,\"contentType\":\"$CTYPE\",\"bytes\":$BYTES,\"tried\":[]}" >> "$PROOF"
    echo "$ASIN OK $BYTES"
  else
    echo "{\"asin\":\"$ASIN\",\"url\":null,\"path\":\"none\",\"status\":$STATUS,\"contentType\":\"$CTYPE\",\"bytes\":$BYTES,\"tried\":[{\"path\":\"browser\",\"reason\":\"image failed validation $STATUS $CTYPE $BYTES\"}]}" >> "$PROOF"
    echo "$ASIN BAD-IMAGE $STATUS $CTYPE $BYTES"
  fi
  sleep 2
done < "$LIST"
