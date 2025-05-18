import { IStorage } from '../storage';
import { Employee, Company, DTR, Payroll, Activity } from '../models';
import type { 
  Employee as EmployeeType,
  Company as CompanyType,
  DTR as DTRType,
  Payroll as PayrollType,
  Activity as ActivityType,
  InsertEmployee,
  InsertCompany,
  InsertDTR,
  InsertPayroll,
  InsertActivity,
  User,
  InsertUser,
  DtrFormat,
  InsertDtrFormat,
  UnknownDtrFormat,
  InsertUnknownDtrFormat
} from '@shared/schema';
import mongoose from 'mongoose';

// Helper function to convert MongoDB document to the expected type
function convertToType<T extends { id: number }>(doc: any): T {
  if (!doc) return undefined as any;
  const json = doc.toJSON();
  return {
    ...json,
    id: parseInt(json.id),
    companyId: json.companyId ? parseInt(json.companyId) : undefined,
    employeeId: json.employeeId ? parseInt(json.employeeId) : undefined,
    approvedBy: json.approvedBy ? parseInt(json.approvedBy) : undefined
  } as T;
}

export class MongoDBStorage implements IStorage {
  // Employee operations
  async getEmployee(id: number): Promise<EmployeeType | undefined> {
    const employee = await Employee.findById(id);
    return convertToType<EmployeeType>(employee);
  }

  async getAllEmployees(): Promise<EmployeeType[]> {
    const employees = await Employee.find();
    return employees.map(emp => convertToType<EmployeeType>(emp));
  }

  async createEmployee(employee: InsertEmployee): Promise<EmployeeType> {
    const newEmployee = new Employee(employee);
    await newEmployee.save();
    return convertToType<EmployeeType>(newEmployee);
  }

  async updateEmployee(id: number, data: Partial<EmployeeType>): Promise<EmployeeType | undefined> {
    const employee = await Employee.findByIdAndUpdate(id, data, { new: true });
    return convertToType<EmployeeType>(employee);
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await Employee.findByIdAndDelete(id);
    return !!result;
  }

  // Company operations
  async getCompany(id: number): Promise<CompanyType | undefined> {
    const company = await Company.findById(id);
    return convertToType<CompanyType>(company);
  }

  async getAllCompanies(): Promise<CompanyType[]> {
    const companies = await Company.find();
    return companies.map(comp => convertToType<CompanyType>(comp));
  }

  async createCompany(company: InsertCompany): Promise<CompanyType> {
    const newCompany = new Company(company);
    await newCompany.save();
    return convertToType<CompanyType>(newCompany);
  }

  async updateCompany(id: number, data: Partial<CompanyType>): Promise<CompanyType | undefined> {
    const company = await Company.findByIdAndUpdate(id, data, { new: true });
    return convertToType<CompanyType>(company);
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await Company.findByIdAndDelete(id);
    return !!result;
  }

  // DTR operations
  async getDTR(id: number): Promise<DTRType | undefined> {
    const dtr = await DTR.findById(id);
    return convertToType<DTRType>(dtr);
  }

  async getAllDTRs(): Promise<DTRType[]> {
    const dtrs = await DTR.find();
    return dtrs.map(dtr => convertToType<DTRType>(dtr));
  }

  async createDTR(dtr: InsertDTR & { regularHours: number }): Promise<DTRType> {
    const newDtr = new DTR(dtr);
    await newDtr.save();
    return convertToType<DTRType>(newDtr);
  }

  async updateDTR(id: number, data: Partial<DTRType>): Promise<DTRType | undefined> {
    const dtr = await DTR.findByIdAndUpdate(id, data, { new: true });
    return convertToType<DTRType>(dtr);
  }

  async deleteDTR(id: number): Promise<boolean> {
    const result = await DTR.findByIdAndDelete(id);
    return !!result;
  }

