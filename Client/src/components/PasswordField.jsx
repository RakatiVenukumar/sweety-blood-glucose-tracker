import { useState } from "react";

function PasswordField({ id, name, label, value, onChange, error, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`field${error ? " field-error" : ""}`}>
      <div className="field-label-row">
        <label htmlFor={id}>{label}</label>
        {error && <span className="field-error-text" role="alert">{error}</span>}
      </div>
      <div className="password-input-wrap">
        <input
          autoComplete={autoComplete}
          id={id}
          name={name}
          onChange={onChange}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export default PasswordField;
