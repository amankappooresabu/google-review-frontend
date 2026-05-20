"use client";

import { useScraperQueue, emptyJob } from "@/app/hooks/useScraperQueue";

export default function ScrapeForm() {
  const {
    jobs,
    batchStarted,
    addUrl,
    removeUrl,
    updateUrl,
    handleStartAll,
    handleDownload,
  } = useScraperQueue();

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
          <p className="text-[#87897e] italic text-sm mt-1">Export Google reviews to CSV</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-4">

          {jobs.map((job, index) => (
            <div key={index} className="space-y-2">

              {(job.status === "idle" || job.status === "error") && (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={job.url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="flex-1 text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8f25c] focus:border-transparent bg-gray-50 placeholder-gray-400"
                  />
                  {jobs.length > 1 && (
                    <button
                      onClick={() => removeUrl(index)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-lg px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {job.status === "error" && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                  <span>⚠️</span>
                  <span>{job.error}</span>
                </div>
              )}

              {job.status === "scraping" && (
                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#c8f25c] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-800 truncate">{job.url}</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Reviews collected</span>
                    <span className="font-semibold text-[#c8f25c]">{job.progress}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[#c8f25c] h-1.5 rounded-full transition-all duration-700"
                      style={{ width: job.progress > 0 ? "70%" : "15%" }}
                    />
                  </div>
                </div>
              )}

              {job.status === "done" && (
                <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700 truncate">{job.placeName || job.url}</span>
                  </div>
                  <button
                    onClick={() => handleDownload(index)}
                    className="ml-3 flex-shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download CSV
                  </button>
                </div>
              )}

            </div>
          ))}

          {/* Add another URL */}
          {jobs.length < 5 && !batchStarted && (
            <button
              onClick={addUrl}
              className="w-full border border-dashed border-gray-300 hover:border-[#c8f25c] text-gray-400 hover:text-[#a8d24c] rounded-xl py-2.5 text-sm transition-all"
            >
              + Add another location
            </button>
          )}

          {/* Start button */}
          {!batchStarted && (
            <button
              onClick={handleStartAll}
              disabled={!jobs.some(j => j.url.trim())}
              className="w-full bg-[#c8f25c] hover:bg-[#a8d24c] disabled:bg-gray-200 disabled:text-gray-400 text-black font-semibold py-3 rounded-xl transition-all text-sm shadow-sm"
            >
              Start Scraping
            </button>
          )}

          <p className="text-center text-xs text-gray-400">
            Fetches reviews from the last 12 months · Up to 5 locations
          </p>

        </div>
      </div>
    </div>
  );
}