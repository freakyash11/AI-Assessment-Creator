'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import { getAssignments } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const [totalAssignments, setTotalAssignments] = useState<number | null>(null);
  
  useEffect(() => {
    getAssignments(1, 1).then(res => {
      setTotalAssignments(res.total ?? res.data?.length ?? 0);
    }).catch(() => {
      // ignore
    });
  }, [pathname]); // Refresh count when navigation happens
  
  const navItems = [
    { label: 'Home', href: '/', icon: 'grid' },
    { label: 'My Groups', href: '/groups', icon: 'users' },
    { label: 'Assignments', href: '/assignments', icon: 'document' },
    { label: 'AI Teacher\'s Toolkit', href: '/create', icon: 'hexagon' },
    { label: 'My Library', href: '/library', icon: 'clock' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="p-6 pb-4">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
      </div>
      
      <div className="px-4 pb-4">
        <Link href="/create" className="flex items-center justify-center w-full bg-[#111827] text-white rounded-full border-[1.5px] border-[#F97316] shadow-[0_0_16px_rgba(249,115,22,0.35),inset_0_0_16px_rgba(249,115,22,0.05)] py-[13px] px-[20px] transition-all duration-200">
          <span className="text-[#F97316] mr-[8px] text-[16px] leading-none">✦</span>
          <span className="font-semibold text-[14px]">Create Assignment</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/assignments' && pathname === '/assignments');
          return (
            <Link key={item.label} href={item.href} className={`flex items-center gap-[12px] p-[10px_16px] rounded-[8px] transition-colors duration-150 ${isActive ? 'bg-[#F3F4F6] text-[#111827] font-medium' : 'text-[#6B7280] hover:bg-neutral-50 hover:text-[#111827] font-normal'}`}>
              <svg className={`w-[20px] h-[20px] ${isActive ? 'text-[#111827]' : 'text-[#6B7280]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {item.icon === 'grid' && <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>}
                {item.icon === 'users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
                {item.icon === 'document' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>}
                {item.icon === 'hexagon' && <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></>}
                {item.icon === 'clock' && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
              </svg>
              <span className="text-[15px]">{item.label}</span>
              {item.label === 'Assignments' && totalAssignments !== null && totalAssignments > 0 && (
                <span className="ml-auto bg-[#F97316] text-white text-[11px] font-bold px-2 py-[2px] leading-none rounded-[6px]">{totalAssignments}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-2">
        <Link href="/settings" className="flex items-center gap-[12px] p-[10px_16px] text-[#6B7280] hover:bg-neutral-50 hover:text-[#111827] rounded-[8px] transition-colors duration-150 font-normal">
           <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1-1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
           <span className="text-[15px]">Settings</span>
        </Link>
      </div>

      <div className="p-4">
        <div className="p-[14px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-[#E5E7EB]">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Monkey" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] text-[#111827] truncate leading-[1.3]">Delhi Public School</p>
            <p className="text-[12px] text-[#6B7280] truncate mt-[2px]">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </div>
  );
}
