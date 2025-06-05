import { useFetcher, useLoaderData, useLocation } from "react-router-dom";
import { useMemo, useCallback, useState } from "react";
import usePagination from "../../../hooks/usePagination";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { useRealtime } from "../../../hooks";
import { useTransactionFilters } from "./useTransactionFilters";
import { createSearchParams } from "../utils/url-params";

export function useTransactions() {
  const [createTransaction, setCreateTransaction] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  const { filters, applyFilters } = useTransactionFilters();
  const location = useLocation();

  const fetcher = useFetcher();

  const loaderData = useLoaderData();

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

  const handlePageSizeChange = useCallback(
    (newPageSize) => applyFilters({ pageSize: newPageSize, page: 0 }),
    [applyFilters]
  );

  const handleSearchChange = useCallback(
    (searchTerm) => applyFilters({ search: searchTerm, page: 0 }),
    [applyFilters]
  );

  const handleStartFromChange = useCallback(
    (startFrom) => applyFilters({ startFrom, page: 0 }),
    [applyFilters]
  );

  const getSearchParams = useCallback(() => {
    return createSearchParams(filters);
  }, [filters]);

  const toggleCreateTransactionModal = useCallback(() => {
    setCreateTransaction(!createTransaction);
    if (createTransaction) setTransactionDetails(null);
  }, [createTransaction]);

  const toggleTransactionDetailsModal = useCallback((transaction) => {
    setShowTransactionDetails((prev) => !prev);
  }, []);

  const handleTransactionDetails = useCallback(
    (transaction) => {
      setTransactionDetails(transaction);
      toggleTransactionDetailsModal();
    },
    [toggleTransactionDetailsModal]
  );

  useRealtime(appwriteConfig.collections.transactions, {
    onCreated: () => {
      fetcher.load(`${currentPath}?${getSearchParams()}`);
    },
    onUpdated: () => {
      fetcher.load(`${currentPath}?${getSearchParams()}`);
    },
    onDeleted: () => {
      const newTotal = total - 1;
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

  return {
    transactions: fetcher?.data?.transactions || loaderData.transactions,
    currencyPreferences: loaderData.currencyPreferences,
    currentMonthSummary: loaderData.currentMonthSummary,
    isLoading: fetcher.state !== "idle",
    pagination: paginationControls,
    filters,
    createTransaction,
    showTransactionDetails,
    transactionDetails,
    applyFilters,
    handleSearchChange,
    handleStartFromChange,
    toggleCreateTransactionModal,
    toggleTransactionDetailsModal,
    handleTransactionDetails,
  };
}
