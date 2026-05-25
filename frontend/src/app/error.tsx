'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F3F4F6]">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#E5E7EB] max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#111827] mb-3">Something went wrong</h2>
        <p className="text-[15px] text-[#6B7280] leading-relaxed mb-8">
          We encountered an unexpected error. Our team has been notified.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full h-12 bg-[#111827] text-white rounded-xl font-semibold hover:bg-black transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full h-12 flex items-center justify-center text-[#111827] font-medium border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
