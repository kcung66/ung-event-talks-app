# BigQuery Release Notes Explorer

A modern, highly interactive, and beautiful dashboard to search, filter, and explore Google Cloud BigQuery release notes. 

This application connects directly to the official Google Cloud BigQuery Release Notes RSS Feed, parses daily update packages into distinct release items (features, changes, fixes, deprecations), caches the results for performance, and presents them in a premium UI with a fully integrated dark/light theme switch, text highlighting, and real-time statistics.

---

## Key Features

- **Granular Splitting**: Translates Google's daily bundled release notes into individual, searchable items.
- **Interactive Stats**: Dynamic counter cards showing statistics for Features, Changes, and Fixes/Deprecations with custom entry animations.
- **Advanced Filtering**:
  - Filter by type (Features, Changes, Deprecations, Fixes).
  - Filter by date ranges (Last 30 Days, 90 Days, Past Year, or All Time).
  - Toggle sorting direction (Newest First vs. Oldest First).
- **Keyword Search & Highlighting**: Instantly search titles, types, and content with highlight rendering that preserves background HTML links.
- **Resilient Caching**: Serves feed data from a 5-minute memory cache to avoid rate limits, fallback capability retrieves stale cache data if Google Cloud servers are unreachable.
- **Deep Linking**: Generate and share links to specific release notes using copy-to-clipboard buttons that use URL hash navigation.
- **Premium Aesthetics**: Built with CSS variables, fluid glassmorphism blur panels, visual backdrop gradients, custom scrollbars, and fully responsive layouts.

---

## File Structure

```
├── app.py                  # Flask application & RSS Parser
├── requirements.txt        # Python dependencies
├── .gitignore              # Files to ignore in git version control
├── README.md               # Project overview & guide
├── templates/
│   └── index.html          # Semantic HTML layout
└── static/
    ├── css/
    │   └── style.css       # Color tokens, styles & animations
    └── js/
        └── main.js         # State management, filter logic & UI interactions
```

---

## Technologies Used

- **Backend**: Python 3.11+, Flask, Requests, Feedparser, BeautifulSoup4
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom properties/variables), Vanilla ES6 JavaScript
- **Icons**: FontAwesome 6 (CDN)
- **Fonts**: Google Fonts (Outfit & Plus Jakarta Sans)

---

## Installation & Getting Started

### Prerequisites
Make sure you have Python (version 3.8 or higher) installed on your system.

### 1. Set Up a Virtual Environment (Optional but Recommended)
Initialize and activate your virtual environment:

```bash
# Create venv
python -m venv .venv

# Activate on Windows (Command Prompt)
.venv\Scripts\activate

# Activate on Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Activate on macOS/Linux
source .venv/bin/activate
```

### 2. Install Dependencies
Install the required packages using pip:

```bash
pip install -r requirements.txt
```

### 3. Run the Application
Launch the Flask development server:

```bash
python app.py
```

By default, the application will bind to local host port 5000:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## How It Works (Data Pipeline)

1. The client requests the dashboard page which loads the frontend assets.
2. The frontend fetches parsed JSON from the server via `/api/releases`.
3. The server retrieves the XML feed from Google, uses `BeautifulSoup` to break down daily feed blocks into individual records, and caches them for 5 minutes.
4. The client receives the payload and calculates statistics, triggers search inputs, filters categories, and displays cards with smooth entrance transitions.
