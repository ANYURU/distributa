import { useState, useRef, useEffect } from "react";
import { Formik, Form, useFormikContext } from "formik";
import * as Yup from "yup";
import { FiX, FiSearch, FiUser } from "react-icons/fi";
import { MdTune } from "react-icons/md";
import { Button } from "../../../components/common/forms";
import { useTransactions } from "../hooks";
import {
  CommonSelect,
  PartySelect,
  CategorySelect,
} from "../../../components/common/forms";
import {
  FormikTextField,
  FormikFieldIcons,
} from "../../../components/common/forms/FormikFields";

const validationSchema = Yup.object({
  search: Yup.string(),
  dates: Yup.object({
    from: Yup.date().nullable(),
    to: Yup.date()
      .nullable()
      .when("from", (from, schema) =>
        from && from?.[0] !== undefined
          ? schema.min(from, "End date must be after start date")
          : schema
      ),
  }),
  category: Yup.string(),
  flow_type: Yup.string(),
  contact: Yup.string(),
  status: Yup.string(),
  amount: Yup.string(),
});

const initialValues = {
  search: "",
  dates: { from: "", to: "" },
  category: "",
  flow_type: "",
  contact: "",
  status: "",
  amount: "",
};

const useFormikFilters = () => {
  const formik = useFormikContext();
  return formik;
};

const SearchInput = ({ disabled }) => {
  const { values, setFieldValue, handleChange } = useFormikFilters();
  const { handleSearchChange } = useTransactions();

  return (
    <>
      <label htmlFor="input-search-bar" className="sr-only">
        Search transactions
      </label>
      <input
        type="text"
        id="input-search-bar"
        name="search"
        value={values.search}
        onChange={(e) => {
          handleChange(e);
          handleSearchChange("");
        }}
        placeholder="Search"
        className="font-normal font-satoshi text-tiny tracking-normal outline-none ring-0 leading-100 px-1 py-3 w-[14rem] md:w-[17.375rem]"
        disabled={disabled}
        aria-label="Search transactions"
      />
      <button
        type="button"
        onClick={() => {
          setFieldValue("search", "");
          handleSearchChange("");
        }}
        className={`p-2 hover:bg-grey group rounded-full ${
          values.search ? "" : "invisible"
        }`}
        aria-label="Clear search"
        disabled={!values.search}
      >
        <FiX className="w-4 h-4 group-disabled:text-greyborder" />
      </button>
    </>
  );
};

