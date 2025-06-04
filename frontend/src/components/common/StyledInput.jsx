import { useState } from 'react';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';

/**
 * StyledInput is a customizable input component.
 * It supports various input types, including password visibility toggling,
 * and allows for extensive styling through props.
 *
 * @param {object} props - The component's props.
 * @param {string} [props.type='text'] - The type of the input (e.g., 'text', 'password', 'email', 'file').
 * @param {string} props.id - The ID of the input element.
 * @param {string} props.name - The name of the input element.
 * @param {string | number} props.value - The current value of the input.
 * @param {function} props.onChange - Callback function triggered when the input value changes.
 * @param {string} [props.label] - The label text for the input.
 * @param {string} [props.placeholder] - The placeholder text for the input.
 * @param {boolean} [props.required=false] - Whether the input is required.
 * @param {number} [props.minLength] - The minimum length required for the input value.
 * @param {string} [props.autoComplete] - The autoComplete attribute for the input.
 * @param {string} [props.className='input input-bordered w-full'] - CSS classes for the input element itself.
 * @param {string} [props.labelClassName='label'] - CSS classes for the label element.
 * @param {string} [props.labelTextClassName='label-text'] - CSS classes for the span inside the label.
 * @param {string} [props.containerClassName='form-control w-full'] - CSS classes for the main container div.
 * @param {string} [props.accept] - The accept attribute, typically used for file inputs.
 * @param {boolean} [props.disabled=false] - Whether the input is disabled.
 */
const StyledInput = ({
  type = 'text',
  id,
  name,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  minLength,
  autoComplete,
  className = 'input input-bordered w-full',
  labelClassName = 'label',
  labelTextClassName = 'label-text',
  containerClassName = 'form-control w-full',
  accept,
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  let inputFinalClassName = className;
  if (type === 'password') {
    inputFinalClassName = `${className} pr-12`; 
  }

  return (
    <div className={containerClassName}>
      {label && (
        <label className={labelClassName} htmlFor={id}>
          <span className={labelTextClassName}>{label}{required && ' *'}</span>
        </label>
      )}
      <div className="relative w-full">
        <input
          type={inputType}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={inputFinalClassName}
          accept={accept}
          disabled={disabled}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-lg leading-5 text-base-content opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
          </button>
        )}
      </div>
    </div>
  );
};

export default StyledInput;