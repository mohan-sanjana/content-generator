'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Draft {
  id: string;
  fullDraft: string;
  wordCount: number;
  detailedOutline: string;
  alternativeHooks: string;
  socialPostBullets: string;
  createdAt: string;
  idea: {
    id: string;
    title: string;
    oneSentenceHook: string;
  };
  draftHighlights: Array<{
    highlight: {
      id: string;
      title: string;
      url: string;
      highlightText: string;
    };
  }>;
}

interface JudgeScores {
  accuracy: number;
  readability: number;
  brandRelevance: number;
  styleConsistency: number;
  overallScore: number;
  feedback: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [judgingDraftId, setJudgingDraftId] = useState<string | null>(null);
  const [judgeScores, setJudgeScores] = useState<Map<string, JudgeScores>>(new Map());
  const [showJudgeModal, setShowJudgeModal] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/drafts/list');
      const data = await res.json();
      setDrafts(data.drafts || []);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJudgeDraft = async (draftId: string) => {
    setJudgingDraftId(draftId);
    setShowJudgeModal(null);

    try {
      const res = await fetch('/api/drafts/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        const newScores = new Map(judgeScores);
        newScores.set(draftId, {
          accuracy: data.scores.accuracy,
          readability: data.scores.readability,
          brandRelevance: data.scores.brandRelevance,
          styleConsistency: data.scores.styleConsistency,
          overallScore: data.scores.overallScore,
          feedback: data.feedback,
        });
        setJudgeScores(newScores);
        setCustomPrompt('');
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setJudgingDraftId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button at top left */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm">Back</span>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Blog Drafts</h1>
        </div>

        {drafts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No drafts created yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Generate ideas and shortlist them to create drafts.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {drafts.map((draft) => {
              const outline = JSON.parse(draft.detailedOutline) as {
                introduction: string;
                sections: Array<{ heading: string; bullets: string[] }>;
                conclusion: string;
              };
              const hooks = JSON.parse(draft.alternativeHooks) as string[];
              const bullets = JSON.parse(draft.socialPostBullets) as string[];
              const isExpanded = expandedId === draft.id;

              return (
                <div key={draft.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold mb-2">{draft.idea.title}</h2>
                      <p className="text-gray-700 mb-2">{draft.idea.oneSentenceHook}</p>
                      <div className="text-sm text-gray-600">
                        <p>
                          <strong>Word Count:</strong> {draft.wordCount}
                        </p>
                        <p>
                          <strong>Created:</strong>{' '}
                          {new Date(draft.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : draft.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </button>
                      <button
                        onClick={() => setShowJudgeModal(draft.id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                      >
                        Judge Draft
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-6 mt-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Detailed Outline</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="mb-3 text-gray-800">
                            <strong className="text-gray-900">Introduction:</strong> <span className="text-gray-700">{outline.introduction}</span>
                          </p>
                          {outline.sections.map((section, idx) => (
                            <div key={idx} className="mb-3">
                              <strong className="text-gray-900">{section.heading}:</strong>
                              <ul className="list-disc list-inside ml-4 mt-1 text-gray-700">
                                {section.bullets.map((bullet, bIdx) => (
                                  <li key={bIdx}>{bullet}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          <p className="mt-3 text-gray-800">
                            <strong className="text-gray-900">Conclusion:</strong> <span className="text-gray-700">{outline.conclusion}</span>
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">Full Draft</h3>
                          {editingDraftId === draft.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  // Save edited content
                                  const content = editedContent.get(draft.id) || draft.fullDraft;
                                  try {
                                    const res = await fetch(`/api/drafts/${draft.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ fullDraft: content }),
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      // Update local state
                                      const updatedDrafts = drafts.map(d =>
                                        d.id === draft.id ? { ...d, fullDraft: content, wordCount: content.split(/\s+/).length } : d
                                      );
                                      setDrafts(updatedDrafts);
                                      setEditingDraftId(null);
                                      const newMap = new Map(editedContent);
                                      newMap.delete(draft.id);
                                      setEditedContent(newMap);
                                    } else {
                                      const errorData = await res.json();
                                      alert(`Failed to save draft: ${errorData.error || 'Unknown error'}`);
                                    }
                                  } catch (error) {
                                    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                  }
                                }}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingDraftId(null);
                                  setEditedContent(new Map());
                                }}
                                className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingDraftId(draft.id);
                                setEditedContent(new Map(editedContent.set(draft.id, draft.fullDraft)));
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                          {editingDraftId === draft.id ? (
                            <textarea
                              value={editedContent.get(draft.id) || draft.fullDraft}
                              onChange={(e) => {
                                const newMap = new Map(editedContent);
                                newMap.set(draft.id, e.target.value);
                                setEditedContent(newMap);
                              }}
                              className="w-full h-96 p-4 border border-gray-300 rounded text-gray-800 leading-relaxed font-sans text-sm"
                              style={{ fontFamily: 'inherit', lineHeight: '1.6' }}
                            />
                          ) : (
                            <article className="prose prose-lg max-w-none text-gray-900">
                              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                {draft.fullDraft}
                              </div>
                            </article>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2">Alternative Hooks (5)</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <ul className="list-disc list-inside space-y-2">
                            {hooks.map((hook, idx) => (
                              <li key={idx} className="text-gray-800">
                                {hook}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2">Social Post Bullets (10)</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <ul className="list-disc list-inside space-y-2">
                            {bullets.map((bullet, idx) => (
                              <li key={idx} className="text-gray-800">
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Supporting Highlights ({draft.draftHighlights.length})
                        </h3>
                        <div className="space-y-2">
                          {draft.draftHighlights.map((dh) => (
                            <div key={dh.highlight.id} className="bg-gray-50 p-3 rounded">
                              <a
                                href={dh.highlight.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-semibold"
                              >
                                {dh.highlight.title}
                              </a>
                              <p className="text-sm text-gray-600 mt-1">
                                {dh.highlight.highlightText}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Judge Scores */}
                      {judgeScores.has(draft.id) && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-3">Judge Evaluation</h3>
                          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                            <div className="grid grid-cols-4 gap-3 mb-4">
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-1">Accuracy</div>
                                <div className="text-xl font-bold text-blue-600">
                                  {(judgeScores.get(draft.id)!.accuracy * 100).toFixed(0)}%
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-1">Readability</div>
                                <div className="text-xl font-bold text-green-600">
                                  {(judgeScores.get(draft.id)!.readability * 100).toFixed(0)}%
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-1">Brand Relevance</div>
                                <div className="text-xl font-bold text-purple-600">
                                  {(judgeScores.get(draft.id)!.brandRelevance * 100).toFixed(0)}%
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-1">Style Consistency</div>
                                <div className="text-xl font-bold text-orange-600">
                                  {(judgeScores.get(draft.id)!.styleConsistency * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <div className="text-sm mb-2">
                                <strong>Overall Score:</strong>{' '}
                                <span className="font-bold text-lg text-purple-700">
                                  {(judgeScores.get(draft.id)!.overallScore * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-sm text-gray-700">
                                <strong>Feedback:</strong>
                                <p className="mt-1 italic">{judgeScores.get(draft.id)!.feedback}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Judge Modal */}
        {showJudgeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-semibold mb-4">Judge Draft</h2>
              <p className="text-gray-600 mb-4">
                The judge will evaluate this draft on accuracy, readability, brand relevance, and style consistency.
                You can provide additional criteria below (optional).
              </p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., 'Focus on technical depth', 'Emphasize business value', 'Check for consistency with previous posts'"
                className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowJudgeModal(null);
                    setCustomPrompt('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleJudgeDraft(showJudgeModal)}
                  disabled={judgingDraftId === showJudgeModal}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {judgingDraftId === showJudgeModal ? 'Judging...' : 'Judge Draft'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

