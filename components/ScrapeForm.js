"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const headers = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true"
};

export default function ScrapeForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [placeId, setPlaceId] = useState(null);
  const [error, setError] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [placeName, setPlaceName] = useState("");

  const pollJob = (id) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${id}`, { headers });
        const data = await res.json();

        if (data.progress?.total_seen) {
          setProgress(data.progress.total_seen);
        }

        if (data.status === "completed") {
          clearInterval(interval);
          const placesRes = await fetch(`${API_BASE}/places`, { headers });
          const places = await placesRes.json();
            const match = places.find((p) => p.original_url === url) 
    || places.sort((a, b) => new Date(b.last_scraped) - new Date(a.last_scraped))[0];

          if (match) {
            setPlaceId(match.place_id);
            setPlaceName(match.place_name || "");
          }
          setReviewCount(data.reviews_count || 0);
          setStatus("done");
        }

        if (data.status === "failed") {
          clearInterval(interval);
          setError(data.error_message || "Scraping failed");
          setStatus("error");
        }
      } catch {
        clearInterval(interval);
        setError("Lost connection to server");
        setStatus("error");
      }
    }, 3000);
  };

  const handleScrape = async () => {
    if (!url.trim()) return;
    setStatus("scraping");
    setError(null);
    setProgress(0);
    setPlaceId(null);
    setPlaceName("");

    try {
      const after = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const res = await fetch(`${API_BASE}/scrape`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url,
          sort_by: "newest",
          download_images: false,
          date_filter: { after, mode: "early_stop" },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to start scrape");
        setStatus("error");
        return;
      }

      pollJob(data.job_id);
    } catch {
      setError("Cannot connect to server. Is api_server.py running?");
      setStatus("error");
    }
  };

  const handleDownload = async () => {
    const res = await fetch(`${API_BASE}/download-csv`, { headers });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reviews.csv";
    link.click();
    setStatus("idle");
    setUrl("");
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-[#f1ede4] flex items-center justify-center p-6 w-full">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#c8f25c] rounded-2xl mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black">Reviews Scraper</h1>
          <p className="text-[#87897e] italic text-sm mt-1">Export Google reviews to CSV </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">

          {(status === "idle" || status === "error") && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Google Maps URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8f25c] focus:border-transparent bg-gray-50 placeholder-gray-400"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleScrape}
                disabled={!url.trim()}
                className="w-full bg-[#c8f25c] hover:bg-[#a8d24c] disabled:bg-gray-200 disabled:text-gray-400 text-black font-semibold py-3 rounded-xl transition-all text-sm shadow-sm"
              >
                Start Scraping
              </button>

              <p className="text-center text-xs text-gray-400">
                Fetches reviews from the last 12 months
              </p>
            </>
          )}

          {/* Scraping state */}
          {status === "scraping" && (
            <div className="space-y-5 py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#c8f25c] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Scraping in progress</p>
                  <p className="text-xs text-gray-400">This may take 10–20 minutes</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Reviews collected</span>
                  <span className="font-semibold text-[#c8f25c]">{progress}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#c8f25c] h-2 rounded-full transition-all duration-700"
                    style={{ width: progress > 0 ? "70%" : "15%" }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Scraping</p>
                <p className="text-xs text-gray-600 truncate font-mono">{url}</p>
              </div>
            </div>
          )}

          {status === "done" && (
            <div className="space-y-5 py-2">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  {/* <p className="font-bold text-gray-800 text-lg">{reviewCount} reviews ready</p> */}
                  {placeName && (
                    <p className="text-sm text-gray-500">{placeName}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </button>

              <button
                onClick={() => { setStatus("idle"); setUrl(""); setProgress(0); }}
                className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Scrape another location
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}