import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { validateEmail, validatePassword } from '../../utils/formValidation';
import StyledInput from '../../components/common/StyledInput';
import AlertMessage from '../../components/common/AlertMessage';
import { useAuth } from '../../context/AuthContext.jsx';

const RestaurantLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { loginRestaurant, error: authError, loading: authLoading, entity, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (entity && token) {
      navigate('/restaurant/dashboard');
    }
  }, [entity, token, navigate]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');

    const emailError = validateEmail(email);
    if (emailError) {
      setFormError(emailError);
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    try {
      await loginRestaurant({ email, password });
    } catch (err) {
      console.error('Restaurant login attempt failed:', err);
    }
  }, [email, password, loginRestaurant, navigate]);

  return (
    <>
      <h2 className="card-title text-2xl mb-6">Restaurant Login</h2>
      <p className="mb-6 text-center">Log in to manage your restaurant.</p>
      <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
        {(formError || authError) && (
          <AlertMessage type="error" message={formError || authError} />
        )}

        <StyledInput
          type="email"
          id="email"
          name="email"
          label="Business Email Address"
          placeholder="contact@restaurant.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFormError(''); }}
          required
          autoComplete="email"
          inputClassName={(formError && (validateEmail(email) || formError.toLowerCase().includes('email'))) || (authError && authError.toLowerCase().includes('email')) ? 'input-error' : ''}
        />

        <StyledInput
          type="password"
          id="password"
          name="password"
          label="Password"
          placeholder="******"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
          required
          autoComplete="current-password"
          inputClassName={(formError && (validatePassword(password) || formError.toLowerCase().includes('password'))) || (authError && authError.toLowerCase().includes('password')) ? 'input-error' : ''}
        />

        <button type="submit" className={`btn btn-primary w-full ${authLoading ? 'loading' : ''}`} disabled={authLoading}>
          {authLoading ? 'Logging in...' : 'Login'}
        </button>

        <div className="text-center mt-4">
          <p className="text-sm">Don&apos;t have an account? <Link to="/restaurant/register" className="link link-secondary">Register Restaurant</Link></p>
        </div>
      </form>
    </>
  );
};

export default RestaurantLogin; 