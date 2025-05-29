import { use } from "react";
import formatCurrency from "../../../utils/format.currency";

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

export default TransactionCurrencyDisplay;
