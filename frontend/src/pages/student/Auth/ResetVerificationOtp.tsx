import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { verifyEmail, verifyResetOtp } from '../../../api/auth/UserAuthentication';

const ResetVerificationOTP = () => {
  const [otp, setOtp] = useState<string[]>(Array(4).fill(''));
  const [counter, setCounter] = useState<number>(60);
  const [resendActive, setResendActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (counter > 0) {
      const timer = setInterval(() => {
        setCounter(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setResendActive(true);
    }
  }, [counter]);

  const handleResend = async () => {
    setResendActive(false);
    setCounter(60);
    setOtp(Array(4).fill("")); // reset OTP input

    const email = localStorage.getItem("ForgotPassEmail") || "";
    const response = await verifyEmail(email);
    if (response.success) {
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^\d?$/.test(value)) return; // only digits

    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    if (value && index < otp.length - 1) {
      document.getElementById(`otpInput-${index + 1}`)?.focus();
    } else if (!value && index > 0) {
      document.getElementById(`otpInput-${index - 1}`)?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otpInput-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    const OTP = otp.join('');
    if (OTP.length !== 4 || otp.some((digit) => digit === '')) {
      toast.error("Please enter the full OTP!");
      return;
    }

    const email = localStorage.getItem("ForgotPassEmail") || "";
    const response = await verifyResetOtp(email, OTP);
    if (response.success) {
      toast.success(response.message);
      navigate('/user/resetPassword');
    } else {
      toast.error(response.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-cyan-100 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-8 sm:p-10">
        
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-wide">
            <span className="text-orange-500">U</span>learn
          </h1>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-800">Verify Your Email</h2>
          <p className="text-sm text-gray-600 mt-2">
            Please enter the 4-digit OTP sent to your email address.
          </p>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((value, index) => (
            <input
              key={index}
              id={`otpInput-${index}`}
              type="text"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            />
          ))}
        </div>

        {/* Conditional Button */}
        {!resendActive ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-base font-medium rounded-lg shadow hover:opacity-90 transition"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleResend}
            className="w-full py-3 border border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition"
          >
            Resend OTP
          </button>
        )}

        {/* Timer / Info */}
        <div className="text-center mt-4 text-sm text-gray-600">
          {resendActive ? (
            <p>Didn't receive the code? Click above to resend.</p>
          ) : (
            <span>Resend in {counter} seconds</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetVerificationOTP;
