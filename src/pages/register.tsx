import { Link } from "react-router-dom";
import logo from "../assets/img/logo.png";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-green-50">

      
      <div className="lg:w-1/2 bg-[#e8f5e9] flex flex-col justify-center items-center p-10 relative overflow-hidden">
        <div >
          <img src={logo}
          alt="NURIX Logo" 
          className="w-100 mx-auto mb-4 object-contain -mt-50"
          />          
        </div>
        <h2 className="text-3xl font-bold text-green-700 mb-2">
            Join Us
        </h2>
        <p className="text-gray-600 text-base">
            Start your green journey with NURIX
        </p>
      </div>


      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-green-100 p-8 sm:p-10">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-500 text-sm">
              Fill in your details to get started
            </p>
          </div>

          <form className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{" "}
                <span className="text-green-700 font-medium cursor-pointer hover:underline">
                  Terms & Conditions
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 rounded-xl shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-green-700 font-semibold hover:underline"
            >
              Login here
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

export default Register;