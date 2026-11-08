import Image from 'next/image';

// Sign-in shell for the studio admin. The left panel is the studio's own work:
// one real wedding photograph under a scrim, the studio's name, one line on what
// this is. (It used to carry glow blobs, an "Internal Operations Portal" chip,
// "Studio Command Center", "Enterprise Edition" and the old "WB" monogram.)
const PHOTO = 'https://media.theweddingvachan.com/client/6804af4ef012e5e291abec61/YUmdBkyUwF8z/orig.jpg';

export default function AdminAuthLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-ground">
      <aside className="relative hidden w-1/2 overflow-hidden bg-ground-deep lg:block">
        <Image
          src={PHOTO}
          alt=""
          fill
          sizes="50vw"
          className="object-cover object-[38%_50%]"
          preload
        />
        <div aria-hidden="true" className="scrim-hero absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <p className="font-display text-2xl text-ink-onDeep">The Wedding Vachan</p>
          <div className="max-w-md space-y-3">
            <h2 className="font-display text-5xl leading-[1.05] text-ink-onDeep">Studio admin</h2>
            <p className="text-[15px] leading-relaxed text-ink-onDeep opacity-80">
              Enquiries, weddings, stories and the website, in one place.
            </p>
          </div>
          <p className="text-xs text-ink-onDeep opacity-70">© {new Date().getFullYear()} The Wedding Vachan</p>
        </div>
      </aside>

      <main className="flex w-full items-center justify-center bg-ground px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md rounded-xl border border-edge-subtle bg-ground-raised p-8 shadow-overlay sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
