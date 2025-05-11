import { Link, useNavigate } from "react-router";
import { useCallback, useEffect } from "react";
import useUserRegistration from "../../hooks/useUserRegistration";
import StyledInput from "../../components/StyledInput";
import AlertMessage from "../../components/AlertMessage";
import RadarMapDisplay from "../../components/RadarMapDisplay";
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
    setError,
  } = useUserRegistration();
  const { openLoginModal } = useModal();
  const navigate = useNavigate();

  const onAddressSelect = useCallback(
    (addressDetails) => {
      if (handleAddressSelected) {
        handleAddressSelected(addressDetails);
      }
      if (error === "Please select a valid address.") {
        if (setError) setError("");
      }
    },
    [handleAddressSelected, error, setError]
  );

  useEffect(() => {
    if (success) {
      openLoginModal();
    }
  }, [success, openLoginModal]);

  return (
    <>
      <h2 className="card-title text-2xl mb-6">User Sign Up</h2>
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
        />

        <div className="form-control w-full">
          <RadarMapDisplay onAddressSelect={onAddressSelect} showMap={false} />
          {formData.fullAddress && (
            <div className="text-xs text-gray-600 mt-1 p-1 bg-gray-50 rounded">
              Selected: {formData.fullAddress}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
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
