export interface RecurrenceRule {
  daysOfWeek: number[];
  startDate: string;
  endDate: string;
}

export interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  selectedDate: Date;
  onSuccess: () => void;
  initialData?: {
    slotId: string;
    startTimeUTC:string;
    endTimeUTC:string;
    startTime: string; 
    endTime: string;
    price: number;
  };
}

export interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  isBooked: boolean;
}

export interface SlotDTO {
  slotId: string;
  instructorId: string;
  startTimeUTC:string;
  endTimeUTC:string;
  startTime: string; 
  endTime: string;
  price: number;
  isBooked: boolean;
}


export interface SingleQuestionFormValues {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface Props {
  initialValues: SingleQuestionFormValues;
  onSubmit: (values: SingleQuestionFormValues) => void;
  buttonLabel?: string;
  formTitle?: string;
}

/////////////////////////////////////////////////////////////////////////////

export interface InstructorColumn<T extends Record<string, unknown>> {
  key: keyof T | string;
  title: string;
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
  width?: string;
}

export interface InstructorActionButton<T extends Record<string, unknown>> {
  key: string;
  label: string | ((record: T) => string);
  icon: React.ReactNode | ((record: T) => React.ReactNode);
  onClick: (record: T) => void;
  className?: string | ((record: T) => string);
  condition?: (record: T) => boolean;
}

export interface InstructorDataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: InstructorColumn<T>[];
  loading?: boolean;
  error?: string | null;
  title: string;
  description?: string;
  actions?: InstructorActionButton<T>[];
  onRetry?: () => void;
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;

  // pagination and search
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  leftSideHeaderContent?: React.ReactNode;
}

export interface Column<T> {
  key: keyof T & string; // restrict key to string keys of T
  title: string;
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
  width?: string;
}


export interface ActionButton<T> {
  key: string;
  label: string | ((record: T) => string);
  icon: React.ReactNode | ((record: T) => React.ReactNode);
  onClick: (record: T) => void;
  className?: string | ((record: T) => string);
  condition?: (record: T) => boolean;
}