// Date preset buttons component
const DatePresetButtons = () => {
  const { setFieldValue } = useFormikFilters();

  const presetDates = [
    { label: "Today", days: 0 },
    { label: "Last 7 Days", days: 7 },
    { label: "This Month", days: 30 },
    { label: "Last 3 Months", days: 90 },
  ];

  const handleDatePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const startDate = start.toISOString().split("T")[0];
    const endDate = end.toISOString().split("T")[0];

    setFieldValue("dates.from", startDate);
    setFieldValue("dates.to", endDate);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {presetDates.map((preset) => (
        <Button
          key={preset.label}
          type="button"
          onClick={() => handleDatePreset(preset.days)}
          kind="secondary"
          className="px-3 py-1 text-tiny rounded-full transition-colors"
          data-testid={`preset-${preset.label
            .toLowerCase()
            .replace(/\s/g, "-")}`}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
};

const StatusFilter = () => {
  const { values, setFieldValue } = useFormikFilters();

  const statuses = [
    { id: "", name: "All Statuses" },
    { id: "pending", name: "Draft", color: "bg-greyborder" },
    { id: "cleared", name: "Sent", color: "bg-success" },
    { id: "bounced", name: "Viewed", color: "bg-orange-400" },
    { id: "failed", name: "Partial", color: "bg-yellow-400" },
    { id: "void", name: "Paid", color: "bg-error" },
  ];

  const handleStatusChange = (statusId) => {
    setFieldValue("status", values.status === statusId ? "" : statusId);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="flex items-center gap-2 font-satoshi text-sm font-normal leading-100 tracking-normal">
        Status
      </legend>
      <div className="flex flex-wrap gap-2">
        {statuses.slice(1).map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => handleStatusChange(status.id)}
            className={`flex items-center gap-2 w-fit p-2 rounded-lg transition-colors text-tiny font-satoshi ${
              values.status === status.id
                ? "bg-accent-50 text-accent"
                : "bg-gray-50 hover:bg-gray-100"
            }`}
            data-testid={`status-${status.id}`}
            aria-pressed={values.status === status.id}
          >
            <span
              className={`w-2 h-2 rounded-full ${status.color}`}
              aria-hidden="true"
            ></span>
            {status.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
};

export const TransactionFilters = () => {
  const { applyFilters } = useTransactions();
  const [isExtendedOpen, setIsExtendedOpen] = useState(false);
  const extendedRef = useRef(null);
  const searchFormRef = useRef(null);

  const types = [
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
  ];

  const toggleExtended = () => setIsExtendedOpen(!isExtendedOpen);

  const handleSearchSubmit = (values) => {
    applyFilters({
      search: values.search,
      dates: { from: "", to: "" },
      status: "",
      category: "",
      flow_type: "",
      contact: "",
      amount: "",
    });
  };

  const handleApplyExtendedFilters = (values) => {
    console.log("Selected Filters: ", values);
    applyFilters({
      search: values.search,
      dates: values.dates,
      status: values.status,
      category: values.category,
      flow_type: values.flow_type,
      contact: values.contact,
      amount: values.amount,
    });
    setIsExtendedOpen(false);
  };

  const handleResetFilters = (resetForm) => {
    resetForm();
    applyFilters(initialValues);
    setIsExtendedOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (extendedRef.current && !extendedRef.current.contains(event.target)) {
        setIsExtendedOpen(false);
      }
    };
    if (isExtendedOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExtendedOpen]);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleApplyExtendedFilters}
      enableReinitialize
    >
      {({ values, resetForm, handleSubmit: formikHandleSubmit, isValid }) => (
        <div className="relative">
          {/* Main Search Bar */}
          <Form
            ref={searchFormRef}
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit(values);
            }}
            aria-label="Search transactions"
            className="flex rounded-full items-center bg-white transition-colors border border-greyborder w-fit focus-within:border-accent px-2 py-0.5"
          >
            <button
              type="submit"
              className="p-2 hover:bg-grey bg-white transition-colors rounded-full group"
              aria-label="Search transactions"
              disabled={!values.search}
            >
              <FiSearch className="w-5 h-5 group-disabled:text-greyborder" />
            </button>

            <SearchInput />

            <button
              type="button"
              className="w-fit h-fit p-2 font-bold text-small flex items-center gap-2 hover:bg-grey rounded-full"
              onClick={toggleExtended}
              aria-label="Toggle filter panel"
              data-testid="open-extended-filters"
              disabled={isExtendedOpen}
            >
              <MdTune className="h-5 w-5 rounded-full" />
            </button>
          </Form>

          {/* Extended Filter Panel */}
          {isExtendedOpen && (
            <>
              <div
                className="fixed inset-0 bg-greyborder bg-opacity-50 z-40"
                aria-hidden="true"
                onClick={toggleExtended}
              />
              <div
                ref={extendedRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="filter-panel-title"
                className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
                  isExtendedOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <Form
                  onSubmit={formikHandleSubmit}
                  className="h-full overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2
                        id="filter-panel-title"
                        className="font-archivo font-normal text-medium leading-140 tracking-normal"
                      >
                        Filter Transactions
                      </h2>
                      <button
                        type="button"
                        onClick={toggleExtended}
                        className="p-2 hover:bg-grey rounded-full"
                        aria-label="Close filter panel"
                        data-testid="close-filter-panel"
                      >
                        <FiX className="w-4 h-4 text-black" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Enhanced Search Field */}
                      <FormikTextField
                        name="search"
                        label="Search"
                        icon={<FiSearch className="w-4 h-4" />}
                        inputIcon={<FiSearch className="w-4 h-4" />}
                        inputIconPosition="left"
                        placeholder="Item ..."
                        className="font-normal font-satoshi rounded-full text-tiny tracking-normal border border-greyborder leading-100 py-3 px-4 w-full focus:outline-none focus:border-accent pl-10"
                        id="input-filters"
                      />

                      <fieldset className="space-y-4">
                        {/* <legend className="flex items-center gap-2 font-satoshi text-sm font-normal leading-100 tracking-normal">
                          <FiCalendar className="w-4 h-4 stroke-black stroke-1" />
                          Date
                        </legend> */}
                        <div className="flex flex-col space-y-4">
                          <FormikTextField
                            name="dates.from"
                            label="From"
                            type="date"
                            icon={<FormikFieldIcons.Calendar />}
                            iconClassName="text-black"
                            className="font-normal font-satoshi text-tiny tracking-normal border border-greyborder leading-100 p-3 w-full focus:outline-none focus:border-accent"
                            id="from"
                            data-testid="from-date"
                            aria-label="From"
                          />

                          <FormikTextField
                            name="dates.to"
                            label="To"
                            type="date"
                            icon={<FormikFieldIcons.Calendar />}
                            iconClassName="text-black"
                            className="font-normal font-satoshi text-tiny tracking-normal border border-greyborder leading-100 p-3 w-full focus:outline-none focus:border-accent"
                            id="to"
                            data-testid="to-date"
                            aria-label="To"
                          />

                          <DatePresetButtons />
                        </div>
                      </fieldset>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-satoshi text-sm font-normal leading-100 tracking-normal">
                          <FiUser className="w-4 h-4" />
                          <span>Contact</span>
                        </div>
                        <PartySelect
                          name="contact"
                          id="contact"
                          placeholder="Select Contact"
                          showCreateOption={false}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-satoshi text-sm font-normal leading-100 tracking-normal">
                          <FormikFieldIcons.Tag />
                          <span>Type</span>
                        </div>
                        <CommonSelect
                          id="flow_type"
                          name="flow_type"
                          placeholder="Select Type"
                          loading={false}
                          optionData={types}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-satoshi text-sm font-normal leading-100 tracking-normal">
                          <FiUser className="w-4 h-4" />
                          <span>Category</span>
                        </div>
                        <CategorySelect
                          name="category"
                          id="category"
                          placeholder="Select Category"
                          showCreateOption={false}
                          className="w-full"
                        />
                      </div>

                      <StatusFilter />

                      <FormikTextField
                        name="amount"
                        label="Amount"
                        placeholder="Amount"
                        className="font-normal font-satoshi text-tiny tracking-normal border border-greyborder leading-100 p-3 w-full focus:outline-none focus:border-accent"
                        id="amount"
                      />
                    </div>

                    <div className="mt-8 space-y-3">
                      <Button
                        type="submit"
                        className="w-full h-fit px-6 py-3 font-bold text-center gap-2"
                        data-testid="apply-filters"
                        disabled={!isValid}
                      >
                        Apply Filters
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleResetFilters(resetForm)}
                        className="w-full h-fit px-6 py-3 font-bold text-center gap-2"
                        kind="secondary"
                        data-testid="reset-filters"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                </Form>
              </div>
            </>
          )}
        </div>
      )}
    </Formik>
  );
};
