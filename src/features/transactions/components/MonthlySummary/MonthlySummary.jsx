import { Suspense, use } from "react";
import { Button } from "../../../../components/common/forms";
import CurrencyDisplay from "../CurrencyDisplay";

function MonthlySummary({
  summaryPromise,
  currencyPromise,
  toggleCreateTransactionModal,
}) {
  const data = use(summaryPromise);
  const income = data?.income ?? "N/A";
  const expense = data?.expense ?? "N/A";

  return (
    <div className="flex flex-col gap-y-2 lg:w-1/3">
      <section className="flex flex-col gap-y-2 ">
        <div className="flex gap-x-2">
          <article className="flex flex-col gap-y-2 w-1/2 px-4 py-8 rounded-lg bg-grey justify-between">
            <Suspense
              fallback={
                <h3 className="font-archivo font-normal text-xl leading-120 tracking-0 w-10 h-4 bg-gray-100 animate-pulse"></h3>
              }
            >
              <CurrencyDisplay
                currencyPromise={currencyPromise}
                amount={income}
                abbreviate={true}
              />
            </Suspense>
            <p className="font-satoshi font-regular text-tiny leading-100 tracking-normal">
              Income this month
            </p>
          </article>
          <article className="flex flex-col gap-y-2 w-1/2 px-4 py-8 rounded-lg bg-grey justify-between">
            <Suspense
              fallback={
                <h3 className="font-archivo font-normal text-xl leading-120 tracking-0 w-10 h-4 bg-gray-100 animate-pulse"></h3>
              }
            >
              <CurrencyDisplay
                currencyPromise={currencyPromise}
                amount={expense}
                abbreviate={true}
              />
            </Suspense>
            <p className="font-satoshi font-regular text-tiny leading-100 tracking-normal">
              Expenses this month
            </p>
          </article>
        </div>
        <Button
          type="button"
          className="w-full px-6 py-3 font-bold text-small"
          kind="plain"
          disabled={!(income || expense)}
          // TODO: Implement the code that exports this into an income report for this month.
        >
          Export PDF Report
        </Button>
        <Button
          type="button"
          className="w-full px-6 py-3 font-bold text-small"
          onClick={toggleCreateTransactionModal}
        >
          Add New
        </Button>
      </section>
    </div>
  );
}

export default MonthlySummary;
