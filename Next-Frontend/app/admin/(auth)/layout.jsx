// Luxury split-screen auth shell for Wedding Boys Studio.
export default function AdminAuthLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-[#FAF8F5]">
      {/* Studio Luxury Brand Panel — hidden on small screens */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#12100E] via-[#1C1917] to-[#29221C] p-16 text-white lg:flex border-r border-[#E7E2DA]/10">
        {/* Soft studio ambient glow */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#C5A880]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-[#8C532B]/15 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-serif font-bold text-[#C5A880] border border-white/10">
              WB
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A880]">
                The Wedding Boys
              </p>
              <p className="text-[11px] font-sans uppercase tracking-widest text-[#A8A29E]">
                Studio Command Center
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <span className="inline-block rounded-full border border-[#C5A880]/30 bg-[#C5A880]/10 px-3 py-1 text-[11px] font-medium tracking-wider text-[#C5A880] uppercase">
            Internal Operations Portal
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-normal leading-[1.15] text-[#FAF8F5]">
            Turning intimate moments into <span className="italic text-[#C5A880]">enduring cinema</span>.
          </h2>
          <p className="text-sm font-sans leading-relaxed text-[#A8A29E]">
            Secure workspace for client management, cinema delivery pipelines, editorial publishing, and studio operations.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-[#78716C]">
          <span>© {new Date().getFullYear()} The Wedding Boys Studio</span>
          <span className="font-mono text-[11px] tracking-wider uppercase">Enterprise Edition</span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 bg-[#FAF8F5]">
        <div className="w-full max-w-md rounded-2xl border border-[#E7E2DA] bg-white p-8 sm:p-10 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
