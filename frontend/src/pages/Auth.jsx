import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth";

function Auth() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isInitializing,
    login,
    sessionMessage,
    clearSessionMessage,
  } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const endpoint = useMemo(() => {
    return mode === "login" ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;
  }, [mode]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMessage("");
    setError("");
    clearSessionMessage();
  };

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  useEffect(() => {
    if (!sessionMessage) {
      return;
    }

    toast.error(sessionMessage);
    clearSessionMessage();
  }, [sessionMessage, clearSessionMessage, toast]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");
    clearSessionMessage();

    const payload =
      mode === "login"
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            role: "ENGINEER",
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      if (mode === "login" && data.token) {
        login(data.token, data.user);
        navigate("/dashboard", { replace: true });
        return;
      }

      toast.success("Registration successful. You can now sign in.");
      setMessage("Registration successful. You can now sign in.");
      setMode("login");

      setForm((previous) => ({ ...previous, password: "" }));
    } catch (submitError) {
      toast.error(submitError.message);
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-info">
          <p className="eyebrow">Complaint System</p>
          <h1>Service Portal Access</h1>
        </aside>

        <section className="auth-card" aria-label="Authentication form">
          <div
            className={`mode-switch mode-${mode}`}
            role="tablist"
            aria-label="Auth modes"
          >
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            {mode === "register" && (
              <label>
                Full Name
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  required
                  placeholder="Alex Johnson"
                />
              </label>
            )}

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
                placeholder="name@company.com"
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </label>

            <button className="submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {message ? <p className="feedback ok">{message}</p> : null}
          {error ? <p className="feedback err">{error}</p> : null}
        </section>
      </section>
    </main>
  );
}

export default Auth;
