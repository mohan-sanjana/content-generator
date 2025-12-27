'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SyncStatus {
  lastSync: {
    startedAt: string;
    completedAt: string | null;
    status: string;
    highlightsCount: number;
    errorMessage: string | null;
  } | null;
  totalHighlights: number;
}

export default function Home() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/sync/status');
      const data = await res.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/workflow/sync', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        await fetchSyncStatus();
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const fetchHighlights = async () => {
    setLoadingHighlights(true);
    try {
      const res = await fetch('/api/highlights/list?limit=100');
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        setHighlights(data.highlights || []);
        setShowHighlights(true);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingHighlights(false);
    }
  };

  const handleClearHighlights = async () => {
    if (!confirm('Are you sure you want to clear all highlights? This cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      const res = await fetch('/api/highlights/clear', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert(`Successfully cleared ${data.deletedCount} highlights`);
        await fetchSyncStatus();
        if (showHighlights) {
          await fetchHighlights();
        }
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Content Ideas Engine</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sync Highlights</h2>
          <div className="flex gap-4">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Highlights'}
            </button>
            <button
              onClick={fetchHighlights}
              disabled={loadingHighlights}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loadingHighlights ? 'Loading...' : 'View Highlights'}
            </button>
            <button
              onClick={handleClearHighlights}
              disabled={clearing}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : 'Clear All Highlights'}
            </button>
          </div>

          {syncStatus && (
            <div className="mt-4 space-y-2">
              <p>
                <strong>Total Highlights:</strong> {syncStatus.totalHighlights}
              </p>
              {syncStatus.lastSync && (
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Last Sync:</strong>{' '}
                    {new Date(syncStatus.lastSync.startedAt).toLocaleString()}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      className={
                        syncStatus.lastSync.status === 'success'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {syncStatus.lastSync.status}
                    </span>
                  </p>
                  {syncStatus.lastSync.completedAt && (
                    <p>
                      <strong>Completed:</strong>{' '}
                      {new Date(syncStatus.lastSync.completedAt).toLocaleString()}
                    </p>
                  )}
                  {syncStatus.lastSync.errorMessage && (
                    <p className="text-red-600">
                      <strong>Error:</strong> {syncStatus.lastSync.errorMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/ideas"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">View Ideas</h2>
            <p className="text-gray-600">See generated blog ideas and curator scores</p>
          </Link>

          <Link
            href="/drafts"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">View Drafts</h2>
            <p className="text-gray-600">Browse completed blog drafts</p>
          </Link>
        </div>

        {showHighlights && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Highlights ({highlights.length})</h2>
              <button
                onClick={() => setShowHighlights(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕ Close
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-4">
              {highlights.length === 0 ? (
                <p className="text-gray-600">No highlights found.</p>
              ) : (
                highlights.map((highlight) => (
                  <div key={highlight.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">
                        <a
                          href={highlight.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {highlight.title}
                        </a>
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(highlight.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {highlight.author && (
                      <p className="text-sm text-gray-600 mb-2">By {highlight.author}</p>
                    )}
                    <p className="text-gray-800 mb-2">{highlight.highlightText}</p>
                    {highlight.note && (
                      <p className="text-sm text-gray-600 italic mb-2">Note: {highlight.note}</p>
                    )}
                    {highlight.tags && highlight.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {highlight.tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">{highlight.sourceDomain}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

