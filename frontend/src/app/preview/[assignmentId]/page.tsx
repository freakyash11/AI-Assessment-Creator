'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/assessmentStore';
import { getAssignment, getPaper } from '@/lib/api';
import QuestionPaperView from '@/components/QuestionPaperView';

// Ensure component unwraps params correctly per Next.js App Router rules
export default function PreviewPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const router = useRouter();
  const { assignmentId } = use(params);
  
  const { 
    jobStatus, 
    generatedPaper, 
    setJobStatus, 
    setGeneratedPaper,
    currentAssignmentId 
  } = useAssessmentStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // First try to get assignment + paper together
        const res = await fetch(
          `${apiUrl}/api/assignments/${assignmentId}`
        );
        
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Failed to load assignment');
          setIsLoading(false);
          return;
        }
        
        const { assignment, paper } = await res.json();
        
        if (!assignment) {
          setError('Assignment not found');
          setIsLoading(false);
          return;
        }

        // Update store with assignment status
        if (assignment.status === 'completed' && paper) {
          setGeneratedPaper(paper);
          setJobStatus('completed', { assignmentId });
        } else if (assignment.status === 'failed') {
          setJobStatus('failed', { assignmentId });
        } else if (assignment.status === 'processing' || 
                   assignment.status === 'pending') {
          setJobStatus('processing', { assignmentId });
          // If still processing, try fetching paper separately after delay
          const pollPaper = async () => {
            const paperRes = await fetch(
              `${apiUrl}/api/papers/${assignmentId}`
            );
            if (paperRes.ok) {
              const paperData = await paperRes.json();
              setGeneratedPaper(paperData);
              setJobStatus('completed', { assignmentId });
            }
          };
          // Poll every 5 seconds
          const pollInterval = setInterval(async () => {
            const statusRes = await fetch(
              `${apiUrl}/api/assignments/${assignmentId}`
            );
            if (statusRes.ok) {
              const data = await statusRes.json();
              if (data.assignment?.status === 'completed') {
                clearInterval(pollInterval);
                await pollPaper();
              } else if (data.assignment?.status === 'failed') {
                clearInterval(pollInterval);
                setJobStatus('failed', { assignmentId });
              }
            }
          }, 5000);
          
          // Cleanup interval after 3 minutes max
          setTimeout(() => clearInterval(pollInterval), 180000);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('[Preview] Load error:', err);
        setError('Failed to connect to server. Is the backend running?');
        setIsLoading(false);
      }
    };

    if (assignmentId) {
      const store = useAssessmentStore.getState();
      
      // Paper already in store and matches current assignment
      if (
        store.jobStatus === 'completed' && 
        store.generatedPaper && 
        store.currentAssignmentId === assignmentId
      ) {
        console.log('[Preview] Using cached paper from store');
        setIsLoading(false);
        return; // Don't fetch, paper is already showing
      }
      
      loadAssignment();
    }
  }, [assignmentId, setJobStatus, setGeneratedPaper]);

  // Derive message based on exact state
  const getLoadingMessage = () => {
    if (jobStatus === 'pending') return "Queuing your assignment...";
    if (jobStatus === 'processing') return "AI is generating questions...";
    return "Finalizing your paper..."; // default fallback
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-pulse text-indigo-600 font-medium">Checking job status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center h-full gap-4 max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-red-50">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2 shadow-sm">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="text-red-500 text-lg font-semibold mb-2">{error}</div>
          <button
            onClick={() => router.push('/assignments')}
            className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm hover:bg-black transition-colors"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  if (jobStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-red-50">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generation Failed</h2>
          <p className="text-gray-500 mb-8">We encountered an error while communicating with the AI. Please try again or adjust your parameters.</p>
          <button 
            onClick={() => router.push('/create')}
            className="w-full py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Go Back & Try Again
          </button>
        </div>
      </div>
    );
  }

  // Smooth render if completely done
  if (jobStatus === 'completed' && generatedPaper) {
    return (
      <div className="animate-in fade-in duration-700">
        <QuestionPaperView paper={generatedPaper} />
      </div>
    );
  }

  // Active Pending / Processing states
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-2xl shadow-indigo-100/50 rounded-3xl p-10 text-center border border-indigo-50 transform transition-all">
        
        {/* Animated Spinner Ring */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3 animate-pulse">
          {getLoadingMessage()}
        </h2>
        
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Please wait while VedaAI crafts your custom assessment. This usually takes 10-20 seconds.
        </p>

        {/* Indeterminate Progress Bar */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-indigo-500 rounded-full animate-pulse shadow-md"></div>
          <div className="absolute top-0 bottom-0 bg-indigo-300 rounded-full animate-ping opacity-20 w-full"></div>
        </div>
      </div>
    </div>
  );
}
