'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAssignments, deleteAssignment } from '@/lib/api';

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAssignments = () => {
    getAssignments(1, 50).then(res => {
      setAssignments(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load assignments', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-[#F3F4F6]">
        <h1 className="text-[26px] font-bold text-[#111827] mb-8">My Assessments</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] h-48 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F3F4F6]">
        <div className="flex flex-col items-center justify-center flex-1 py-16">
          <div className="relative w-64 h-64 mb-6 flex items-center justify-center">
            {/* Soft gray background circle */}
            <div className="absolute inset-0 bg-[#F3F4F6] rounded-full scale-[1.2]"></div>
            
            {/* Custom SVG Illustration */}
            <img src="/Illustrations.png" alt="No assignments yet" className="relative z-10 w-full h-full object-contain" />
          </div>
          
          <h3 className="text-[20px] font-bold text-[#111827] mb-3">No assignments yet</h3>
          <p className="text-[14px] text-[#6B7280] text-center max-w-[400px] leading-[1.6] mb-8">
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
          <Link href="/create" className="flex items-center gap-2 px-8 py-3.5 bg-[#111827] text-white text-[15px] font-semibold rounded-full hover:bg-black transition-colors shadow-sm">
            <span className="text-[18px] leading-none">+</span> Create Your First Assignment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-full flex flex-col pb-40">
      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        </div>
        <p className="text-sm text-gray-500 ml-[18px]">
          Manage and create assignments for your classes.
        </p>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-center relative mb-6 mt-2">
        <button onClick={() => router.back()} className="absolute left-0 w-[42px] h-[42px] bg-[#EBEBEB] rounded-full flex items-center justify-center text-[#1A1A1A] transition-colors cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-[17px] font-bold text-[#1A1A1A]">Assignments</h1>
      </div>

      <div className="bg-white rounded-[24px] h-[52px] px-4 md:px-5 flex justify-between items-center mb-6 shadow-sm shrink-0">
        <button className="flex items-center gap-2 text-[14px] text-[#A3A3A3] font-medium hover:text-[#1A1A1A] transition-colors cursor-pointer pl-1 md:pl-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filter
        </button>
        
        <div className="flex items-center ml-4 flex-1 justify-end">
          <div className="relative w-full max-w-[220px] md:max-w-[280px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#A3A3A3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Search Name" className="w-full h-[36px] bg-transparent outline-none pl-9 pr-3 text-[14px] text-[#1A1A1A] placeholder:text-[#A3A3A3] border border-[#E5E5E5] rounded-full focus:border-[#F97316] transition-colors" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignments.map(assignment => {
          const createdAt = new Date(assignment.createdAt);
          const dueDate = new Date(createdAt.getTime() + 86400000); // placeholder +1 day
          
          return (
            <div 
              key={assignment._id} 
              onClick={() => router.push(`/preview/${assignment._id}`)}
              className="bg-white rounded-[24px] p-5 shadow-sm flex flex-col gap-4 relative group hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-center relative">
                <h3 className="text-[17px] md:text-[20px] font-bold md:font-extrabold text-[#1A1A1A] tracking-tight truncate pr-4">{assignment.title}</h3>
                
                <div className="relative z-50" ref={openMenuId === assignment._id ? menuRef : null}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('3-dots clicked for assignment:', assignment._id);
                      setOpenMenuId(openMenuId === assignment._id ? null : assignment._id);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer block"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 pointer-events-none">
                      <circle cx="12" cy="5" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>

                  {openMenuId === assignment._id && (
                    <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Navigating to:', `/preview/${assignment._id}`);
                          router.push(`/preview/${assignment._id}`);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                      >
                        View Assignment
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Deleting assignment:', assignment._id);
                          try {
                            await deleteAssignment(assignment._id);
                            setOpenMenuId(null);
                            fetchAssignments();
                          } catch (err) {
                            console.error('Failed to delete', err);
                          }
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] md:text-[12px] font-semibold text-[#737373]">
                <div className="flex items-center gap-1">
                  <span className="text-[#1A1A1A] font-bold">Assigned on :</span>
                  <span>{createdAt.toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#1A1A1A] font-bold">Due :</span>
                  <span>{dueDate.toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacer to guarantee scroll clearance above the fixed button */}
      <div className="h-[120px] shrink-0 w-full" />

      <div className="hidden md:flex fixed bottom-0 right-0 w-full md:w-[calc(100vw-330px)] h-[100px] pointer-events-none bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6]/80 to-transparent items-end justify-center pb-6 z-40">
        <Link href="/create" className="pointer-events-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#111827] text-white text-[14px] font-semibold rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:scale-[1.02] hover:bg-black transition-all">
          <span className="text-[18px] leading-none font-light">+</span> Create Assignment
        </Link>
      </div>
    </div>
  );
}
