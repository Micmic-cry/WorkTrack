import {
  employees,
  companies,
  dtrs,
  payrolls,
  users,
  activities,
  dtrFormats,
  unknownDtrFormats,
  type Employee,
  type InsertEmployee,
  type Company,
  type InsertCompany,
  type DTR,
  type InsertDTR,
  type Payroll,
  type InsertPayroll,
  type User,
  type InsertUser,
  type Activity,
  type InsertActivity,
  type DtrFormat,
  type InsertDtrFormat,
  type UnknownDtrFormat,
  type InsertUnknownDtrFormat,
} from "@shared/schema";

export interface IStorage {
  // Employee operations
  getEmployee(id: number): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, data: Partial<Company>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;

  // DTR operations
  getDTR(id: number): Promise<DTR | undefined>;
  getAllDTRs(): Promise<DTR[]>;
  createDTR(dtr: InsertDTR & { regularHours: number }): Promise<DTR>;
  updateDTR(id: number, data: Partial<DTR>): Promise<DTR | undefined>;
  deleteDTR(id: number): Promise<boolean>;

  // DTR Format operations
  getDtrFormat(id: number): Promise<DtrFormat | undefined>;
  getAllDtrFormats(): Promise<DtrFormat[]>;
  createDtrFormat(format: InsertDtrFormat): Promise<DtrFormat>;
  updateDtrFormat(id: number, data: Partial<DtrFormat>): Promise<DtrFormat | undefined>;
  deleteDtrFormat(id: number): Promise<boolean>;

  // Unknown DTR Format operations
  getUnknownDtrFormat(id: number): Promise<UnknownDtrFormat | undefined>;
  getAllUnknownDtrFormats(): Promise<UnknownDtrFormat[]>;
  createUnknownDtrFormat(format: InsertUnknownDtrFormat): Promise<UnknownDtrFormat>;
  updateUnknownDtrFormat(id: number, data: Partial<UnknownDtrFormat>): Promise<UnknownDtrFormat | undefined>;
  deleteUnknownDtrFormat(id: number): Promise<boolean>;

  // Payroll operations
  getPayroll(id: number): Promise<Payroll | undefined>;
  getAllPayrolls(): Promise<Payroll[]>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, data: Partial<Payroll>): Promise<Payroll | undefined>;
  deletePayroll(id: number): Promise<boolean>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  getAllActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  markAllActivitiesAsRead(): Promise<void>;

  // Data reset operations
  clearEmployees(): Promise<void>;
  clearCompanies(): Promise<void>;
  clearDTRs(): Promise<void>;
  clearDtrFormats(): Promise<void>;
  clearUnknownDtrFormats(): Promise<void>;
  clearPayrolls(): Promise<void>;
  clearUsers(): Promise<void>;
  clearActivities(): Promise<void>;
  clearAll(): Promise<void>;
}

export class MemStorage implements IStorage {
  private employees: Map<number, Employee>;
  private companies: Map<number, Company>;
  private dtrs: Map<number, DTR>;
  private payrolls: Map<number, Payroll>;
  private users: Map<number, User>;
  private activities: Map<number, Activity>;
  private dtrFormats: Map<number, DtrFormat>;
  private unknownDtrFormats: Map<number, UnknownDtrFormat>;
  
  currentEmployeeId: number;
  currentCompanyId: number;
  currentDtrId: number;
  currentPayrollId: number;
  currentUserId: number;
  currentActivityId: number;
  currentDtrFormatId: number;
  currentUnknownDtrFormatId: number;

