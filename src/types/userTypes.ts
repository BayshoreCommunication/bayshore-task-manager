export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  userName: string;
  email: string | null;
  isActive: boolean;
  type: string;
  jobTitle: string | null;
  jobDescription: string | null;
  image: string | null;
}

export interface EmployeeActions {
  onTerminate: (id: string) => void;
  onChangePassword: (id: string, newPassword: string) => void;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  completionStatus?: string;
}
