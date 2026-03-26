'use client';

import Link from 'next/link';
import { TopNav } from '@/components/TopNav';
import { cn } from '@/lib/cn';

const upcomingRooms = [
  {
    name: 'Interview Prep Circle',
    members: '4.8k members',
    activity: 'Daily discussion threads',
    topic: 'System Design + DSA prep plans',
  },
  {
    name: 'Streak Warriors',
    members: '3.1k members',
    activity: '24h challenge board',
    topic: 'Daily accountability and consistency',
  },
  {
    name: 'Company Buckets',
    members: '5.2k members',
    activity: 'Top company question drops',
    topic: 'Amazon, Google, Meta focused sets',
  },
];

const futureModules = [
  {
    title: 'Peer Review Rooms',
    description: 'Post your approach, compare alternatives, and collect feedback from advanced peers.',
  },
  {
    title: 'Mentor Office Hours',
    description: 'Weekly live sessions for debugging strategy, revision plans, and interview simulation.',
  },
  {
    title: 'Battle Threads',
    description: 'Small-group timed challenges where teams race and explain optimized solutions.',
  },
  {
    title: 'Reputation & Badges',
    description: 'Earn rank points for helping others, writing clean explanations, and solving hard sets.',
  },
];

export default function CommunityPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav activeHref="/community" />
      <main className="mx-auto max-w-6xl px-4 py-8 pt-24 md:px-8 md:py-12 md:pt-28">
        <section className="relative overflow-hidden rounded-3xl border border-outline-variant bg-gradient-to-br from-secondary-container/30 via-surface-container-low to-primary-container/30 p-8 md:p-12">
          <div className="absolute -left-8 top-0 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />

          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Coming Soon</p>
          <h1 className="mt-3 max-w-3xl font-headline text-3xl font-extrabold tracking-tight md:text-5xl">
            Community Hub for Learning Together
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-on-surface-variant md:text-base">
            Ask doubts, join challenge circles, and learn how others think through the same
            problems with different tradeoffs.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold">
              Discussion feeds
            </span>
            <span className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold">
              Mentor-led sessions
            </span>
            <span className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold">
              Peer code reviews
            </span>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {upcomingRooms.map((room) => (
            <article
              key={room.name}
              className="rounded-2xl border border-outline-variant bg-surface-container-low p-5"
            >
              <h2 className="font-headline text-xl font-bold">{room.name}</h2>
              <p className="mt-1 text-sm text-primary">{room.members}</p>
              <p className="mt-4 text-sm text-on-surface-variant">{room.activity}</p>
              <p className="mt-2 text-sm font-medium">{room.topic}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-outline-variant bg-surface-container-low p-6 md:p-8">
          <h3 className="font-headline text-2xl font-bold">Future Modules Preview</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {futureModules.map((module) => (
              <article
                key={module.title}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
              >
                <h4 className="font-headline text-lg font-bold">{module.title}</h4>
                <p className="mt-2 text-sm text-on-surface-variant">{module.description}</p>
              </article>
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
