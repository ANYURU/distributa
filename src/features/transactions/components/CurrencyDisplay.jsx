import { use } from "react";
import formatCurrency from "../../../utils/format.currency";

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

export default CurrencyDisplay;
