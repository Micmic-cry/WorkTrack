import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { format } from "date-fns";
import {
  insertEmployeeSchema,
  insertCompanySchema,
  insertDtrSchema,
  insertPayrollSchema,
  InsertUser,
} from "@shared/schema";
import { calculateRegularHours } from "../client/src/lib/utils/dateUtils";
import { setupAuth } from "./auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  const server = createServer(app);
  setupAuth(app);
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: "Authentication required" });
  };
  
  // Middleware to check if user is an admin
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && (req.user as any)?.role === "Admin") {
      return next();
    }
    res.status(403).json({ error: "Admin access required" });
  };
  // Helper middleware for validating requests
  const validateRequest = (schema: any) => {
    return (req: any, res: any, next: any) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error,
        });
      }
    };
  };

  // Log activity
  const logActivity = async (userId: string | undefined, action: string, description: string) => {
    if (!userId) return; // Skip logging if no userId available
    await storage.createActivity({
      userId,
      action,
      description,
      timestamp: new Date().toISOString(),
    });
  };

  // Employee endpoints
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", validateRequest(insertEmployeeSchema), async (req, res) => {
    try {
      // 1. Create employee record
      const employee = await storage.createEmployee(req.body);

      // 2. Generate secure temporary password
      const tempPassword = crypto.randomBytes(8).toString("base64url");
      // 3. Hash the password before saving
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // 4. Create user account
      const userData: InsertUser = {
        username: employee.email,
        email: employee.email,
        password: hashedPassword, // Store the hash, not the plain password!
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: "Staff",
        status: "Active",
        // employeeId: employee._id, // Uncomment if user schema allows
      };
      const user = await storage.createUser(userData);

      // Log the plain temp password for admin reference
      console.log(`[NEW EMPLOYEE USER] Email: ${employee.email} | Temp Password: ${tempPassword}`);

      // 5. (Placeholder) Send credentials email with tempPassword
      // await sendCredentialsEmail(employee.email, tempPassword);

      res.status(201).json({ employee, user });
    } catch (error) {
      console.error("[EMPLOYEE CREATE] Error:", error);
      res.status(500).json({ message: "Failed to create employee and user." });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const employeeId = req.params.id;
      const updatedEmployee = await storage.updateEmployee(employeeId, req.body);
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      logActivity((req.user as any)?._id, "employee_updated", `Updated employee: ${updatedEmployee.firstName} ${updatedEmployee.lastName}`)
        .catch(err => console.error("Failed to log activity:", err));
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.patch("/api/employees/:id/activate", async (req, res) => {
    try {
      const employeeId = req.params.id;
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const updatedEmployee = await storage.updateEmployee(employeeId, { ...employee, status: "Active" });
      logActivity((req.user as any)?._id, "employee_activated", `Activated employee: ${employee.firstName} ${employee.lastName}`)
        .catch(err => console.error("Failed to log activity:", err));
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: "Failed to activate employee" });
    }
  });

  app.patch("/api/employees/:id/deactivate", async (req, res) => {
    try {
      const employeeId = req.params.id;
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const updatedEmployee = await storage.updateEmployee(employeeId, { ...employee, status: "Inactive" });
      logActivity((req.user as any)?._id, "employee_deactivated", `Deactivated employee: ${employee.firstName} ${employee.lastName}`)
        .catch(err => console.error("Failed to log activity:", err));
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate employee" });
    }
  });

  // Companies endpoints
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      console.log("Fetched companies:", companies);
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const companyId = req.params.id;
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", validateRequest(insertCompanySchema), async (req, res) => {
    try {
      const company = await storage.createCompany(req.body);
      res.status(201).json(company); // Respond immediately
      // Log activity in the background, catch errors
      logActivity((req.user as any)?._id, "company_added", `Added new company: ${company.name}`)
        .catch(err => console.error("Failed to log activity:", err));
    } catch (error) {
      console.error('Error creating company:', error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", async (req, res) => {
    try {
      const companyId = req.params.id;
      const updatedCompany = await storage.updateCompany(companyId, req.body);
      if (!updatedCompany) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(updatedCompany); // Respond immediately
      logActivity((req.user as any)?._id, "company_updated", `Updated company: ${updatedCompany.name}`)
        .catch(err => console.error("Failed to log activity:", err));
    } catch (error) {
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.patch("/api/companies/:id/activate", async (req, res) => {
    try {
      const companyId = req.params.id;
      const company = await storage.getCompany(companyId);
      console.log("[ACTIVATE] CompanyId:", companyId);
      console.log("[ACTIVATE] Company before update:", company);
      console.log("[ACTIVATE] Update data:", { ...company, status: "Active" });
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const updatedCompany = await storage.updateCompany(companyId, { ...company, status: "Active" });
      res.json(updatedCompany); // Respond immediately
      logActivity((req.user as any)?._id, "company_activated", `Activated company: ${company.name}`)
        .catch(err => console.error("Failed to log activity:", err));
    } catch (error) {
      res.status(500).json({ message: "Failed to activate company" });
    }
  });

  app.patch("/api/companies/:id/deactivate", async (req, res) => {
    try {
      const companyId = req.params.id;
      const company = await storage.getCompany(companyId);
      console.log("[DEACTIVATE] CompanyId:", companyId);
      console.log("[DEACTIVATE] Company before update:", company);
      console.log("[DEACTIVATE] Update data:", { ...company, status: "Inactive" });
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const updatedCompany = await storage.updateCompany(companyId, { ...company, status: "Inactive" });
      res.json(updatedCompany); // Respond immediately
      logActivity((req.user as any)?._id, "company_deactivated", `Deactivated company: ${company.name}`)
        .catch(err => console.error("Failed to log activity:", err));
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate company" });
    }
  });

  // Stats endpoint for dashboard
  app.get("/api/stats", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const companies = await storage.getAllCompanies();
      const dtrs = await storage.getAllDTRs();
      const payrolls = await storage.getAllPayrolls();

      // Count pending DTRs
      const pendingDTRs = dtrs.filter(dtr => dtr.status === "Pending").length;

      // Calculate payroll total (sum of netPay for all payrolls)
      const payrollTotal = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);

      // Count active clients/companies
      const activeClients = companies.filter(c => c.status === "Active").length;

      res.json({
        totalEmployees: employees.length,
        pendingDTRs,
        payrollTotal,
        activeClients
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // DTR endpoints
  app.get("/api/dtrs", async (req, res) => {
    try {
      const dtrs = await storage.getAllDTRs();
      res.json(dtrs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DTRs" });
    }
  });

  app.get("/api/dtrs/recent", async (req, res) => {
    try {
      const dtrs = await storage.getAllDTRs();
      // Sort by submission date, newest first, and limit to 10
      const recentDtrs = dtrs
        .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
        .slice(0, 10);
      res.json(recentDtrs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent DTRs" });
    }
  });

  app.get("/api/dtrs/:id", async (req, res) => {
    try {
      const dtr = await storage.getDTR(req.params.id);
      if (!dtr) {
        return res.status(404).json({ message: "DTR not found" });
      }
      res.json(dtr);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DTR" });
    }
  });

  app.post("/api/dtrs", validateRequest(insertDtrSchema), async (req, res) => {
    try {
      // Calculate regular hours from time in, time out, and break hours
      const regularHours = calculateRegularHours(
        req.body.timeIn,
        req.body.timeOut,
        req.body.breakHours
      );

      // Add calculated regular hours to the DTR data
      const dtrData = {
        ...req.body,
        regularHours,
        submissionDate: format(new Date(), "yyyy-MM-dd"),
      };

      const dtr = await storage.createDTR(dtrData);

      // Get employee name for activity log
      const employee = await storage.getEmployee(dtr.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;

      await logActivity((req.user as any)?._id, "dtr_submitted", `DTR submitted for ${employeeName} - ${dtr.date}`);
      res.status(201).json(dtr);
    } catch (error) {
      console.error("Failed to create DTR:", error instanceof Error ? error.message : error);
      res.status(500).json({ message: "Failed to create DTR" });
    }
  });

  app.patch("/api/dtrs/:id", async (req, res) => {
    try {
      const dtrId = req.params.id;
      const updatedDTR = await storage.updateDTR(dtrId, req.body);
      if (!updatedDTR) {
        return res.status(404).json({ message: "DTR not found" });
      }
      
      const employee = await storage.getEmployee(updatedDTR.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${updatedDTR.employeeId}`;
      
      await logActivity((req.user as any)?._id, "dtr_updated", `DTR updated for ${employeeName} - ${updatedDTR.date}`);
      res.json(updatedDTR);
    } catch (error) {
      res.status(500).json({ message: "Failed to update DTR" });
    }
  });

  app.patch("/api/dtrs/:id/approve", async (req, res) => {
    try {
      const dtrId = req.params.id;
      const dtr = await storage.getDTR(dtrId);
      if (!dtr) {
        return res.status(404).json({ message: "DTR not found" });
      }
      
      const updatedDTR = await storage.updateDTR(dtrId, { 
        ...dtr,
        status: "Approved",
        approvalDate: format(new Date(), "yyyy-MM-dd")
      });
      
      const employee = await storage.getEmployee(dtr.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;
      
      await logActivity((req.user as any)?._id, "dtr_approved", `DTR approved for ${employeeName} - ${dtr.date}`);
      res.json(updatedDTR);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve DTR" });
    }
  });

  app.patch("/api/dtrs/:id/reject", async (req, res) => {
    try {
      const dtrId = req.params.id;
      const dtr = await storage.getDTR(dtrId);
      if (!dtr) {
        return res.status(404).json({ message: "DTR not found" });
      }
      
      const updatedDTR = await storage.updateDTR(dtrId, { 
        ...dtr,
        status: "Rejected",
        approvalDate: format(new Date(), "yyyy-MM-dd")
      });
      
      const employee = await storage.getEmployee(dtr.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;
      
      await logActivity((req.user as any)?._id, "dtr_rejected", `DTR rejected for ${employeeName} - ${dtr.date}`);
      res.json(updatedDTR);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject DTR" });
    }
  });

  app.patch("/api/dtrs/:id/request-revision", async (req, res) => {
    try {
      const dtrId = req.params.id;
      const dtr = await storage.getDTR(dtrId);
      if (!dtr) {
        return res.status(404).json({ message: "DTR not found" });
      }
      
      // Update status back to pending with message in remarks
      const remarks = req.body.remarks || "Needs revision";
      const updatedDTR = await storage.updateDTR(dtrId, { 
        ...dtr,
        status: "Pending",
        remarks: dtr.remarks ? `${dtr.remarks} | ${remarks}` : remarks
      });
      
      const employee = await storage.getEmployee(dtr.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;
      
      await logActivity((req.user as any)?._id, "dtr_revision_requested", `Revision requested for ${employeeName}'s DTR - ${dtr.date}`);
      res.json(updatedDTR);
    } catch (error) {
      res.status(500).json({ message: "Failed to request DTR revision" });
    }
  });
  
  // Bulk DTR operations
  app.post("/api/dtrs/bulk/approve", async (req, res) => {
    try {
      const { dtrIds } = req.body;
      
      if (!dtrIds || !Array.isArray(dtrIds) || dtrIds.length === 0) {
        return res.status(400).json({ message: "No DTR IDs provided" });
      }
      
      const results = [];
      const errors = [];
      
      for (const dtrId of dtrIds) {
        try {
          const dtr = await storage.getDTR(dtrId);
          if (!dtr) {
            errors.push({ id: dtrId, message: "DTR not found" });
            continue;
          }
          
          if (dtr.status !== "Pending") {
            errors.push({ id: dtrId, message: "DTR must be in Pending status to approve" });
            continue;
          }
          
          const updateObj = {
            status: "Approved",
            approvalDate: format(new Date(), "yyyy-MM-dd")
          };
          console.log('Attempting to update DTR:', dtrId, updateObj);
          const updatedDTR = await storage.updateDTR(dtrId, updateObj);
          console.log('Update result:', updatedDTR);
          const employee = await storage.getEmployee(dtr.employeeId);
          const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;
          await logActivity((req.user as any)?._id, "dtr_approved", `DTR approved for ${employeeName} - ${dtr.date}`);
          results.push(updatedDTR);
        } catch (error) {
          console.error('Bulk DTR update error:', error, typeof error, JSON.stringify(error));
          errors.push({ id: dtrId, message: "Failed to process" });
        }
      }
      
      await logActivity((req.user as any)?._id, "bulk_dtr_approved", `${results.length} DTRs approved in bulk`);
      res.json({
        success: true,
        processed: results.length,
        total: dtrIds.length,
        results,
        errors
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process bulk DTR approval" });
    }
  });
  
  app.post("/api/dtrs/bulk/reject", async (req, res) => {
    try {
      const { dtrIds } = req.body;
      
      if (!dtrIds || !Array.isArray(dtrIds) || dtrIds.length === 0) {
        return res.status(400).json({ message: "No DTR IDs provided" });
      }
      
      const results = [];
      const errors = [];
      
      for (const dtrId of dtrIds) {
        try {
          const dtr = await storage.getDTR(dtrId);
          if (!dtr) {
            errors.push({ id: dtrId, message: "DTR not found" });
            continue;
          }
          
          if (dtr.status !== "Pending") {
            errors.push({ id: dtrId, message: "DTR must be in Pending status to reject" });
            continue;
          }
          
          const updateObj = {
            status: "Rejected",
            approvalDate: format(new Date(), "yyyy-MM-dd")
          };
          console.log('Attempting to update DTR:', dtrId, updateObj);
          const updatedDTR = await storage.updateDTR(dtrId, updateObj);
          console.log('Update result:', updatedDTR);
          const employee = await storage.getEmployee(dtr.employeeId);
          const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;
          await logActivity((req.user as any)?._id, "dtr_rejected", `DTR rejected for ${employeeName} - ${dtr.date}`);
          results.push(updatedDTR);
        } catch (error) {
          console.error('Bulk DTR update error:', error, typeof error, JSON.stringify(error));
          errors.push({ id: dtrId, message: "Failed to process" });
        }
      }
      
      await logActivity((req.user as any)?._id, "bulk_dtr_rejected", `${results.length} DTRs rejected in bulk`);
      res.json({
        success: true,
        processed: results.length,
        total: dtrIds.length,
        results,
        errors
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process bulk DTR rejection" });
    }
  });
  
  // Bulk DTR payroll processing
  app.post("/api/dtrs/bulk/process-payroll", async (req, res) => {
    try {
      const { dtrIds } = req.body;
      if (!dtrIds || !Array.isArray(dtrIds) || dtrIds.length === 0) {
        return res.status(400).json({ message: "No DTR IDs provided" });
      }
      const results = [];
      const errors = [];
      for (const dtrId of dtrIds) {
        try {
          const dtr = await storage.getDTR(dtrId);
          if (!dtr) {
            errors.push({ id: dtrId, message: "DTR not found" });
            continue;
          }
          if (dtr.status !== "Approved") {
            errors.push({ id: dtrId, message: "DTR must be in Approved status to process payroll" });
            continue;
          }
          // Find the employee to get the salary
          const employee = await storage.getEmployee(dtr.employeeId);
          if (!employee) {
            errors.push({ id: dtrId, message: "Employee not found" });
            continue;
          }
          const salary = employee.salary;
          const regularHours = dtr.regularHours;
          const overtimeHours = dtr.overtimeHours || 0;
          // Calculate pay
          const regularPay = regularHours * salary;
          const overtimePay = overtimeHours * salary * 1.5; // Assuming 1.5x for overtime
          const grossPay = regularPay + overtimePay;
          // Apply standard deductions (simplified for demo)
          const taxRate = 0.15; // 15% tax
          const taxDeduction = grossPay * taxRate;
          const otherDeductions = 0; // Can be customized
          const totalDeductions = taxDeduction + otherDeductions;
          const netPay = grossPay - totalDeductions;
          // Create a payroll record
          const payrollData = {
            employeeId: dtr.employeeId,
            dtrId: dtr.id,
            payPeriodStart: dtr.date,
            payPeriodEnd: dtr.date,
            totalRegularHours: regularHours,
            totalOvertimeHours: overtimeHours,
            grossPay: grossPay,
            totalDeductions: totalDeductions,
            netPay: netPay,
            status: "Processed",
            processedBy: 1,
            processedDate: format(new Date(), "yyyy-MM-dd"),
          };
          const payroll = await storage.createPayroll(payrollData);
          results.push(payroll);
          const employeeName = `${employee.firstName} ${employee.lastName}`;
          await logActivity((req.user as any)?._id, "payroll_processed", `Payroll processed for ${employeeName} - ${dtr.date}`);
        } catch (error) {
          errors.push({ id: dtrId, message: "Failed to process" });
        }
      }
      await logActivity((req.user as any)?._id, "bulk_payroll_processed", `${results.length} payrolls processed in bulk`);
      res.json({
        success: true,
        processed: results.length,
        total: dtrIds.length,
        results,
        errors
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process bulk payroll" });
    }
  });
  
  // DTR Format endpoints
  app.get("/api/dtr-formats", async (req, res) => {
    try {
      const formats = await storage.getAllDtrFormats();
      res.json(formats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DTR formats" });
    }
  });
  
  app.post("/api/dtr-formats", async (req, res) => {
    try {
      const newFormat = await storage.createDtrFormat({
        name: req.body.name || "New Format",
        companyId: req.body.companyId || null,
        pattern: req.body.pattern || "",
        extractionRules: req.body.extractionRules || {},
        example: req.body.example || "",
      });
      
      await logActivity((req.user as any)?._id, "dtr_format_created", `New DTR format created: ${newFormat.name}`);
      
      res.status(201).json(newFormat);
    } catch (error) {
      res.status(500).json({ message: "Failed to store DTR format" });
    }
  });
  
  app.get("/api/unknown-dtr-formats", async (req, res) => {
    try {
      const unknownFormats = await storage.getAllUnknownDtrFormats();
      res.json(unknownFormats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unknown DTR formats" });
    }
  });
  
  app.post("/api/unknown-dtr-formats", async (req, res) => {
    try {
      const newUnknownFormat = await storage.createUnknownDtrFormat({
        rawText: req.body.rawText,
        parsedData: req.body.parsedData || null,
        imageData: req.body.imageData || null,
        companyId: req.body.companyId || null,
      });
      
      await logActivity((req.user as any)?._id, "unknown_dtr_format_detected", "New unrecognized DTR format stored for review");
      
      res.status(201).json(newUnknownFormat);
    } catch (error) {
      res.status(500).json({ message: "Failed to store unknown DTR format" });
    }
  });
  
  app.post("/api/unknown-dtr-formats/:id/approve", async (req, res) => {
    try {
      const formatId = parseInt(req.params.id);
      const unknownFormat = await storage.getUnknownDtrFormat(formatId);
      
      if (!unknownFormat) {
        return res.status(404).json({ message: "Unknown DTR format not found" });
      }
      
      // Extract data from the unknown format to create a new DTR format
      const newFormatData = {
        name: req.body.name || "Approved Format",
        companyId: req.body.companyId || unknownFormat.companyId,
        pattern: req.body.pattern || "",
        extractionRules: req.body.extractionRules || {},
        example: unknownFormat.rawText
      };
      
      // Create a new DTR format
      const newFormat = await storage.createDtrFormat(newFormatData);
      
      // Mark unknown format as processed
      await storage.updateUnknownDtrFormat(formatId, {
        ...unknownFormat,
        isProcessed: true
      });
      
      await logActivity((req.user as any)?._id, "dtr_format_approved", `DTR format approved and added as: ${newFormat.name}`);
      
      res.json({ 
        success: true, 
        message: "DTR format approved and added to known formats",
        format: newFormat
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve DTR format" });
    }
  });
  
  // OCR Endpoint for processing DTR images
  app.post("/api/process-dtr-image", async (req, res) => {
    try {
      const { imageData, employeeId } = req.body;
      
      // Normally, we would process the image with OCR here,
      // but since Tesseract is a client-side library, this
      // processing happens in the frontend

      // Instead, we'll simulate matching against known formats
      // by using our stored DTR formats

      // Get all known DTR formats
      const formats = await storage.getAllDtrFormats();
      const employee = employeeId ? await storage.getEmployee(req.params.id) : null;
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : undefined;
      
      // Log the processing attempt
      console.log(`Processing DTR image${employeeId ? ` for employee #${req.params.id}` : ''}`);
      await logActivity((req.user as any)?._id, "dtr_processing_attempt", `DTR image processing attempt${employee ? ` for ${employeeName}` : ''}`);
      
      // Return format information to help the client
      res.json({
        success: true,
        formats: formats,
        employeeInfo: employee ? {
          id: employee.id,
          name: employeeName,
          companyId: employee.companyId
        } : null
      });
    } catch (error) {
      console.error("Error processing DTR image:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process DTR image",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Payroll endpoints
  app.get("/api/payrolls", async (req, res) => {
    try {
      const payrolls = await storage.getAllPayrolls();
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payrolls" });
    }
  });

  app.get("/api/payrolls/:id", async (req, res) => {
    try {
      const payroll = await storage.getPayroll(req.params.id);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.post("/api/payrolls", validateRequest(insertPayrollSchema), async (req, res) => {
    try {
      const payroll = await storage.createPayroll(req.body);
      
      const employee = await storage.getEmployee(payroll.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${payroll.employeeId}`;
      
      await logActivity((req.user as any)?._id, "payroll_created", `Payroll created for ${employeeName} - ${payroll.payPeriodStart} to ${payroll.payPeriodEnd}`);
      res.status(201).json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to create payroll" });
    }
  });

  app.post("/api/payroll/process/:dtrId", async (req, res) => {
    try {
      const dtrId = req.params.dtrId;
      const dtr = await storage.getDTR(dtrId);
      if (!dtr) {
        return res.status(404).json({ message: "DTR not found" });
      }
      
      // Mark DTR as processing
      await storage.updateDTR(dtrId, {
        ...dtr,
        status: "Processing"
      });
      
      // Find the employee to get the salary
      const employee = await storage.getEmployee(dtr.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const salary = employee.salary;
      const regularHours = dtr.regularHours;
      const overtimeHours = dtr.overtimeHours || 0;
      
      // Calculate pay
      const regularPay = regularHours * salary;
      const overtimePay = overtimeHours * salary * 1.5; // OT is 1.5x
      const grossPay = regularPay + overtimePay;
      
      // Apply simple deductions (10% of gross pay for demo)
      const totalDeductions = grossPay * 0.1;
      const netPay = grossPay - totalDeductions;
      
      // Create a payroll record
      const payrollData = {
        employeeId: dtr.employeeId,
        payPeriodStart: dtr.date,
        payPeriodEnd: dtr.date,
        totalRegularHours: regularHours,
        totalOvertimeHours: overtimeHours,
        grossPay,
        totalDeductions,
        netPay,
        status: "Pending",
        processedBy: 1, // Admin user
        processedDate: format(new Date(), "yyyy-MM-dd")
      };
      
      const payroll = await storage.createPayroll(payrollData);
      const employeeName = `${employee.firstName} ${employee.lastName}`;
      
      await logActivity((req.user as any)?._id, "payroll_processed", `Payroll processed for ${employeeName} - ${dtr.date}`);
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to process payroll" });
    }
  });

  app.post("/api/payrolls/generate", async (req, res) => {
    console.log('HIT PAYROLL GENERATE ENDPOINT');
    try {
      const { periodStart, periodEnd } = req.body;
      console.log("[PAYROLL GENERATE] periodStart:", periodStart, "periodEnd:", periodEnd);
      // For demo purposes, we'll create payrolls for all active employees
      const employees = await storage.getAllEmployees();
      const activeEmployees = employees.filter(emp => emp.status === "Active");
      console.log("[PAYROLL GENERATE] Active employees:", activeEmployees.map(e => ({ id: e.id || e._id, name: e.firstName + ' ' + e.lastName })));
      const payrolls = [];
      for (const employee of activeEmployees) {
        // Get approved DTRs for this employee in the period
        const dtrs = await storage.getAllDTRs();
        // Fix employeeId comparison for string/ObjectId
        const employeeDtrs = dtrs.filter(dtr => 
          (String(dtr.employeeId) === String(employee._id || employee.id)) && 
          dtr.status === "Approved" &&
          new Date(dtr.date) >= new Date(periodStart) &&
          new Date(dtr.date) <= new Date(periodEnd)
        );
        if (employeeDtrs.length > 0) {
          // Check if payroll already exists for this employee and period
          const allPayrolls = await storage.getAllPayrolls();
          const alreadyExists = allPayrolls.some(p => 
            String(p.employeeId) === String(employee._id || employee.id) &&
            p.payPeriodStart === periodStart &&
            p.payPeriodEnd === periodEnd
          );
          if (alreadyExists) {
            continue; // Skip duplicate
          }
          // Calculate total hours and pay
          let totalRegularHours = 0;
          let totalOvertimeHours = 0;
          employeeDtrs.forEach(dtr => {
            totalRegularHours += dtr.regularHours;
            totalOvertimeHours += dtr.overtimeHours || 0;
          });
          // Payroll calculation based on employee type
          let regularPay = 0;
          let overtimePay = 0;
          if (employee.employeeType === 'Regular') {
            // Pro-rate salary if period is not a full month
            const periodStartDate = new Date(periodStart);
            const periodEndDate = new Date(periodEnd);
            const daysInPeriod = (periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
            const daysInMonth = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth() + 1, 0).getDate();
            regularPay = employee.salary * (daysInPeriod / daysInMonth);
            overtimePay = totalOvertimeHours * (employee.salary / daysInMonth / 8) * 1.25; // OT based on daily rate (calendar days, 8 hours/day)
          } else {
            // Project-based, Contract, or Hourly: pay is per hour
            regularPay = totalRegularHours * employee.salary;
            overtimePay = totalOvertimeHours * employee.salary * 1.25;
          }
          const grossPay = regularPay + overtimePay;
          const taxDeduction = grossPay * 0.1; // 10% deduction for demo
          const sssDeduction = 0; // Add logic if needed
          const philhealthDeduction = 0; // Add logic if needed
          const totalDeductions = taxDeduction + sssDeduction + philhealthDeduction;
          const netPay = grossPay - totalDeductions;
          const payrollData = {
            employeeId: employee._id || employee.id,
            periodStart: periodStart,
            periodEnd: periodEnd,
            basicPay: regularPay,
            overtimePay: overtimePay,
            deductions: [
              { type: "Tax", amount: taxDeduction, description: "Withholding tax" },
              // Add SSS, PhilHealth, etc. if needed
            ],
            netPay: netPay,
            status: "Pending",
            totalRegularHours,
            totalOvertimeHours,
            grossPay,
            totalDeductions,
          };
          const payroll = await storage.createPayroll(payrollData);
          payrolls.push(payroll);
          // Do NOT update DTRs here; leave them as 'Approved'.
          // (No status change in this loop)
          await logActivity((req.user as any)?._id, "payroll_generated", `Payroll generated for ${employee.firstName} ${employee.lastName} - ${periodStart} to ${periodEnd}`);
        }
      }
      res.json({ message: `${payrolls.length} payrolls generated successfully`, payrolls });
    } catch (error) {
      console.error("[PAYROLL GENERATE] ERROR:", error, (error instanceof Error ? error.stack : ''));
      res.status(500).json({ message: "Failed to generate payrolls", error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : '' });
    }
  });

  app.patch("/api/payrolls/:id/process", async (req, res) => {
    try {
      const payrollId = req.params.id;
      const payroll = await storage.getPayroll(payrollId);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      const updatedPayroll = await storage.updatePayroll(payrollId, {
        ...payroll,
        status: "Processed",
        processedBy: 1,
        processedDate: format(new Date(), "yyyy-MM-dd")
      });
      const employee = await storage.getEmployee(payroll.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${payroll.employeeId}`;

      // --- NEW: Update DTRs in this pay period to 'Processed' ---
      const dtrs = await storage.getAllDTRs();
      const dtrsToUpdate = dtrs.filter(dtr =>
        dtr.employeeId == payroll.employeeId &&
        dtr.status === "Processing" &&
        new Date(dtr.date) >= new Date(payroll.payPeriodStart) &&
        new Date(dtr.date) <= new Date(payroll.payPeriodEnd)
      );
      for (const dtr of dtrsToUpdate) {
        const updated = await storage.updateDTR(dtr._id, { ...dtr, status: "Processed" });
        console.log(`[DTR STATUS UPDATE] DTR _id: ${dtr._id} set to Processed. Result:`, updated);
      }
      // --- END NEW ---

      res.json(updatedPayroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to process payroll" });
    }
  });

  app.patch("/api/payrolls/:id/mark-paid", async (req, res) => {
    try {
      const payrollId = req.params.id;
      const payroll = await storage.getPayroll(payrollId);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      // Log the payroll object for debugging
      console.log('[PAYROLL MARK PAID] Payroll object:', payroll);
      // Use both possible field names for robustness
      const periodStart = payroll.payPeriodStart || payroll.periodStart;
      const periodEnd = payroll.payPeriodEnd || payroll.periodEnd;
      const updatedPayroll = await storage.updatePayroll(payrollId, {
        ...payroll,
        status: "Paid",
        paymentDate: format(new Date(), "yyyy-MM-dd")
      });
      // Update DTRs in this pay period to 'Paid'
      const dtrs = await storage.getAllDTRs();
      const dtrsToUpdate = dtrs.filter(dtr =>
        String(dtr.employeeId) === String(payroll.employeeId) &&
        dtr.status !== "Paid" &&
        periodStart && periodEnd &&
        new Date(dtr.date) >= new Date(periodStart) &&
        new Date(dtr.date) <= new Date(periodEnd)
      );
      console.log(`[PAYROLL MARK PAID] PayrollId: ${payrollId}, EmployeeId: ${payroll.employeeId}, periodStart: ${periodStart}, periodEnd: ${periodEnd}`);
      console.log(`[PAYROLL MARK PAID] DTRs to update to Paid:`, dtrsToUpdate.map(d => ({ _id: d._id, date: d.date, status: d.status })));
      for (const dtr of dtrsToUpdate) {
        const dtrId = dtr._id || dtr.id;
        if (!dtrId) {
          console.error('[PAYROLL MARK PAID] DTR missing id:', dtr);
          continue;
        }
        const updated = await storage.updateDTR(dtrId, { ...dtr, status: "Paid" });
        console.log(`[PAYROLL MARK PAID] Updated DTR _id: ${dtrId} to Paid. Result:`, updated);
      }
      res.json(updatedPayroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark payroll as paid" });
    }
  });

  // --- Employee Dashboard API Endpoints ---
  app.get("/api/employee/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?._id;
      if (!userId) return res.status(401).json({ message: "Not logged in" });
      // Find employee by user email (assuming email is unique)
      const employees = await storage.getAllEmployees();
      const employee = employees.find(e => e.email === (req.user as any)?.email);
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee profile" });
    }
  });

  app.get("/api/employee/dtrs", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const employee = employees.find(e => e.email === (req.user as any)?.email);
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      const dtrs = await storage.getAllDTRs();
      let result = dtrs.filter(dtr => String(dtr.employeeId) === String(employee.id || employee._id));
      if (req.query.week === "current") {
        // Filter for current week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        result = result.filter(dtr => {
          const dtrDate = new Date(dtr.date);
          return dtrDate >= startOfWeek && dtrDate <= endOfWeek;
        });
      }
      if (req.query.recent) {
        result = result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DTRs" });
    }
  });

  app.get("/api/employee/payslip-latest", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const employee = employees.find(e => e.email === (req.user as any)?.email);
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      const payrolls = await storage.getAllPayrolls();
      const empPayrolls = payrolls.filter(p => String(p.employeeId) === String(employee.id || employee._id));
      if (empPayrolls.length === 0) return res.json(null);
      const latest = empPayrolls.sort((a, b) => new Date(b.paymentDate || b.payPeriodEnd || b.periodEnd).getTime() - new Date(a.paymentDate || a.payPeriodEnd || a.periodEnd).getTime())[0];
      res.json(latest);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest payslip" });
    }
  });

  app.get("/api/employee/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?._id;
      if (!userId) return res.status(401).json({ message: "Not logged in" });
      const activities = await storage.getAllActivities();
      // Only show activities for this user (or employee)
      const userActivities = activities.filter(a => String(a.userId) === String(userId));
      res.json(userActivities.slice(0, 10));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  // --- END Employee Dashboard API Endpoints ---

  // Change password endpoint for authenticated users
  app.post("/api/users/change-password", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?._id;
      const { currentPassword, newPassword } = req.body;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      // Find user by ID
      const user = await storage.getUserById ? await storage.getUserById(userId) : await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Check current password
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

      // Hash and update new password
      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { password: hashed });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
