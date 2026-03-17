'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          DANIEL PAP TATTOO
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/flash-gallery" className="text-sm text-zinc-600 hover:text-black">
            Flash Gallery
          </Link>
          <Link
            href="/book"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Book Now
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-zinc-200 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link
              href="/flash-gallery"
              className="text-sm text-zinc-600 hover:text-black"
              onClick={() => setMobileOpen(false)}
            >
              Flash Gallery
            </Link>
            <Link
              href="/book"
              className="rounded-md bg-black px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800"
              onClick={() => setMobileOpen(false)}
            >
              Book Now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
