import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Palette, Calendar, MessageSquare } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-black px-4 py-24 text-white md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Book Your Next Tattoo
            </h1>
            <p className="mt-6 text-lg text-zinc-400 md:text-xl">
              Browse the flash gallery, select your own design, or book a consultation.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Clean, Classic, Fast Tattooing on the Gold Coast.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-black hover:bg-zinc-200"
              >
                Book an Appointment
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/flash-gallery"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-600 px-6 py-3 text-sm font-medium text-white hover:border-zinc-400"
              >
                Browse Flash Designs
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold md:text-3xl">
              How it works
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Palette size={20} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  1. Choose your design
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Pick from my flash gallery, describe your own idea, or book a
                  free consultation if you&apos;re not sure yet.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Calendar size={20} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  2. Pick your slot
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Select a date and time that works for you. Pay a small 20%
                  deposit to lock it in.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <MessageSquare size={20} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  3. Get tattooed
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Chat with me to finalise details, then show up on the
                  day. Simple.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Booking options */}
        <section className="bg-zinc-50 px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold md:text-3xl">
              Ready to get started?
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Link
                href="/book"
                className="group rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-semibold group-hover:underline">
                  I know what I want
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  You have a design in mind or want to pick from the flash
                  gallery. Let&apos;s book it in.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                  Book now <ArrowRight size={14} />
                </span>
              </Link>

              <Link
                href="/book?type=consultation"
                className="group rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-semibold group-hover:underline">
                  I need some guidance
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Not sure on the design or size? Book a free 30-minute
                  consultation to discuss ideas.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                  Book consultation <ArrowRight size={14} />
                </span>
              </Link>

              <Link
                href="/flash-gallery"
                className="group rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-semibold group-hover:underline">
                  Just browsing
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Check out my latest flash designs for inspiration. You can
                  book any design directly from the gallery.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                  View gallery <ArrowRight size={14} />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
