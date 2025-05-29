import { account } from "../../../lib/appwrite/client";
import { transactionService } from "../services/transaction.service";
import { parseTransactionParams } from "../utils/url-params";
import { currencyService } from "../../currencies/services/currency.service";
import { balancesService } from "../../balances/services";

export async function transactionsLoader({ request }) {
  const { $id: userId } = await account.get();
  const url = new URL(request.url);
  const params = parseTransactionParams(url.searchParams);

  const transactionsPromise = transactionService.listTransactions(params);
  const currentMonthSummaryPromise = balancesService.getCurrentMonthSummary();
  const currencyPreferencePromise = currencyService.getPreferences(userId);

  return {
    transactions: transactionsPromise,
    currentMonthSummary: currentMonthSummaryPromise,
    currencyPreferences: currencyPreferencePromise,
  };
}

export async function transactionLoader({ params }) {
  try {
    const { $id: userId } = await account.get();
    const transaction = transactionService.getTransaction(params.id);
    const currencyPreference = currencyService.getPreferredCurrency(userId);

    const data = Promise.all([transaction, currencyPreference]);

    return { data };
  } catch (error) {
    return {
      error: true,
      message:
        error.message || "An error occurred while loading the transaction.",
    };
  }
}
