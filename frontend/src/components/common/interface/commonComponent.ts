import { type ReactNode } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "danger";
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  withShadow?: boolean;
  padded?: boolean;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}


export interface PaginationPropsEntityTable {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export interface EntityTableProps<T extends Record<string, unknown>> {
  title: string;
  data: T[];
  columns: {
    key: keyof T;
    label: string;
    render?: (value: T[keyof T], row: T) => ReactNode;
  }[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onAction?: (item: T) => void;
  actionLabel?: string;
  emptyText?: string;
  pagination?: PaginationPropsEntityTable;
}


export interface InputFieldProps {
  type?: string;
  placeholder?: string;
  name: string;
  label: string;
  disabled?: boolean;

  // New props for useState compatibility
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  useFormik?: boolean; // default true
  min?:string | number;
  max?:string | number;
}

export interface PasswordFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  hideError?: boolean; 
}