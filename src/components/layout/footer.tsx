export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Daniel Pap Tattoo. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="https://www.instagram.com/danielpap/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-black"
            >
              Instagram
            </a>
            <a
              href="mailto:info@danielpaptattoo.com"
              className="text-sm text-zinc-500 hover:text-black"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
