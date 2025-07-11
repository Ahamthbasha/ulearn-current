import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { resendOtp, verifyOtp } from "../../../api/auth/UserAuthentication";
import otpImage from "../../../assets/otp.jpg";

const OTPVerification = () => {
  const [otp, setOtp] = useState<string[]>(Array(4).fill(""));
  const [counter, setCounter] = useState<number>(60);
  const [resendActive, setResendActive] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (counter > 0) {
      timer = setInterval(() => {
        setCounter((prev) => prev - 1);
      }, 1000);
    } else {
      setResendActive(true);
    }

    return () => clearInterval(timer);
  }, [counter]);

  const handleResend = async () => {
    setResendActive(false);
    setCounter(60); // Reset timer

    const email = localStorage.getItem("email");
    if (email) {
      const response = await resendOtp(email);
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } else {
      toast.error("Validation token expired! Redirecting...");
      navigate("/user/verifyOtp");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    if (value && index < otp.length - 1) {
      document.getElementById(`otpInput-${index + 1}`)?.focus();
    } else if (!value && index > 0) {
      document.getElementById(`otpInput-${index - 1}`)?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otpInput-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    const OTP = otp.join("");
    if (OTP.length === 4) {
      const response = await verifyOtp(OTP);
      if (response.success) {
        toast.success(response.message);
        localStorage.removeItem("verificationToken");
        localStorage.removeItem("email");
        setTimeout(() => {
          navigate("/user/login");
        }, 1000);
      } else {
        toast.error(response.message);
      }
    } else {
      toast.error("Please enter the complete OTP");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 sm:p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden border flex flex-col md:flex-row">
        {/* Left side - Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-10">
          {/* Brand */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-blue-700 tracking-wide">ULearn</h1>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-semibold text-gray-800">
            Verify Your Email Address
          </h2>
          <p className="text-gray-600 mt-2 text-sm">
            A verification OTP has been sent to your email. Please enter the OTP below.
          </p>

          {/* OTP Inputs */}
          <div className="flex space-x-3 mt-6 justify-center">
            {otp.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={value}
                id={`otpInput-${index}`}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onChange={(e) => handleChange(e, index)}
                className="bg-gray-100 rounded-md w-12 h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 text-center text-lg font-medium"
              />
            ))}
          </div>

          {/* Submit Button - Hide after 60s */}
          {!resendActive && (
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Resend Link */}
          <div className="text-center mt-4 text-sm text-gray-600">
            {resendActive ? (
              <button
                onClick={handleResend}
                className="text-blue-600 font-semibold hover:underline"
              >
                Resend OTP
              </button>
            ) : (
              <span>
                Resend OTP in <span className="text-blue-600">{counter}s</span>
              </span>
            )}
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden md:flex w-1/2 bg-gray-50 items-center justify-center p-6">
          <img
            src={otpImage}
            alt="Illustration"
            className="max-w-xs rounded-xl shadow"
          />
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
