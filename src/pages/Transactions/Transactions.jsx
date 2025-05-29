import { useEffect, Suspense } from "react";
import { useLocation } from "react-router";
import { ContentViewAreaWrapper } from "../../Layouts/components";
import { CreateTransaction, TransactionDetails } from "../../components/Modals";
import { useTransactions } from "../../features/transactions/hooks";
import {
  Footer,
  FooterSkeleton,
  MonthlySummary,
  MonthlySummarySkeleton,
  TransactionsMain,
  TransactionsMainSkeleton,
} from "../../features/transactions/components";

const Transactions = () => {
  const {
    transactions,
    currencyPreferences,
    currentMonthSummary,
    pagination,
    createTransaction,
    showTransactionDetails,
    transactionDetails,
    categoryInfo,
    partyInfo,
    toggleCreateTransactionModal,
    toggleTransactionDetailsModal,
    setCategoryInfo,
    setPartyInfo,
  } = useTransactions();

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const categoryId = searchParams.get("category_id");
    const categoryName = searchParams.get("category_name");
    const categoryType = searchParams.get("category_type");

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

      toggleCreateTransactionModal();
    }
  }, [location, setCategoryInfo, setPartyInfo, toggleCreateTransactionModal]);

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
          <Suspense fallback={<MonthlySummarySkeleton />}>
            <MonthlySummary
              summaryPromise={currentMonthSummary}
              currencyPromise={currencyPreferences}
              toggleCreateTransactionModal={toggleCreateTransactionModal}
            />
          </Suspense>
          <hr className="invisible h-8 lg:hidden" />
          <main className="flex-1 flex justify-center items-center lg:w-2/3 lg:bg-grey rounded-lg">
            <Suspense fallback={<TransactionsMainSkeleton />}>
              <TransactionsMain
                transactionsPromise={transactions}
                toggleCreateTransactionModal={toggleCreateTransactionModal}
              />
            </Suspense>
          </main>
        </div>
        <Suspense fallback={<FooterSkeleton />}>
          <Footer
            transactionsPromise={transactions}
            paginationControls={pagination}
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
          handleClose={toggleTransactionDetailsModal}
          transaction={transactionDetails}
        />
      )}
    </ContentViewAreaWrapper>
  );
};

export default Transactions;
