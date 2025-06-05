import { useCallback, useState, useMemo, useEffect } from "react";
import { useFetcher, useNavigate, useLocation } from "react-router-dom";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from "../../../data/constants/pagination";
import { toast } from "react-toastify";
import { useTransactionData } from "./useTransactionData";
import PropTypes from "prop-types";

export function useTransactionView(transaction, handleClose) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();

  const [localStorageAvailable, setLocalStorageAvailable] = useState(true);

  const parentPath = useMemo(
    () => location.pathname.split("/")[1],
    [location.pathname]
  );

  useEffect(() => {
    try {
      const testKey = "_test_localStorage_";
      localStorage.setItem(testKey, "test");
      const testValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (testValue !== "test") {
        setLocalStorageAvailable(false);
        console.error("localStorage doesn't appear to be working properly");
      }
    } catch (error) {
      setLocalStorageAvailable(false);
      console.error("localStorage is not available:", error);
    }
  }, []);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      toast.success(fetcher.data.message);
      if (localStorageAvailable) {
        localStorage.removeItem("transaction_form_data");
      }

      if (handleClose && typeof handleClose === "function") {
        handleClose();
      }

      navigate(
        `/${parentPath}?page=${DEFAULT_PAGE}&pageSize=${DEFAULT_PAGE_SIZE}`
      );
    } else if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.message);
    }
  }, [fetcher.state, fetcher.data, navigate, parentPath]);

  const isSubmitting = useMemo(
    () => fetcher.state === "submitting",
    [fetcher.state]
  );

  const actions = {
    updateDetails: useCallback(
      (data) => {
        fetcher.submit(JSON.stringify(data), {
          method: "patch",
          action: `/${parentPath}/${transaction.$id}/edit`,
          encType: "application/json",
        });
      },
      [fetcher, transaction.$id]
    ),

    deleteInvoice: useCallback(() => {
      fetcher.submit(null, {
        method: "delete",
        action: `/${parentPath}/${transaction.$id}/delete`,
      });
    }, [fetcher, transaction.$id]),

    navigateToEdit: useCallback(() => {
      navigate(`/${parentPath}/${transaction.$id}/edit`);
    }, [navigate, transaction.$id]),

    navigateToView: useCallback(() => {
      navigate(`/${parentPath}/${invoice.$id}`);
    }, [navigate, transaction.$id]),
  };

  return {
    fetcher,
    isSubmitting,
    actions,
  };
}

useTransactionView.propTypes = {
  initialTransactionData: PropTypes.object,
};
