// const Login = () => {
//   return (
//     <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">

//       <div className="text-center">

//         <h1 className="text-3xl font-bold text-green-800">
//           Login
//         </h1>

//         <p className="mt-3 text-gray-600">
//           Welcome back to Plant Care.
//         </p>

//       </div>

//     </main>
//   );
// };

// export default Login;

import { Link } from "react-router-dom";
import logo from "../assets/img/logo.png";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-green-50">

      {/* Left Side */}
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

      {/* Right Side */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10">

        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-green-100 p-8 sm:p-10">

          {/* Form Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome Back!
            </h1>

            <p className="text-gray-500 text-sm">
              Login to your account to continue
            </p>
          </div>

          <form className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Remember Me & Forgot Password */}
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

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 rounded-xl shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Login
            </button>

          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-green-700 font-semibold hover:underline"
            >
              Register here
            </Link>
          </p>

          {/* Back to Home */}
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