  // Payroll operations
  async getPayroll(id: number): Promise<PayrollType | undefined> {
    const payroll = await Payroll.findById(id);
    return convertToType<PayrollType>(payroll);
  }

  async getAllPayrolls(): Promise<PayrollType[]> {
    const payrolls = await Payroll.find();
    return payrolls.map(pay => convertToType<PayrollType>(pay));
  }

  async createPayroll(payroll: InsertPayroll): Promise<PayrollType> {
    const newPayroll = new Payroll(payroll);
    await newPayroll.save();
    return convertToType<PayrollType>(newPayroll);
  }

  async updatePayroll(id: number, data: Partial<PayrollType>): Promise<PayrollType | undefined> {
    const payroll = await Payroll.findByIdAndUpdate(id, data, { new: true });
    return convertToType<PayrollType>(payroll);
  }

  async deletePayroll(id: number): Promise<boolean> {
    const result = await Payroll.findByIdAndDelete(id);
    return !!result;
  }

  // Activity operations
  async getActivity(id: number): Promise<ActivityType | undefined> {
    const activity = await Activity.findById(id);
    return convertToType<ActivityType>(activity);
  }

  async getAllActivities(): Promise<ActivityType[]> {
    const activities = await Activity.find();
    return activities.map(act => convertToType<ActivityType>(act));
  }

  async createActivity(activity: InsertActivity): Promise<ActivityType> {
    const newActivity = new Activity(activity);
    await newActivity.save();
    return convertToType<ActivityType>(newActivity);
  }

  async markAllActivitiesAsRead(): Promise<void> {
    await Activity.updateMany({}, { $set: { read: true } });
  }

  // Clear operations
  async clearEmployees(): Promise<void> {
    await Employee.deleteMany({});
  }

  async clearCompanies(): Promise<void> {
    await Company.deleteMany({});
  }

  async clearDTRs(): Promise<void> {
    await DTR.deleteMany({});
  }

  async clearPayrolls(): Promise<void> {
    await Payroll.deleteMany({});
  }

  async clearActivities(): Promise<void> {
    await Activity.deleteMany({});
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      this.clearEmployees(),
      this.clearCompanies(),
      this.clearDTRs(),
      this.clearPayrolls(),
      this.clearActivities()
    ]);
  }

  // Not implemented operations (to be implemented as needed)
  async getUser(id: number): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }

  async getAllUsers(): Promise<User[]> {
    throw new Error('Method not implemented.');
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error('Method not implemented.');
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }

  async deleteUser(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async clearUsers(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getDtrFormat(id: number): Promise<DtrFormat | undefined> {
    throw new Error('Method not implemented.');
  }

  async getAllDtrFormats(): Promise<DtrFormat[]> {
    throw new Error('Method not implemented.');
  }

  async createDtrFormat(format: InsertDtrFormat): Promise<DtrFormat> {
    throw new Error('Method not implemented.');
  }

  async updateDtrFormat(id: number, data: Partial<DtrFormat>): Promise<DtrFormat | undefined> {
    throw new Error('Method not implemented.');
  }

  async deleteDtrFormat(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async getUnknownDtrFormat(id: number): Promise<UnknownDtrFormat | undefined> {
    throw new Error('Method not implemented.');
  }

  async getAllUnknownDtrFormats(): Promise<UnknownDtrFormat[]> {
    throw new Error('Method not implemented.');
  }

  async createUnknownDtrFormat(format: InsertUnknownDtrFormat): Promise<UnknownDtrFormat> {
    throw new Error('Method not implemented.');
  }

  async updateUnknownDtrFormat(id: number, data: Partial<UnknownDtrFormat>): Promise<UnknownDtrFormat | undefined> {
    throw new Error('Method not implemented.');
  }

  async deleteUnknownDtrFormat(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async clearDtrFormats(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async clearUnknownDtrFormats(): Promise<void> {
    throw new Error('Method not implemented.');
  }
} 