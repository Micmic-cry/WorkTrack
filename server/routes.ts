import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { format } from "date-fns";
import {
  insertEmployeeSchema,
  insertCompanySchema,
  insertDtrSchema,
  insertPayrollSchema,
  insertActivitySchema,
} from "@shared/schema";
import { calculateRegularHours } from "../client/src/lib/utils/dateUtils";
import { setupAuth } from "./auth";

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
    if (req.isAuthenticated() && req.user?.role === "Admin") {
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
      const employee = await storage.getEmployee(parseInt(req.params.id));
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
      const employee = await storage.createEmployee(req.body);
      // Log activity in the background, do not block response
      logActivity(req.user?._id || req.user?.id, "employee_added", `Added new employee: ${employee.firstName} ${employee.lastName}`)
        .catch(err => console.error("Failed to log activity:", err));
      res.status(201).json(employee);
    } catch (error) {
      console.error('Failed to create employee:', error);
      res.status(500).json({ message: "Failed to create employee", error: error.message, stack: error.stack });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const updatedEmployee = await storage.updateEmployee(employeeId, req.body);
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      logActivity(req.user?._id || req.user?.id, "employee_updated", `Updated employee: ${updatedEmployee.firstName} ${updatedEmployee.lastName}`)
        .catch(err => console.error("Failed to log activity:", err));
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.patch("/api/employees/:id/activate", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const updatedEmployee = await storage.updateEmployee(employeeId, { ...employee, status: "Active" });
      logActivity(req.user?._id || req.user?.id, "employee_activated", `Activated employee: ${employee.firstName} ${employee.lastName}`)
        .catch(err => console.error("Failed to log activity:", err));
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: "Failed to activate employee" });
    }
  });

  app.patch("/api/employees/:id/deactivate", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const updatedEmployee = await storage.updateEmployee(employeeId, { ...employee, status: "Inactive" });
      logActivity(req.user?._id || req.user?.id, "employee_deactivated", `Deactivated employee: ${employee.firstName} ${employee.lastName}`)
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
      logActivity(req.user?._id || req.user?.id, "company_added", `Added new company: ${company.name}`)
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
      logActivity(req.user?._id || req.user?.id, "company_updated", `Updated company: ${updatedCompany.name}`)
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
      logActivity(req.user?._id || req.user?.id, "company_activated", `Activated company: ${company.name}`)
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
      logActivity(req.user?._id || req.user?.id, "company_deactivated", `Deactivated company: ${company.name}`)
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
      const dtr = await storage.getDTR(parseInt(req.params.id));
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

      await logActivity(req.user?._id || req.user?.id, "dtr_submitted", `DTR submitted for ${employeeName} - ${dtr.date}`);
      res.status(201).json(dtr);
    } catch (error) {
      res.status(500).json({ message: "Failed to create DTR" });
    }
  });

  app.patch("/api/dtrs/:id", async (req, res) => {
    try {
      const dtrId = parseInt(req.params.id);
      const updatedDTR = await storage.updateDTR(dtrId, req.body);
      if (!updatedDTR) {
        return res.status(404).json({ message: "DTR not found" });
      }
      
      const employee = await storage.getEmployee(updatedDTR.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${updatedDTR.employeeId}`;
      
      await logActivity(req.user?._id || req.user?.id, "dtr_updated", `DTR updated for ${employeeName} - ${updatedDTR.date}`);
      res.json(updatedDTR);
    } catch (error) {
      res.status(500).json({ message: "Failed to update DTR" });
    }
  });

  app.patch("/api/dtrs/:id/approve", async (req, res) => {
    try {
      const dtrId = parseInt(req.params.id);
      const dtr = await storage.getDTR(dtrId);
      if (!dtr) {
        return res.status(404).json({ message: "DTR not found" });
      }
      
      const updatedDTR = await storage.updateDTR(dtrId, { 
        ...dtr,
        status: "Approved",
        approvedBy: 1, // Admin user ID
        approvalDate: format(new Date(), "yyyy-MM-dd")
      });
      
      const employee = await storage.getEmployee(dtr.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;
      
      await logActivity(req.user?._id || req.user?.id, "dtr_approved", `DTR approved for ${employeeName} - ${dtr.date}`);
      res.json(updatedDTR);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve DTR" });
    }
  });

  app.patch("/api/dtrs/:id/reject", async (req, res) => {
    try {
      const dtrId = parseInt(req.params.id);
      const dtr = await storage.getDTR(dtrId);
      if (!dtr) {
        return res.status(404).json({ message: "DTR not found" });
      }
      
      const updatedDTR = await storage.updateDTR(dtrId, { 
        ...dtr,
        status: "Rejected",
        approvedBy: 1, // Admin user ID
        approvalDate: format(new Date(), "yyyy-MM-dd")
      });
      
      const employee = await storage.getEmployee(dtr.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;
      
      await logActivity(req.user?._id || req.user?.id, "dtr_rejected", `DTR rejected for ${employeeName} - ${dtr.date}`);
      res.json(updatedDTR);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject DTR" });
    }
  });

  app.patch("/api/dtrs/:id/request-revision", async (req, res) => {
    try {
      const dtrId = parseInt(req.params.id);
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
      
      await logActivity(req.user?._id || req.user?.id, "dtr_revision_requested", `Revision requested for ${employeeName}'s DTR - ${dtr.date}`);
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
          
          const updatedDTR = await storage.updateDTR(dtrId, {
            ...dtr,
            status: "Approved",
            approvedBy: 1, // Admin user ID
            approvalDate: format(new Date(), "yyyy-MM-dd")
          });
          
          const employee = await storage.getEmployee(dtr.employeeId);
          const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;
          
          await logActivity(req.user?._id || req.user?.id, "dtr_approved", `DTR approved for ${employeeName} - ${dtr.date}`);
          results.push(updatedDTR);
        } catch (error) {
          errors.push({ id: dtrId, message: "Failed to process" });
        }
      }
      
      await logActivity(req.user?._id || req.user?.id, "bulk_dtr_approved", `${results.length} DTRs approved in bulk`);
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
          
          const updatedDTR = await storage.updateDTR(dtrId, {
            ...dtr,
            status: "Rejected",
            approvedBy: 1, // Admin user ID
            approvalDate: format(new Date(), "yyyy-MM-dd")
          });
          
          const employee = await storage.getEmployee(dtr.employeeId);
          const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${dtr.employeeId}`;
          
          await logActivity(req.user?._id || req.user?.id, "dtr_rejected", `DTR rejected for ${employeeName} - ${dtr.date}`);
          results.push(updatedDTR);
        } catch (error) {
          errors.push({ id: dtrId, message: "Failed to process" });
        }
      }
      
      await logActivity(req.user?._id || req.user?.id, "bulk_dtr_rejected", `${results.length} DTRs rejected in bulk`);
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
          
          // Mark DTR as processing
          await storage.updateDTR(dtrId, {
            ...dtr,
            status: "Processing"
          });
          
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
          await logActivity(req.user?._id || req.user?.id, "payroll_processed", `Payroll processed for ${employeeName} - ${dtr.date}`);
        } catch (error) {
          errors.push({ id: dtrId, message: "Failed to process" });
        }
      }
      
      await logActivity(req.user?._id || req.user?.id, "bulk_payroll_processed", `${results.length} payrolls processed in bulk`);
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
      
      await logActivity(req.user?._id || req.user?.id, "dtr_format_created", `New DTR format created: ${newFormat.name}`);
      
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
      
      await logActivity(req.user?._id || req.user?.id, "unknown_dtr_format_detected", "New unrecognized DTR format stored for review");
      
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
      
      await logActivity(req.user?._id || req.user?.id, "dtr_format_approved", `DTR format approved and added as: ${newFormat.name}`);
      
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
      const employee = employeeId ? await storage.getEmployee(parseInt(employeeId)) : null;
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : undefined;
      
      // Log the processing attempt
      console.log(`Processing DTR image${employeeId ? ` for employee #${employeeId}` : ''}`);
      await logActivity(req.user?._id || req.user?.id, "dtr_processing_attempt", `DTR image processing attempt${employee ? ` for ${employeeName}` : ''}`);
      
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
      const payroll = await storage.getPayroll(parseInt(req.params.id));
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
      
      await logActivity(req.user?._id || req.user?.id, "payroll_created", `Payroll created for ${employeeName} - ${payroll.payPeriodStart} to ${payroll.payPeriodEnd}`);
      res.status(201).json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to create payroll" });
    }
  });

  app.post("/api/payroll/process/:dtrId", async (req, res) => {
    try {
      const dtrId = parseInt(req.params.dtrId);
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
      
      await logActivity(req.user?._id || req.user?.id, "payroll_processed", `Payroll processed for ${employeeName} - ${dtr.date}`);
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to process payroll" });
    }
  });

  app.post("/api/payrolls/generate", async (req, res) => {
    try {
      const { periodStart, periodEnd } = req.body;
      
      // For demo purposes, we'll create payrolls for all active employees
      const employees = await storage.getAllEmployees();
      const activeEmployees = employees.filter(emp => emp.status === "Active");
      
      const payrolls = [];
      for (const employee of activeEmployees) {
        // Get approved DTRs for this employee in the period
        const dtrs = await storage.getAllDTRs();
        const employeeDtrs = dtrs.filter(dtr => 
          dtr.employeeId === employee.id && 
          dtr.status === "Approved" &&
          new Date(dtr.date) >= new Date(periodStart) &&
          new Date(dtr.date) <= new Date(periodEnd)
        );
        
        if (employeeDtrs.length > 0) {
          // Calculate total hours and pay
          let totalRegularHours = 0;
          let totalOvertimeHours = 0;
          
          employeeDtrs.forEach(dtr => {
            totalRegularHours += dtr.regularHours;
            totalOvertimeHours += dtr.overtimeHours || 0;
          });
          
          const regularPay = totalRegularHours * employee.salary;
          const overtimePay = totalOvertimeHours * employee.salary * 1.25;
          const grossPay = regularPay + overtimePay;
          const totalDeductions = grossPay * 0.1; // 10% deduction for demo
          const netPay = grossPay - totalDeductions;
          
          const payrollData = {
            employeeId: employee.id,
            payPeriodStart: periodStart,
            payPeriodEnd: periodEnd,
            totalRegularHours,
            totalOvertimeHours,
            grossPay,
            totalDeductions,
            netPay,
            status: "Pending",
            processedBy: 1,
            processedDate: format(new Date(), "yyyy-MM-dd")
          };
          
          const payroll = await storage.createPayroll(payrollData);
          payrolls.push(payroll);
          
          // Update DTRs to processing
          for (const dtr of employeeDtrs) {
            await storage.updateDTR(dtr.id, {
              ...dtr,
              status: "Processing"
            });
          }
          
          await logActivity(req.user?._id || req.user?.id, "payroll_generated", `Payroll generated for ${employee.firstName} ${employee.lastName} - ${periodStart} to ${periodEnd}`);
        }
      }
      
      res.json({ message: `${payrolls.length} payrolls generated successfully`, payrolls });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate payrolls" });
    }
  });

  app.patch("/api/payrolls/:id/process", async (req, res) => {
    try {
      const payrollId = parseInt(req.params.id);
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
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${payroll.employeeId}`

    } catch (error) {
      res.status(500).json({ message: "Failed to process payroll" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
