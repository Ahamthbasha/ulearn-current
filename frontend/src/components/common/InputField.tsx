import React, { useState } from "react";
import { Field, ErrorMessage } from "formik";
import { Eye, EyeOff } from "lucide-react";
import { type InputFieldProps } from "./interface/commonComponent";

const InputField: React.FC<InputFieldProps> = ({
  type = "text",
  placeholder = "",
  name,
  label,
  disabled = false,
  value,
  onChange,
  useFormik = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="block text-gray-800 text-xs sm:text-sm font-semibold mb-1"
      >
        {label.toUpperCase()}
      </label>

      <div className="relative flex flex-col">
        {useFormik ? (
          <Field
            className={`w-full px-3 sm:px-5 py-2 sm:py-3 rounded-lg ${type === "number" ? "no-arrows" : ""} font-medium border-2 border-transparent text-black text-xs sm:text-sm focus:outline-none focus:border-2 focus:outline bg-gray-100`}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            placeholder={placeholder}
            id={name}
            name={name}
            disabled={disabled}
          />
        ) : (
          <input
            className={`w-full px-3 sm:px-5 py-2 sm:py-3 rounded-lg ${type === "number" ? "no-arrows" : ""} font-medium border-2 border-transparent text-black text-xs sm:text-sm focus:outline-none focus:border-2 focus:outline bg-gray-100`}
            type={type}
            placeholder={placeholder}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )}

        {isPassword && (
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-2/4 right-3 transform -translate-y-1/2 cursor-pointer text-gray-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        )}
      </div>

      {useFormik && (
        <ErrorMessage
          className="text-xs sm:text-sm font-semibold text-red-500 mt-1 ml-2 sm:ml-3"
          name={name}
          component="span"
        />
      )}
    </div>
  );
};

export default InputField;
