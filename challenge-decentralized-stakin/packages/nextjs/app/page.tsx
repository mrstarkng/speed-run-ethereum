import Link from "next/link";

export default function HomePage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Decentralized Staker Challenge</h1>
      <p className="text-lg text-slate-300">
        Welcome! Jump into the staking dashboard to pool ETH, monitor the countdown, and execute the challenge flow.
      </p>
      <Link
        className="inline-flex w-fit items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-base font-medium text-white shadow transition hover:bg-indigo-400"
        href="/stakings"
      >
        Open staking dashboard
      </Link>
    </section>
  );
}
