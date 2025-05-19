import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertEmployeeSchema } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

const formSchema = insertEmployeeSchema.extend({
  confirmEmail: z.string().email(),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Emails do not match",
  path: ["confirmEmail"],
});

type EmployeeFormProps = {
  onSubmit: () => void;
  onCancel: () => void;
  employeeId?: number;
};

const EmployeeForm = ({ onSubmit, onCancel, employeeId }: EmployeeFormProps) => {
  const { toast } = useToast();
  const isEditing = !!employeeId;

  const { data: companies, isLoading: isCompaniesLoading } = useQuery({
    queryKey: ['/api/companies'],
  });

  const { data: employee, isLoading: isEmployeeLoading } = useQuery({
    queryKey: ['/api/employees', employeeId],
    enabled: isEditing,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing && employee
      ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          confirmEmail: employee.email,
          phone: employee.phone,
          position: employee.position,
          department: employee.department,
          employeeType: employee.employeeType,
          dateHired: employee.dateHired,
          status: employee.status,
          hourlyRate: employee.hourlyRate,
          companyId: employee.companyId,
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          confirmEmail: "",
          phone: "",
          position: "",
          department: "",
          employeeType: "Regular",
          dateHired: new Date().toISOString().split('T')[0],
          status: "Active",
          hourlyRate: 0,
          companyId: "",
        },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { confirmEmail, ...employeeData } = values;
      
      if (isEditing) {
        await apiRequest("PATCH", `/api/employees/${employeeId}`, employeeData);
      } else {
        await apiRequest("POST", "/api/employees", employeeData);
      }
      
      await queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      
      toast({
        title: isEditing ? "Employee Updated" : "Employee Added",
        description: isEditing
          ? "Employee has been updated successfully."
          : "New employee has been added successfully.",
      });
      
      onSubmit();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} employee. Please try again.`,
        variant: "destructive",
      });
    }
  };

  if (isEditing && isEmployeeLoading) {
    return <div>Loading employee data...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
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
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
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
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} />
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
                  <Input placeholder="Engineering" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employeeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee type" />
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
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly Rate (₱)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isCompaniesLoading ? (
                      <SelectItem value="loading">Loading companies...</SelectItem>
                    ) : companies && companies.length > 0 ? (
                      companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none">No companies available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Employee" : "Add Employee"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EmployeeForm;
