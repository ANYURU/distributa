function TransactionsMainSkeleton() {
  return (
    <ul className="h-full w-full animate-pulse flex flex-col bg-white gap-y-4 justify-center items-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <li
          key={index}
          className="w-full h-36 bg-grey animate-pulse rounded-lg"
        ></li>
      ))}
    </ul>
  );
}

export default TransactionsMainSkeleton;
