'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { QuestionPaper, useAssessmentStore } from '@/store/assessmentStore';
import { regenerateAssignment } from '@/lib/api';

export default function QuestionPaperView({ paper }: { paper: QuestionPaper }) {
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    rollNumber: '',
    section: ''
  });
  
  return (
    <div className="min-h-screen bg-[#F8F9FA] sm:bg-[#EFEFEF] py-0 sm:py-6 px-0 sm:px-6 lg:px-8 print:bg-white print:min-h-0 print:p-0 pb-24 sm:pb-6">
      <div className="max-w-5xl mx-auto print:max-w-none print:mx-0">
        
        {/* Container mimicking the dark card in image */}
        <div className="bg-[#262626] sm:bg-[#171717] rounded-none sm:rounded-[24px] shadow-none sm:shadow-lg overflow-hidden flex flex-col print:bg-white print:shadow-none print:rounded-none print:overflow-visible print:block">
          
          {/* Header Banner */}
          <div className="px-5 py-6 sm:px-10 sm:py-8 flex flex-col items-start relative print:hidden rounded-b-[24px] sm:rounded-b-none shadow-sm z-10 bg-[#262626] sm:bg-transparent">
            <h2 className="text-white text-[13px] sm:text-xl font-medium sm:font-bold leading-[1.6] sm:leading-relaxed pr-8 sm:pr-12 max-w-4xl opacity-90 sm:opacity-100">
              Here is the customized Question Paper for your {paper.gradeLevel} {paper.subject} class:
            </h2>
            
            {/* Desktop Buttons */}
            <div className="hidden md:flex mt-5 flex-wrap items-center gap-3">
              <button
                onClick={() => window.print()}
                type="button"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#171717] text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors no-print cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download as PDF
              </button>
              <button 
                onClick={async () => {
                  if (window.confirm('This will replace the current paper. Continue?')) {
                    try {
                      const { jobId } = await regenerateAssignment(paper.assignmentId);
                      useAssessmentStore.getState().setJobStatus('pending', { jobId });
                    } catch (error) {
                      console.error('Failed to regenerate assignment:', error);
                      alert('Failed to regenerate. Please try again.');
                    }
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border border-white/30 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-colors no-print cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                Regenerate
              </button>
            </div>

            {/* Mobile Buttons */}
            <div className="md:hidden mt-4 flex items-center gap-3">
              <button onClick={() => window.print()} className="w-[38px] h-[38px] flex items-center justify-center border border-white/20 text-white rounded-full transition-colors hover:bg-white/10 cursor-pointer no-print">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button onClick={async () => {
                if (window.confirm('This will replace the current paper. Continue?')) {
                  try {
                    const { jobId } = await regenerateAssignment(paper.assignmentId);
                    useAssessmentStore.getState().setJobStatus('pending', { jobId });
                  } catch (error) {
                    console.error('Failed to regenerate assignment:', error);
                    alert('Failed to regenerate. Please try again.');
                  }
                }
              }} className="w-[38px] h-[38px] flex items-center justify-center border border-white/20 text-white rounded-full transition-colors hover:bg-white/10 cursor-pointer no-print">
                 <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
              </button>
            </div>
            {paper.generationCount && paper.generationCount > 1 && (
              <div className="absolute top-6 right-6 text-xs font-bold bg-[#E8472A] text-white px-2.5 py-1 rounded-full uppercase tracking-wide no-print">
                Regeneration #{paper.generationCount}
              </div>
            )}
          </div>

          {/* Paper Document */}
          <div className="bg-[#F8F9FA] sm:bg-white rounded-none sm:rounded-[24px] mx-0 mb-0 sm:mx-6 sm:mb-6 px-5 py-8 sm:p-12 shadow-none sm:shadow-sm paper-content text-[#1A1A1A] print:bg-white print:rounded-none print:shadow-none print:m-0 print:p-0 z-0">
            
            {/* Header */}
            <div className="text-center mb-8 sm:mb-10 relative">
              <h1 className="text-[15px] sm:text-[28px] font-bold text-[#1A1A1A] tracking-tight mb-2 sm:mb-3 uppercase">
                {paper.title}
              </h1>
              <div className="flex flex-col items-center gap-0.5 sm:gap-1.5 text-[13px] sm:text-[18px] text-[#1A1A1A]">
                <div className="font-semibold">Subject: {paper.subject}</div>
                <div className="font-semibold">Class: {paper.gradeLevel}</div>
              </div>
            </div>
            
            {/* Time and Marks row */}
            <div className="flex justify-between items-center mb-6 sm:mb-8 font-bold text-[#1A1A1A] text-[13px] sm:text-base">
              <div>Time Allowed: {paper.duration} minutes</div>
              <div>Maximum Marks: {paper.totalMarks}</div>
            </div>

            {/* General Instructions */}
            <div className="mb-6 sm:mb-8">
              <p className="font-bold text-[#1A1A1A] text-[13px] sm:text-base">All questions are compulsory unless stated otherwise.</p>
            </div>

            {/* Student Info Section */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-10 sm:mb-12 text-[13px] sm:text-base font-bold text-[#1A1A1A]">
              <div className="flex gap-2 items-end">
                <span className="min-w-[50px] mb-0.5">Name:</span>
                <input
                  type="text"
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 border-b-[1.5px] border-[#1A1A1A] bg-transparent outline-none max-w-[300px] h-6"
                />
              </div>
              <div className="flex gap-2 items-end">
                <span className="min-w-[100px] mb-0.5">Roll Number:</span>
                <input
                  type="text"
                  value={studentInfo.rollNumber}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, rollNumber: e.target.value }))}
                  className="flex-1 border-b-[1.5px] border-[#1A1A1A] bg-transparent outline-none max-w-[250px] h-6"
                />
              </div>
              <div className="flex gap-2 items-end">
                <span className="whitespace-nowrap mb-0.5">Class: {paper.gradeLevel} Section:</span>
                <input
                  type="text"
                  value={studentInfo.section}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, section: e.target.value }))}
                  className="flex-1 border-b-[1.5px] border-[#1A1A1A] bg-transparent outline-none max-w-[150px] h-6"
                />
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-10 sm:space-y-12">
              {paper.sections.map((section, sIdx) => {
                const sectionTitle = section.title.toLowerCase().includes('section') 
                  ? section.title
                  : `Section ${section.id?.replace('sec_', '').toUpperCase()}`;
                
                return (
                  <div key={section.id} className="section-block">
                    {/* Section Header */}
                    <div className="text-center mb-6 sm:mb-8">
                      <h2 className="text-[15px] sm:text-[22px] font-bold text-[#1A1A1A]">
                        {sectionTitle}
                      </h2>
                    </div>
                    
                    <div className="mb-6 sm:mb-8">
                      <h3 className="font-bold text-[#1A1A1A] text-[14px] sm:text-[17px] mb-1 sm:mb-2">
                        {section.title}
                      </h3>
                      {section.instruction && (
                        <p className="text-[12px] sm:text-[15px] text-[#737373] italic">
                          {section.instruction}
                        </p>
                      )}
                    </div>

                    {/* Questions */}
                    <div className="space-y-6 sm:space-y-8 text-[#1A1A1A]">
                      {section.questions.map((q, qIdx) => (
                        <div key={q.id} className="flex gap-1.5 sm:gap-2.5 question-item text-[13px] sm:text-[16px]">
                          <span className="min-w-[1.25rem] sm:min-w-[1.75rem] text-right mt-0 sm:mt-0.5">{qIdx + 1}.</span>
                          <div className="flex-1">
                            <div className="leading-relaxed">
                              <span className="text-[#737373] mr-2">[{q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}]</span>
                              <span>{q.text}</span>
                              <span className="text-[#737373] ml-2">[{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]</span>
                            </div>

                            {/* MCQ Options */}
                            {q.type === 'mcq' && q.options && q.options.length > 0 && (
                              <div className="flex flex-col gap-2.5 mt-4 ml-2">
                                {q.options.map((option, idx) => {
                                  const labels = ['a', 'b', 'c', 'd'];
                                  const label = labels[idx] || idx + 1;
                                  
                                  const isEmptyOption = option.trim().length <= 1 && 
                                                        ['a','b','c','d','A','B','C','D'].includes(option.trim());
                                  
                                  return (
                                    <div key={idx} className="flex items-start gap-2 text-[#1A1A1A]">
                                      <span className="min-w-[20px]">{label})</span>
                                      <span>{isEmptyOption ? '___' : option}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* True/False Options */}
                            {q.type === 'true-false' && (
                              <div className="mt-5 flex gap-8 ml-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#1A1A1A]"></div>
                                  <span>True</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#1A1A1A]"></div>
                                  <span>False</span>
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
            
            <div className="mt-10 sm:mt-14 mb-6 sm:mb-8 font-bold text-[#1A1A1A] text-[13px] sm:text-[15px]">
              End of Question Paper
            </div>

            {/* Answer Key Section */}
            {paper.sections.some(s => s.questions.some(q => q.answer)) && (
              <div className="mt-10 sm:mt-12 pt-6 sm:pt-8">
                <h3 className="text-[14px] sm:text-[17px] font-bold text-[#1A1A1A] mb-4 sm:mb-6">Answer Key:</h3>
                <div className="space-y-4 sm:space-y-5">
                  {paper.sections.flatMap(s => s.questions).filter(q => q.answer).map((q, idx) => (
                    <div key={`ans-${q.id}`} className="flex gap-1.5 sm:gap-2.5 text-[13px] sm:text-[16px] text-[#1A1A1A]">
                      <span className="min-w-[1.75rem] text-right mt-0.5">{idx + 1}.</span>
                      <div className="flex-1 leading-relaxed">
                        {q.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
