import ScrollOnTop from '@/Component/ScrollOnTop.jsx';
import Navbar from '@/Component/Navbar.jsx';
import Footer from '@/Component/Footer.jsx';
import Background from '@/Component/Background.jsx';

export default function SiteLayout({ children }) {
  return (
    <>
      <ScrollOnTop />
      <div className="relative min-h-screen">
        <Background />
        <div className="relative z-10">
          <Navbar />
          <main className="pt-[6rem] lg:pr-2 sm:px-2 box-border overflow-hidden">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
