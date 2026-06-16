// Application State
let state = {
    allReleases: [],
    filteredReleases: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchQuery: "",
    selectedCategory: "all",
    selectedTimeRange: "all",
    sortOrder: "newest"
};

// DOM Elements
const elements = {
    releasesList: document.getElementById("releases-list"),
    loader: document.getElementById("loader"),
    errorContainer: document.getElementById("error-container"),
    errorMessage: document.getElementById("error-message"),
    emptyState: document.getElementById("empty-state"),
    
    // Stats
    valTotal: document.getElementById("val-total"),
    valFeatures: document.getElementById("val-features"),
    valChanges: document.getElementById("val-changes"),
    valFixes: document.getElementById("val-fixes"),
    
    // Filters & Search
    searchInput: document.getElementById("search-input"),
    clearSearchBtn: document.getElementById("clear-search-btn"),
    categoryFilters: document.getElementById("category-filters"),
    timeFilter: document.getElementById("time-filter"),
    sortOrderSelect: document.getElementById("sort-order"),
    
    // Active Filters Display
    activeFiltersDisplay: document.getElementById("active-filters-display"),
    activeFiltersList: document.getElementById("active-filters-list"),
    resetAllFilters: document.getElementById("reset-all-filters"),
    clearAllBtn: document.getElementById("clear-all-btn"),
    
    // Feed Summary
    feedCountSummary: document.getElementById("feed-count-summary"),
    exportCsvBtn: document.getElementById("export-csv-btn"),
    
    // Controls
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    refreshBtn: document.getElementById("refresh-btn"),
    retryBtn: document.getElementById("retry-btn"),
    
    // Pagination
    paginationControls: document.getElementById("pagination-controls"),
    prevPageBtn: document.getElementById("prev-page"),
    nextPageBtn: document.getElementById("next-page"),
    pageInfo: document.getElementById("page-info")
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupEventListeners();
    fetchReleases();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "light") {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
    } else {
        document.body.classList.add("dark-theme");
        document.body.classList.remove("light-theme");
    }
}

function toggleTheme() {
    if (document.body.classList.contains("light-theme")) {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark");
    } else {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        localStorage.setItem("theme", "light");
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Theme Toggle
    elements.themeToggleBtn.addEventListener("click", toggleTheme);
    
    // Refresh & Retry
    elements.refreshBtn.addEventListener("click", () => fetchReleases(true));
    elements.retryBtn.addEventListener("click", () => fetchReleases(true));
    
    // Export CSV
    elements.exportCsvBtn.addEventListener("click", exportToCSV);
    
    // Search input
    elements.searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value.trim();
        state.currentPage = 1;
        toggleClearSearchBtn();
        applyFilters();
    });
    
    elements.clearSearchBtn.addEventListener("click", () => {
        elements.searchInput.value = "";
        state.searchQuery = "";
        state.currentPage = 1;
        toggleClearSearchBtn();
        applyFilters();
        elements.searchInput.focus();
    });
    
    // Category selection
    elements.categoryFilters.addEventListener("click", (e) => {
        const targetBtn = e.target.closest("button");
        if (!targetBtn) return;
        
        // Update active class on buttons
        elements.categoryFilters.querySelectorAll("button").forEach(btn => {
            btn.classList.remove("active");
        });
        targetBtn.classList.add("active");
        
        state.selectedCategory = targetBtn.dataset.type;
        state.currentPage = 1;
        applyFilters();
    });
    
    // Time filter dropdown
    elements.timeFilter.addEventListener("change", (e) => {
        state.selectedTimeRange = e.target.value;
        state.currentPage = 1;
        applyFilters();
    });
    
    // Sort filter dropdown
    elements.sortOrderSelect.addEventListener("change", (e) => {
        state.sortOrder = e.target.value;
        state.currentPage = 1;
        applyFilters();
    });
    
    // Reset buttons
    elements.resetAllFilters.addEventListener("click", resetFilters);
    elements.clearAllBtn.addEventListener("click", resetFilters);
    
    // Pagination buttons
    elements.prevPageBtn.addEventListener("click", () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderReleases();
            scrollToFeedHeader();
        }
    });
    
    elements.nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(state.filteredReleases.length / state.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderReleases();
            scrollToFeedHeader();
        }
    });
}

function toggleClearSearchBtn() {
    if (state.searchQuery.length > 0) {
        elements.clearSearchBtn.style.display = "block";
    } else {
        elements.clearSearchBtn.style.display = "none";
    }
}

