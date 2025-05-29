function MonthlySummarySkeleton() {
  return (
    <div className="flex flex-col gap-y-2 lg:w-1/3">
      <section className="flex flex-col gap-y-2">
        <div className="flex gap-x-2">
          <article className="flex flex-col gap-y-2 w-1/2 px-4 py-8 rounded-lg bg-grey/20 animate-pulse">
            <div className="h-7 w-16 bg-grey/40 rounded"></div>
            <div className="h-4 w-24 bg-grey/40 rounded"></div>
          </article>
          <article className="flex flex-col gap-y-2 w-1/2 px-4 py-8 rounded-lg bg-grey/20 animate-pulse">
            <div className="h-7 w-16 bg-grey/40 rounded"></div>
            <div className="h-4 w-24 bg-grey/40 rounded"></div>
          </article>
        </div>
        <div className="w-full h-12 bg-grey rounded-lg animate-pulse"></div>
        <div className="w-full h-12 bg-grey rounded-lg animate-pulse"></div>
      </section>
    </div>
  );
}

export default MonthlySummarySkeleton;
