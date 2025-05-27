import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import PayrollForm from "@/components/payroll/PayrollForm";
import PayslipView from "@/components/payroll/PayslipView";
import { Plus, Download, Search, Filter, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Payroll } from "@shared/schema";
import { DateRange } from "react-day-picker";
import { useSearchParams } from "react-router-dom";

const PayrollPage = () => {
  const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);
  const [viewingPayslip, setViewingPayslip] = useState<Payroll | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [payrollPeriod, setPayrollPeriod] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });

  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("companyId");

  const { toast } = useToast();

  const { data: payrolls, isLoading, refetch } = useQuery({
    queryKey: ['/api/payrolls'],
  });

  const { data: employees, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  console.log('companyId from URL:', companyId);
  console.log('All employees:', employees);
  const employeesInCompany = (Array.isArray(employees) ? employees : []).filter((e: any) => !companyId || String(e.companyId) === String(companyId));
  console.log('Employees in selected company:', employeesInCompany);
  console.log('All payrolls:', payrolls);

  const filteredPayrolls = (Array.isArray(payrolls) ? payrolls : []).filter((payroll: any) => {
    // Only filter by date if both from and to are set
    if (payrollPeriod.from && payrollPeriod.to) {
      const payPeriodStart = new Date(payroll.payPeriodStart);
      const payPeriodEnd = new Date(payroll.payPeriodEnd);
      const matchesDateRange =
        (payPeriodStart >= payrollPeriod.from && payPeriodStart <= payrollPeriod.to) ||
        (payPeriodEnd >= payrollPeriod.from && payPeriodEnd <= payrollPeriod.to);
      if (!matchesDateRange) return false;
    }
    // Filter by search query (employee name would be implemented in a real app)
    const matchesQuery =
      searchQuery === "" || payroll.employeeId.toString().includes(searchQuery);
    // Filter by tab
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && payroll.status === "Pending") ||
      (activeTab === "processed" && payroll.status === "Processed") ||
      (activeTab === "paid" && payroll.status === "Paid");
    // Filter by companyId if present
    if (companyId) {
      const employee = (Array.isArray(employees) ? employees : []).find((e: any) => e.id === payroll.employeeId);
      if (!employee || String(employee.companyId) !== String(companyId)) return false;
    }
    return matchesQuery && matchesTab;
  });

  console.log('Filtered payrolls:', filteredPayrolls);

  const handleGeneratePayrolls = async () => {
    try {
      const periodStart = payrollPeriod.from ? format(payrollPeriod.from, "yyyy-MM-dd") : "";
      const periodEnd = payrollPeriod.to ? format(payrollPeriod.to, "yyyy-MM-dd") : "";
      await apiRequest("POST", "/api/payrolls/generate", {
        periodStart,
        periodEnd,
      });
      await refetch(); // Force fresh fetch of payrolls
      toast({
        title: "Payrolls Generated",
        description: "Payrolls have been generated successfully.",
      });
      setIsGeneratingPayroll(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate payrolls. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPayslip = (payrollId: number) => {
    const payroll = (Array.isArray(payrolls) ? payrolls : []).find((p: any) => p.id === payrollId) as any;
    if (payroll) {
      const employee = (Array.isArray(employees) ? employees : []).find((e: any) => e.id === payroll.employeeId);
      setViewingPayslip({
        ...payroll,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Not specified",
        position: employee?.position || "Not specified",
        department: employee?.department || "Not specified",
        payDate: payroll.processedDate || payroll.payPeriodEnd,
      });
    }
  };

  const handleProcessPayroll = async (payrollId: number) => {
    try {
      await apiRequest("PATCH", `/api/payrolls/${payrollId}/process`, {});
      await queryClient.invalidateQueries({ queryKey: ['/api/payrolls'] });
      toast({
        title: "Payroll Processed",
        description: "The payroll has been processed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payroll. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (payrollId: number) => {
    try {
      await apiRequest("PATCH", `/api/payrolls/${payrollId}/mark-paid`, {});
      await queryClient.invalidateQueries({ queryKey: ['/api/payrolls'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/dtrs'] });
      toast({
        title: "Payroll Marked as Paid",
        description: "The payroll has been marked as paid.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark payroll as paid. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = (Array.isArray(employees) ? employees : []).find((e: any) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${employeeId}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
            Pending
          </span>
        );
      case "Processed":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Processed
          </span>
        );
      case "Paid":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Paid
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (viewingPayslip) {
    return (
      <div className="max-w-7xl mx-auto">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => setViewingPayslip(null)}
        >
          Back to Payroll List
        </Button>
        <PayslipView
          payslip={viewingPayslip as any}
          onClose={() => setViewingPayslip(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Payroll Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Process and manage employee payroll and payslips.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          <Button variant="outline" onClick={() => {}}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button onClick={() => setIsGeneratingPayroll(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Payroll
          </Button>
        </div>
      </div>

      {isGeneratingPayroll ? (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Generate Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <PayrollForm
              payrollPeriod={payrollPeriod}
              setPayrollPeriod={setPayrollPeriod}
              onCancel={() => setIsGeneratingPayroll(false)}
              onSubmit={handleGeneratePayrolls}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-2 mb-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-8"
                placeholder="Search by employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Period:</span>
                <DateRangePicker value={payrollPeriod} onChange={setPayrollPeriod} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPayrollPeriod({ from: undefined, to: undefined })}
                  title="Clear date filter"
                >
                  Clear
                </Button>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="processed">Processed</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pay Period
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Pay
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Pay
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
                  {isLoading || isEmployeesLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="px-6 py-4 whitespace-nowrap">
                          <div className="animate-pulse flex space-x-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredPayrolls && filteredPayrolls.length > 0 ? (
                    filteredPayrolls.map((payroll) => (
                      <tr key={payroll.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getEmployeeName(payroll.employeeId)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payroll.payPeriodStart} to {payroll.payPeriodEnd}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payroll.totalRegularHours} hrs
                            {payroll.totalOvertimeHours > 0 && (
                              <span className="ml-1 text-primary">
                                (+{payroll.totalOvertimeHours} OT)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₱{((payroll.basicPay || 0) + (payroll.overtimePay || 0)).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₱{(Array.isArray(payroll.deductions) ? payroll.deductions.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) : 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₱{payroll.netPay.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payroll.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPayslip(payroll.id)}
                              title="View Payslip"
                            >
                              <FileText className="h-4 w-4 text-primary" />
                            </Button>
                            
                            {payroll.status === "Pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleProcessPayroll(payroll.id)}
                                title="Process Payroll"
                              >
                                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </Button>
                            )}
                            
                            {payroll.status === "Processed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkAsPaid(payroll.id)}
                                title="Mark as Paid"
                              >
                                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPayslip(payroll.id)}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4 text-gray-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No payrolls found for the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default PayrollPage;
