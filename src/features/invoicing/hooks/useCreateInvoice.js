import { useCallback } from "react";
import { useFetcher, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from "../../../data/constants/pagination";
import { toast } from "react-toastify";
import { useLoaderData } from "react-router";

export function useCreateInvoice() {
  const loaderData = useLoaderData();

  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();

  const parentPath = location.pathname.split("/")[1];

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      toast.success(fetcher.data.message);
      navigate(
        `/${parentPath}?page=${DEFAULT_PAGE}&pageSize=${DEFAULT_PAGE_SIZE}`
      );
    } else if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.message);
    }
  }, [fetcher?.state, fetcher?.data, navigate]);

  const actions = {
    createInvoice: useCallback(
      (data) => {
        fetcher.submit(JSON.stringify(data), {
          method: "post",
          action: `/${parentPath}/new`,
          encType: "application/json",
        });
      },
      [fetcher, parentPath]
    ),
  };
  
  return {
    organisation: loaderData.organisation,
    currencies: loaderData.currencies,
    invoices: loaderData.invoices,
    isLoading: fetcher.state === "submitting",
    actions,
  };
}
