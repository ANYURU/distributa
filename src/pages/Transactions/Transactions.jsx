import { ContentViewAreaWrapper } from "../../Layouts/components";
import { Button } from "../../components/common/forms";
import { Book } from "../../components/common/icons";
import { useLoaderData, useLocation, useFetcher } from "react-router";
import { CreateTransaction, TransactionDetails } from "../../components/Modals";
import {
  useState,
  useCallback,
  useEffect,
  Suspense,
  useMemo,
  use,
} from "react";
import { groupBy, map, sumBy } from "lodash";
import { format, parse } from "date-fns";
import TransactionRow from "../../features/transactions/components/table/TransactionRow";
import formatCurrency from "../../utils/format.currency";
import { useRealtime } from "../../hooks";
import { useTransactionFilters } from "../../features/transactions/hooks/useTransactionFilters";
import usePagination from "../../hooks/usePagination";
import {
  Pagination,
  PageSizeSelector,
} from "../../components/common/pagination";
import { createSearchParams } from "../../features/transactions/utils/url-params";
import { appwriteConfig } from "../../lib/appwrite/config";

// New component to handle currency preferences promise
function CurrencyDisplay({
  currencyPromise,
  amount,
  prefix = "",
  abbreviate = false,
}) {
  const currencyPreferences = use(currencyPromise);

  return (
    <h3 className="font-archivo font-normal text-xl leading-120 tracking-normal break-words whitespace-normal overflow-visible text-left">
      {currencyPreferences?.preferredCurrency && amount !== "N/A"
        ? formatCurrency(
            amount,
            currencyPreferences.preferredCurrency,
            prefix,
            abbreviate
          )
        : amount}
    </h3>
  );
}

function Footer({ transactionsPromise, paginationControls }) {
  const transactions = use(transactionsPromise);

  const totalPages = Math.max(
    1,
    Math.ceil(transactions.total / paginationControls.pageSize)
  );

  const pagination = {
    ...paginationControls,
    totalPages: totalPages,
    hasNextPage: paginationControls.currentPage < totalPages - 1,
    hasPreviousPage: paginationControls.currentPage > 0,
  };

  return (
    <div className="w-full flex flex-wrap items-center justify-between mt-4 gap-4">
      <PageSizeSelector
        pageSize={pagination.pageSize}
        onPageSizeChange={pagination.onPageSizeChange}
        pageSizeOptions={[10, 25, 50, 100]}
        currentPage={pagination.currentPage}
        totalItems={transactions.total}
      />
      <Pagination {...pagination} />
    </div>
  );
}

function TransactionCurrencyDisplay({ currencyPromise, netBalance, prefix }) {
  const currencyPreferences = use(currencyPromise);

  return (
    <h6 className="font-archivo font-normal text-tiny leading-150 tracking-normal">
      {currencyPreferences?.preferredCurrency
        ? formatCurrency(
            netBalance,
            currencyPreferences.preferredCurrency,
            prefix
          )
        : `${prefix}${netBalance}`}
    </h6>
  );
}

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
          <article className="flex flex-col gap-y-2 w-1/2 px-4 py-8 rounded-lg bg-grey">
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
          // Todo Implement the code that exports this into an income report for this month.
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

function TransactionsMain({
  transactionsPromise,
  toggleCreateTransactionModal,
}) {
  const data = use(transactionsPromise);

  if (data?.total > 0) {
    return <TransactionList data={data.documents} />;
  }

  return (
    <article className="flex flex-col items-center gap-y-4">
      <div className="flex justify-center items-center rounded-full bg-grey w-24 h-24">
        <Book variation="black" />
      </div>
      <div className="flex flex-col gap-y-2">
        <h3 className="font-archivo font-normal text-xl leading-120 tracking-normal text-center">
          No Transactions
        </h3>
        <p className="font-satoshi font-normal text-medium leading-150 tracking-normal text-center">
          You haven't created any transaction yet.
        </p>
      </div>
      <Button
        className="w-fit px-12 py-3 font-bold text-medium"
        onClick={toggleCreateTransactionModal}
      >
        Create Transaction
      </Button>
    </article>
  );
}

