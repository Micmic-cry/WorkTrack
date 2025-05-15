import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SortableTable, Column } from "@/components/ui/sortable-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ActionBar } from "@/components/ui/action-bar";
import { formatDate } from "@/lib/utils";
import { Eye, Plus, Download, Trash, Edit, MailOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSearchParams } from "react-router-dom";

// Define the Employee type
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  companyId: number;
  companyName?: string;
  status: "Active" | "Inactive" | "On Leave";
  dateHired: string;
  salary: number;
}

// Create a schema for employee form
const employeeSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  position: z.string().min(2, { message: "Position is required" }),
  department: z.string().optional(),
  companyId: z.number().min(1, { message: "Company is required" }),
  status: z.enum(["Active", "Inactive", "On Leave"]),
  dateHired: z.string(),
  salary: z.number().min(0, { message: "Salary must be a positive number" }),
  employeeType: z.enum(["Regular", "Contract", "Project-based"]),
  dailyWage: z.number().min(0, { message: "Daily wage must be a positive number" }),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface Company {
  id: number;
  name: string;
}

export default function Employees() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("");
  const [searchParams] = useSearchParams();
  const initialCompanyId = searchParams.get("companyId");

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      return await res.json();
    },
  });

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/companies");
      return await res.json();
    },
  });

  // After fetching employees and companies:
  const employeesWithCompanyName = employees.map((emp: any) => ({
    ...emp,
    companyName: companies.find((c: any) => c.id === emp.companyId)?.name || "",
  }));

  // Set company filter from URL on mount or when companies load
  useEffect(() => {
    if (initialCompanyId && companies.length > 0) {
      const company = companies.find((c: any) => String(c.id) === String(initialCompanyId));
      if (company) setCompanyFilter(company.name);
    }
  }, [initialCompanyId, companies]);

  // Add employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      const res = await apiRequest("POST", "/api/employees", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Employee added successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EmployeeFormValues }) => {
      const res = await apiRequest("PATCH", `/api/employees/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Employee updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/employees/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "Success",
        description: "Employee deleted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Setup form for adding/editing employee
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      companyId: 0,
      status: "Active",
      dateHired: new Date().toISOString().split("T")[0],
      salary: 0,
      employeeType: "Regular",
      dailyWage: 0,
    },
  });

  // Reset form when opening add dialog
  const handleAddClick = () => {
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      companyId: 0,
      status: "Active",
      dateHired: new Date().toISOString().split("T")[0],
      salary: 0,
      employeeType: "Regular",
      dailyWage: 0,
    });
    setIsAddDialogOpen(true);
  };

  // Populate form when opening edit dialog
  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    form.reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || "",
      position: employee.position,
      department: employee.department || "",
      companyId: employee.companyId,
      status: employee.status,
      dateHired: employee.dateHired,
      salary: employee.salary,
      employeeType: "Regular",
      dailyWage: 0,
    });
    setIsEditDialogOpen(true);
  };

  // Handle employee deletion
  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  // Handle employee view
  const handleViewClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  // Handle form submission for adding employee
  const onAddSubmit = (data: EmployeeFormValues) => {
    addEmployeeMutation.mutate(data);
  };

  // Handle form submission for editing employee
  const onEditSubmit = (data: EmployeeFormValues) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, data });
    }
  };

  // Handle employee deletion confirmation
  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteEmployeeMutation.mutate(selectedEmployee.id);
    }
  };

  // Define columns for the sortable table
  const columns: Column<Employee>[] = [
    {
      key: "id",
      header: "ID",
      isSortable: true,
    },
    {
      key: "firstName",
      header: "First Name",
      isSortable: true,
      isSearchable: true,
      cell: (row) => <span className="font-medium">{row.firstName}</span>,
    },
    {
      key: "lastName",
      header: "Last Name",
      isSortable: true,
      isSearchable: true,
      cell: (row) => <span className="font-medium">{row.lastName}</span>,
    },
    {
      key: "email",
      header: "Email",
      isSortable: true,
      isSearchable: true,
    },
    {
      key: "position",
      header: "Position",
      isSortable: true,
      isSearchable: true,
    },
    {
      key: "companyName",
      header: "Company",
      isSortable: true,
      isSearchable: true,
    },
    {
      key: "status",
      header: "Status",
      isSortable: true,
      cell: (row) => {
        let badgeVariant: "default" | "destructive" | "secondary" | "outline" = "default";
        if (row.status === "Active") badgeVariant = "default";
        if (row.status === "Inactive") badgeVariant = "secondary";
        if (row.status === "On Leave") badgeVariant = "outline";

        return (
          <Badge variant={badgeVariant} className="capitalize">
            {row.status}
          </Badge>
        );
      },
    },
    {
      key: "dateHired",
      header: "Date Hired",
      isSortable: true,
      cell: (row) => formatDate(row.dateHired),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div>
          <ActionBar
            actions={[
              {
                type: "view",
                label: "View",
                onClick: () => handleViewClick(row),
              },
              {
                type: "edit",
                label: "Edit",
                onClick: () => handleEditClick(row),
              },
              {
                type: "delete",
                label: "Delete",
                onClick: () => handleDeleteClick(row),
              },
              {
                type: "email",
                label: "Send Email",
                onClick: () => {
                  toast({
                    title: "Feature Coming Soon",
                    description: "Email functionality will be available soon.",
                    variant: "default",
                  });
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  // Filter employees by company name
  const filteredEmployees = employeesWithCompanyName.filter((emp: any) =>
    companyFilter === "" ||
    (emp.companyName && emp.companyName.toLowerCase().includes(companyFilter.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee records across all companies
          </p>
        </div>
        <Button onClick={handleAddClick} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>
      <div className="mb-4 max-w-xs">
        <input
          type="text"
          placeholder="Filter company"
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="border rounded px-2 py-1 w-full"
        />
      </div>
      <Card>
        <CardContent className="pt-6">
          <SortableTable
            columns={columns}
            data={filteredEmployees}
            isLoading={isLoading}
            defaultSortKey="lastName"
            defaultSortDirection="asc"
            searchPlaceholder="Search employees..."
            emptyMessage="No employees found. Add your first employee to get started."
          />
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter employee details below to add a new record.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Job position" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Project-based">Project-based</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dailyWage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Wage (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Daily Wage"
                          min={0}
                          step={0.01}
                          {...field}
                          onChange={e => {
                            const value = e.target.value.replace(/[^\d.]/g, '');
                            field.onChange(Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company: Company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateHired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Hired</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Salary amount"
                        {...field}
                        onChange={e => {
                          const value = e.target.value.replace(/[^\d.]/g, '');
                          field.onChange(Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addEmployeeMutation.isPending}>
                  {addEmployeeMutation.isPending ? (
                    <>Adding...</>
                  ) : (
                    <>Add Employee</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              {/* Same form fields as Add Employee */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Job position" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Project-based">Project-based</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dailyWage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Wage (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Daily Wage"
                          min={0}
                          step={0.01}
                          {...field}
                          onChange={e => {
                            const value = e.target.value.replace(/[^\d.]/g, '');
                            field.onChange(Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company: Company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateHired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Hired</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Salary amount"
                        {...field}
                        onChange={e => {
                          const value = e.target.value.replace(/[^\d.]/g, '');
                          field.onChange(Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                  {updateEmployeeMutation.isPending ? (
                    <>Updating...</>
                  ) : (
                    <>Update Employee</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Employee Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedEmployee?.firstName} {selectedEmployee?.lastName}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteEmployeeMutation.isPending}
            >
              {deleteEmployeeMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                  {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Name:</span>
                  <span className="font-medium">{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Email:</span>
                  <span>{selectedEmployee.email}</span>
                </div>
                {selectedEmployee.phone && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Phone:</span>
                    <span>{selectedEmployee.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Position:</span>
                  <span>{selectedEmployee.position}</span>
                </div>
                {selectedEmployee.department && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Department:</span>
                    <span>{selectedEmployee.department}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Company:</span>
                  <span>{
                    companies.find((c: any) => c.id === selectedEmployee.companyId)?.name || 'Not specified'
                  }</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  <Badge variant={
                    selectedEmployee.status === "Active"
                      ? "default"
                      : selectedEmployee.status === "Inactive"
                      ? "secondary"
                      : "outline"
                  } className="capitalize">
                    {selectedEmployee.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Date Hired:</span>
                  <span>{formatDate(selectedEmployee.dateHired)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Salary:</span>
                  <span className="font-medium">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(selectedEmployee.salary)}</span>
                </div>
              </div>
              
              <DialogFooter className="space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  type="button" 
                  variant="default"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditClick(selectedEmployee);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}