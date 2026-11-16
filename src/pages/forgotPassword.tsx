
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-6">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-green-100 p-8 sm:p-10 text-center">

        <div className="text-5xl mb-5">
          🔐
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Forgot Password?
        </h1>

        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Password recovery is not available yet.
          Please contact the administrator for assistance.
        </p>

        <Link
          to="/login"
          className="inline-block w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 rounded-xl shadow-md transition"
        >
          Back to Login
        </Link>

        <div className="mt-5">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-green-600 transition"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
