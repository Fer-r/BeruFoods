import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import useUserProfile from '../../features/user/hooks/useUserProfile';
import StyledInput from '../../components/common/StyledInput';
import AlertMessage from '../../components/common/AlertMessage';
import GoogleMapDisplay from '../../components/common/GoogleMapDisplay';

const UserProfilePage = () => {
  const { entity, logOut } = useAuth();
  const navigate = useNavigate();
  const { userData, isLoading: profileLoading, error: profileError, updateProfile, setError: setProfileError } = useUserProfile();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      address_line: '',
      address_line_2: '',
      city: '',
      lat: '',
      lng: ''
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Update form data when userData changes
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: {
          address_line: Array.isArray(userData.address?.address_line) 
            ? userData.address.address_line[0] || '' 
            : userData.address?.address_line || '',
          address_line_2: Array.isArray(userData.address?.address_line) 
            ? userData.address.address_line[1] || '' 
            : '',
          city: userData.address?.city || '',
          lat: userData.address?.lat || '',
          lng: userData.address?.lng || ''
        }
      });
    }
  }, [userData]);

  // Handle profile errors
  useEffect(() => {
    if (profileError) {
      setError(profileError);
    }
  }, [profileError]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!entity?.userId) {
      navigate('/');
    }
  }, [entity?.userId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSelected = useCallback((addressDetails) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        address_line: addressDetails.addressLine || '',
        city: addressDetails.city || '',
        lat: addressDetails.lat || '',
        lng: addressDetails.lng || ''
      }
    }));
    if (error === 'Please select a valid address using the autocomplete search.') {
      setError('');
    }
  }, [error]);

  const validatePasswordForm = () => {
    if (!passwordData.newPassword && !passwordData.confirmPassword && !passwordData.currentPassword) {
      return null; // No password change requested
    }

    if (!passwordData.newPassword) {
      return 'New password is required.';
    }

    if (passwordData.newPassword.length < 6) {
      return 'New password must be at least 6 characters long.';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return 'New password and confirmation do not match.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password if changing
    const passwordError = validatePasswordForm();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setProfileError(null);

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address.address_line ? {
          address_line: [
            formData.address.address_line,
            ...(formData.address.address_line_2 ? [formData.address.address_line_2] : [])
          ],
          city: formData.address.city,
          lat: formData.address.lat,
          lng: formData.address.lng
        } : null
      };

      // Add password to payload if changing
      if (passwordData.newPassword) {
        payload.password = passwordData.newPassword;
      }

      await updateProfile(payload);

      setSuccess('Profile updated successfully! You will be logged out for security reasons.');
      
      // Clear password fields after successful update
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);

      // Logout after successful update for security
      setTimeout(() => {
        logOut();
        navigate('/');
      }, 2000); // Give user time to read the success message

    } catch (err) {
      let errorMessage = err.details?.message || err.message || 'Failed to update profile.';
      if (err.details?.errors) {
        const fieldErrors = Object.entries(err.details.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('; ');
        errorMessage = `${errorMessage} Details: ${fieldErrors}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!entity?.userId) {
    return <div className="container mx-auto p-4 text-center">Redirecting to login...</div>;
  }

  if (profileLoading || (!userData && !profileError)) {
    return <div className="container mx-auto p-4 text-center"><span className="loading loading-lg loading-spinner text-primary"></span></div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center card-title">User Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-base-100 shadow-xl p-8 rounded-lg">
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}

        <StyledInput
          id="name"
          name="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your full name"
          disabled={isLoading}
        />

        <StyledInput
          type="email"
          id="email"
          name="email"
          label="Email Address (Cannot be changed)"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          placeholder="your@email.com"
          disabled
        />

        <StyledInput
          type="tel"
          id="phone"
          name="phone"
          label="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          placeholder="123-456-7890"
          disabled={isLoading}
        />

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Address Information</h3>
          <GoogleMapDisplay
            onAddressSelect={handleAddressSelected}
            showMap={false}
            placeholder="Start typing your address..."
            defaultValue={formData.address.address_line}
          />
          
          <StyledInput
            type="text"
            id="address_line_2"
            name="address.address_line_2"
            label="Address Line 2 (Optional)"
            value={formData.address.address_line_2}
            onChange={handleChange}
            placeholder="Apartment, suite, unit, building, or floor"
            disabled={isLoading}
          />

          {formData.address.address_line && (
            <div className="text-xs text-base-content/70 mt-2 p-2 bg-base-200 rounded">
              Selected: {formData.address.address_line}
              {formData.address.address_line_2 && `, ${formData.address.address_line_2}`}
              {formData.address.city && `, ${formData.address.city}`}
              <br/>
              (Lat: {formData.address.lat}, Lng: {formData.address.lng})
            </div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Password</h3>
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="btn btn-sm btn-outline"
              disabled={isLoading}
            >
              {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
            </button>
          </div>

          {showPasswordSection && (
            <div className="space-y-4 border border-base-300 p-4 rounded-lg bg-base-50">
              <StyledInput
                type="password"
                id="newPassword"
                name="newPassword"
                label="New Password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                minLength="6"
                autoComplete="new-password"
                disabled={isLoading}
              />

              <StyledInput
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                minLength="6"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full mt-8"
          disabled={isLoading}
        >
          {isLoading ? <span className="loading loading-spinner"></span> : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default UserProfilePage; 