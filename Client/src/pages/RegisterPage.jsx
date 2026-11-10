import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthBrandPanel from "../components/AuthBrandPanel";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/apiClient";

function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
  };

  const validate = () => {
    const nextErrors = {};
    const name = form.name.trim();
    if (!name) nextErrors.name = "Full name is required.";
    else if (name.length < 2 || name.length > 100) nextErrors.name = "Use between 2 and 100 characters.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!form.password) nextErrors.password = "Password is required.";
    else if (form.password.length < 8) nextErrors.password = "Use at least 8 characters.";
    else if (new TextEncoder().encode(form.password).length > 72) nextErrors.password = "Password must be 72 bytes or fewer.";
    if (!form.confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
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
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password
        })
      });
      signIn({ token: response.token, user: response.user });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-register">
      <AuthBrandPanel mode="register" />
      <section className="auth-form-side">
        <Link className="auth-mobile-brand" to="/"><span className="brand-mark">✦</span><strong>Sweety</strong></Link>
        <div className="auth-form-container page-enter">
          <span className="eyebrow"><span className="eyebrow-line" /> Start simply</span>
          <h1>A better rhythm<br /><em>starts here.</em></h1>
          <p className="auth-intro">Create your private space for everyday clarity.</p>
          <form className="auth-form" onSubmit={submit} noValidate>
            {error && <div className="form-alert" role="alert"><span>!</span>{error}</div>}
            <div className={`field${fieldErrors.name ? " field-error" : ""}`}>
              <div className="field-label-row"><label htmlFor="register-name">Full name</label>{fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}</div>
              <input autoComplete="name" id="register-name" name="name" onChange={updateField} placeholder="How should we call you?" type="text" value={form.name} />
            </div>
            <div className={`field${fieldErrors.email ? " field-error" : ""}`}>
              <div className="field-label-row"><label htmlFor="register-email">Email address</label>{fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}</div>
              <input autoComplete="email" id="register-email" name="email" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
            </div>
            <PasswordField autoComplete="new-password" error={fieldErrors.password} id="register-password" label="Password" name="password" onChange={updateField} value={form.password} />
            <PasswordField autoComplete="new-password" error={fieldErrors.confirmPassword} id="register-confirm-password" label="Confirm password" name="confirmPassword" onChange={updateField} value={form.confirmPassword} />
            <p className="password-hint">At least 8 characters · Keep it memorable, not obvious.</p>
            <button className="button button-dark auth-submit" disabled={loading} type="submit">{loading ? <><span className="spinner" /> Creating space</> : <>Create my space <span>→</span></>}</button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in <span>↗</span></Link></p>
        </div>
        <span className="auth-footnote">Private by design · Your data stays yours</span>
      </section>
    </main>
  );
}

export default RegisterPage;