const Transactions = () => {
  const loaderData = useLoaderData();
  const location = useLocation();
  const fetcher = useFetcher();

  const [createTransaction, setCreateTransaction] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [partyInfo, setPartyInfo] = useState(null);

  const toggleCreateTransactionModal = useCallback(() => {
    setCreateTransaction((prevState) => !prevState);
    if (createTransaction) {
      setCategoryInfo(null);
    }
  }, [createTransaction]);

  const toggleTransactionDetailsModal = useCallback(() => {
    setShowTransactionDetails((prevState) => !prevState);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Category Info
    const categoryId = searchParams.get("category_id");
    const categoryName = searchParams.get("category_name");
    const categoryType = searchParams.get("category_type");

    // Party Info
    const partyId = searchParams.get("party_id");
    const partyName = searchParams.get("party_name");

    const returnToTransaction = searchParams.get("return_to_transaction");

    if (
      (categoryId && categoryName && categoryType) ||
      (partyId && partyName) ||
      returnToTransaction === "true"
    ) {

      if (categoryId && categoryName && categoryType) {
        setCategoryInfo(() => ({
          id: categoryId,
          name: categoryName,
          type: categoryType,
        }));
      }

      if (partyId && partyName) {
        setPartyInfo(() => ({
          id: partyId,
          name: partyName,
        }));
      }

      setCreateTransaction(true);
    }
  }, [location]);

  const { filters, applyFilters } = useTransactionFilters();

  const currentPath = location.pathname;

  const pagination = useMemo(
    () => ({
      currentPage: filters.page,
      pageSize: filters.pageSize,
    }),
    [filters.page, filters.pageSize]
  );

  const handlePageChange = useCallback(
    (newPage) => applyFilters({ page: newPage }),
    [applyFilters]
  );

  const handleSearchChange = useCallback(
    (searchTerm) => applyFilters({ search: searchTerm, page: 0 }),
    [applyFilters]
  );

  const handleDateChange = useCallback(({ from, to }) => {
    applyFilters({ dates: { from, to } });
  }, []);

  const handlePageSizeChange = useCallback(
    (newPageSize) => applyFilters({ pageSize: newPageSize, page: 0 }),
    [applyFilters]
  );

  const getSearchParams = useCallback(() => {
    return createSearchParams(filters);
  }, [filters]);

  useRealtime(appwriteConfig.collections.transactions, {
    onCreated: () => {
      fetcher.load(`${currentPath}?${getSearchParams()}`);
    },
    onUpdated: () => {
      fetcher.load(`${currentPath}?${getSearchParams()}`);
    },
    onDeleted: () => {
      const data = loaderData.transactions;
      const newTotal = data.total - 1;
      const newPages = Math.ceil(newTotal / pagination.pageSize);

      if (pagination.currentPage >= newPages && newPages > 0) {
        handlePageChange(newPages - 1);
      } else {
        fetcher.load(`${currentPath}?${getSearchParams()}`);
      }
    },
  });

  const paginationControls = usePagination({
    pageSize: pagination.pageSize,
    currentPage: pagination.currentPage,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  });

  return (
    <ContentViewAreaWrapper>
      <section className="flex-1 flex flex-col gap-y-2">
        <header className="flex flex-col gap-y-2">
          <h1 className="font-archivo font-normal text-xl lg:text-4xl leading-110 tracking-normal">
            My Transactions
          </h1>
          <hr className="invisible h-8" />
        </header>
        <div className="flex-1 flex flex-col lg:flex-row-reverse md:gap-x-4">
          <Suspense
            fallback={
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
            }
          >
            <MonthlySummary
              summaryPromise={loaderData.currentMonthSummary}
              currencyPromise={loaderData.currencyPreferences}
              toggleCreateTransactionModal={toggleCreateTransactionModal}
            />
          </Suspense>

          <hr className="invisible h-8 lg:hidden" />
          <main className="flex-1 flex justify-center items-center lg:w-2/3 lg:bg-grey rounded-lg">
            <Suspense
              fallback={
                <ul className="h-full w-full animate-pulse flex flex-col bg-white gap-y-4 justify-center items-center">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <li
                      key={index}
                      className="w-full h-36 bg-grey animate-pulse rounded-lg"
                    ></li>
                  ))}
                </ul>
              }
            >
              <TransactionsMain
                transactionsPromise={
                  fetcher.data?.transactions || loaderData.transactions
                }
                toggleCreateTransactionModal={toggleCreateTransactionModal}
              />
            </Suspense>
          </main>
        </div>
        <Suspense
          fallback={
            <div className="flex gap-x-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-4 w-4 bg-grey animate-pulse rounded-lg"
                ></div>
              ))}
            </div>
          }
        >
          <Footer
            transactionsPromise={
              fetcher.data?.transactions || loaderData.transactions
            }
            paginationControls={paginationControls}
          />
        </Suspense>
      </section>
      {createTransaction && (
        <CreateTransaction
          handleClose={toggleCreateTransactionModal}
          categoryInfo={categoryInfo}
          partyInfo={partyInfo}
        />
      )}
      {showTransactionDetails && transactionDetails && (
        <TransactionDetails
          handleClose={() => {
            setTransactionDetails(null);
            toggleTransactionDetailsModal();
          }}
          transaction={transactionDetails}
        />
      )}
    </ContentViewAreaWrapper>
  );
};

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
    <ul className="flex flex-col h-full w-full  gap-y-4 bg-white">
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

export default Transactions;
