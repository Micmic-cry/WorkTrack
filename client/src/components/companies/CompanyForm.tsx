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
import { insertCompanySchema, Company } from "@shared/schema";
import { useEffect } from "react";

type CompanyFormProps = {
  onSubmit: () => void;
  onCancel: () => void;
  companyId?: string;
};

const CompanyForm = ({ onSubmit, onCancel, companyId }: CompanyFormProps) => {
  const { toast } = useToast();
  const isEditing = !!companyId;

  const form = useForm({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      address: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      status: "Active",
    },
  });

  // Fetch company data if editing
  useEffect(() => {
    const fetchCompany = async () => {
      if (isEditing && companyId) {
        try {
          const response = await apiRequest("GET", `/api/companies/${companyId}`);
          const company = await response.json() as Company;
          form.reset({
            name: company.name,
            address: company.address,
            contactPerson: company.contactPerson,
            contactEmail: company.contactEmail,
            contactPhone: company.contactPhone,
            status: company.status,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch company details. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    fetchCompany();
  }, [isEditing, companyId, form, toast]);

  const handleSubmit = async (values: any) => {
    try {
      if (isEditing) {
        await apiRequest("PATCH", `/api/companies/${companyId}`, values);
      } else {
        await apiRequest("POST", "/api/companies", values);
      }
      
      await queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      
      toast({
        title: isEditing ? "Company Updated" : "Company Added",
        description: isEditing
          ? "Company has been updated successfully."
          : "New company has been added successfully.",
      });
      
      onSubmit();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} company. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Business St, City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="John Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@acmecorp.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
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
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Company" : "Add Company"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CompanyForm;
