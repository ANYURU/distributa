import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from "../../../data/constants/pagination";

export const parseSearchParams = (searchParams) => {
  return {
    page: parseInt(searchParams.get("page") || DEFAULT_PAGE),
    pageSize: parseInt(searchParams.get("pageSize") || DEFAULT_PAGE_SIZE),
    search: searchParams.get("search") || "",
  };
};

export const parseDateParams = (searchParams) => {
  const dates = {};
  const dateFields = {
    from: "from",
    to: "to",
  };

  Object.entries(dateFields).forEach(([key, param]) => {
    const value = searchParams.get(param);
    if (value) dates[key] = value;
  });

  return Object.keys(dates).length ? { dates } : {};
};

export const parseTransactionParams = (searchParams) => ({
  ...parseSearchParams(searchParams),
  ...parseDateParams(searchParams),
  status: searchParams.get("status") || "",
});

export const createSearchParams = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.pageSize != null)
    params.set("pageSize", String(filters.pageSize));

  const dates = filters.dates || {};

  if (dates?.from) params.set("from", dates.from);
  if (dates?.to) params.set("to", dates.to);

  return params;
};