function scrollToFeedHeader() {
    elements.releasesList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Fetch Release Notes
async function fetchReleases(forceRefresh = false) {
    showLoader();
    elements.refreshBtn.disabled = true;
    elements.refreshBtn.querySelector("i").classList.add("fa-spin");
    
    try {
        const url = forceRefresh ? "/api/releases?refresh=true" : "/api/releases";
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            state.allReleases = data.releases;
            state.filteredReleases = [...data.releases];
            
            // Calculate statistics and apply filters
            calculateStats();
            applyFilters();
            
            // Visual feedback on refresh success
            if (forceRefresh) {
                showToast("Release notes refreshed!");
            }
        } else {
            throw new Error(data.error || "Unknown error occurred on server");
        }
    } catch (err) {
        console.error("Fetch error:", err);
        showError(err.message);
    } finally {
        elements.refreshBtn.disabled = false;
        elements.refreshBtn.querySelector("i").classList.remove("fa-spin");
    }
}

// Helper to show custom toast message
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "glass-panel";
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.borderLeft = "4px solid var(--accent-purple)";
    toast.style.zIndex = "1000";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    toast.style.animation = "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-purple); margin-right: 8px;"></i> ${message}`;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.5s ease";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Calculate Feed Statistics
function calculateStats() {
    const total = state.allReleases.length;
    const features = state.allReleases.filter(item => item.type.toLowerCase() === "feature").length;
    const changes = state.allReleases.filter(item => item.type.toLowerCase() === "change").length;
    const fixes = state.allReleases.filter(item => {
        const type = item.type.toLowerCase();
        return type === "issue" || type === "fixed" || type === "deprecation" || type === "breaking";
    }).length;
    
    // Animate counter values
    animateValue(elements.valTotal, total);
    animateValue(elements.valFeatures, features);
    animateValue(elements.valChanges, changes);
    animateValue(elements.valFixes, fixes);
}

function animateValue(obj, end, duration = 1000) {
    let start = 0;
    if (isNaN(end)) {
        obj.innerHTML = "-";
        return;
    }
    if (end === 0) {
        obj.innerHTML = "0";
        return;
    }
    let range = end - start;
    let current = start;
    let increment = end > start ? 1 : -1;
    let stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, 20); // Minimum step time of 20ms
    
    let timer = setInterval(function() {
        current += Math.ceil(range / (duration / stepTime));
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        obj.innerHTML = current;
    }, stepTime);
}

// Apply Search and Filters to State
function applyFilters() {
    let result = [...state.allReleases];
    
    // 1. Filter by Category
    if (state.selectedCategory !== "all") {
        result = result.filter(item => {
            const type = item.type.toLowerCase();
            if (state.selectedCategory === "feature") return type === "feature";
            if (state.selectedCategory === "change") return type === "change";
            if (state.selectedCategory === "deprecation") return type === "deprecation" || type === "breaking";
            if (state.selectedCategory === "fixed") return type === "fixed" || type === "issue";
            return false;
        });
    }
    
    // 2. Filter by Time Range
    if (state.selectedTimeRange !== "all") {
        const now = new Date();
        const daysLimit = parseInt(state.selectedTimeRange);
        
        result = result.filter(item => {
            if (!item.updated) return false;
            const releaseDate = new Date(item.updated);
            const diffTime = Math.abs(now - releaseDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= daysLimit;
        });
    }
    
    // 3. Filter by Search Query
    if (state.searchQuery.length > 0) {
        const query = state.searchQuery.toLowerCase();
        result = result.filter(item => {
            const matchTitle = item.date.toLowerCase().includes(query);
            const matchType = item.type.toLowerCase().includes(query);
            const matchContent = item.content.toLowerCase().includes(query);
            return matchTitle || matchType || matchContent;
        });
    }
    
    // 4. Apply Sorting
    result.sort((a, b) => {
        const dateA = a.updated ? new Date(a.updated) : new Date(0);
        const dateB = b.updated ? new Date(b.updated) : new Date(0);
        
        if (state.sortOrder === "newest") {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
    
    state.filteredReleases = result;
    renderActiveFiltersBanner();
    renderReleases();
}

// Render Active Filters Banner
function renderActiveFiltersBanner() {
    let filters = [];
    
    if (state.selectedCategory !== "all") {
        filters.push({
            id: "category",
            label: `Category: ${state.selectedCategory.charAt(0).toUpperCase() + state.selectedCategory.slice(1)}`
        });
    }
    
    if (state.selectedTimeRange !== "all") {
        let label = "All Time";
        if (state.selectedTimeRange === "30") label = "Last 30 Days";
        if (state.selectedTimeRange === "90") label = "Last 90 Days";
        if (state.selectedTimeRange === "365") label = "Past Year";
        
        filters.push({
            id: "time",
            label: `Time: ${label}`
        });
    }
    
    if (state.searchQuery) {
        filters.push({
            id: "search",
            label: `Search: "${state.searchQuery}"`
        });
    }
    
    if (filters.length > 0) {
        elements.activeFiltersList.innerHTML = "";
        filters.forEach(filter => {
            const pill = document.createElement("div");
            pill.className = "active-filter-pill";
            pill.innerHTML = `
                <span>${filter.label}</span>
                <button data-filter-id="${filter.id}" aria-label="Remove filter">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            
            // Remove filter click handler
            pill.querySelector("button").addEventListener("click", () => {
                removeIndividualFilter(filter.id);
            });
            
            elements.activeFiltersList.appendChild(pill);
        });
        
        elements.activeFiltersDisplay.classList.remove("hidden");
    } else {
        elements.activeFiltersDisplay.classList.add("hidden");
    }
}

