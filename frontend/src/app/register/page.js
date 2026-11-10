"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { homeForRole } from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Errors
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      errors.name = "Full name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await register(name.trim(), email.trim(), password);
      router.replace(homeForRole(user.role));
    } catch (err) {
      setServerError(err.message || "Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Left Brand Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 text-white group">
            <span className="text-3xl p-2 bg-white/10 rounded-xl backdrop-blur-sm group-hover:bg-white/20 transition">
              💧
            </span>
            <span className="text-2xl font-bold tracking-tight">Empty Bottle</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-blue-100">
              Join Campus Hydration
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight text-white">
              Stay refreshed everywhere across campus.
            </h2>
            <p className="text-blue-100/90 text-sm leading-relaxed">
              Create your student account to bookmark water dispensers, receive crowd updates, and report maintenance issues.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/20">
            <div className="flex items-start gap-3.5">
              <span className="text-xl p-1.5 bg-white/10 rounded-lg">⚡</span>
              <div>
                <h4 className="font-semibold text-sm text-white">Fast 1-minute Signup</h4>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  Instant registration with your student or campus email address.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="text-xl p-1.5 bg-white/10 rounded-lg">🛡️</span>
              <div>
                <h4 className="font-semibold text-sm text-white">Privacy by Design</h4>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  GPS data stays entirely on your phone. No location logs are stored.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="text-xl p-1.5 bg-white/10 rounded-lg">🤝</span>
              <div>
                <h4 className="font-semibold text-sm text-white">Community Driven</h4>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  Help fellow students by reporting dry taps, broken coolers, or dirty filters.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-200">
          <span>&copy; {new Date().getFullYear()} Empty Bottle • LPU Campus</span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Top Mobile Brand & Home Link */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
            >
              <span>&larr;</span>
              <span>Back to home</span>
            </Link>

            <div className="lg:hidden flex items-center gap-2">
              <span className="text-xl">💧</span>
              <span className="font-bold text-gray-900">Empty Bottle</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Create an account
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your details to register as a student.
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div
                role="alert"
                className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 animate-in fade-in"
              >
                <span className="text-base shrink-0">⚠️</span>
                <div className="flex-1 text-xs sm:text-sm">{serverError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 text-sm">
                    👤
                  </span>
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl transition text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      fieldErrors.name
                        ? "border-red-300 focus:border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:border-blue-600 focus:ring-blue-500"
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 text-sm">
                    ✉️
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="student@example.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl transition text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      fieldErrors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:border-blue-600 focus:ring-blue-500"
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 text-sm">
                    🔒
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-11 py-2.5 text-sm bg-white border rounded-xl transition text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      fieldErrors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:border-blue-600 focus:ring-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 text-sm focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  loading={submitting}
                  className="w-full py-2.5 text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
