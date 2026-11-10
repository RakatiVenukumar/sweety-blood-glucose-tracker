import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthBrandPanel from "../components/AuthBrandPanel";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/apiClient";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.password) nextErrors.password = "Password is required.";
    return nextErrors;
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password
        })
      });
      signIn({ token: response.token, user: response.user }, remember);
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <AuthBrandPanel mode="login" />
      <section className="auth-form-side">
        <Link className="auth-mobile-brand" to="/"><span className="brand-mark">✦</span><strong>Sweety</strong></Link>
        <div className="auth-form-container page-enter">
          <span className="eyebrow"><span className="eyebrow-line" /> Welcome back</span>
          <h1>Good to see<br /><em>you again.</em></h1>
          <p className="auth-intro">Sign in to pick up where you left off.</p>
          <form className="auth-form" onSubmit={submit} noValidate>
            {error && <div className="form-alert" role="alert"><span>!</span>{error}</div>}
            <div className={`field${fieldErrors.email ? " field-error" : ""}`}>
              <div className="field-label-row"><label htmlFor="login-email">Email address</label>{fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}</div>
              <input autoComplete="email" id="login-email" name="email" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
            </div>
            <PasswordField autoComplete="current-password" error={fieldErrors.password} id="login-password" label="Password" name="password" onChange={updateField} value={form.password} />
            <div className="form-options">
              <label className="check-label"><input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" /><span>Keep me signed in</span></label>
              <span className="quiet-note">Secure session</span>
            </div>
            <button className="button button-dark auth-submit" disabled={loading} type="submit">{loading ? <><span className="spinner" /> Signing in</> : <>Sign in <span>→</span></>}</button>
          </form>
          <p className="auth-switch">New to Sweety? <Link to="/register">Create an account <span>↗</span></Link></p>
        </div>
        <span className="auth-footnote">Private by design · Your data stays yours</span>
      </section>
    </main>
  );
}

export default LoginPage;
