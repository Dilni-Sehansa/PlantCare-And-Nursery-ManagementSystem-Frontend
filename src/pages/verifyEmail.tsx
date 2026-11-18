import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../service/auth";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setMessage("Verification token is missing.");
        setSuccess(false);
        setLoading(false);
        return;
      }

      try {
        const response = await verifyEmail(token);

        setMessage(
          response.message || "Your email has been verified successfully."
        );
        setSuccess(true);
      } catch (error: any) {
        setMessage(
          error.response?.data?.message ||
            "Email verification failed. The link may be invalid or expired."
        );
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">

        <h1 className="mb-4 text-2xl font-bold text-green-800">
          NURIX Email Verification
        </h1>

        {loading ? (
          <p className="text-gray-600">
            Verifying your email, please wait...
          </p>
        ) : (
          <>
            <div
              className={`mb-4 text-lg font-semibold ${
                success ? "text-green-600" : "text-red-600"
              }`}
            >
              {success ? "Verification Successful!" : "Verification Failed"}
            </div>

            <p className="mb-6 text-gray-600">{message}</p>

            {success && (
              <Link
                to="/login"
                className="inline-block rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
              >
                Go to Login
              </Link>
            )}

            {!success && (
              <Link
                to="/register"
                className="inline-block rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
              >
                Back to Register
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;