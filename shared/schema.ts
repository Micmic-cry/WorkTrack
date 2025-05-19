import { z } from "zod";

// Company Schema
export const companySchema = z.object({
  _id: z.string(),
  name: z.string(),
  address: z.string(),
  contactPerson: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  status: z.enum(["Active", "Inactive"]),
});

export const insertCompanySchema = companySchema.omit({ _id: true });

// Employee Schema
export const employeeSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  position: z.string(),
  department: z.string(),
  employeeType: z.enum(["Regular", "Contract", "Project-based"]),
  dateHired: z.string(),
  status: z.enum(["Active", "Inactive"]),
  salary: z.number(),
  companyId: z.string(),
});

export const insertEmployeeSchema = employeeSchema.omit({ _id: true });

// DTR Schema
export const dtrSchema = z.object({
  _id: z.string(),
  employeeId: z.string(),
  date: z.string(),
  timeIn: z.string(),
  timeOut: z.string(),
  breakHours: z.number().default(1),
  regularHours: z.number(),
  overtimeHours: z.number().default(0),
  remarks: z.string().optional(),
  type: z.enum(["Daily", "Bi-Weekly", "Project-based"]),
  status: z.enum(["Pending", "Approved", "Rejected", "Processing"]),
  submissionDate: z.string(),
  approvedBy: z.string().optional(),
  approvalDate: z.string().optional(),
});

export const insertDtrSchema = dtrSchema.omit({
  _id: true,
  approvalDate: true,
  approvedBy: true,
  regularHours: true,
});

// Payroll Schema
export const payrollSchema = z.object({
  _id: z.string(),
  employeeId: z.string(),
  payPeriodStart: z.string(),
  payPeriodEnd: z.string(),
  totalRegularHours: z.number(),
  totalOvertimeHours: z.number(),
  grossPay: z.number(),
  totalDeductions: z.number(),
  netPay: z.number(),
  status: z.enum(["Pending", "Processed", "Paid"]),
  processedBy: z.string().optional(),
  processedDate: z.string().optional(),
});

export const insertPayrollSchema = payrollSchema.omit({
  _id: true,
  processedDate: true,
});

// Define the types
export type Company = z.infer<typeof companySchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Employee = z.infer<typeof employeeSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type DTR = z.infer<typeof dtrSchema>;
export type InsertDTR = z.infer<typeof insertDtrSchema>;

export type Payroll = z.infer<typeof payrollSchema>;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;

// User Schema
export const userSchema = z.object({
  _id: z.string(),
  username: z.string(),
  password: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.enum(["Admin", "Manager", "Staff"]),
  status: z.enum(["Active", "Inactive"]),
});

export const insertUserSchema = userSchema.omit({ _id: true });

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