function removeIndividualFilter(filterId) {
    if (filterId === "category") {
        state.selectedCategory = "all";
        // Reset category button active class
        elements.categoryFilters.querySelectorAll("button").forEach(btn => {
            btn.classList.remove("active");
            if (btn.dataset.type === "all") btn.classList.add("active");
        });
    } else if (filterId === "time") {
        state.selectedTimeRange = "all";
        elements.timeFilter.value = "all";
    } else if (filterId === "search") {
        state.searchQuery = "";
        elements.searchInput.value = "";
        toggleClearSearchBtn();
    }
    state.currentPage = 1;
    applyFilters();
}

function resetFilters() {
    state.selectedCategory = "all";
    state.selectedTimeRange = "all";
    state.searchQuery = "";
    state.currentPage = 1;
    
    // Reset UI inputs
    elements.searchInput.value = "";
    toggleClearSearchBtn();
    elements.timeFilter.value = "all";
    
    elements.categoryFilters.querySelectorAll("button").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.type === "all") btn.classList.add("active");
    });
    
    applyFilters();
}

// Render Release Notes to DOM
function renderReleases() {
    const totalItems = state.filteredReleases.length;
    elements.feedCountSummary.innerText = `Showing ${totalItems} release${totalItems !== 1 ? 's' : ''}`;
    
    // Hide states by default
    elements.loader.classList.add("hidden");
    elements.errorContainer.classList.add("hidden");
    elements.emptyState.classList.add("hidden");
    elements.releasesList.innerHTML = "";
    
    if (totalItems === 0) {
        elements.emptyState.classList.remove("hidden");
        elements.paginationControls.classList.add("hidden");
        return;
    }
    
    // Paginate items
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    if (state.currentPage > totalPages) state.currentPage = totalPages || 1;
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = Math.min(startIndex + state.itemsPerPage, totalItems);
    
    const pageItems = state.filteredReleases.slice(startIndex, endIndex);
    
    // Render list
    pageItems.forEach(item => {
        const card = createReleaseCard(item);
        elements.releasesList.appendChild(card);
    });
    
    // Pagination rendering
    elements.paginationControls.classList.remove("hidden");
    elements.pageInfo.innerText = `Page ${state.currentPage} of ${totalPages}`;
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.nextPageBtn.disabled = state.currentPage === totalPages;
}

