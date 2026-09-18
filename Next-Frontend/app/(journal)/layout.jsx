import { Suspense } from 'react';
import ScrollOnTop from '@/Component/ScrollOnTop.jsx';
import JournalNavbar from './_components/JournalNavbar.jsx';
import Footer from '@/Component/Footer.jsx';

export default function JournalLayout({ children }) {
  return (
    <>
      <ScrollOnTop />
      <div className="relative min-h-screen bg-[#FFF7EE] text-[#2F2F2F] flex flex-col font-sans selection:bg-[#FF5353]/20 selection:text-[#5E2B17]">
        {/* Dedicated Editorial Navigation */}
        <Suspense fallback={<div className="h-18 bg-[#FFF7EE] border-b border-[#E5DCD3]" />}>
          <JournalNavbar />
        </Suspense>

        {/* Main Content Area — Free from marketing watermarks */}
        <main className="flex-1">
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
}
