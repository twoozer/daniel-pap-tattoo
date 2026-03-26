'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Daniel Pap Tattoo" width={44} height={44} className="rounded-full" />
          <span className="text-xl font-bold tracking-tight">DANIEL PAP TATTOO</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="https://danielpaptattoo.com"
            className="text-sm text-zinc-600 hover:text-black"
          >
            Main Website
          </a>
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
            <a
              href="https://danielpaptattoo.com"
              className="text-sm text-zinc-600 hover:text-black"
              onClick={() => setMobileOpen(false)}
            >
              Main Website
            </a>
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
