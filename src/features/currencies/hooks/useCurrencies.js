import { useFetcher, useLoaderData, useLocation } from "react-router-dom";
import { useCallback } from "react";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { useRealtime } from "../../../hooks";
import { useCurrencyFilters } from "./useCurrencyFilters";
import { createSearchParams } from "../utils/url-params";

export function useCurrencies() {
  const { filters, applyFilters } = useCurrencyFilters();
  const location = useLocation();
  const fetcher = useFetcher();

  const { currencies: currenciesPromise } = useLoaderData();

  const getSearchParams = useCallback(() => {
    return createSearchParams(filters);
  }, [filters]);

  useRealtime(appwriteConfig.collections.currencyPreferences, {
    onCreated: () => {
      fetcher.load(`${location.pathname}?${getSearchParams()}`);
    },
    onUpdated: () => {
      fetcher.load(`${location.pathname}?${getSearchParams()}`);
    },
    onDeleted: () => {
      fetcher.load(`${location.pathname}?${getSearchParams()}`);
    },
  });

  const actions = {
    updateCurrencies: useCallback(
      (data) => {
        fetcher.submit(data, {
          method: "patch",
          action: `/settings/currencies/update`,
        });
      },
      [fetcher]
    ),
    handleSearchChange: useCallback(
      (searchTerm) => applyFilters({ search: searchTerm, page: 0 }),
      [applyFilters]
    ),
  };

  return {
    currenciesPromise, 
    isLoading: fetcher.state !== "idle",
    filters,
    applyFilters,
    actions,
  };
}
