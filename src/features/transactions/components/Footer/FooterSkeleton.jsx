function FooterSkeleton() {
  return (
    <div className="flex gap-x-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-4 w-4 bg-grey animate-pulse rounded-lg"
        ></div>
      ))}
    </div>
  );
}

export default FooterSkeleton;
