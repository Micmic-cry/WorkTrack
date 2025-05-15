import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, MoreVertical, Users, FileText, XCircle } from "lucide-react";
import { Company } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useNavigate } from "react-router-dom";

type CompanyListProps = {
  companies?: Company[];
  isLoading: boolean;
  onEditCompany?: (company: Company) => void;
};

const CompanyList = ({ companies = [], isLoading, onEditCompany }: CompanyListProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDeactivate = async (companyId: number) => {
    try {
      await apiRequest("PATCH", `/api/companies/${companyId}/deactivate`, {});
      await queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({
        title: "Company Deactivated",
        description: "The company has been deactivated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate company. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (companyId: number) => {
    try {
      await apiRequest("PATCH", `/api/companies/${companyId}/activate`, {});
      await queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({
        title: "Company Activated",
        description: "The company has been activated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate company. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewEmployees = (company: Company) => {
    navigate(`/employees?companyId=${company.id}`);
  };

  const handleViewPayroll = (company: Company) => {
    navigate(`/payroll?companyId=${company.id}`);
  };

  return (
    <Card className="overflow-hidden">
      <div className="w-full overflow-auto max-h-[70vh]">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Person
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </td>
                  </tr>
                ))
            ) : companies.length > 0 ? (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {company.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.contactPerson}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.contactEmail}
                    </div>
                    <div className="text-sm text-gray-500">
                      {company.contactPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEditCompany && onEditCompany(company)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewEmployees(company)}>
                          <Users className="mr-2 h-4 w-4" />
                          View Employees
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewPayroll(company)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Payroll
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {company.status === "Active" ? (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeactivate(company.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => handleActivate(company.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default CompanyList;
