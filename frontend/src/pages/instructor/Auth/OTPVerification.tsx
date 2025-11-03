import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  resendOtp,
  verifyOtp,
} from "../../../api/auth/InstructorAuthentication";
import otpImage from "../../../assets/otp.jpg";

const OTPVerification = () => {
  const [otp, setOtp] = useState<string[]>(Array(4).fill(""));
  const [counter, setCounter] = useState<number>(60);
  const [resendActive, setResendActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    try {
      setResendActive(false);
      setCounter(60);
      setOtp(Array(4).fill("")); // Clear the OTP input fields

      const email = localStorage.getItem("email");
      if (email) {
        const response = await resendOtp(email);
        if (response.success) {
          toast.success(response.message);
        } else {
          toast.error(response.message);
        }
      } else {
        toast.error("Validation Token expired! Redirecting...");
        navigate("/instructor/verifyOtp");
      }
    } catch (error) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : "Failed to resend OTP";
      toast.error(errorMsg);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    if (value && index < otp.length - 1) {
      document.getElementById(`otpInput-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        document.getElementById(`otpInput-${index - 1}`)?.focus();
      } else {
        // Clear current input
        const newOTP = [...otp];
        newOTP[index] = "";
        setOtp(newOTP);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    // Only process if it's exactly 4 digits
    if (/^\d{4}$/.test(pastedData)) {
      const newOTP = pastedData.split("");
      setOtp(newOTP);
      // Focus on last input
      document.getElementById(`otpInput-3`)?.focus();
    }
  };

const handleSubmit = async () => {
  const OTP = otp.join("");
  
  if (OTP.length !== 4) {
    toast.error("Please enter the complete OTP");
    return;
  }

  setIsSubmitting(true);
  try {
    const response = await verifyOtp(OTP);
    if (response.success) {
      toast.success(response.message || "OTP verified successfully!");
      localStorage.removeItem("verificationToken");
      localStorage.removeItem("email");
      setTimeout(() => {
        navigate("/instructor/login");
      }, 1000);
    }
  } catch (error) {
    // Now error is already a standard Error with the message from backend
    const errorMsg = error instanceof Error 
      ? error.message 
      : "OTP verification failed";
    toast.error(errorMsg);
    
    // Clear OTP on error
    setOtp(Array(4).fill(""));
    document.getElementById("otpInput-0")?.focus();
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 sm:p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden border flex flex-col md:flex-row">
        {/* Left side - Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-10">
          {/* Brand */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-blue-700 tracking-wide">
              ULearn
            </h1>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-semibold text-gray-800">
            Verify Your Email Address
          </h2>
          <p className="text-gray-600 mt-2 text-sm">
            A verification OTP has been sent to your email. Please enter the OTP
            below.
          </p>

          {/* OTP Inputs */}
          <div className="flex space-x-3 mt-6 justify-center">
            {otp.map((value, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                id={`otpInput-${index}`}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onChange={(e) => handleChange(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isSubmitting}
                className="bg-gray-100 rounded-md w-12 h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 text-center text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                autoComplete="off"
              />
            ))}
          </div>

          {/* Submit Button */}
          {counter > 0 && (
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || otp.join("").length !== 4}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Verifying..." : "Continue"}
              </button>
            </div>
          )}

          {/* Resend Link */}
          <div className="text-center mt-4 text-sm text-gray-600">
            {resendActive ? (
              <button
                onClick={handleResend}
                disabled={isSubmitting}
                className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            ) : (
              <span>
                Resend OTP in <span className="text-blue-600 font-semibold">{counter}s</span>
              </span>
            )}
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden md:flex w-1/2 bg-gray-50 items-center justify-center p-6">
          <img
            src={otpImage}
            alt="OTP Verification"
            className="max-w-xs rounded-xl shadow"
          />
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;