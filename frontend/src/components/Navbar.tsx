'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const router = useRouter();
  
  return (
    <div data-navbar="true" className="flex items-center justify-between w-full h-full px-6">
      <div className="flex items-center gap-4">
        {/* Mobile Left Side: Logo */}
        <Link href="/" className="md:hidden flex items-center hover:opacity-80 transition-opacity">
          <img src="/logo-mobile.png" alt="VedaAI" className="h-[22px] object-contain" />
        </Link>

        {/* Desktop Left Side */}
        <div className="hidden md:flex items-center gap-4">
          {/* Back arrow */}
          <button onClick={() => router.back()} className="text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer">
            <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
          </button>
          {/* Grid Icon + Assignment */}
          <div className="flex items-center gap-3 text-[#111827]">
            <svg className="w-[20px] h-[20px] text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            <span className="text-[15px] font-medium text-[#6B7280]">Assignment</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
         {/* Notification Bell */}
         <div className="relative cursor-pointer text-[#1A1A1A] hover:text-[#E8472A] transition-colors mt-0.5">
           <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
           <span className="absolute -top-[1px] right-[1px] w-2.5 h-2.5 bg-[#E8472A] rounded-full border-2 border-white"></span>
         </div>
         {/* User Menu */}
         <div className="flex items-center gap-3 cursor-pointer group">
           <div className="w-[28px] h-[28px] md:w-8 md:h-8 rounded-full overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shrink-0">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Monkey" alt="Avatar" className="w-full h-full object-cover" />
           </div>
           <span className="hidden md:block text-[14px] font-medium text-[#111827] group-hover:text-[#F97316] transition-colors">John Doe</span>
           <svg className="hidden md:block w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
         </div>
         {/* Mobile Hamburger Menu */}
         <button className="md:hidden text-[#1A1A1A] ml-1">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
             <line x1="3" y1="6" x2="21" y2="6"></line>
             <line x1="3" y1="12" x2="21" y2="12"></line>
             <line x1="3" y1="18" x2="21" y2="18"></line>
           </svg>
         </button>
      </div>
    </div>
  );
}
