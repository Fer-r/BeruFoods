import { useState, useEffect, useRef, useCallback } from 'react';
import { validateEmail, validatePassword } from '../../../../utils/formValidation'; 
import StyledInput from '../../../common/StyledInput';
import AlertMessage from '../../../common/AlertMessage';
import { useAuth } from '../../../../context/AuthContext.jsx';

/**
 * UserLoginModal provides a modal dialog for user authentication.
 * It includes form fields for email and password, validation, and error handling.
 * The component uses the AuthContext to handle the login process and track authentication state.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Controls whether the modal is open or closed
 * @param {Function} props.handleClose - Callback function to close the modal
 */
const UserLoginModal = ({ open, handleClose }) => {
  const modalRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  // Error and loading states will be handled by AuthContext
  const { loginUser, error: authError, loading: authLoading } = useAuth();

  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      if (open) {
        modalElement.showModal();
        setEmail('');
        setPassword('');
        setEmailError('');
        setPasswordError('');
      } else {
        if (modalElement.open) { 
          modalElement.close();
        }
      }
    }
  }, [open]);

  const handleDialogNativeClose = useCallback(() => {
    if (open) {
      handleClose();
    }
  }, [open, handleClose]);

  const handleLoginSubmit = useCallback(async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    const currentEmailError = validateEmail(email);
    if (currentEmailError) {
      setEmailError(currentEmailError);
      return;
    }
    const currentPasswordError = validatePassword(password);
    if (currentPasswordError) {
      setPasswordError(currentPasswordError);
      return;
    }
    try {
      await loginUser({ email, password });
      handleClose();
    } catch (err) {
      console.error("Login attempt failed (UserLoginModal):", err);
    }
  }, [email, password, loginUser, handleClose]);

  const stopPropagation = (e) => e.stopPropagation();

  if (!open && !modalRef.current?.open) {
    return null;
  }

  return (
    <dialog ref={modalRef} className={`modal ${open ? 'modal-open' : ''}`} onClose={handleDialogNativeClose}>
      <div className="modal-box" onClick={stopPropagation}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Iniciar Sesión</h3>
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost">✕</button>
          </form>
        </div>

        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 py-4">
          {authError && <AlertMessage type="error" message={authError} />}
          
          <StyledInput
            type="email"
            id="login-email"
            name="email"
            label="Correo Electrónico"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            required
            autoFocus
            autoComplete="email"
          />
          {emailError && <AlertMessage type="error" message={emailError} />}
          <StyledInput
            type="password"
            id="login-password"
            name="password"
            label="Contraseña"
            placeholder="******"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            required
            autoComplete="current-password"
          />
          {passwordError && <AlertMessage type="error" message={passwordError} />}
          <div className="modal-action mt-4">
            <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={authLoading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={authLoading}>
              {authLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
};

export default UserLoginModal;