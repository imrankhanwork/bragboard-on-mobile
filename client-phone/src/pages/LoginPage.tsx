// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { X } from "lucide-react";
import useAuth from "../hooks/useAuth";

interface LoginPageProps {
  // We accept a flexible payload so App.tsx can receive the full backend response
  onLogin: (payload: any, remember?: boolean) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const openForgot = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setForgotEmail("");
    setForgotStatus("idle");
    setErrorMessage("");
    setShowForgot(true);
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotEmail("");
    setForgotStatus("idle");
  };

  const handleSendReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const mail = forgotEmail.trim();
    if (!mail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setForgotStatus("sending");
    setErrorMessage("");
    try {
      await new Promise((r) => setTimeout(r, 800));
      setForgotStatus("sent");
    } catch {
      setForgotStatus("error");
      setErrorMessage("Failed to send reset link. Try again later.");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMessage("");
    if (!email.trim() || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      // use the hook which wraps api.login and stores token
      const user = await login(email.trim(), password);
      // Pass the user object to onLogin; the hook already stored token
      onLogin({ user }, remember);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Login failed. Please check credentials.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-indigo-50 to-white">
        <div className="max-w-md text-center">
          <img
            src="https://images.unsplash.com/photo-1593062096033-9a26b09da705?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200&q=80"
            alt="App illustration"
            className="w-full h-auto rounded-3xl shadow-lg mb-6"
          />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Celebrate your team</h2>
          <p className="text-gray-600">
            BragBoard helps you appreciate colleagues, boost morale, and build a culture of recognition.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-md p-8 shadow-soft-lg border border-gray-200 rounded-2xl bg-white">
          <div className="text-center mb-6">
            <div className="h-20 flex items-center justify-center mb-4">
              <img src="/logo.png" alt="BragBoard logo" className="h-12 w-auto" />
            </div>
            <h1 className="text-gray-900 text-xl font-semibold">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to continue to BragBoard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-11 bg-white border-gray-200 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-11 bg-white border-gray-200 rounded-xl"
              />
            </div>

            {errorMessage && <div className="text-sm text-red-600">{errorMessage}</div>}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={openForgot}
                className="text-sky-600 hover:text-sky-700"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 btn-primary-glow rounded-xl"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>

      {showForgot && (
        <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={closeForgot} />
          <div className="relative w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 rounded-xl">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Forgot password</h3>
                  <p className="text-sm text-gray-600">Enter your email and we'll send a reset link.</p>
                </div>
                <button
                  onClick={closeForgot}
                  aria-label="Close"
                  className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {forgotStatus === "sent" ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">A password reset link has been sent to <strong>{forgotEmail}</strong>. Check your inbox.</p>
                  <div className="flex justify-end">
                    <Button onClick={closeForgot} className="px-4 py-2 rounded-xl">
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendReset} className="space-y-3">
                  <div>
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      type="email"
                      placeholder="you@company.com"
                      className="h-11 rounded-xl bg-white border-gray-200"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={closeForgot} className="px-4 py-2 rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="h-10 px-6 btn-primary-glow rounded-xl"
                      disabled={forgotStatus === "sending"}
                    >
                      {forgotStatus === "sending" ? "Sending..." : "Send reset link"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
