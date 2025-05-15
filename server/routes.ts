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
  const logActivity = async (userId: number, action: string, description: string) => {
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
      await logActivity(1, "employee_added", `Added new employee: ${employee.firstName} ${employee.lastName}`);
      res.status(201).json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const updatedEmployee = await storage.updateEmployee(employeeId, req.body);
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      await logActivity(1, "employee_updated", `Updated employee: ${updatedEmployee.firstName} ${updatedEmployee.lastName}`);
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
      await logActivity(1, "employee_activated", `Activated employee: ${employee.firstName} ${employee.lastName}`);
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
      await logActivity(1, "employee_deactivated", `Deactivated employee: ${employee.firstName} ${employee.lastName}`);
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate employee" });
    }
  });

  // Companies endpoints
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const company = await storage.getCompany(parseInt(req.params.id));
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
      await logActivity(1, "company_added", `Added new company: ${company.name}`);
      res.status(201).json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const updatedCompany = await storage.updateCompany(companyId, req.body);
      if (!updatedCompany) {
        return res.status(404).json({ message: "Company not found" });
      }
      await logActivity(1, "company_updated", `Updated company: ${updatedCompany.name}`);
      res.json(updatedCompany);
    } catch (error) {
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.patch("/api/companies/:id/activate", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const updatedCompany = await storage.updateCompany(companyId, { ...company, status: "Active" });
      await logActivity(1, "company_activated", `Activated company: ${company.name}`);
      res.json(updatedCompany);
    } catch (error) {
      res.status(500).json({ message: "Failed to activate company" });
    }
  });

  app.patch("/api/companies/:id/deactivate", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const updatedCompany = await storage.updateCompany(companyId, { ...company, status: "Inactive" });
      await logActivity(1, "company_deactivated", `Deactivated company: ${company.name}`);
      res.json(updatedCompany);
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate company" });
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

      await logActivity(1, "dtr_submitted", `DTR submitted for ${employeeName} - ${dtr.date}`);
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
      
      await logActivity(1, "dtr_updated", `DTR updated for ${employeeName} - ${updatedDTR.date}`);
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
      
      await logActivity(1, "dtr_approved", `DTR approved for ${employeeName} - ${dtr.date}`);
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
      
      await logActivity(1, "dtr_rejected", `DTR rejected for ${employeeName} - ${dtr.date}`);
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
      
      await logActivity(1, "dtr_revision_requested", `Revision requested for ${employeeName}'s DTR - ${dtr.date}`);
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
          
          await logActivity(1, "dtr_approved", `DTR approved for ${employeeName} - ${dtr.date}`);
          results.push(updatedDTR);
        } catch (error) {
          errors.push({ id: dtrId, message: "Failed to process" });
        }
      }
      
      await logActivity(1, "bulk_dtr_approved", `${results.length} DTRs approved in bulk`);
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
          
          await logActivity(1, "dtr_rejected", `DTR rejected for ${employeeName} - ${dtr.date}`);
          results.push(updatedDTR);
        } catch (error) {
          errors.push({ id: dtrId, message: "Failed to process" });
        }
      }
      
      await logActivity(1, "bulk_dtr_rejected", `${results.length} DTRs rejected in bulk`);
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
          
          // Find the employee to get the hourly rate
          const employee = await storage.getEmployee(dtr.employeeId);
          if (!employee) {
            errors.push({ id: dtrId, message: "Employee not found" });
            continue;
          }
          
          const hourlyRate = employee.hourlyRate;
          const regularHours = dtr.regularHours;
          const overtimeHours = dtr.overtimeHours || 0;
          
          // Calculate pay
          const regularPay = regularHours * hourlyRate;
          const overtimePay = overtimeHours * hourlyRate * 1.5; // Assuming 1.5x for overtime
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
          await logActivity(1, "payroll_processed", `Payroll processed for ${employeeName} - ${dtr.date}`);
        } catch (error) {
          errors.push({ id: dtrId, message: "Failed to process" });
        }
      }
      
      await logActivity(1, "bulk_payroll_processed", `${results.length} payrolls processed in bulk`);
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
      
      await logActivity(1, "dtr_format_created", `New DTR format created: ${newFormat.name}`);
      
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
      
      await logActivity(1, "unknown_dtr_format_detected", "New unrecognized DTR format stored for review");
      
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
      
      await logActivity(1, "dtr_format_approved", `DTR format approved and added as: ${newFormat.name}`);
      
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
      await logActivity(1, "dtr_processing_attempt", `DTR image processing attempt${employee ? ` for ${employeeName}` : ''}`);
      
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
      
      await logActivity(1, "payroll_created", `Payroll created for ${employeeName} - ${payroll.payPeriodStart} to ${payroll.payPeriodEnd}`);
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
      
      // Find the employee to get the hourly rate
      const employee = await storage.getEmployee(dtr.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const hourlyRate = employee.hourlyRate;
      const regularHours = dtr.regularHours;
      const overtimeHours = dtr.overtimeHours || 0;
      
      // Calculate pay
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * 1.25; // OT is 1.25x
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
      
      await logActivity(1, "payroll_processed", `Payroll processed for ${employeeName} - ${dtr.date}`);
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
          
          const regularPay = totalRegularHours * employee.hourlyRate;
          const overtimePay = totalOvertimeHours * employee.hourlyRate * 1.25;
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
          
          await logActivity(1, "payroll_generated", `Payroll generated for ${employee.firstName} ${employee.lastName} - ${periodStart} to ${periodEnd}`);
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
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${payroll.employeeId}`;
      
      await logActivity(1, "payroll_processed", `Payroll processed for ${employeeName} - ${payroll.payPeriodStart} to ${payroll.payPeriodEnd}`);
      res.json(updatedPayroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to process payroll" });
    }
  });

  app.patch("/api/payrolls/:id/mark-paid", async (req, res) => {
    try {
      const payrollId = parseInt(req.params.id);
      const payroll = await storage.getPayroll(payrollId);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      
      const updatedPayroll = await storage.updatePayroll(payrollId, {
        ...payroll,
        status: "Paid",
      });
      
      const employee = await storage.getEmployee(payroll.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${payroll.employeeId}`;
      
      await logActivity(1, "payroll_paid", `Payroll marked as paid for ${employeeName} - ${payroll.payPeriodStart} to ${payroll.payPeriodEnd}`);
      res.json(updatedPayroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark payroll as paid" });
    }
  });

  app.post("/api/payroll/generate-payslips", async (req, res) => {
    try {
      // This would normally generate PDF payslips
      // For demo, we'll just update the payroll status
      const payrolls = await storage.getAllPayrolls();
      const pendingPayrolls = payrolls.filter(p => p.status === "Processed");
      
      for (const payroll of pendingPayrolls) {
        await storage.updatePayroll(payroll.id, {
          ...payroll,
          status: "Paid"
        });
        
        const employee = await storage.getEmployee(payroll.employeeId);
        if (employee) {
          await logActivity(1, "payslip_generated", `Payslip generated for ${employee.firstName} ${employee.lastName}`);
        }
      }
      
      res.json({ message: `${pendingPayrolls.length} payslips generated successfully` });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate payslips" });
    }
  });

  // Dashboard statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const dtrs = await storage.getAllDTRs();
      const payrolls = await storage.getAllPayrolls();
      const companies = await storage.getAllCompanies();
      
      const stats = {
        totalEmployees: employees.length,
        pendingDTRs: dtrs.filter(d => d.status === "Pending").length,
        payrollTotal: payrolls.reduce((sum, p) => sum + p.grossPay, 0),
        activeClients: companies.filter(c => c.status === "Active").length
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Payroll status for dashboard
  app.get("/api/payroll/status", async (req, res) => {
    try {
      const payrolls = await storage.getAllPayrolls();
      const employees = await storage.getAllEmployees();
      
      // Current pay period
      const now = new Date();
      const day = now.getDate();
      let periodStart, periodEnd;
      
      if (day <= 15) {
        periodStart = format(new Date(now.getFullYear(), now.getMonth(), 1), "MMMM d");
        periodEnd = format(new Date(now.getFullYear(), now.getMonth(), 15), "MMMM d, yyyy");
      } else {
        periodStart = format(new Date(now.getFullYear(), now.getMonth(), 16), "MMMM d");
        periodEnd = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "MMMM d, yyyy");
      }
      
      // Calculate progress through current pay period
      const currentDay = day <= 15 ? day : day - 15;
      const totalDays = day <= 15 ? 15 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - 15;
      const progress = Math.round((currentDay / totalDays) * 100);
      
      // Group information
      const regularEmployees = employees.filter(e => e.employeeType === "Regular" && e.status === "Active").length;
      const contractEmployees = employees.filter(e => e.employeeType === "Contract" && e.status === "Active").length;
      const projectEmployees = employees.filter(e => e.employeeType === "Project-based" && e.status === "Active").length;
      
      const regularProcessed = payrolls.filter(p => {
        const employee = employees.find(e => e.id === p.employeeId);
        return employee && employee.employeeType === "Regular";
      }).length;
      
      const contractProcessed = payrolls.filter(p => {
        const employee = employees.find(e => e.id === p.employeeId);
        return employee && employee.employeeType === "Contract";
      }).length;
      
      const projectProcessed = payrolls.filter(p => {
        const employee = employees.find(e => e.id === p.employeeId);
        return employee && employee.employeeType === "Project-based";
      }).length;
      
      const regularAmount = payrolls.filter(p => {
        const employee = employees.find(e => e.id === p.employeeId);
        return employee && employee.employeeType === "Regular";
      }).reduce((sum, p) => sum + p.grossPay, 0);
      
      const contractAmount = payrolls.filter(p => {
        const employee = employees.find(e => e.id === p.employeeId);
        return employee && employee.employeeType === "Contract";
      }).reduce((sum, p) => sum + p.grossPay, 0);
      
      const projectAmount = payrolls.filter(p => {
        const employee = employees.find(e => e.id === p.employeeId);
        return employee && employee.employeeType === "Project-based";
      }).reduce((sum, p) => sum + p.grossPay, 0);
      
      const status = {
        progress,
        periodStart,
        periodEnd,
        groups: [
          {
            name: "Regular Employees",
            status: regularProcessed >= regularEmployees ? "Ready" : "Pending",
            processed: regularProcessed,
            total: regularEmployees,
            amount: regularAmount
          },
          {
            name: "Contract Workers",
            status: contractProcessed >= contractEmployees ? "Ready" : "Pending",
            processed: contractProcessed,
            total: contractEmployees || 5, // Default for demo
            amount: contractAmount
          },
          {
            name: "Project-based",
            status: "Processing",
            processed: projectProcessed,
            total: projectEmployees || 3, // Default for demo
            amount: projectAmount
          }
        ]
      };
      
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll status" });
    }
  });

  // Recent activities
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getAllActivities();
      // Sort by timestamp, newest first, and limit to 10
      const recentActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      res.json(recentActivities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities/mark-read", async (req, res) => {
    try {
      await storage.markAllActivitiesAsRead();
      res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // User profile
  app.get("/api/users/profile", async (req, res) => {
    try {
      // Return admin user for demo
      const adminUser = {
        id: 1,
        username: "admin",
        firstName: "Admin",
        lastName: "User",
        email: "admin@worktrack.com",
        role: "Admin",
        status: "Active"
      };
      res.json(adminUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // System settings
  app.get("/api/settings", async (req, res) => {
    try {
      // Return default settings for demo
      const settings = {
        emailNotifications: true,
        autoApproveDTR: false,
        weekendOvertimeBonus: true,
        automaticBackup: false,
        defaultHourlyRate: 250,
        overtimeMultiplier: 1.25,
        taxRate: 10,
        sssRate: 3.63,
        philhealthRate: 2.75,
        applyTaxDeductions: true
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    try {
      const { from, to } = req.query;
      const employees = await storage.getAllEmployees();
      const dtrs = await storage.getAllDTRs();
      const payrolls = await storage.getAllPayrolls();

      // Payroll report data
      const payrollReport = [
        { period: "Week 1", regularPay: 120000, overtimePay: 15000, deductions: 13500 },
        { period: "Week 2", regularPay: 125000, overtimePay: 12000, deductions: 13700 },
        { period: "Week 3", regularPay: 118000, overtimePay: 14500, deductions: 13250 },
        { period: "Week 4", regularPay: 122000, overtimePay: 13000, deductions: 13500 }
      ];
      const payrollSummary = {
        totalPayroll: payrolls.reduce((sum, p) => sum + p.grossPay, 0),
        averagePayPerEmployee: employees.length > 0 ? payrolls.reduce((sum, p) => sum + p.netPay, 0) / employees.length : 0,
        totalEmployeesPaid: new Set(payrolls.map(p => p.employeeId)).size
      };

      // Employee report data
      const deptCounts: { [key: string]: number } = {};
      employees.forEach(e => {
        deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
      });
      const byDepartment = Object.keys(deptCounts).map(dept => ({ name: dept, value: deptCounts[dept] }));
      const employeeReport = { byDepartment };
      const employeeSummary = {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.status === "Active").length,
        activePercentage: employees.length > 0 ? Math.round((employees.filter(e => e.status === "Active").length / employees.length) * 100) : 0,
        regularEmployees: employees.filter(e => e.employeeType === "Regular").length,
        contractEmployees: employees.filter(e => e.employeeType === "Contract").length,
        projectEmployees: employees.filter(e => e.employeeType === "Project-based").length
      };

      // DTR report data
      const submissionDates: { [key: string]: { date: string; submissions: number; approved: number; rejected: number } } = {};
      dtrs.forEach(d => {
        const date = d.date;
        if (!submissionDates[date]) {
          submissionDates[date] = { date, submissions: 0, approved: 0, rejected: 0 };
        }
        submissionDates[date].submissions += 1;
        if (d.status === "Approved") {
          submissionDates[date].approved += 1;
        } else if (d.status === "Rejected") {
          submissionDates[date].rejected += 1;
        }
      });
      const byDate = Object.values(submissionDates);
      const dtrReport = { byDate };
      const dtrSummary = {
        totalSubmissions: dtrs.length,
        pendingDTRs: dtrs.filter(d => d.status === "Pending").length,
        approvedDTRs: dtrs.filter(d => d.status === "Approved").length,
        rejectedDTRs: dtrs.filter(d => d.status === "Rejected").length,
        processingDTRs: dtrs.filter(d => d.status === "Processing").length,
        averageHoursPerDTR: dtrs.length > 0 ? dtrs.reduce((sum, d) => sum + d.regularHours, 0) / dtrs.length : 0,
        averageOvertimeHours: dtrs.length > 0 ? dtrs.reduce((sum, d) => sum + (d.overtimeHours || 0), 0) / dtrs.length : 0
      };

      // Merge all summaries
      const summary = { ...payrollSummary, ...employeeSummary, ...dtrSummary };

      res.json({
        payroll: payrollReport,
        employee: employeeReport,
        dtr: dtrReport,
        summary
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Data clearing endpoints
  app.delete("/api/dtrs/clear", async (req, res) => {
    try {
      await storage.clearDTRs();
      await logActivity(1, "data_cleared", "All DTR records have been cleared");
      res.json({ message: "All DTR records have been cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear DTR records" });
    }
  });

  app.delete("/api/payrolls/clear", async (req, res) => {
    try {
      await storage.clearPayrolls();
      await logActivity(1, "data_cleared", "All payroll records have been cleared");
      res.json({ message: "All payroll records have been cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear payroll records" });
    }
  });

  app.delete("/api/activities/clear", async (req, res) => {
    try {
      await storage.clearActivities();
      // Create a new activity for this action
      await logActivity(1, "data_cleared", "All activity logs have been cleared");
      res.json({ message: "All activity logs have been cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear activity logs" });
    }
  });

  app.delete("/api/all/clear", async (req, res) => {
    try {
      await storage.clearAll();
      
      // Add back admin user
      await storage.createUser({
        username: "admin",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        email: "admin@worktrack.com",
        role: "Admin",
        status: "Active"
      });
      
      // Add back staff user
      await storage.createUser({
        username: "staff",
        password: "staff123",
        firstName: "Staff",
        lastName: "Member",
        email: "staff@worktrack.com",
        role: "Staff",
        status: "Active"
      });
      
      // Add back manager user
      await storage.createUser({
        username: "manager",
        password: "manager123",
        firstName: "Department",
        lastName: "Manager",
        email: "manager@worktrack.com",
        role: "Manager",
        status: "Active"
      });
      
      await logActivity(1, "system_reset", "System has been reset to initial state");
      res.json({ message: "System has been reset to initial state" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset system" });
    }
  });

  app.post("/api/system/backup", async (req, res) => {
    try {
      // In a real app, this would create an actual backup
      // For demo, we'll just log it
      await logActivity(1, "system_backup", "System backup has been created");
      res.json({ message: "System backup has been created" });
    } catch (error) {
      res.status(500).json({ message: "Failed to create system backup" });
    }
  });

  // Export reports
  app.post("/api/reports/export", async (req, res) => {
    try {
      const { reportType, dateRange } = req.body;
      // In a real app, this would generate an actual report file
      // For demo, we'll just log it
      await logActivity(1, "report_exported", `${reportType} report has been exported for period: ${dateRange.from} to ${dateRange.to}`);
      res.json({ message: `${reportType} report has been exported` });
    } catch (error) {
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
