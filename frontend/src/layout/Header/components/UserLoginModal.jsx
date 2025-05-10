import { useState, useEffect, useRef, useCallback } from 'react';
import { validateEmail, validatePassword } from '../../../utils/formValidation'; // Adjust path as needed
import StyledInput from '../../../components/StyledInput'; // Assuming we want to use StyledInput
import AlertMessage from '../../../components/AlertMessage'; // Import the new component
import { useAuth } from '../../../context/AuthContext.jsx'; // Import useAuth

const UserLoginModal = ({ open, handleClose }) => {
  const modalRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Error and loading states will be handled by AuthContext
  const { loginUser, error: authError, loading: authLoading, entity } = useAuth();

  // Effect to programmatically open/close the modal
  useEffect(() => {
    const modalElement = modalRef.current;
    if (open) {
      modalElement?.showModal();
      // Reset form on open
      setEmail('');
      setPassword('');
      // setError(''); // AuthContext will manage error state
      // setLoading(false); // AuthContext will manage loading state
    } else {
      modalElement?.close();
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClose]);

  // Effect to close modal on successful login
  useEffect(() => {
    if (entity && open) { // If entity is set (login successful) and modal is open
      handleClose();
    }
  }, [entity, open, handleClose]);

  const handleLoginSubmit = useCallback(async (e) => {
    e.preventDefault();
    // setError(''); // AuthContext will manage error state

    const emailError = validateEmail(email);
    if (emailError) {
      // We can set a local error for form validation if needed, or rely on AuthContext for API errors
      // For now, let's use a local error for immediate feedback on form validation.
      // This component's 'error' state needs to be re-added if we want to show form validation errors distinctly.
      // For simplicity, we'll assume AuthContext's error can cover this for now, or rely on input validation UI.
      alert(emailError); // Simple alert for now, ideally use AlertMessage with a local error state
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      alert(passwordError); // Simple alert, same as above
      return;
    }

    // setLoading(true); // AuthContext will manage loading state
    try {
      await loginUser({ email, password });
      // On successful login, the useEffect for 'entity' will close the modal.
    } catch (err) {
      // Error is already set in AuthContext by loginUser
      console.error("Login attempt failed (UserLoginModal):", err);
    }
    // setLoading(false); // AuthContext will manage loading state
  }, [email, password, loginUser, handleClose]);

  // Prevent closing modal when clicking inside
  const stopPropagation = (e) => e.stopPropagation();

  if (!open) return null; // Don't render if not open, to ensure state reset on reopen from useEffect

  return (
    <dialog ref={modalRef} className="modal modal-open" onClick={handleClose}> {/* Ensure modal-open for visibility control via prop */}
      <div className="modal-box" onClick={stopPropagation}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Sign in</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={handleClose}>✕</button>
        </div>

        {/* Form content using StyledInput */} 
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 py-4">
          {/* Use AlertMessage component with error from AuthContext */} 
          {authError && <AlertMessage type="error" message={authError} />}
          
          <StyledInput
            type="email"
            id="login-email"
            name="email"
            label="Email Address" // Generic label
            placeholder="your@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); /* setError(''); */ }}
            required
            autoFocus
            autoComplete="email"
          />
          <StyledInput
            type="password"
            id="login-password"
            name="password"
            label="Password"
            placeholder="******"
            value={password}
            onChange={(e) => { setPassword(e.target.value); /* setError(''); */ }}
            required
            autoComplete="current-password"
          />
          <div className="modal-action mt-4">
            <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={authLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={authLoading}>
              {authLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default UserLoginModal; 