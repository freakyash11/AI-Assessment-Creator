'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPaper } from '@/lib/api';
import { QuestionPaper } from '@/store/assessmentStore';

export default function PrintPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;
    getPaper(assignmentId).then(data => {
      setPaper(data);
      setLoading(false);
      // Automatically trigger print after a short delay for rendering
      setTimeout(() => window.print(), 800);
    }).catch(err => {
      console.error('Failed to load paper for print', err);
      setLoading(false);
    });
  }, [assignmentId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-sans text-gray-500">Loading document for print...</div>;
  }

  if (!paper) {
    return <div className="min-h-screen flex items-center justify-center font-sans text-red-500">Error: Could not load the document.</div>;
  }

  return (
    <div className="bg-white min-h-screen relative font-sans text-black">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 15mm 15mm 15mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .print-hidden { display: none !important; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          .page-break-before-always { page-break-before: always; }
          /* Reduce font sizes slightly for print */
          h1 { font-size: 24px !important; }
          h2 { font-size: 16px !important; }
          p, span, li, div { font-size: 13px !important; }
          /* Ensure headers stay together with content */
          h2, h3 { page-break-after: avoid; }
          .section-block { margin-top: 20px; page-break-inside: avoid; }
        }
      `}} />
      
      {/* Hide this in print, used for manual printing if auto-print fails */}
      <div className="print-hidden fixed top-4 right-4 z-50">
        <button onClick={() => window.print()} className="bg-black text-white px-5 py-2.5 rounded-lg font-medium shadow-lg hover:bg-gray-800 transition-colors">
          Print / Save PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-bold text-black uppercase tracking-wider mb-3" style={{ fontSize: '26px' }}>{paper.title}</h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-black font-medium" style={{ fontSize: '15px' }}>
            <span>{paper.subject}</span>
            <span>|</span>
            <span>{paper.gradeLevel}</span>
            <span>|</span>
            <span>Duration: {paper.duration} mins</span>
            <span>|</span>
            <span>Total Marks: {paper.totalMarks}</span>
          </div>
        </div>
        
        <hr className="border-black mb-8 border-t-2" />

        {/* Student Info Box */}
        <div className="border-2 border-black p-5 rounded-lg mb-8 grid grid-cols-3 gap-8">
          <div className="flex items-end">
            <span className="font-semibold text-black mr-3">Name:</span>
            <div className="flex-1 border-b-2 border-black h-5"></div>
          </div>
          <div className="flex items-end">
            <span className="font-semibold text-black mr-3">Roll No:</span>
            <div className="flex-1 border-b-2 border-black h-5"></div>
          </div>
          <div className="flex items-end">
            <span className="font-semibold text-black mr-3">Section:</span>
            <div className="flex-1 border-b-2 border-black h-5"></div>
          </div>
        </div>

        {/* General Instructions */}
        <div className="mb-8">
          <h3 className="font-bold text-black mb-3 underline decoration-2 underline-offset-4">General Instructions:</h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-black font-medium">
            <li>The question paper comprises {paper.sections.length} sections.</li>
            <li>Read all questions carefully before attempting them.</li>
            <li>Write your answers clearly and legibly.</li>
            <li>Verify that you have written your Name and Roll Number before starting.</li>
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {paper.sections.map((section, sIdx) => {
            const sectionLetter = String.fromCharCode(65 + sIdx);
            return (
              <div key={section.id} className="section-block">
                {/* Section Header */}
                <div className="flex justify-between items-start mb-5 border-b-2 border-black pb-2">
                  <div>
                    <h2 className="font-bold text-black uppercase tracking-wide text-lg">
                      SECTION {sectionLetter} — {section.title}
                    </h2>
                    <p className="text-black italic mt-1.5 font-medium">{section.instruction}</p>
                  </div>
                  <span className="font-bold text-black whitespace-nowrap ml-4 text-lg">
                    [{section.totalMarks} Marks]
                  </span>
                </div>

                {/* Questions */}
                <div className="space-y-8 mt-6">
                  {section.questions.map((q, qIdx) => (
                    <div key={q.id} className="flex gap-4 page-break-inside-avoid">
                      <span className="font-bold text-black min-w-[2rem] text-right text-[15px]">Q{qIdx + 1}.</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-black font-medium leading-relaxed text-[15px]">{q.text}</p>
                          
                          {/* Marks Badge only, remove difficulty for print to be clean */}
                          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                            <span className="font-bold px-2 py-1 border border-black uppercase tracking-wide text-black text-[12px]">
                              {q.marks} {q.marks === 1 ? 'MARK' : 'MARKS'}
                            </span>
                          </div>
                        </div>

                        {/* MCQ Options */}
                        {q.type === 'mcq' && q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3 ml-4">
                            {q.options.map((option, idx) => {
                              const labels = ['a', 'b', 'c', 'd'];
                              const label = labels[idx] || idx + 1;
                              
                              // Skip rendering if option is just a single letter label
                              const isEmptyOption = option.trim().length <= 1 && 
                                                    ['a','b','c','d','A','B','C','D'].includes(option.trim());
                              
                              return (
                                <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="font-medium text-gray-900 min-w-[20px]">
                                    {label})
                                  </span>
                                  <span>{isEmptyOption ? '___' : option}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* True/False Options */}
                        {q.type === 'true-false' && (
                          <div className="mt-4 flex gap-10">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full border-2 border-black"></div>
                              <span className="text-black font-medium">True</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full border-2 border-black"></div>
                              <span className="text-black font-medium">False</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 text-center text-black text-[13px] font-bold tracking-widest uppercase">
          — End of Paper —
        </div>
      </div>
    </div>
  );
}
