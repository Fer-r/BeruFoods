import { Link, useNavigate } from "react-router";
import { useCallback, useEffect } from "react";
import useUserRegistration from "../../features/auth/hooks/useUserRegistration";
import StyledInput from "../../components/common/StyledInput";
import AlertMessage from "../../components/common/AlertMessage";
import GoogleMapDisplay from "../../components/common/GoogleMapDisplay";
import { useModal } from "../../context/ModalContext.jsx";

const UserRegister = () => {
  const {
    formData,
    error,
    success,
    loading,
    handleChange,
    handleSubmit,
    handleAddressSelected,
  } = useUserRegistration();
  const { openLoginModal } = useModal();
  const navigate = useNavigate();

  const onAddressSelect = useCallback(
    (addressDetails) => {
      handleAddressSelected(addressDetails);
    },
    [handleAddressSelected]
  );

  useEffect(() => {
    if (success) {
      openLoginModal();
    }
  }, [success, openLoginModal]);

  return (
    <>
      <h2 className="card-title text-2xl mb-6 text-base-content">User Sign Up</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}

        <StyledInput
          type="email"
          id="email"
          name="email"
          label="Email Address"
          placeholder="your@email.com"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          className="input input-bordered w-full focus:input-primary shadow-sm"
        />

        <StyledInput
          type="text"
          id="name"
          name="name"
          label="Full Name (Optional)"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
          className="input input-bordered w-full focus:input-primary shadow-sm"
        />

        <StyledInput
          type="tel"
          id="phone"
          name="phone"
          label="Phone Number (Optional)"
          placeholder="123-456-7890"
          value={formData.phone}
          onChange={handleChange}
          autoComplete="tel"
          className="input input-bordered w-full focus:input-primary shadow-sm"
        />

        <StyledInput
          type="password"
          id="password"
          name="password"
          label="Password"
          placeholder="******"
          value={formData.password}
          onChange={handleChange}
          required
          minLength="6"
          autoComplete="new-password"
          className="input input-bordered w-full focus:input-primary shadow-sm"
        />

        <StyledInput
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          placeholder="******"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          autoComplete="new-password"
          className="input input-bordered w-full focus:input-primary shadow-sm"
        />

        <div className="form-control w-full">
          <GoogleMapDisplay onAddressSelect={onAddressSelect} showMap={false} />
        </div>

        <StyledInput
          type="text"
          id="addressLine2"
          name="addressLine2"
          label="Address details (Optional)"
          placeholder="Apartment, suite, unit, building, or floor"
          value={formData.addressLine2 || ''}
          onChange={handleChange}
          className="input input-bordered w-full focus:input-primary shadow-sm"
        />

        <button
          type="submit"
          className="btn btn-primary w-full mt-4 shadow-md"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "Sign Up"
          )}
        </button>

        <div className="text-center text-sm space-y-2 mt-4">
          <p>
            Already have an account?{" "}
            <button 
              type="button"
              onClick={() => {
                openLoginModal();
                navigate('/');
              }}
              className="link link-secondary"
            >
              Sign In
            </button>
          </p>
          <p>
            Register as a restaurant?{" "}
            <Link to="/restaurant/register" className="link link-accent">
              Restaurant Sign Up
            </Link>
          </p>
        </div>
      </form>
    </>
  );
};

export default UserRegister;