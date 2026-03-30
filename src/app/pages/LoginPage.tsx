   import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { loginApi } from "../../utils/apiEndpoints";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginApi(email, password);
      login(response.access_token);
      navigate("/projects");
    } catch (err) {
      setError("Invalid credentials or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Abstract Background Element for 'Spatial' feel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[400px] glass-panel rounded-[2rem] p-8 md:p-12 relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500 slide-in-from-bottom-8">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome 
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your credentials to access the workspace.
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground ml-1"
            >
              Email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-input-background rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
              placeholder="admin"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground ml-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-input-background rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
              placeholder="admin123"
            />
          </div>

          {error && (
            <div className="text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 active:scale-[0.98] transform duration-100 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <a href="#" className="text-sm text-blue-500 hover:underline">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