// Create Card Element
function createReleaseCard(item) {
    const card = document.createElement("article");
    card.className = "release-card glass-panel";
    
    // Determine category specific styles
    const typeLower = item.type.toLowerCase();
    let typeClass = "general";
    let typeBorderColor = "var(--color-general)";
    let typeBadgeBg = "var(--color-general-bg)";
    let typeTextColor = "var(--color-general)";
    
    if (typeLower === "feature") {
        typeClass = "feature";
        typeBorderColor = "var(--color-feature)";
        typeBadgeBg = "var(--color-feature-bg)";
        typeTextColor = "var(--color-feature)";
    } else if (typeLower === "change") {
        typeClass = "change";
        typeBorderColor = "var(--color-change)";
        typeBadgeBg = "var(--color-change-bg)";
        typeTextColor = "var(--color-change)";
    } else if (typeLower === "deprecation" || typeLower === "breaking") {
        typeClass = "deprecation";
        typeBorderColor = "var(--color-deprecation)";
        typeBadgeBg = "var(--color-deprecation-bg)";
        typeTextColor = "var(--color-deprecation)";
    } else if (typeLower === "fixed" || typeLower === "issue") {
        typeClass = "fixed";
        typeBorderColor = "var(--color-fixed)";
        typeBadgeBg = "var(--color-fixed-bg)";
        typeTextColor = "var(--color-fixed)";
    }
    
    card.style.setProperty("--card-border-color", typeBorderColor);
    card.style.setProperty("--tag-bg-color", typeBadgeBg);
    card.style.setProperty("--tag-text-color", typeTextColor);
    
    // Escape regex helpers for keyword highlighting
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Content search highlight
    let contentHtml = item.content;
    let displayTitle = item.date;
    let displayType = item.type;
    
    if (state.searchQuery.length > 0) {
        const query = escapeRegExp(state.searchQuery);
        // Highlight in content (avoiding breaking HTML tags)
        const contentRegex = new RegExp(`(${query})(?![^<>]*>)`, 'gi');
        contentHtml = contentHtml.replace(contentRegex, "<mark class='text-highlight'>$1</mark>");
        
        // Highlight in title & type (plain text, safe to replace)
        const textRegex = new RegExp(`(${query})`, 'gi');
        displayTitle = displayTitle.replace(textRegex, "<mark class='text-highlight'>$1</mark>");
        displayType = displayType.replace(textRegex, "<mark class='text-highlight'>$1</mark>");
    }
    
    card.innerHTML = `
        <div class="release-header">
            <div class="release-meta">
                <span class="release-date"><i class="fa-regular fa-calendar"></i> ${displayTitle}</span>
                <span class="category-tag ${typeClass}">${displayType}</span>
            </div>
            <div class="card-actions">
                <button class="card-action-btn copy-text-btn" title="Copy release details to clipboard" aria-label="Copy text">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <button class="card-action-btn share-btn" title="Copy link to this release" aria-label="Copy link">
                    <i class="fa-regular fa-share-from-square"></i>
                </button>
                <a href="${item.link}" target="_blank" rel="noopener" class="card-action-btn" title="View in official page" aria-label="Official page">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </div>
        </div>
        <div class="release-description">
            ${contentHtml}
        </div>
    `;
    
    // Wire up copy text button
    card.querySelector(".copy-text-btn").addEventListener("click", () => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = item.content;
        const plainText = `${item.date} - [${item.type}]\n\n${tempDiv.innerText || tempDiv.textContent}`;
        navigator.clipboard.writeText(plainText)
            .then(() => {
                showToast("Copied release text to clipboard!");
            })
            .catch(err => {
                console.error("Could not copy text: ", err);
            });
    });
    
    // Wire up share button
    card.querySelector(".share-btn").addEventListener("click", () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}#${item.id}`;
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                showToast("Copied link to clipboard!");
            })
            .catch(err => {
                console.error("Could not copy text: ", err);
            });
    });
    
    return card;
}

// Display States Helper Functions
function showLoader() {
    elements.loader.classList.remove("hidden");
    elements.errorContainer.classList.add("hidden");
    elements.emptyState.classList.add("hidden");
    elements.releasesList.innerHTML = "";
    elements.paginationControls.classList.add("hidden");
}

function showError(msg) {
    elements.loader.classList.add("hidden");
    elements.emptyState.classList.add("hidden");
    elements.releasesList.innerHTML = "";
    elements.paginationControls.classList.add("hidden");
    
    elements.errorMessage.innerText = msg;
    elements.errorContainer.classList.remove("hidden");
}

// Export filtered releases to CSV file
function exportToCSV() {
    if (state.filteredReleases.length === 0) {
        showToast("No releases to export.");
        return;
    }
    
    // Headers
    const headers = ["Date", "Updated Date", "Type", "Content", "Official Link"];
    
    // Rows
    const rows = state.filteredReleases.map(item => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = item.content;
        const cleanContent = (tempDiv.innerText || tempDiv.textContent).replace(/"/g, '""').trim();
        
        return [
            `"${item.date.replace(/"/g, '""')}"`,
            `"${item.updated.replace(/"/g, '""')}"`,
            `"${item.type.replace(/"/g, '""')}"`,
            `"${cleanContent}"`,
            `"${item.link.replace(/"/g, '""')}"`
        ];
    });
    
    // Combine headers and rows with UTF-8 BOM
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    // Download Blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const categorySuffix = state.selectedCategory !== "all" ? `_${state.selectedCategory}` : "";
    const filename = `bigquery_releases${categorySuffix}_${dateStr}.csv`;
    
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("CSV file exported successfully!");
}
