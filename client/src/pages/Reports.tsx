import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, Filter, FileText } from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const COLORS = ['#1976D2', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#3F51B5'];

// Helper to check if value is a plain object
function isPlainObject(val: unknown): val is Record<string, any> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

const Reports = () => {
  const [reportType, setReportType] = useState("payroll");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [companyFilter, setCompanyFilter] = useState("all");

  const { toast } = useToast();

  // Fetch companies for filter
  const { data: companies } = useQuery({
    queryKey: ['/api/companies'],
  });

  // Fetch report data based on filters
  const { data: reportData, isLoading } = useQuery({
    queryKey: [
      '/api/reports',
      reportType,
      dateRange.from ? dateRange.from.toISOString() : null,
      dateRange.to ? dateRange.to.toISOString() : null,
      companyFilter,
    ],
  });

  const handleExportReport = async () => {
    try {
      await apiRequest("POST", "/api/reports/export", {
        reportType,
        dateRange: {
          ...(dateRange.from ? { from: format(dateRange.from, "yyyy-MM-dd") } : {}),
          ...(dateRange.to ? { to: format(dateRange.to, "yyyy-MM-dd") } : {}),
        },
        companyFilter,
      });
      
      toast({
        title: "Report Exported",
        description: "Your report has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderPayrollReport = () => {
    const payrollData = isPlainObject(reportData) && Array.isArray(reportData.payroll) ? reportData.payroll : [];
    const summary = isPlainObject(reportData) && isPlainObject(reportData.summary) ? reportData.summary : {};
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payroll Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Array.isArray(payrollData) ? payrollData : []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => typeof value === 'number' ? `₱${value.toFixed(2)}` : value} />
                  <Legend />
                  <Bar dataKey="regularPay" name="Regular Pay" fill="#1976D2" />
                  <Bar dataKey="overtimePay" name="Overtime Pay" fill="#4CAF50" />
                  <Bar dataKey="deductions" name="Deductions" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">Total Payroll</h5>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ₱{typeof summary.totalPayroll === 'number' ? summary.totalPayroll.toFixed(2) : '0.00'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">Average Pay per Employee</h5>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ₱{typeof summary.averagePayPerEmployee === 'number' ? summary.averagePayPerEmployee.toFixed(2) : '0.00'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">Total Employees Paid</h5>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.totalEmployeesPaid ?? '0'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderEmployeeReport = () => {
    const employeeData = isPlainObject(reportData) && isPlainObject(reportData.employee) ? reportData.employee : { byDepartment: [] };
    const summary = isPlainObject(reportData) && isPlainObject(reportData.summary) ? reportData.summary : {};
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Employee Distribution by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Array.isArray(employeeData.byDepartment) ? employeeData.byDepartment : []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(Array.isArray(employeeData.byDepartment) ? employeeData.byDepartment : []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} employees`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">Total Employees</h5>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.totalEmployees ?? '0'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">Active Employees</h5>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.activeEmployees ?? '0'}
                </div>
                <div className="text-sm text-gray-500">
                  ({summary.activePercentage ?? '0'}% of total)
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">Employee Types</h5>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Regular</span>
                    <span className="text-sm font-medium">{summary.regularEmployees ?? '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Contract</span>
                    <span className="text-sm font-medium">{summary.contractEmployees ?? '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Project-based</span>
                    <span className="text-sm font-medium">{summary.projectEmployees ?? '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDTRReport = () => {
    const dtrData = isPlainObject(reportData) && isPlainObject(reportData.dtr) ? reportData.dtr : { byDate: [] };
    const summary = isPlainObject(reportData) && isPlainObject(reportData.summary) ? reportData.summary : {};
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>DTR Submissions by Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Array.isArray(dtrData.byDate) ? dtrData.byDate : []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submissions" name="Submissions" fill="#1976D2" />
                  <Bar dataKey="approved" name="Approved" fill="#4CAF50" />
                  <Bar dataKey="rejected" name="Rejected" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DTR Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">Total DTR Submissions</h5>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.totalSubmissions ?? '0'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">DTR Status</h5>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-sm font-medium">{summary.pendingDTRs ?? '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="text-sm font-medium">{summary.approvedDTRs ?? '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rejected</span>
                    <span className="text-sm font-medium">{summary.rejectedDTRs ?? '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Processing</span>
                    <span className="text-sm font-medium">{summary.processingDTRs ?? '0'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-900">Average Hours</h5>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {typeof summary.averageHoursPerDTR === 'number' ? summary.averageHoursPerDTR.toFixed(2) : '0'} hrs
                </div>
                <div className="text-sm text-gray-500">
                  Including {typeof summary.averageOvertimeHours === 'number' ? summary.averageOvertimeHours.toFixed(2) : '0'} overtime hours
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Reports
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Generate and view reports for payroll, employees, and DTR.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button
            variant="outline"
            className="mr-2 flex items-center"
            onClick={handleExportReport}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button
            onClick={handleExportReport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-2 mb-6">
        <Tabs value={reportType} onValueChange={setReportType} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="employee">Employees</TabsTrigger>
            <TabsTrigger value="dtr">DTR</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Date Range:</span>
            <DateRangePicker
              value={{ from: dateRange.from ?? undefined, to: dateRange.to ?? undefined } as { from: Date | undefined; to: Date | undefined }}
              onChange={setDateRange}
              className="w-auto"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ from: undefined, to: undefined })}
              title="Clear date filter"
            >
              Clear
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Company:</span>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {Array.isArray(companies) && companies.map((company: any) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
                <div className="text-gray-400">Loading chart data...</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {reportType === "payroll" && renderPayrollReport()}
          {reportType === "employee" && renderEmployeeReport()}
          {reportType === "dtr" && renderDTRReport()}
        </>
      )}
    </div>
  );
};

export default Reports;
