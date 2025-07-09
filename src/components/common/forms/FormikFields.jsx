import { useField, useFormikContext } from "formik";
import cn from "../../../utils/cn";

/**
 * Label component with optional icon support
 */
const Label = ({
  label,
  icon,
  iconPosition = "left",
  iconClassName = "",
  required = false,
  htmlFor,
  className = "",
}) => {
  if (!label) return null;

  const labelContent = (
    <>
      {icon && iconPosition === "left" && (
        <span className={cn("inline-flex items-center", iconClassName)}>
          {icon}
        </span>
      )}
      <span className="inline-flex items-center">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </span>
      {icon && iconPosition === "right" && (
        <span className={cn("inline-flex items-center", iconClassName)}>
          {icon}
        </span>
      )}
    </>
  );

  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "font-satoshi font-medium text-tiny leading-100 tracking-normal flex items-center gap-2",
        className
      )}
    >
      {labelContent}
    </label>
  );
};

/**
 * A reusable text input field component for Formik forms with icon support
 */
export const FormikTextField = ({
  label,
  icon,
  iconPosition = "left",
  iconClassName = "",
  required = false,
  inputIcon,
  inputIconPosition = "left",
  inputIconClassName = "",
  ...props
}) => {
  const [field, meta] = useField(props);
  const hasError = meta.touched && meta.error;

  return (
    <div className="w-full flex flex-col gap-y-2">
      <Label
        label={label}
        icon={icon}
        iconPosition={iconPosition}
        iconClassName={iconClassName}
        required={required}
        htmlFor={props.id || props.name}
      />

      <div className="relative">
        {inputIcon && inputIconPosition === "left" && (
          <div
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none",
              inputIconClassName
            )}
          >
            {inputIcon}
          </div>
        )}

        <input
          {...field}
          {...props}
          className={cn(
            "w-full border border-greyborder focus:border-accent p-3 bg-white disabled:text-greyborder font-satoshi font-normal text-tiny outline-none placeholder-black",
            {
              "border-error focus:border-error": hasError,
              "pl-10": inputIcon && inputIconPosition === "left",
              "pr-10": inputIcon && inputIconPosition === "right",
            },
            props.className
          )}
        />

        {inputIcon && inputIconPosition === "right" && (
          <div
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none",
              inputIconClassName
            )}
          >
            {inputIcon}
          </div>
        )}
      </div>

      {hasError && (
        <div className="font-normal font-satoshi text-tiny tracking-normal leading-150 text-error">
          {meta.error}
        </div>
      )}
    </div>
  );
};

/**
 * A reusable textarea field component for Formik forms with icon support
 */
export const FormikTextAreaField = ({
  label,
  rows = 3,
  icon,
  iconPosition = "left",
  iconClassName = "",
  required = false,
  ...props
}) => {
  const [field, meta] = useField(props);
  const hasError = meta.touched && meta.error;

  return (
    <div className="w-full flex flex-col gap-y-2">
      <Label
        label={label}
        icon={icon}
        iconPosition={iconPosition}
        iconClassName={iconClassName}
        required={required}
        htmlFor={props.id || props.name}
      />

      <textarea
        {...field}
        {...props}
        rows={rows}
        className={cn(
          "resize-none border outline-none border-greyborder focus:border-accent p-3 bg-white disabled:text-greyborder font-satoshi font-normal text-tiny placeholder:text-black",
          {
            "border-error focus:border-error": hasError,
          },
          props.className
        )}
      />

      {hasError && (
        <div className="font-normal font-satoshi text-tiny tracking-normal leading-150 text-error">
          {meta.error}
        </div>
      )}
    </div>
  );
};

/**
 * A reusable select field component for Formik forms with icon support
 */
