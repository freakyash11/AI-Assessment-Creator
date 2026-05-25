'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomBar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: 'grid' },
    { label: 'Assignments', href: '/assignments', icon: 'document' },
    { label: 'Library', href: '/library', icon: 'clock' },
    { label: 'AI Toolkit', href: '/create', icon: 'sparkles' },
  ];

  return (
    <div className="md:hidden flex-none w-full relative z-20 pb-2 print:hidden">
      {/* Floating Create Button */}
      <div className="absolute right-4 -top-16">
        <Link href="/create" className="flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-lg border border-[#E5E5E5] text-[#E8472A] hover:bg-gray-50 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </Link>
      </div>

      {/* Dark Bottom Bar */}
      <div className="bg-[#1A1A1A] rounded-[32px] mx-4 py-3 px-6 shadow-xl flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/assignments' && pathname.startsWith('/assignments'));
          
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1.5 transition-colors group relative cursor-pointer">
              <div className={`transition-colors ${isActive ? 'text-white' : 'text-[#737373] group-hover:text-gray-400'}`}>
                {item.icon === 'grid' && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                  </svg>
                )}
                {item.icon === 'document' && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2.5" fill={isActive ? 'currentColor' : 'none'} stroke={isActive ? 'none' : 'currentColor'}></rect>
                    {isActive && <path d="M8 7h8M8 12h8M8 17h5" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"></path>}
                    {!isActive && <path d="M8 7h8M8 12h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>}
                  </svg>
                )}
                {item.icon === 'clock' && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                    <line x1="8" y1="7" x2="16" y2="7"></line>
                    <line x1="8" y1="12" x2="14" y2="12"></line>
                  </svg>
                )}
                {item.icon === 'sparkles' && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path>
                  </svg>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-white' : 'text-[#737373] group-hover:text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
