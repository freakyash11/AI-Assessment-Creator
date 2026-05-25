'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/assessmentStore';
import { createAssignment } from '@/lib/api';

const GRADE_LEVELS = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'College'];
const QUESTION_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Long Questions',
  'True / False'
];

interface QuestionTypeRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const setJobStatus = useAssessmentStore((state) => state.setJobStatus);
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [difficulty, setDifficulty] = useState('medium');
  
  const [dueDate, setDueDate] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [questionRows, setQuestionRows] = useState<QuestionTypeRow[]>([
    { id: '1', type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { id: '2', type: 'Short Questions', count: 3, marks: 2 },
    { id: '3', type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { id: '4', type: 'Numerical Problems', count: 5, marks: 5 },
  ]);

  const totalQuestions = questionRows.reduce((acc, row) => acc + row.count, 0);
  const totalMarks = questionRows.reduce((acc, row) => acc + (row.count * row.marks), 0);

  const addRow = () => {
    setQuestionRows([...questionRows, { 
      id: Math.random().toString(36).substring(7), 
      type: QUESTION_OPTIONS[0], 
      count: 1, 
      marks: 1 
    }]);
  };

  const removeRow = (id: string) => {
    setQuestionRows(questionRows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof QuestionTypeRow, value: any) => {
    setQuestionRows(questionRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const mapTypeToBackend = (type: string) => {
    if (type.includes('Multiple Choice')) return 'mcq';
    if (type.includes('Short')) return 'short';
    if (type.includes('Long')) return 'long';
    if (type.includes('True')) return 'true-false';
    return 'short'; // fallback
  };

  const handleSubmit = async () => {
    try {
      if (!title || !subject || !gradeLevel) {
        alert("Please go back and fill all basic information.");
        return;
      }
      if (questionRows.length === 0) {
        alert("Please add at least one question type.");
        return;
      }

      setIsSubmitting(true);
      
      const backendTypes = Array.from(new Set(questionRows.map(r => mapTypeToBackend(r.type))));
      
      const payload = {
        title,
        subject,
        gradeLevel,
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        totalMarks,
        duration,
        questionTypes: backendTypes,
        numberOfQuestions: totalQuestions,
        difficulty,
        additionalInstructions
      };
      
      const result = await createAssignment(payload as any);
      const assignmentId = result.assignment._id;
      const jobId = result.jobId;

      setJobStatus('pending', { assignmentId, jobId });
      router.push(`/preview/${assignmentId}`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to create assignment: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto pt-10 pb-20 px-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-3 h-3 rounded-full bg-[#E8472A] shadow-[0_0_8px_rgba(232,71,42,0.6)]" />
          <h1 className="text-[24px] font-bold text-[#111827] tracking-tight">Create Assignment</h1>
        </div>
        <p className="text-[14px] text-[#6B7280] ml-6 mb-8">Set up a new assignment for your students</p>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-10 h-1">
          <div className="flex-1 bg-[#111827] rounded-full" />
          <div className={`flex-1 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-[#111827]' : 'bg-[#E5E7EB]'}`} />
        </div>

        {step === 1 && (
          <div className="bg-[#F7F7F7] rounded-[24px] p-8 shadow-sm">
            <h2 className="text-[20px] font-bold text-[#111827] mb-1">Basic Information</h2>
            <p className="text-[14px] text-[#6B7280] mb-8">Subject and curriculum details</p>

            <div className="space-y-6">
              <div>
                <label className="block text-[14px] font-medium text-[#111827] mb-2">Assignment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-[48px] rounded-[10px] border border-[#E5E5E5] px-4 text-[14px] focus:border-[#111827] focus:ring-1 focus:ring-[#111827] outline-none"
                  placeholder="e.g. Midterm Physics Exam"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#111827] mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-[48px] rounded-[10px] border border-[#E5E5E5] px-4 text-[14px] focus:border-[#111827] focus:ring-1 focus:ring-[#111827] outline-none"
                  placeholder="e.g. Physics"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-medium text-[#111827] mb-2">Grade Level</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full h-[48px] rounded-[10px] border border-[#E5E5E5] px-4 text-[14px] focus:border-[#111827] outline-none bg-white"
                  >
                    <option value="">Select...</option>
                    {GRADE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-[#111827] mb-2">Duration (mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-[48px] rounded-[10px] border border-[#E5E5E5] px-4 text-[14px] focus:border-[#111827] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#111827] mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-[48px] rounded-[10px] border border-[#E5E5E5] px-4 text-[14px] focus:border-[#111827] outline-none bg-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-10">
              <button 
                onClick={() => {
                  if(!title || !subject || !gradeLevel) {
                    alert("Please fill out Title, Subject, and Grade Level.");
                    return;
                  }
                  setStep(2);
                }}
                className="bg-[#111827] text-white px-8 h-[48px] rounded-full text-[15px] font-semibold flex items-center gap-2 hover:bg-black transition-colors"
              >
                Next 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#F7F7F7] rounded-[24px] p-8 shadow-sm">
            <h2 className="text-[20px] font-bold text-[#111827] mb-1">Assignment Details</h2>
            <p className="text-[14px] text-[#6B7280] mb-8">Basic information about your assignment</p>

            {/* Dropzone */}
            <div 
              className="border-[1.5px] border-dashed border-[#D4D4D4] rounded-[16px] bg-white p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#111827] transition-colors mb-2"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <svg className="w-8 h-8 text-[#111827] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <h3 className="text-[15px] font-medium text-[#111827] mb-1">Choose a file or drag & drop it here</h3>
              <p className="text-[12px] text-[#A3A3A3] mb-4">JPEG, PNG, upto 10MB</p>
              <div className="bg-[#F0F0F0] text-[#111827] text-[13px] font-medium px-4 py-2 rounded-full">
                {selectedFile ? selectedFile.name : 'Browse Files'}
              </div>
              <input 
                id="file-upload" 
                type="file" 
                accept=".pdf,.txt,.jpeg,.jpg,.png" 
                className="hidden" 
                onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              />
            </div>
            <p className="text-center text-[13px] text-[#A3A3A3] mb-8">Upload images of your preferred document/image</p>

            {/* Due Date */}
            <div className="mb-8">
              <label className="block text-[14px] font-medium text-[#111827] mb-2">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-[48px] rounded-[10px] border border-[#E5E5E5] px-4 text-[14px] text-[#111827] focus:border-[#111827] focus:ring-1 focus:ring-[#111827] outline-none appearance-none"
                  placeholder="DD-MM-YYYY"
                />
              </div>
            </div>

            {/* Question Types Header */}
            <div className="grid grid-cols-[1fr_120px_120px_32px] gap-4 mb-4 px-2">
              <div className="text-[14px] font-bold text-[#111827]">Question Type</div>
              <div className="text-[14px] font-medium text-[#111827] text-center">No. of Questions</div>
              <div className="text-[14px] font-medium text-[#111827] text-center">Marks</div>
              <div></div>
            </div>

            {/* Dynamic Rows */}
            <div className="space-y-3 mb-6">
              {questionRows.map((row) => (
                <div key={row.id} className="grid grid-cols-[1fr_120px_120px_32px] items-center gap-4">
                  {/* Select Type */}
                  <div className="relative">
                    <select 
                      value={row.type}
                      onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                      className="w-full h-[44px] bg-white rounded-full border border-[#E5E5E5] px-5 text-[14px] text-[#111827] font-medium outline-none appearance-none cursor-pointer"
                    >
                      {QUESTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>

                  {/* Count Stepper */}
                  <div className="flex items-center justify-between bg-white rounded-full h-[44px] px-3 border border-[#E5E5E5]">
                    <button onClick={() => updateRow(row.id, 'count', Math.max(1, row.count - 1))} className="text-[#A3A3A3] hover:text-[#111827] p-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/></svg>
                    </button>
                    <span className="text-[14px] font-bold text-[#111827]">{row.count}</span>
                    <button onClick={() => updateRow(row.id, 'count', row.count + 1)} className="text-[#A3A3A3] hover:text-[#111827] p-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14"/></svg>
                    </button>
                  </div>

                  {/* Marks Stepper */}
                  <div className="flex items-center justify-between bg-white rounded-full h-[44px] px-3 border border-[#E5E5E5]">
                    <button onClick={() => updateRow(row.id, 'marks', Math.max(1, row.marks - 1))} className="text-[#A3A3A3] hover:text-[#111827] p-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/></svg>
                    </button>
                    <span className="text-[14px] font-bold text-[#111827]">{row.marks}</span>
                    <button onClick={() => updateRow(row.id, 'marks', row.marks + 1)} className="text-[#A3A3A3] hover:text-[#111827] p-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14"/></svg>
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button onClick={() => removeRow(row.id)} className="flex items-center justify-center w-8 h-8 rounded-full text-[#A3A3A3] hover:text-red-500 hover:bg-red-50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add Button */}
            <button onClick={addRow} className="flex items-center gap-2 text-[#111827] font-bold text-[14px] hover:opacity-80 transition-opacity mb-8">
              <div className="w-8 h-8 bg-[#111827] rounded-full flex items-center justify-center text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14"/></svg>
              </div>
              Add Question Type
            </button>

            {/* Totals */}
            <div className="flex flex-col items-end gap-1 mb-8">
              <div className="text-[14px] text-[#111827]">Total Questions : <span className="font-bold">{totalQuestions}</span></div>
              <div className="text-[14px] text-[#111827]">Total Marks : <span className="font-bold">{totalMarks}</span></div>
            </div>

            {/* Additional Information */}
            <div className="mb-2">
              <label className="block text-[14px] font-bold text-[#111827] mb-2">Additional Information (For better output)</label>
              <div className="relative">
                <textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="w-full min-h-[100px] rounded-[16px] bg-[#F7F7F7] border border-[#E5E5E5] p-5 text-[14px] focus:border-[#111827] focus:ring-1 focus:ring-[#111827] outline-none resize-none"
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                />
                <button className="absolute bottom-4 right-4 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-[#111827] border border-[#E5E5E5] hover:bg-gray-50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </button>
              </div>
            </div>
            
          </div>
        )}

        {/* Footer Navigation */}
        {step === 2 && (
          <div className="flex justify-between items-center mt-6">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-[#111827] font-medium text-[15px] hover:opacity-70 transition-opacity"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Previous
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`bg-[#111827] text-white px-8 h-[48px] rounded-full text-[15px] font-semibold flex items-center gap-2 hover:bg-black transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Generating...' : 'Next'} 
              {!isSubmitting && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
