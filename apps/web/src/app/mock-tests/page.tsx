import Link from 'next/link';
import { cn } from '@/lib/cn';

const navTabs = [
  { label: 'Curriculum', href: '/' },
  { label: 'Mock Tests', href: '/mock-tests' },
  { label: 'Community', href: '/community' },
];

const upcomingSeries = [
  {
    title: 'Weekly Algorithm Sprint',
    frequency: 'Every Saturday',
    problems: 12,
    duration: '90 min',
    difficultyMix: 'Easy 30% · Medium 50% · Hard 20%',
  },
  {
    title: 'FAANG Pattern Drill',
    frequency: 'Twice a week',
    problems: 8,
    duration: '60 min',
    difficultyMix: 'Easy 15% · Medium 65% · Hard 20%',
  },
  {
    title: 'Dynamic Programming Arena',
    frequency: 'Every Sunday',
    problems: 10,
    duration: '120 min',
    difficultyMix: 'Easy 10% · Medium 50% · Hard 40%',
  },
];

const plannedFeatures = [
  'Adaptive test generation based on weak topics',
  'Timed leaderboard with percentile and rank shifts',
  'Detailed post-test analytics and revision queue',
  'Company-specific mock sets and difficulty presets',
];

export default function MockTestsPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-low/90 px-4 backdrop-blur-md md:px-6">
        <Link href="/" className="font-headline text-lg font-extrabold tracking-tight md:text-xl">
          DSA Architect
        </Link>
        <div className="flex items-center gap-5">
          {navTabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                'hidden py-5 text-sm font-bold tracking-tight transition-colors md:block',
                tab.href === '/mock-tests'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-on-surface-variant hover:text-primary',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-outline-variant bg-gradient-to-br from-primary-container/30 via-surface-container-low to-secondary-container/30 p-8 md:p-12">
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-14 left-10 h-44 w-44 rounded-full bg-secondary/25 blur-3xl" />

          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Coming Soon</p>
          <h1 className="mt-3 max-w-3xl font-headline text-3xl font-extrabold tracking-tight md:text-5xl">
            Mock Test Arena with Real Interview Pressure
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-on-surface-variant md:text-base">
            Practice in timed rounds with topic-balanced sets, ranking snapshots, and actionable
            feedback after each attempt.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold">
              Launching in next release cycle
            </span>
            <span className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold">
              100% Static preview
            </span>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {upcomingSeries.map((series) => (
            <article
              key={series.title}
              className="rounded-2xl border border-outline-variant bg-surface-container-low p-5"
            >
              <h2 className="font-headline text-xl font-bold">{series.title}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{series.frequency}</p>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Problems</dt>
                  <dd className="font-semibold">{series.problems}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Duration</dt>
                  <dd className="font-semibold">{series.duration}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Mix</dt>
                  <dd className="text-right font-semibold">{series.difficultyMix}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-outline-variant bg-surface-container-low p-6 md:p-8">
          <h3 className="font-headline text-2xl font-bold">What You’ll Get</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {plannedFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-medium"
              >
                {feature}
              </div>
            ))}
          </div>
          <div className="mt-7">
            <Link
              href="/"
              className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-all hover:brightness-110"
            >
              Back to Curriculum
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
