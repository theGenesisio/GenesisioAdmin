/**
 * WithdrawalAddress component renders input fields based on the selected withdrawal option.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.option - The selected withdrawal option (e.g., "paypal", "bank").
 * @param {Object} props.control - Control object from react-hook-form.
 * @param {Function} props.setValue - Function to set the value of a form field.
 *
 * @returns {JSX.Element} The rendered component.
 */
import PropTypes from "prop-types";
import { useEffect } from "react";
import { Controller } from "react-hook-form";

const WithdrawalAddress = ({ option, control, setValue }) => {
  useEffect(() => {
    setValue("address", "");
  }, [option, setValue]);

  const fieldComponents = {
    paypal: {
      label: "PayPal Email",
      placeholder: "Enter PayPal email",
      validation: {
        pattern: {
          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          message: "Enter a valid email address",
        },
      },
    },
    bank: [
      {
        name: "bankName",
        label: "Bank Name",
        placeholder: "Enter bank name",
        validation: { required: "Bank name is required" },
      },
      {
        name: "accountName",
        label: "Account Name",
        placeholder: "Enter account name",
        validation: { required: "Account name is required" },
      },
      {
        name: "address",
        label: "Account Number",
        placeholder: "Enter account number",
        validation: {
          required: "Account number is required",
          pattern: {
            value: /^[0-9]+$/,
            message: "Enter a valid account number",
          },
        },
      },
    ],
    default: {
      label: "Wallet Address",
      placeholder: "Enter wallet address",
      validation: { required: "Wallet address is required" },
    },
  };

  const renderFields = () => {
    const fields = fieldComponents[option] || fieldComponents.default;
    return Array.isArray(fields) ? (
      fields.map(({ name, label, placeholder, validation }) => (
        <div key={name}>
          <label className='block text-sm font-semibold'>{label}</label>
          <Controller
            name={name}
            control={control}
            rules={validation}
            render={({ field, fieldState }) => (
              <>
                <input className='form-input w-full' placeholder={placeholder} {...field} />
                {fieldState.error && (
                  <span className='text-red-600 text-xs'>{fieldState.error.message}</span>
                )}
              </>
            )}
          />
        </div>
      ))
    ) : (
      <div>
        <label className='block text-sm font-semibold'>{fields.label}</label>
        <Controller
          name='address'
          control={control}
          rules={fields.validation}
          render={({ field, fieldState }) => (
            <>
              <input className='form-input w-full' placeholder={fields.placeholder} {...field} />
              {fieldState.error && (
                <span className='text-red-600 text-xs'>{fieldState.error.message}</span>
              )}
            </>
          )}
        />
      </div>
    );
  };

  return <div>{renderFields()}</div>;
};

WithdrawalAddress.propTypes = {
  option: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  setValue: PropTypes.func.isRequired,
};

export default WithdrawalAddress;
