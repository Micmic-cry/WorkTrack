import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertDtrSchema, Employee } from "@shared/schema";
import { format } from "date-fns";
import { z } from "zod";
import { calculateRegularHours } from "@/lib/utils/dateUtils";
import { useAuth } from "@/hooks/use-auth";

const formSchema = insertDtrSchema.extend({
  timeIn: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Time must be in 24-hour format (HH:MM)",
  }),
  timeOut: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Time must be in 24-hour format (HH:MM)",
  }),
}).refine((data) => {
  // Convert timeIn and timeOut to Date objects for comparison
  const [inHour, inMinute] = data.timeIn.split(':').map(Number);
  const [outHour, outMinute] = data.timeOut.split(':').map(Number);
  const timeInDate = new Date(0, 0, 0, inHour, inMinute);
  const timeOutDate = new Date(0, 0, 0, outHour, outMinute);
  
  // Check if timeOut is after timeIn
  return timeOutDate > timeInDate;
}, {
  message: "Time out must be after time in",
  path: ["timeOut"],
});

type DTRFormProps = {
  onSubmit: () => void;
  onCancel: () => void;
  dtrId?: number;
  employees?: Employee[];
  isLoading?: boolean;
};

const DTRForm = ({ onSubmit, onCancel, dtrId, employees = [], isLoading = false }: DTRFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!dtrId;
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: user && user.role !== "Admin" ? user._id : "",
      date: today,
      timeIn: "08:00",
      timeOut: "17:00",
      breakHours: 1,
      overtimeHours: 0,
      remarks: "",
      type: "Daily",
      status: "Pending",
      submissionDate: today,
    },
  });

  const watchTimeIn = form.watch("timeIn");
  const watchTimeOut = form.watch("timeOut");
  const watchBreakHours = form.watch("breakHours");

  // Calculate regular hours based on time in, time out, and break hours
  const calculateHours = () => {
    if (watchTimeIn && watchTimeOut) {
      const regularHours = calculateRegularHours(watchTimeIn, watchTimeOut, watchBreakHours);
      return regularHours > 0 ? regularHours : 0;
    }
    return 0;
  };
  
  const regularHours = calculateHours();

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e._id === employeeId);
    if (employee) {
      setSelectedEmployeeType(employee.employeeType);
      // Only set DTR type if Project-based
      if (employee.employeeType === "Project-based") {
        form.setValue("type", "Project-based");
      }
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const dtrData = {
        ...values,
        submissionDate: format(new Date(), "yyyy-MM-dd"),
        employeeId: values.employeeId,
        regularHours: regularHours
      };
      
      if (isEditing) {
        await apiRequest("PATCH", `/api/dtrs/${dtrId}`, dtrData);
      } else {
        await apiRequest("POST", "/api/dtrs", dtrData);
      }
      
      await queryClient.invalidateQueries({ queryKey: ['/api/dtrs'] });
      
      toast({
        title: isEditing ? "DTR Updated" : "DTR Added",
        description: isEditing
          ? "DTR has been updated successfully."
          : "New DTR has been added successfully.",
      });
      
      onSubmit();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} DTR. Please try again.`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // If user is not admin, set employeeId to their own id
    if (user && user.role !== "Admin") {
      form.setValue("employeeId", user._id);
    } else if (employees.length > 0 && !form.getValues("employeeId")) {
      form.setValue("employeeId", employees[0]._id);
      handleEmployeeChange(employees[0]._id);
    }
  }, [employees, user]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Only show Employee dropdown for Admins/Managers */}
          {user && user.role === "Admin" && (
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoading ? (
                          <SelectItem key="loading" value="loading">Loading employees...</SelectItem>
                        ) : employees.length > 0 ? (
                          employees.map((employee) => (
                            <SelectItem key={employee._id} value={employee._id}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem key="none" value="none">No employees available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DTR Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={selectedEmployeeType === "Project-based"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select DTR type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="Project-based">Project-based</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="timeIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time In</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        form.trigger(["timeIn", "timeOut"]); // Re-validate both fields
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeOut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Out</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        form.trigger(["timeIn", "timeOut"]); // Re-validate both fields
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
            name="breakHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Break Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(!isNaN(value) ? value : 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="overtimeHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overtime Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(!isNaN(value) ? value : 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Hours Summary</h4>
            <span className="text-sm text-gray-500">Calculated automatically</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Regular Hours:</span>
              <span className="font-medium">{regularHours} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Overtime Hours:</span>
              <span className="font-medium">{form.getValues("overtimeHours")} hrs</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Total Hours:</span>
              <span>{regularHours + form.getValues("overtimeHours")} hrs</span>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes or comments about this DTR entry"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update DTR" : "Submit DTR"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DTRForm;
