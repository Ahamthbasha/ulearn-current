import React, { useState } from "react";
import { Field, ErrorMessage } from "formik";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  hideError?: boolean; // Optional to skip ErrorMessage here
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  name,
  label = "Password",
  placeholder = "Enter your password",
  hideError = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
    setTimeout(() => setShowPassword(false), 1000); // Optional auto-hide
  };

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-700 mb-1"
      >
        {label}
      </label>

      <div className="relative">
        <Field
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <div
          onClick={togglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 cursor-pointer"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </div>
      </div>

      {!hideError && (
        <ErrorMessage
          name={name}
          component="div"
          className="text-red-500 text-xs mt-1"
        />
      )}
    </div>
  );
};

export default PasswordField;
