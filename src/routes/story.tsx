import { createFileRoute, Link } from "@tanstack/react-router";

import barista from "@/assets/barista.png";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Our Story — Boost Coffee Shop" },
      {
        name: "description",
        content:
          "From a two-burner roaster in a back alley to six farm partners: how Boost Coffee roasts, cups and hand-letters every bag.",
      },
      { property: "og:title", content: "Our Story — Boost Coffee Shop" },
      {
        property: "og:description",
        content: "How Boost Coffee roasts, cups and hand-letters every bag.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoryPage,
});

const timeline = [
  ["2019", "A two-burner roaster in a back alley and one very patient neighbour."],
  ["2021", "First farm partnership in Yirgacheffe; the olive-green bags appear."],
  ["2023", "The corner shop opens. Latte art classes every second Sunday."],
  ["2026", "Six farm partners, two roast days a week, 1.2k cups poured weekly."],
];

function StoryPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow text-marker">The story</p>
        <h1 className="mt-3 max-w-3xl text-5xl md:text-6xl">
          One roastery, <span className="script text-marker">a lot</span> of very awake
          people.
        </h1>

        <div className="mt-12 grid items-center gap-12 md:grid-cols-2">
          <img
            src={barista}
            alt="Illustrated barista in a checkered apron pouring latte art"
            width={912}
            height={1104}
            loading="lazy"
            className="mx-auto w-full max-w-sm"
          />
          <div>
            <p className="text-muted-foreground">
              Boost started because nobody on our street could find a decent cup before
              8am. We bought a tiny sample roaster, burnt a lot of beans, and slowly got
              good at it.
            </p>
            <p className="mt-4 text-muted-foreground">
              Today we cup every lot ourselves, roast Tuesdays and Fridays, and
              hand-letter every bag that leaves the counter. Nothing sits longer than 48
              hours between roast and cup.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-6">
              {[
                ["6", "Farm partners"],
                ["48h", "Roast to cup"],
                ["1.2k", "Cups a week"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-3xl text-primary">{value}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/60 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl md:text-4xl">How we got here</h2>
          <ol className="mt-8 space-y-6">
            {timeline.map(([year, copy]) => (
              <li key={year} className="flex gap-6">
                <span className="font-display text-2xl text-primary">{year}</span>
                <p className="pt-1 text-sm text-muted-foreground">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="script text-4xl text-marker">come taste the difference</p>
        <Link
          to="/menu"
          className="mt-6 inline-block rounded-full bg-primary px-7 py-3 font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Browse the counter
        </Link>
      </section>
    </>
  );
}
