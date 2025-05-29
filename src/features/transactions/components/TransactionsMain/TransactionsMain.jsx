import { use } from "react";
import TransactionList from "../TransactionList";
import TransactionsEmptyState from "../TransactionsEmptyState";

function TransactionsMain({
  transactionsPromise,
  toggleCreateTransactionModal,
}) {
  const data = use(transactionsPromise);

  return data?.total > 0 ? (
    <TransactionList data={data.documents} />
  ) : (
    <TransactionsEmptyState toggleCreate={toggleCreateTransactionModal} />
  );
}

export default TransactionsMain;
