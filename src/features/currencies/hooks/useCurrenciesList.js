import { use, useMemo, useCallback } from "react";
import { useFetcher, useLocation } from "react-router-dom";
import usePagination from "../../../hooks/usePagination";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { useRealtime } from "../../../hooks";
import { useCurrencyFilters } from "./useCurrencyFilters";
import { createSearchParams } from "../utils/url-params";

export function useCurrenciesList(currenciesPromise) {
  const { filters, applyFilters } = useCurrencyFilters();
  const location = useLocation();
  const fetcher = useFetcher();

  const resolvedData = use(currenciesPromise);

  const { documents, total } = useMemo(() => {
    if (Array.isArray(resolvedData)) {
      return { documents: resolvedData, total: resolvedData.length };
    } else {
      return {
        documents: resolvedData.documents || [],
        total: resolvedData.total || 0,
      };
    }
  }, [resolvedData]);

  const pagination = useMemo(
    () => ({
      currentPage: filters.page,
      pageSize: filters.pageSize,
    }),
    [filters.page, filters.pageSize]
  );

  const getSearchParams = useCallback(() => {
    return createSearchParams(filters);
  }, [filters]);

  const actions = {
    handlePageChange: useCallback(
      (newPage) => applyFilters({ page: newPage }),
      [applyFilters]
    ),
    handlePageSizeChange: useCallback(
      (newPageSize) => applyFilters({ pageSize: newPageSize, page: 0 }),
      [applyFilters]
    ),
    handleSearchChange: useCallback(
      (searchTerm) => applyFilters({ search: searchTerm, page: 0 }),
      [applyFilters]
    ),
    updateCurrencies: useCallback(
      (data) => {
        fetcher.submit(data, {
          method: "patch",
          action: `/settings/currencies/update`,
        });
      },
      [fetcher]
    ),
  };

  useRealtime(appwriteConfig.collections.currencyPreferences, {
    onCreated: () => {
      fetcher.load(`${location.pathname}?${getSearchParams()}`);
    },
    onUpdated: () => {
      fetcher.load(`${location.pathname}?${getSearchParams()}`);
    },
    onDeleted: () => {
      const newTotal = total - 1;
      const newPages = Math.ceil(newTotal / pagination.pageSize);

      if (pagination.currentPage >= newPages && newPages > 0) {
        actions.handlePageChange(newPages - 1);
      } else {
        fetcher.load(`${location.pathname}?${getSearchParams()}`);
      }
    },
  });

  const paginationControls = usePagination({
    total,
    pageSize: pagination.pageSize,
    currentPage: pagination.currentPage,
    onPageChange: actions.handlePageChange,
    onPageSizeChange: actions.handlePageSizeChange,
  });

  return {
    currencies: documents,
    isLoading: fetcher.state !== "idle",
    pagination: paginationControls,
    total,
    filters,
    applyFilters,
    actions,
  };
}
