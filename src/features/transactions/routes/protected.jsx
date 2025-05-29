import { transactionsLoader, transactionLoader } from "./loaders";
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
} from "./actions";
import { Transactions, Transaction } from "../../../pages";

export default [
  {
    path: "/transactions",
    loader: transactionsLoader,
    element: <Transactions />,
  },
  {
    path: "/transactions/new",
    action: createTransactionAction,
  },
  {
    path: "/transactions/:id",
    loader: transactionLoader,
    element: <Transaction />,
  },
  {
    path: "/transactions/:id/edit",
    action: updateTransactionAction
  },
  {
    path: "/transactions/:id/delete",
    action: deleteTransactionAction
  },
];
