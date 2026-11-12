import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/img/logo.png";
import { useState } from "react";
import { login } from "../service/auth";
import type { FormEvent } from "react";
import { getUserRole } from "../hooks/useAuth";
import PasswordVisibilityToggle from "../component/common/PasswordVisibilityToggle";

const Login = () => {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {

    e.preventDefault();
    if (!email.trim() || !password) {
      return alert("Please Enter All Fields to Login!");
    }
    try {
      setLoading(true);
      const resdata = await login(email.trim(), password);

      const accessToken = resdata.accessToken;
      const refreshToken = resdata.refreshToken;

      if (!accessToken || !refreshToken) {
        throw new Error("Access Token or Refresh Token not received!");
      }

      localStorage.setItem("ACCESS_TOKEN", accessToken);
      localStorage.setItem("REFRESH_TOKEN", refreshToken);

      const role = getUserRole();

      if (role === "SUPER_ADMIN") {
        navigate("/super-admin", { replace: true });
      } else if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }

    } catch (error) {

      console.error("Error in Login:", error);
      alert("Login Failed! Please Check Your Email and Password.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-green-50">

      <div className="lg:w-1/2 bg-[#e8f5e9] flex flex-col justify-center items-center p-10 relative overflow-hidden">

        <div>
          <img
            src={logo}
            alt="NURIX Logo"
            className="w-100 mx-auto mb-4 object-contain -mt-50"
          />
        </div>

        <h2 className="text-3xl font-bold text-green-700 mb-2">
          Welcome Back
        </h2>

        <p className="text-gray-600 text-base">
          Continue your green journey with NURIX
        </p>

      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10">

        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-green-100 p-8 sm:p-10">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome Back!
            </h1>

            <p className="text-gray-500 text-sm">
              Login to your account to continue
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full px-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordVisibilityToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((visible) => !visible)}
                />
              </div>
            </div>

            
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />

                <label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm text-green-700 font-medium hover:underline"
              >
                Forgot Password?
              </Link>

            </div>

            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 rounded-xl shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
            //   onClick={handleLogin}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-green-700 font-semibold hover:underline"
            >
              Register here
            </Link>
          </p>

          <div className="text-center mt-4">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-green-600 transition"
            >
              ← Back to Home
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;


