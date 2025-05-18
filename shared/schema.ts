import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Employee table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  position: text("position").notNull(),
  department: text("department").notNull(),
  employeeType: text("employee_type").notNull(), // Regular, Contract, Project-based
  dateHired: text("date_hired").notNull(),
  status: text("status").notNull(), // Active, Inactive
  salary: doublePrecision("salary").notNull(),
  companyId: integer("company_id").notNull(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

// Company table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  address: text("address").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  status: text("status").notNull(), // Active, Inactive
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
});

// DTR table (Daily Time Record)
export const dtrs = pgTable("dtrs", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: text("date").notNull(),
  timeIn: text("time_in").notNull(),
  timeOut: text("time_out").notNull(),
  breakHours: doublePrecision("break_hours").notNull().default(1),
  regularHours: doublePrecision("regular_hours").notNull(),
  overtimeHours: doublePrecision("overtime_hours").notNull().default(0),
  remarks: text("remarks"),
  type: text("type").notNull(), // Daily, Bi-Weekly, Project-based
  status: text("status").notNull(), // Pending, Approved, Rejected, Processing
  submissionDate: text("submission_date").notNull(),
  approvedBy: integer("approved_by"),
  approvalDate: text("approval_date"),
});

export const insertDtrSchema = createInsertSchema(dtrs).omit({
  id: true,
  approvalDate: true,
  approvedBy: true,
  regularHours: true,
});

// Payroll table
export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  payPeriodStart: text("pay_period_start").notNull(),
  payPeriodEnd: text("pay_period_end").notNull(),
  totalRegularHours: doublePrecision("total_regular_hours").notNull(),
  totalOvertimeHours: doublePrecision("total_overtime_hours").notNull(),
  grossPay: doublePrecision("gross_pay").notNull(),
  totalDeductions: doublePrecision("total_deductions").notNull(),
  netPay: doublePrecision("net_pay").notNull(),
  status: text("status").notNull(), // Pending, Processed, Paid
  processedBy: integer("processed_by"),
  processedDate: text("processed_date"),
});

export const insertPayrollSchema = createInsertSchema(payrolls).omit({
  id: true,
  processedDate: true,
});

// User table (for system users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // Admin, Manager, Staff
  status: text("status").notNull(), // Active, Inactive
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// DTR Format table (for storing OCR recognition patterns)
export const dtrFormats = pgTable("dtr_formats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  pattern: text("pattern").notNull(),
  extractionRules: json("extraction_rules").notNull(),
  example: text("example"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDtrFormatSchema = createInsertSchema(dtrFormats).omit({
  id: true,
  isActive: true,
  createdAt: true,
});

// Unknown DTR Format table (for learning new formats)
export const unknownDtrFormats = pgTable("unknown_dtr_formats", {
  id: serial("id").primaryKey(),
  rawText: text("raw_text").notNull(),
  parsedData: json("parsed_data"),
  imageData: text("image_data"),
  companyId: integer("company_id").references(() => companies.id),
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUnknownDtrFormatSchema = createInsertSchema(unknownDtrFormats).omit({
  id: true,
  isProcessed: true,
  createdAt: true,
});

// Activity table (for system logs)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  description: text("description").notNull(),
  timestamp: text("timestamp").notNull(),
  isRead: boolean("is_read").default(false),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  isRead: true,
});

// Define the types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type DTR = typeof dtrs.$inferSelect;
export type InsertDTR = z.infer<typeof insertDtrSchema>;

export type DtrFormat = typeof dtrFormats.$inferSelect;
export type InsertDtrFormat = z.infer<typeof insertDtrFormatSchema>;

export type UnknownDtrFormat = typeof unknownDtrFormats.$inferSelect;
export type InsertUnknownDtrFormat = z.infer<typeof insertUnknownDtrFormatSchema>;

export type Payroll = typeof payrolls.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
