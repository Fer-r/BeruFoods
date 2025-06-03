import { useState } from 'react';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';

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