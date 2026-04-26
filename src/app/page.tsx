import { SearchHero } from "@/components/landing/search-hero";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex min-h-[calc(100dvh-6rem)] items-start px-4 pb-20 pt-[22vh] sm:px-6 sm:pt-[25vh]">
        <div className="mx-auto w-full max-w-[96rem]">
          <SearchHero />
        </div>
      </section>
    </div>
  );
}
