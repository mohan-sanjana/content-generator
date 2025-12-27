'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Idea {
  id: string;
  title: string;
  oneSentenceHook: string;
  whyNow: string;
  targetAudience: string;
  outlineBullets: string;
  riskOfGeneric: number;
  noveltyScoreGuess: number;
  createdAt: string;
  curatorScores: {
    groundedness: number;
    originality: number;
    brandFit: number;
    diversity: number;
    clarity: number;
    averageScore: number;
    feedback: string | null;
    shortlisted: boolean;
  } | null;
  ideaHighlights: Array<{
    highlight: {
      id: string;
      title: string;
      url: string;
      highlightText: string;
      note: string | null;
      author: string | null;
      sourceDomain: string;
      tags: string;
      createdAt: string;
    };
  }>;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [creatingDraft, setCreatingDraft] = useState<string | null>(null);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [expandedHighlights, setExpandedHighlights] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const res = await fetch('/api/ideas/list');
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress('Preparing to generate ideas...');
    
    try {
      setProgress('Calling AI to generate ideas (this may take 30-60 seconds)...');
      
      const res = await fetch('/api/workflow/generate-ideas', { method: 'POST' });
      const data = await res.json();
      
      if (data.error) {
        setProgress('');
        alert(`Error: ${data.error}${data.details ? '\n\nDetails: ' + data.details : ''}`);
      } else {
        setProgress('Saving ideas to database...');
        await fetchIdeas();
        setProgress('Done!');
        setTimeout(() => setProgress(''), 2000);
      }
    } catch (error) {
      setProgress('');
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!userFeedback.trim()) {
      alert('Please provide feedback or direction for regenerating ideas.');
      return;
    }

    setRegenerating(true);
    setProgress('Regenerating ideas with your feedback...');
    setShowRegenerateModal(false);

    try {
      const res = await fetch('/api/workflow/regenerate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: userFeedback }),
      });

      const data = await res.json();

      if (data.error) {
        setProgress('');
        alert(`Error: ${data.error}`);
      } else {
        setProgress('Saving regenerated ideas...');
        setUserFeedback('');
        await fetchIdeas();
        setProgress('Done!');
        setTimeout(() => setProgress(''), 2000);
      }
    } catch (error) {
      setProgress('');
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRegenerating(false);
    }
  };

  const handleCreateDraft = async (ideaId: string) => {
    setCreatingDraft(ideaId);
    setProgress('Creating draft (this may take 1-2 minutes)...');
    
    try {
      console.log('[UI] Creating draft for idea:', ideaId);
      const res = await fetch('/api/workflow/create-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaIds: [ideaId] }),
      });
      
      const data = await res.json();
      console.log('[UI] Draft creation response:', data);
      
      if (data.error) {
        setProgress('');
        alert(`Error creating draft: ${data.error}`);
      } else if (data.results && data.results[0]?.error) {
        setProgress('');
        alert(`Error: ${data.results[0].error}`);
      } else if (data.results && data.results[0]?.draftId) {
        setProgress('✓ Draft created successfully! Redirecting...');
        setTimeout(() => {
          setProgress('');
          window.location.href = '/drafts';
        }, 2000);
      } else {
        setProgress('');
        alert('Draft creation completed but no draft ID returned. Check server logs.');
      }
    } catch (error) {
      setProgress('');
      console.error('[UI] Draft creation error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingDraft(null);
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

        {/* Header with action buttons */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Blog Ideas</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Ideas'}
            </button>
            <button
              onClick={() => setShowRegenerateModal(true)}
              disabled={generating || regenerating || ideas.length === 0}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Regenerate Ideas
            </button>
            {progress && (
              <div className="text-sm text-gray-600 italic">
                {progress}
              </div>
            )}
          </div>
        </div>

        {ideas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No ideas generated yet.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Ideas'}
              </button>
              {progress && (
                <div className="text-sm text-gray-600 italic text-center">
                  {progress}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {ideas.map((idea) => {
              // Determine border color based on curator scores
              let borderClass = '';
              let statusBadge = null;
              
              if (idea.curatorScores) {
                if (idea.curatorScores.shortlisted) {
                  borderClass = 'border-2 border-green-500';
                  statusBadge = (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                      ✓ SHORTLISTED
                    </span>
                  );
                } else if (idea.curatorScores.averageScore < 0.6) {
                  borderClass = 'border-2 border-red-500';
                  statusBadge = (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
                      ✗ REJECTED
                    </span>
                  );
                } else {
                  borderClass = 'border-2 border-yellow-500';
                  statusBadge = (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">
                      ⚠ REVIEW
                    </span>
                  );
                }
              } else {
                borderClass = 'border-2 border-gray-300';
                statusBadge = (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    PENDING CURATION
                  </span>
                );
              }
              
              return (
              <div
                key={idea.id}
                className={`bg-white rounded-lg shadow p-6 ${borderClass}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">{idea.title}</h2>
                    <p className="text-gray-700 mb-2">{idea.oneSentenceHook}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Why Now:</strong> {idea.whyNow}
                      </p>
                      <p>
                        <strong>Target Audience:</strong> {idea.targetAudience}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    {idea.curatorScores ? (
                      <>
                        <div
                          className={`text-2xl font-bold ${
                            idea.curatorScores.shortlisted
                              ? 'text-green-600'
                              : idea.curatorScores.averageScore >= 0.6
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(idea.curatorScores.averageScore * 100).toFixed(0)}%
                        </div>
                        <div className="mt-2">{statusBadge}</div>
                      </>
                    ) : (
                      <div className="text-gray-400 text-sm">Not yet curated</div>
                    )}
                  </div>
                </div>

                {idea.curatorScores && (
                  <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">Evaluation Scores</h3>
                    <div className="grid grid-cols-5 gap-3 text-sm mb-3">
                      <div className="bg-white p-2 rounded border">
                        <div className="text-xs text-gray-500 mb-1">Groundedness</div>
                        <div className="text-lg font-bold text-blue-600">
                          {(idea.curatorScores.groundedness * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Based on supporting highlights</div>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <div className="text-xs text-gray-500 mb-1">Originality</div>
                        <div className="text-lg font-bold text-purple-600">
                          {(idea.curatorScores.originality * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Uniqueness & novelty</div>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <div className="text-xs text-gray-500 mb-1">Brand Fit</div>
                        <div className="text-lg font-bold text-green-600">
                          {(idea.curatorScores.brandFit * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Alignment with brand</div>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <div className="text-xs text-gray-500 mb-1">Diversity</div>
                        <div className="text-lg font-bold text-orange-600">
                          {(idea.curatorScores.diversity * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Content variety</div>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <div className="text-xs text-gray-500 mb-1">Clarity</div>
                        <div className="text-lg font-bold text-teal-600">
                          {(idea.curatorScores.clarity * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Hook clarity</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="text-sm">
                        <strong className="text-gray-700">Average Score:</strong>{' '}
                        <span className="font-bold text-lg">
                          {(idea.curatorScores.averageScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      {idea.curatorScores.feedback && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Feedback:</strong> {idea.curatorScores.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <strong>Outline:</strong>
                  <ul className="list-disc list-inside mt-2 text-gray-700">
                    {(JSON.parse(idea.outlineBullets) as string[]).map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Supporting Highlights ({idea.ideaHighlights.length}):</strong>
                  <div className="mt-2 space-y-2">
                    {idea.ideaHighlights.map((ih) => {
                      const isExpanded = expandedHighlights.has(ih.highlight.id);
                      const tags = JSON.parse(ih.highlight.tags || '[]') as string[];
                      
                      return (
                        <div key={ih.highlight.id} className="border border-gray-200 rounded p-3 bg-white">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{ih.highlight.title}</h4>
                              {ih.highlight.author && (
                                <p className="text-xs text-gray-500 mt-1">
                                  By {ih.highlight.author} • {ih.highlight.sourceDomain}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedHighlights);
                                if (isExpanded) {
                                  newExpanded.delete(ih.highlight.id);
                                } else {
                                  newExpanded.add(ih.highlight.id);
                                }
                                setExpandedHighlights(newExpanded);
                              }}
                              className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </button>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-3 space-y-2 pt-3 border-t border-gray-200">
                              <div>
                                <strong className="text-gray-700 text-xs">Highlight:</strong>
                                <p className="text-gray-800 mt-1 text-sm leading-relaxed">
                                  {ih.highlight.highlightText}
                                </p>
                              </div>
                              {ih.highlight.note && (
                                <div>
                                  <strong className="text-gray-700 text-xs">Note:</strong>
                                  <p className="text-gray-600 mt-1 text-sm italic">
                                    {ih.highlight.note}
                                  </p>
                                </div>
                              )}
                              {tags.length > 0 && (
                                <div>
                                  <strong className="text-gray-700 text-xs">Tags:</strong>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {tags.map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {ih.highlight.url && (
                                <div>
                                  <a
                                    href={ih.highlight.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-xs"
                                  >
                                    View Source →
                                  </a>
                                </div>
                              )}
                              <div className="text-xs text-gray-400">
                                Created: {new Date(ih.highlight.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Risk of Generic: {(idea.riskOfGeneric * 100).toFixed(0)}% | Novelty:{' '}
                    {(idea.noveltyScoreGuess * 100).toFixed(0)}%
                  </div>
                  {(idea.curatorScores?.shortlisted || !idea.curatorScores) && (
                    <button
                      onClick={() => handleCreateDraft(idea.id)}
                      disabled={creatingDraft === idea.id}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {creatingDraft === idea.id ? 'Creating Draft...' : 'Create Draft'}
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {showRegenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-semibold mb-4">Regenerate Ideas</h2>
              <p className="text-gray-600 mb-4">
                Provide additional direction or feedback to guide the AI in generating new ideas.
                For example: "Focus on AI infrastructure topics" or "Generate ideas about product
                management challenges".
              </p>
              <textarea
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                placeholder="Enter your feedback or direction for generating ideas..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowRegenerateModal(false);
                    setUserFeedback('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={!userFeedback.trim() || regenerating}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate Ideas'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

