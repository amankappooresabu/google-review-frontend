import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const headers = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true"
};

export const emptyJob = () => ({
  url: "", status: "idle", jobId: null, progress: 0, placeName: "", error: null
});

export function useScraperQueue() {
  const [jobs, setJobs] = useState([emptyJob()]);
  const [batchStarted, setBatchStarted] = useState(false);

  const addUrl = () => {
    if (jobs.length < 5) setJobs(prev => [...prev, emptyJob()]);
  };

  const removeUrl = (index) => {
    setJobs(prev => prev.filter((_, i) => i !== index));
  };

  const updateUrl = (index, url) => {
    setJobs(prev => prev.map((j, i) => i === index ? { ...j, url } : j));
  };

  const pollUntilDone = (jobId, index, resolve) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, { headers });
        const data = await res.json();

        if (data.progress?.total_seen) {
          setJobs(prev => prev.map((j, i) =>
            i === index ? { ...j, progress: data.progress.total_seen } : j
          ));
        }

        if (data.status === "completed") {
          clearInterval(interval);
          try {
            const placeRes = await fetch(`${API_BASE}/places?job_id=${jobId}`, { headers });
            const places = await placeRes.json();
            const placeName = places?.[0]?.place_name || "";
            setJobs(prev => prev.map((j, i) =>
              i === index ? { ...j, status: "done", placeName } : j
            ));
          } catch {
            setJobs(prev => prev.map((j, i) =>
              i === index ? { ...j, status: "done" } : j
            ));
          }
          resolve();
        }

        if (data.status === "failed") {
          clearInterval(interval);
          setJobs(prev => prev.map((j, i) =>
            i === index ? { ...j, status: "error", error: data.error_message || "Scraping failed" } : j
          ));
          resolve();
        }

      } catch {
        clearInterval(interval);
        setJobs(prev => prev.map((j, i) =>
          i === index ? { ...j, status: "error", error: "Lost connection to server" } : j
        ));
        resolve();
      }
    }, 3000);
  };

 const scrapeAndPoll = (index, jobsList) => {
  return new Promise(async (resolve) => {
    const job = jobsList[index];

    setJobs(prev => prev.map((j, i) =>
      i === index ? { ...j, status: "scraping", error: null, progress: 0, placeName: "" } : j
    ));

    try {
      const after = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0];

      const res = await fetch(`${API_BASE}/scrape`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: job.url,
          sort_by: "newest",
          download_images: false,
          date_filter: { after, mode: "early_stop" },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setJobs(prev => prev.map((j, i) =>
          i === index ? { ...j, status: "error", error: data.detail || "Failed to start scrape" } : j
        ));
        resolve();
        return;
      }

      const jobId = data.job_id;
      setJobs(prev => prev.map((j, i) => i === index ? { ...j, jobId } : j));
      pollUntilDone(jobId, index, resolve);

    } catch {
      setJobs(prev => prev.map((j, i) =>
        i === index ? { ...j, status: "error", error: "Cannot connect to server" } : j
      ));
      resolve();
    }
  }).then(() =>
    new Promise(r => setTimeout(r, 2000))
  );
};

  const runQueue = async (jobsList) => {
    for (let i = 0; i < jobsList.length; i++) {
      if (!jobsList[i].url.trim()) continue;
      await scrapeAndPoll(i, jobsList);
    }
    setBatchStarted(false);
  };

  const handleStartAll = () => {
    const hasValid = jobs.some(j => j.url.trim());
    if (!hasValid) return;
    setBatchStarted(true);
    runQueue(jobs);
  };

  const handleDownload = async (index) => {
    const job = jobs[index];
    if (!job.jobId) return;
    const res = await fetch(`${API_BASE}/download-csv/${job.jobId}`, { headers });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reviews_${job.placeName || job.jobId}.csv`;
    link.click();
    setJobs(prev => prev.map((j, i) => i === index ? emptyJob() : j));
  };

  return {
    jobs,
    batchStarted,
    addUrl,
    removeUrl,
    updateUrl,
    handleStartAll,
    handleDownload,
  };
}