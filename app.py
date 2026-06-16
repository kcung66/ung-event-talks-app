import os
import time
from datetime import datetime
import logging
from flask import Flask, render_template, jsonify, request
import requests
import feedparser
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_EXPIRY_SECONDS = 300  # 5 minutes cache

# Memory cache structure
cache = {
    "items": [],
    "last_updated": 0
}

def parse_release_feed(feed_content):
    """
    Parses the feed XML content, splits entries by h3/h4 tags to extract 
    individual release items, and structures them.
    """
    feed = feedparser.parse(feed_content)
    parsed_items = []
    
    for entry in feed.entries:
        date_str = entry.get("title", "")  # e.g., "June 15, 2026"
        updated_raw = entry.get("updated", "")  # e.g., "2026-06-15T00:00:00-07:00"
        entry_id = entry.get("id", "")
        link = entry.get("link", "")
        
        # Get HTML content
        html_content = entry.get("summary", "")
        if not html_content and entry.get("content"):
            html_content = entry.get("content")[0].get("value", "")
            
        if not html_content:
            continue
            
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # We check if there are any h3/h4 headers to split by
        headers = soup.find_all(['h3', 'h4'])
        
        if not headers:
            # If no headings, treat the entire entry content as a single general/announcement item
            parsed_items.append({
                "id": f"{entry_id}#general",
                "date": date_str,
                "updated": updated_raw,
                "type": "Announcement",
                "content": html_content.strip(),
                "link": link
            })
            continue
            
        # If headers exist, split content into segments for each header
        current_type = "General"
        current_content_parts = []
        item_counter = 0
        
        for child in soup.contents:
            if child.name in ['h3', 'h4']:
                # Save previous section if it has content
                if current_content_parts:
                    content_html = "".join(str(x) for x in current_content_parts).strip()
                    if content_html:
                        parsed_items.append({
                            "id": f"{entry_id}#{current_type.lower()}-{item_counter}",
                            "date": date_str,
                            "updated": updated_raw,
                            "type": current_type,
                            "content": content_html,
                            "link": link
                        })
                        item_counter += 1
                    current_content_parts = []
                current_type = child.get_text().strip()
            else:
                current_content_parts.append(child)
                
        # Append the last accumulated section
        if current_content_parts:
            content_html = "".join(str(x) for x in current_content_parts).strip()
            if content_html:
                parsed_items.append({
                    "id": f"{entry_id}#{current_type.lower()}-{item_counter}",
                    "date": date_str,
                    "updated": updated_raw,
                    "type": current_type,
                    "content": content_html,
                    "link": link
                })
                
    return parsed_items

def fetch_and_cache_releases(force_refresh=False):
    """
    Fetches release notes feed, parses it, and caches the result.
    If fetch fails, falls back to the cache (if available).
    """
    now = time.time()
    
    # Check if cache is still valid
    if not force_refresh and cache["items"] and (now - cache["last_updated"] < CACHE_EXPIRY_SECONDS):
        logger.info("Serving release notes from memory cache.")
        return cache["items"], False

    logger.info("Fetching fresh release notes from Google Cloud feed...")
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        parsed_items = parse_release_feed(response.content)
        
        # Update cache
        cache["items"] = parsed_items
        cache["last_updated"] = now
        logger.info(f"Successfully fetched and parsed {len(parsed_items)} release items.")
        return parsed_items, True
        
    except Exception as e:
        logger.error(f"Error fetching release notes: {e}")
        # Fallback to expired cache if available
        if cache["items"]:
            logger.warning("Failed to fetch fresh feed. Serving expired cache as fallback.")
            return cache["items"], False
        # Re-raise if no cache exists
        raise e

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases_api():
    """
    API endpoint that returns the release notes.
    Supports force refreshing using the ?refresh=true query parameter.
    """
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        releases, is_fresh = fetch_and_cache_releases(force_refresh=force_refresh)
        return jsonify({
            "success": True,
            "count": len(releases),
            "is_fresh": is_fresh,
            "last_updated": datetime.fromtimestamp(cache["last_updated"]).isoformat(),
            "releases": releases
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Allow running on local port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
