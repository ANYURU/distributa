import { useRef, useCallback, useState, useEffect, memo, useMemo } from "react";
import { Button, AsyncSelect } from ".";
import { CURRENCY_LOCALE_MAP } from "../../../data/constants";
import { useNavigate, useLocation } from "react-router";
import { useFormikContext } from "formik";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { databases, account } from "../../../lib/appwrite/client";
import { Query } from "appwrite";

const FORM_STATE_KEY = "invoice_form_state";

const InvoiceCurrencySelect = memo(({ showCreateOption = false, ...props }) => {
  const formikContext = useFormikContext();
  const formValuesRef = useRef(formikContext.values);
  const { setFieldValue } = formikContext;
  const navigate = useNavigate();
  const location = useLocation();

  const newCurrencyIdRef = useRef(null);
  const [localStorageAvailable, setLocalStorageAvailable] = useState(true);
  const localStorageCheckedRef = useRef(false);

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  formValuesRef.current = formikContext.values;

  useEffect(() => {
    if (!showCreateOption || localStorageCheckedRef.current) return;

    localStorageCheckedRef.current = true;

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
  }, [showCreateOption]);

  const searchParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  useEffect(() => {
    const currencyId = searchParams.get("currency_id");
    const returnFromCurrencies = searchParams.get("return_from_currencies");

    if (!currencyId || returnFromCurrencies !== "true") return;

    newCurrencyIdRef.current = currencyId;

    if (localStorageAvailable) {
      try {
        const savedState = localStorage.getItem(FORM_STATE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);

          Object.keys(parsedState).forEach((key) => {
            if (key !== props.name) {
              setFieldValue(key, parsedState[key]);
            }
          });

          setFieldValue(props.name, currencyId);
          localStorage.removeItem(FORM_STATE_KEY);
        }
      } catch (error) {
        console.error("Error restoring form state:", error);
      }
    }

    if (window.history?.replaceState) {
      const newUrl = `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, setFieldValue, props.name, localStorageAvailable]);

  const generateOption = useCallback((currency) => {
    return {
      value: currency.code,
      label: (
        <div className="p-3 font-satoshi text-tiny">
          {CURRENCY_LOCALE_MAP[currency.code]?.name || currency.code}
        </div>
      ),
    };
  }, []);

  const handleNavigateToCurrencies = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!localStorageAvailable) {
        console.error("Cannot save form state: localStorage is not available");
        navigate("/settings/currencies?return_to_invoice=true");
        return;
      }

      try {
        localStorage.setItem(
          FORM_STATE_KEY,
          JSON.stringify(formValuesRef.current)
        );
        navigate("/settings/currencies?return_to_invoice=true");
      } catch (error) {
        console.error("Error saving form state:", error);
        navigate("/settings/currencies?return_to_invoice=true");
      }
    },
    [localStorageAvailable, navigate]
  );

  const setCurrenciesOption = useMemo(
    () => ({
      value: "new",
      label: (
        <div className="border-t border-t-[#CCCCCC] bg-white p-3">
          <Button
            type="button"
            className="font-medium text-[0.5rem] px-2 h-4 py-0 align-middle border-transparent text-black"
            onClick={handleNavigateToCurrencies}
            kind="secondary"
          >
            Set Currencies
          </Button>
        </div>
      ),
      isDisabled: true,
    }),
    [handleNavigateToCurrencies]
  );

  useEffect(() => {
    let isMounted = true;

    if (initialLoadComplete) return;

    setLoading(true);

    async function fetchOptions() {
      try {
        const { $id: userId } = await account.get();
        const queries = [
          Query.limit(100),
          Query.equal("is_available", true),
          Query.equal("user_id", userId),
        ];

        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.currencyPreferences,
          queries
        );

        let loadedOptions = [];
        if (response?.total > 0) {
          loadedOptions = response.documents.map(generateOption);
        }
        loadedOptions.push(setCurrenciesOption);

        if (isMounted) {
          setOptions(loadedOptions);
          setInitialLoadComplete(true);
        }
      } catch (error) {
        if (isMounted) {
          setOptions([setCurrenciesOption]);
          setInitialLoadComplete(true);
        }
        console.error("Error loading options:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOptions();

    return () => {
      isMounted = false;
    };
  }, [generateOption, setCurrenciesOption, initialLoadComplete]);

  const loadOptions = useCallback(
    async (inputValue) => {
      if (!inputValue && options.length > 0) {
        return options;
      }

      if (!inputValue) {
        return options;
      }

      try {
        const { $id: userId } = await account.get();
        const queries = [
          Query.limit(100),
          Query.equal("is_available", true),
          Query.equal("user_id", userId),
        ];

        const searchTerm = inputValue.trim().toLowerCase();

        const matchedCodesByName = Object.entries(CURRENCY_LOCALE_MAP)
          .filter(([, data]) => data.name?.toLowerCase().includes(searchTerm))
          .map(([code]) => code);

        const matchedCodesByCode = Object.keys(CURRENCY_LOCALE_MAP).filter(
          (code) => code.toLowerCase().includes(searchTerm)
        );

        const matchedCodesByLocale = Object.entries(CURRENCY_LOCALE_MAP)
          .filter(([, data]) => {
            if (Array.isArray(data.locales)) {
              return data.locales.some(
                (locale) =>
                  locale.code?.toLowerCase().includes(searchTerm) ||
                  locale.name?.toLowerCase().includes(searchTerm)
              );
            }
            return false;
          })
          .map(([code]) => code);

        const matches = [
          ...new Set([
            ...matchedCodesByName,
            ...matchedCodesByCode,
            ...matchedCodesByLocale,
          ]),
        ];

        if (matches.length > 0) {
          queries.push(Query.equal("code", matches));
        } else {
          queries.push(
            Query.or([
              Query.contains("code", searchTerm),
              Query.contains("locale", searchTerm),
            ])
          );
        }

        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.currencyPreferences,
          queries
        );

        let loadedOptions = [];
        if (response?.total > 0) {
          loadedOptions = response.documents.map(generateOption);
        }
        loadedOptions.push(setCurrenciesOption);

        return loadedOptions;
      } catch (error) {
        return [setCurrenciesOption];
      }
    },
    [generateOption, setCurrenciesOption, options]
  );

  const selectedValue = useMemo(() => {
    const currentValue = formikContext.values[props.name];
    if (!currentValue || currentValue === "new") {
      const ugxOption = options.find((opt) => opt.value === "UGX");
      return ugxOption || null;
    }
    return options.find((opt) => opt.value === currentValue) || null;
  }, [options, formikContext.values, props.name]);

  const handleChange = useCallback(
    (selectedOption) => {
      const value = selectedOption ? selectedOption.value : "";
      setFieldValue(props.name, value);
    },
    [setFieldValue, props.name]
  );

  return (
    <AsyncSelect
      value={selectedValue}
      handleChange={handleChange}
      loadOptions={loadOptions}
      defaultOptions={options}
      cacheOptions={true}
      onCreateOption={showCreateOption ? handleNavigateToCurrencies : undefined}
      isLoading={loading}
      options={options}
      {...props}
    />
  );
});

InvoiceCurrencySelect.displayName = "InvoiceCurrencySelect";

export default InvoiceCurrencySelect;