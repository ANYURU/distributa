import { Suspense, useCallback, useMemo } from "react";
import { useLoaderData } from "react-router";
import { groupBy, map, sumBy } from "lodash";
import { format, parse } from "date-fns";
import TransactionRow from "./table/TransactionRow";
import TransactionCurrencyDisplay from "./TransactionCurrencyDisplay";

function TransactionList({ data }) {
  const loaderData = useLoaderData();

  const transactionList = useMemo(() => {
    const grouped = groupBy(data, (transaction) =>
      format(transaction.date, "yyyy-MM-dd")
    );

    return map(grouped, (groupedTransactions, date) => ({
      date,
      transactions: groupedTransactions || [],
    }));
  }, [data]);

  const formatDateString = useCallback((dateString) => {
    const date = parse(dateString, "yyyy-MM-dd", new Date());
    return format(date, "MMMM d");
  }, []);

  /**
   * @function getNetBalance
   * @description returns the difference between the total income and expenditure of a days transactions
   * @param { Array } transactions An array of transactions
   * @returns { number } The difference between the income and expenditure
   */
  const getNetBalance = useCallback((transactions) => {
    const groupedByType = groupBy(transactions, "flow_type");
    const totalIncome = sumBy(groupedByType["income"] || [], "amount") || 0;
    const totalExpenditure =
      sumBy(groupedByType["expense"] || [], "amount") || 0;
    return totalIncome - totalExpenditure;
  }, []);

  const getPrefix = useCallback((amount) => (amount < 0 ? "-" : "+"), []);

  return (
    <ul className="flex flex-col h-full w-full gap-y-4 bg-white">
      {transactionList.map(({ date, transactions }) => {
        const netBalance = getNetBalance(transactions);
        const prefix = getPrefix(netBalance);

        return (
          <li
            key={date}
            className="flex flex-col gap-y-2 p-4 rounded-lg bg-grey overflow-x-auto"
          >
            <header className="flex justify-between">
              <h6 className="font-archivo font-normal text-tiny leading-150 tracking-normal">
                {formatDateString(date)}
              </h6>
              <Suspense
                fallback={
                  <h6 className="font-archivo font-normal text-tiny leading-150 tracking-normal w-20 h-3 bg-gray-100 animate-pulse"></h6>
                }
              >
                <TransactionCurrencyDisplay
                  currencyPromise={loaderData.currencyPreferences}
                  netBalance={netBalance}
                  prefix={prefix}
                />
              </Suspense>
            </header>
            <table className="w-full">
              <tbody>
                {transactions.map((transaction) => (
                  <TransactionRow
                    transaction={transaction}
                    key={transaction.$id}
                  />
                ))}
              </tbody>
            </table>
          </li>
        );
      })}
    </ul>
  );
}

export default TransactionList;
