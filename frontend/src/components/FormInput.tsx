import React, { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  required,
  className,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <input
        className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''} ${className || ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

interface FormSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  helperText,
  options,
  required,
  className,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <select
        className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''} ${className || ''}`}
        {...props}
      >
        <option value="">Select {label?.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  label,
  error,
  helperText,
  required,
  className,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <textarea
        className={`input resize-none ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''} ${className || ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};
