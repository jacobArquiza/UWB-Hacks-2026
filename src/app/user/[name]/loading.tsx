export default function UserLoading() {
  return (
    <div className="shell flex flex-1 flex-col gap-6 py-8 sm:py-10">
      <div className="h-72 animate-pulse rounded-[2rem] border border-white/8 bg-white/[0.03]" />
      <div className="h-64 animate-pulse rounded-[2rem] border border-white/8 bg-white/[0.03]" />
      <div className="h-72 animate-pulse rounded-[2rem] border border-white/8 bg-white/[0.03]" />
    </div>
  );
}
