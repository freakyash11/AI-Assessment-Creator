import Link from 'next/link';

export default function Home() {
  return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-transparent min-h-full">
        <div className="flex flex-col items-center justify-center flex-1 py-8 sm:py-16 max-w-2xl mx-auto w-full">
          
          <div className="mb-8 text-center">
            <h1 className="text-[28px] sm:text-[40px] font-extrabold text-[#1A1A1A] tracking-tight mb-4">
              Welcome to VedaAI
            </h1>
            <p className="text-[14px] sm:text-[16px] text-[#737373] max-w-[500px] mx-auto leading-relaxed">
              Your intelligent assistant for effortless question paper generation and automated grading. What would you like to do today?
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[600px] px-4 sm:px-0">
            {/* Quick Action: Create */}
            <Link href="/create" className="group bg-white border border-[#E5E5E5] rounded-[24px] p-6 sm:p-8 flex flex-col items-center text-center hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#1A1A1A]/20 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-[#F8F9FA] rounded-full flex items-center justify-center mb-5 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors text-[#1A1A1A]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path>
                </svg>
              </div>
              <h3 className="text-[16px] sm:text-[18px] font-bold text-[#1A1A1A] mb-2">Create Paper</h3>
              <p className="text-[13px] text-[#737373]">Generate AI-powered assessments instantly</p>
            </Link>

            {/* Quick Action: Assignments */}
            <Link href="/assignments" className="group bg-white border border-[#E5E5E5] rounded-[24px] p-6 sm:p-8 flex flex-col items-center text-center hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#1A1A1A]/20 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-[#F8F9FA] rounded-full flex items-center justify-center mb-5 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors text-[#1A1A1A]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2.5"></rect>
                  <path d="M8 7h8M8 12h8M8 17h5" strokeLinecap="round"></path>
                </svg>
              </div>
              <h3 className="text-[16px] sm:text-[18px] font-bold text-[#1A1A1A] mb-2">My Assignments</h3>
              <p className="text-[13px] text-[#737373]">View and manage your past question papers</p>
            </Link>
          </div>

        </div>
      </div>
  );
}