export const FormikSelectField = ({
  label,
  options,
  icon,
  iconPosition = "left",
  iconClassName = "",
  required = false,
  selectIcon,
  selectIconPosition = "left",
  selectIconClassName = "",
  ...props
}) => {
  const [field, meta] = useField(props);
  const hasError = meta.touched && meta.error;

  return (
    <div className="w-full flex flex-col gap-y-2">
      <Label
        label={label}
        icon={icon}
        iconPosition={iconPosition}
        iconClassName={iconClassName}
        required={required}
        htmlFor={props.id || props.name}
      />

      <div className="relative">
        {selectIcon && selectIconPosition === "left" && (
          <div
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10",
              selectIconClassName
            )}
          >
            {selectIcon}
          </div>
        )}

        <select
          {...field}
          {...props}
          className={cn(
            "w-full border border-greyborder focus:border-accent p-3 bg-white disabled:text-greyborder font-satoshi font-normal text-tiny outline-none placeholder-black appearance-none",
            {
              "border-error focus:border-error": hasError,
              "pl-10": selectIcon && selectIconPosition === "left",
              "pr-10": selectIcon && selectIconPosition === "right",
            },
            props.className
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {selectIcon && selectIconPosition === "right" && (
          <div
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10",
              selectIconClassName
            )}
          >
            {selectIcon}
          </div>
        )}

        {/* Default dropdown arrow if no right icon */}
        {!(selectIcon && selectIconPosition === "right") && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        )}
      </div>

      {hasError && (
        <div className="font-normal font-satoshi text-tiny tracking-normal leading-150 text-error">
          {meta.error}
        </div>
      )}
    </div>
  );
};

/**
 * A reusable calculated field component that displays a value with icon support
 */
export const FormikCalculatedField = ({
  label,
  value,
  formatter,
  icon,
  iconPosition = "left",
  iconClassName = "",
}) => {
  return (
    <div className="flex justify-between py-2">
      <div className="flex items-center gap-2">
        {icon && iconPosition === "left" && (
          <span className={cn("inline-flex items-center", iconClassName)}>
            {icon}
          </span>
        )}
        <span className="font-satoshi font-normal text-tiny leading-100 tracking-normal">
          {label}
        </span>
        {icon && iconPosition === "right" && (
          <span className={cn("inline-flex items-center", iconClassName)}>
            {icon}
          </span>
        )}
      </div>
      <span className="font-satoshi font-medium text-tiny leading-120 tracking-normal">
        {formatter ? formatter(value) : value}
      </span>
    </div>
  );
};

/**
 * A reusable numeric field with calculation side effects and icon support
 */
export const FormikCalculatedInputField = ({
  label,
  onValueChange,
  icon,
  iconPosition = "left",
  iconClassName = "",
  required = false,
  inputIcon,
  inputIconPosition = "left",
  inputIconClassName = "",
  ...props
}) => {
  const { setFieldValue, values } = useFormikContext();
  const [field, meta] = useField(props);
  const hasError = meta.touched && meta.error;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFieldValue(name, value);

    if (onValueChange) {
      onValueChange(name, value, values, setFieldValue);
    }
  };

  return (
    <div className="w-full flex flex-col gap-y-2">
      <Label
        label={label}
        icon={icon}
        iconPosition={iconPosition}
        iconClassName={iconClassName}
        required={required}
        htmlFor={props.id || props.name}
      />

      <div className="relative">
        {inputIcon && inputIconPosition === "left" && (
          <div
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none",
              inputIconClassName
            )}
          >
            {inputIcon}
          </div>
        )}

        <input
          {...field}
          {...props}
          onChange={handleChange}
          className={cn(
            "w-full border border-greyborder focus:border-accent p-3 bg-white disabled:text-greyborder font-satoshi font-normal text-tiny outline-none placeholder-black",
            {
              "border-error focus:border-error": hasError,
              "pl-10": inputIcon && inputIconPosition === "left",
              "pr-10": inputIcon && inputIconPosition === "right",
            },
            props.className
          )}
        />

        {inputIcon && inputIconPosition === "right" && (
          <div
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none",
              inputIconClassName
            )}
          >
            {inputIcon}
          </div>
        )}
      </div>

      {hasError && (
        <div className="font-normal font-satoshi text-tiny tracking-normal leading-150 text-error">
          {meta.error}
        </div>
      )}
    </div>
  );
};

/**
 * Icon components for common use cases
 */
export const FormikFieldIcons = {
  User: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),

  Email: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),

  Phone: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  ),

  Currency: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
      />
    </svg>
  ),

  Calendar: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),

  Document: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),

  Tag: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  ),

  Search: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),

  Lock: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),

  Location: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
};
