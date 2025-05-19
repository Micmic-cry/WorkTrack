import { IStorage } from '../storage';
import { Employee, Company, DTR, Payroll, Activity, User as UserModel } from '../models';
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
function convertToType<T extends { id: string }>(doc: any): T {
  if (!doc) return undefined as any;
  const json = doc.toJSON ? doc.toJSON() : doc;
  const result: any = {
    ...json,
    id: (typeof json.id === 'string' && json.id) || json._id?.toString(),
    companyId: json.companyId?.toString(),
    employeeId: json.employeeId?.toString(),
    approvedBy: json.approvedBy?.toString(),
  };
  delete result._id;
  return result as T;
}

function userToType(user: any): User {
  if (!user) return undefined as any;
  const json = user.toJSON();
  return {
    ...json,
    id: json.id || json._id?.toString(),
  };
}

export class MongoDBStorage implements IStorage {
  // Employee operations
  async getEmployee(id: string): Promise<EmployeeType | undefined> {
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

  async updateEmployee(id: string, data: Partial<EmployeeType>): Promise<EmployeeType | undefined> {
    const employee = await Employee.findByIdAndUpdate(id, data, { new: true });
    return convertToType<EmployeeType>(employee);
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await Employee.findByIdAndDelete(id);
    return !!result;
  }

  // Company operations
  async getCompany(id: string): Promise<CompanyType | undefined> {
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

  async updateCompany(id: string, data: Partial<CompanyType>): Promise<CompanyType | undefined> {
    const company = await Company.findByIdAndUpdate(id, data, { new: true });
    return convertToType<CompanyType>(company);
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await Company.findByIdAndDelete(id);
    return !!result;
  }

  // DTR operations
  async getDTR(id: string): Promise<DTRType | undefined> {
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

  async updateDTR(id: string, data: Partial<DTRType>): Promise<DTRType | undefined> {
    const dtr = await DTR.findByIdAndUpdate(id, data, { new: true });
    return convertToType<DTRType>(dtr);
  }

  async deleteDTR(id: string): Promise<boolean> {
    const result = await DTR.findByIdAndDelete(id);
    return !!result;
  }

  // Payroll operations
  async getPayroll(id: string): Promise<PayrollType | undefined> {
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

  async updatePayroll(id: string, data: Partial<PayrollType>): Promise<PayrollType | undefined> {
    const payroll = await Payroll.findByIdAndUpdate(id, data, { new: true });
    return convertToType<PayrollType>(payroll);
  }

  async deletePayroll(id: string): Promise<boolean> {
    const result = await Payroll.findByIdAndDelete(id);
    return !!result;
  }

  // Activity operations
  async getActivity(id: string): Promise<ActivityType | undefined> {
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

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    return user ? userToType(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? userToType(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email });
    return user ? userToType(user) : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await UserModel.find();
    return users.map(userToType);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = new UserModel(user);
    await newUser.save();
    return userToType(newUser);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true });
    return user ? userToType(user) : undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async clearUsers(): Promise<void> {
    await UserModel.deleteMany({});
  }

  // Utility: Ensure default admin user exists
  async ensureAdminUser(): Promise<void> {
    const admin = await UserModel.findOne({ username: 'admin' });
    if (!admin) {
      await this.createUser({
        username: 'admin',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@worktrack.com',
        role: 'Admin',
        status: 'Active',
      });
    }
  }

  // Not implemented operations (to be implemented as needed)
  async getDtrFormat(id: string): Promise<DtrFormat | undefined> {
    throw new Error('Method not implemented.');
  }

  async getAllDtrFormats(): Promise<DtrFormat[]> {
    throw new Error('Method not implemented.');
  }

  async createDtrFormat(format: InsertDtrFormat): Promise<DtrFormat> {
    throw new Error('Method not implemented.');
  }

  async updateDtrFormat(id: string, data: Partial<DtrFormat>): Promise<DtrFormat | undefined> {
    throw new Error('Method not implemented.');
  }

  async deleteDtrFormat(id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async getUnknownDtrFormat(id: string): Promise<UnknownDtrFormat | undefined> {
    throw new Error('Method not implemented.');
  }

  async getAllUnknownDtrFormats(): Promise<UnknownDtrFormat[]> {
    throw new Error('Method not implemented.');
  }

  async createUnknownDtrFormat(format: InsertUnknownDtrFormat): Promise<UnknownDtrFormat> {
    throw new Error('Method not implemented.');
  }

  async updateUnknownDtrFormat(id: string, data: Partial<UnknownDtrFormat>): Promise<UnknownDtrFormat | undefined> {
    throw new Error('Method not implemented.');
  }

  async deleteUnknownDtrFormat(id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async clearDtrFormats(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async clearUnknownDtrFormats(): Promise<void> {
    throw new Error('Method not implemented.');
  }
} 