  constructor() {
    this.employees = new Map();
    this.companies = new Map();
    this.dtrs = new Map();
    this.payrolls = new Map();
    this.users = new Map();
    this.activities = new Map();
    this.dtrFormats = new Map();
    this.unknownDtrFormats = new Map();
    
    this.currentEmployeeId = 1;
    this.currentCompanyId = 1;
    this.currentDtrId = 1;
    this.currentPayrollId = 1;
    this.currentUserId = 1;
    this.currentActivityId = 1;
    this.currentDtrFormatId = 1;
    this.currentUnknownDtrFormatId = 1;
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      email: "admin@worktrack.com",
      role: "Admin",
      status: "Active"
    });
    
    // Create regular staff user
    this.createUser({
      username: "staff",
      password: "staff123",
      firstName: "Staff",
      lastName: "Member",
      email: "staff@worktrack.com",
      role: "Staff",
      status: "Active"
    });
    
    // Create manager user
    this.createUser({
      username: "manager",
      password: "manager123",
      firstName: "Department",
      lastName: "Manager",
      email: "manager@worktrack.com",
      role: "Manager",
      status: "Active"
    });
    
    // Create sample companies
    const companyNames = ["Acme Corporation", "Globex Inc.", "Stark Industries", "Umbrella Corp."];
    companyNames.forEach(name => {
      this.createCompany({
        name,
        address: "123 Business St, Metro City",
        contactPerson: "John Contact",
        contactEmail: `contact@${name.toLowerCase().replace(/\s/g, '')}.com`,
        contactPhone: "+1 (555) 123-4567",
        status: "Active"
      });
    });
    
    // Create sample DTR formats
    this.createDtrFormat({
      name: "Standard Timesheet",
      companyId: 1,
      pattern: String.raw`Employee\s*:?\s*(?<employeeName>[\w\s]+)[\s\S]*?Date\s*:?\s*(?<date>\d{2}[/-]\d{2}[/-]\d{4})[\s\S]*?Time In\s*:?\s*(?<timeIn>\d{1,2}:\d{2}\s*[AP]M)[\s\S]*?Time Out\s*:?\s*(?<timeOut>\d{1,2}:\d{2}\s*[AP]M)`,
      extractionRules: {
        employeeName: "employeeName",
        date: "date",
        timeIn: "timeIn",
        timeOut: "timeOut"
      },
      example: "Employee: John Smith\nDate: 05/12/2023\nTime In: 8:30 AM\nTime Out: 5:30 PM"
    });
    
    this.createDtrFormat({
      name: "Compact DTR Format",
      companyId: 2,
      pattern: String.raw`ID#(?<employeeId>\d+)\s+(?<date>\d{2}[/-]\d{2}[/-]\d{4})\s+(?<timeIn>\d{1,2}:\d{2}[AP]M)-(?<timeOut>\d{1,2}:\d{2}[AP]M)`,
      extractionRules: {
        employeeId: "employeeId",
        date: "date",
        timeIn: "timeIn",
        timeOut: "timeOut"
      },
      example: "ID#12345 06/15/2023 8:00AM-5:00PM"
    });
    
    // Create sample employees
    const firstNames = ["John", "Jane", "Robert", "Lisa", "Michael", "Emily", "David", "Sarah"];
    const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Wilson", "Miller", "Jones", "Taylor"];
    const positions = ["Software Engineer", "Marketing Specialist", "Accountant", "HR Manager", "Sales Representative", "Designer"];
    const departments = ["Engineering", "Marketing", "Finance", "Human Resources", "Sales", "Design"];
    const employeeTypes = ["Regular", "Contract", "Project-based"];
    
    for (let i = 0; i < 12; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const position = positions[Math.floor(Math.random() * positions.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const employeeType = employeeTypes[Math.floor(Math.random() * employeeTypes.length)];
      const companyId = Math.floor(Math.random() * companyNames.length) + 1;
      
      this.createEmployee({
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
        position,
        department,
        employeeType,
        dateHired: `2023-${Math.floor(1 + Math.random() * 12).toString().padStart(2, '0')}-${Math.floor(1 + Math.random() * 28).toString().padStart(2, '0')}`,
        status: Math.random() > 0.2 ? "Active" : "Inactive", // 80% active
        salary: Math.floor(20000 + Math.random() * 30000),
        companyId,
      });
    }
    
    // Create sample DTRs
    const employees = Array.from(this.employees.values());
    const activeEmployees = employees.filter(emp => emp.status === "Active");
    const dtrTypes = ["Daily", "Bi-Weekly", "Project-based"];
    const dtrStatuses = ["Pending", "Approved", "Rejected", "Processing"];
    
    for (let i = 0; i < 30; i++) {
      const employee = activeEmployees[Math.floor(Math.random() * activeEmployees.length)];
      const dtrType = dtrTypes[Math.floor(Math.random() * dtrTypes.length)];
      const dtrStatus = dtrStatuses[Math.floor(Math.random() * dtrStatuses.length)];
      const day = Math.floor(1 + Math.random() * 28).toString().padStart(2, '0');
      const month = Math.floor(5 + Math.random() * 2).toString().padStart(2, '0'); // May or June
      
      const timeIn = `0${Math.floor(7 + Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`; // 7-10 AM
      const timeOut = `1${Math.floor(6 + Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`; // 16-19 PM
      
      // Calculate regular hours (simplified)
      const inHour = parseInt(timeIn.split(':')[0]);
      const inMinute = parseInt(timeIn.split(':')[1]);
      const outHour = parseInt(timeOut.split(':')[0]);
      const outMinute = parseInt(timeOut.split(':')[1]);
      
      const totalMinutes = (outHour * 60 + outMinute) - (inHour * 60 + inMinute) - 60; // 1 hour break
      const regularHours = Math.max(0, totalMinutes / 60);
      
      this.createDTR({
        employeeId: employee.id,
        date: `2023-${month}-${day}`,
        timeIn,
        timeOut,
        breakHours: 1,
        regularHours,
        overtimeHours: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0, // 30% chance of overtime
        remarks: Math.random() > 0.8 ? "Late arrival due to traffic" : "",
        type: dtrType,
        status: dtrStatus,
        submissionDate: `2023-${month}-${day}`,
        approvedBy: dtrStatus === "Approved" || dtrStatus === "Rejected" ? 1 : undefined,
        approvalDate: dtrStatus === "Approved" || dtrStatus === "Rejected" ? `2023-${month}-${day}` : undefined,
      });
    }
    
    // Create sample payrolls
    for (let i = 0; i < 10; i++) {
      const employee = activeEmployees[Math.floor(Math.random() * activeEmployees.length)];
      const payrollStatuses = ["Pending", "Processed", "Paid"];
      const payrollStatus = payrollStatuses[Math.floor(Math.random() * payrollStatuses.length)];
      
      const totalRegularHours = 80 + Math.floor(Math.random() * 20); // 80-100 hours
      const totalOvertimeHours = Math.random() > 0.5 ? Math.floor(Math.random() * 10) : 0; // 50% chance of overtime
      
      const grossPay = employee.salary;
      const totalDeductions = grossPay * 0.1; // 10% deductions
      const netPay = grossPay - totalDeductions;
      
      this.createPayroll({
        employeeId: employee.id,
        payPeriodStart: "2023-06-01",
        payPeriodEnd: "2023-06-15",
        totalRegularHours,
        totalOvertimeHours,
        grossPay,
        totalDeductions,
        netPay,
        status: payrollStatus,
        processedBy: payrollStatus !== "Pending" ? 1 : undefined,
        processedDate: payrollStatus !== "Pending" ? "2023-06-16" : undefined,
      });
    }
    
    // Create sample activities
    const actionTypes = ["dtr_submitted", "dtr_approved", "dtr_rejected", "payroll_processed", "employee_added"];
    for (let i = 0; i < 20; i++) {
      const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      const employee = employees[Math.floor(Math.random() * employees.length)];
      let description = "";
      
      switch (action) {
        case "dtr_submitted":
          description = `${employee.firstName} ${employee.lastName} submitted their bi-weekly DTR`;
          break;
        case "dtr_approved":
          description = `Team Lead approved ${employee.firstName} ${employee.lastName}'s DTR entry`;
          break;
        case "dtr_rejected":
          description = `Team Lead rejected ${employee.firstName} ${employee.lastName}'s DTR entry`;
          break;
        case "payroll_processed":
          description = `Admin User processed payroll for ${employee.firstName} ${employee.lastName}`;
          break;
        case "employee_added":
          description = `HR Manager added ${employee.firstName} ${employee.lastName} to the system`;
          break;
      }
      
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - i * 3); // Space activities out
      
      this.createActivity({
        userId: 1, // Admin user
        action,
        description,
        timestamp: timestamp.toISOString(),
      });
    }
  }

  // Employee operations
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.currentEmployeeId++;
    const newEmployee: Employee = { ...employee, id };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updatedEmployee: Employee = { ...employee, ...data };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getAllCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const id = this.currentCompanyId++;
    const newCompany: Company = { ...company, id };
    this.companies.set(id, newCompany);
    return newCompany;
  }

  async updateCompany(id: number, data: Partial<Company>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updatedCompany: Company = { ...company, ...data };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    return this.companies.delete(id);
  }

  // DTR operations
  async getDTR(id: number): Promise<DTR | undefined> {
    return this.dtrs.get(id);
  }

  async getAllDTRs(): Promise<DTR[]> {
    return Array.from(this.dtrs.values());
  }

  async createDTR(dtr: InsertDTR & { regularHours: number }): Promise<DTR> {
    const id = this.currentDtrId++;
    const newDTR: DTR = { ...dtr, id };
    this.dtrs.set(id, newDTR);
    return newDTR;
  }

  async updateDTR(id: number, data: Partial<DTR>): Promise<DTR | undefined> {
    const dtr = this.dtrs.get(id);
    if (!dtr) return undefined;
    
    const updatedDTR: DTR = { ...dtr, ...data };
    this.dtrs.set(id, updatedDTR);
    return updatedDTR;
  }

  async deleteDTR(id: number): Promise<boolean> {
    return this.dtrs.delete(id);
  }

  // Payroll operations
  async getPayroll(id: number): Promise<Payroll | undefined> {
    return this.payrolls.get(id);
  }

  async getAllPayrolls(): Promise<Payroll[]> {
    return Array.from(this.payrolls.values());
  }

  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const id = this.currentPayrollId++;
    const newPayroll: Payroll = { ...payroll, id };
    this.payrolls.set(id, newPayroll);
    return newPayroll;
  }

  async updatePayroll(id: number, data: Partial<Payroll>): Promise<Payroll | undefined> {
    const payroll = this.payrolls.get(id);
    if (!payroll) return undefined;
    
    const updatedPayroll: Payroll = { ...payroll, ...data };
    this.payrolls.set(id, updatedPayroll);
    return updatedPayroll;
  }

  async deletePayroll(id: number): Promise<boolean> {
    return this.payrolls.delete(id);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const newActivity: Activity = { ...activity, id, isRead: false };
    this.activities.set(id, newActivity);
    return newActivity;
  }
  
  async markAllActivitiesAsRead(): Promise<void> {
    for (const [id, activity] of this.activities.entries()) {
      this.activities.set(id, { ...activity, isRead: true });
    }
  }

  // Data reset operations
  async clearEmployees(): Promise<void> {
    this.employees.clear();
    this.currentEmployeeId = 1;
  }

  async clearCompanies(): Promise<void> {
    this.companies.clear();
    this.currentCompanyId = 1;
  }

  async clearDTRs(): Promise<void> {
    this.dtrs.clear();
    this.currentDtrId = 1;
  }

  async clearPayrolls(): Promise<void> {
    this.payrolls.clear();
    this.currentPayrollId = 1;
  }

  async clearUsers(): Promise<void> {
    this.users.clear();
    this.currentUserId = 1;
  }

  async clearActivities(): Promise<void> {
    this.activities.clear();
    this.currentActivityId = 1;
  }

  // DTR Format operations
  async getDtrFormat(id: number): Promise<DtrFormat | undefined> {
    return this.dtrFormats.get(id);
  }

  async getAllDtrFormats(): Promise<DtrFormat[]> {
    return Array.from(this.dtrFormats.values());
  }

  async createDtrFormat(format: InsertDtrFormat): Promise<DtrFormat> {
    const id = this.currentDtrFormatId++;
    const now = new Date();
    const newFormat: DtrFormat = { 
      ...format, 
      id, 
      isActive: true,
      createdAt: now
    };
    this.dtrFormats.set(id, newFormat);
    return newFormat;
  }

  async updateDtrFormat(id: number, data: Partial<DtrFormat>): Promise<DtrFormat | undefined> {
    const format = this.dtrFormats.get(id);
    if (!format) return undefined;
    
    const updatedFormat: DtrFormat = { ...format, ...data };
    this.dtrFormats.set(id, updatedFormat);
    return updatedFormat;
  }

  async deleteDtrFormat(id: number): Promise<boolean> {
    return this.dtrFormats.delete(id);
  }

  // Unknown DTR Format operations
  async getUnknownDtrFormat(id: number): Promise<UnknownDtrFormat | undefined> {
    return this.unknownDtrFormats.get(id);
  }

  async getAllUnknownDtrFormats(): Promise<UnknownDtrFormat[]> {
    return Array.from(this.unknownDtrFormats.values());
  }

  async createUnknownDtrFormat(format: InsertUnknownDtrFormat): Promise<UnknownDtrFormat> {
    const id = this.currentUnknownDtrFormatId++;
    const now = new Date();
    const newFormat: UnknownDtrFormat = { 
      ...format, 
      id, 
      isProcessed: false,
      createdAt: now
    };
    this.unknownDtrFormats.set(id, newFormat);
    return newFormat;
  }

  async updateUnknownDtrFormat(id: number, data: Partial<UnknownDtrFormat>): Promise<UnknownDtrFormat | undefined> {
    const format = this.unknownDtrFormats.get(id);
    if (!format) return undefined;
    
    const updatedFormat: UnknownDtrFormat = { ...format, ...data };
    this.unknownDtrFormats.set(id, updatedFormat);
    return updatedFormat;
  }

  async deleteUnknownDtrFormat(id: number): Promise<boolean> {
    return this.unknownDtrFormats.delete(id);
  }

  // Clear operations
  async clearDtrFormats(): Promise<void> {
    this.dtrFormats.clear();
    this.currentDtrFormatId = 1;
  }

  async clearUnknownDtrFormats(): Promise<void> {
    this.unknownDtrFormats.clear();
    this.currentUnknownDtrFormatId = 1;
  }

  async clearAll(): Promise<void> {
    await this.clearEmployees();
    await this.clearCompanies();
    await this.clearDTRs();
    await this.clearDtrFormats();
    await this.clearUnknownDtrFormats();
    await this.clearPayrolls();
    await this.clearUsers();
    await this.clearActivities();
  }
}

export const storage = new MemStorage();
