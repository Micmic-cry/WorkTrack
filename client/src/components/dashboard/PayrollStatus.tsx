import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState } from "react";
import { DateRange } from "react-day-picker";

type PayrollGroupStatus = {
  name: string;
  status: string;
  processed: number;
  total: number;
  amount: number;
};

type PayrollStatusProps = {
  isLoading: boolean;
  payrollData?: {
    progress: number;
    periodStart: string;
    periodEnd: string;
    groups: PayrollGroupStatus[];
  };
};

const PayrollStatus = ({ isLoading, payrollData }: PayrollStatusProps) => {
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleGeneratePayslips = async () => {
    try {
      await apiRequest("POST", "/api/payroll/generate-payslips", {});
      await queryClient.invalidateQueries({ queryKey: ['/api/payroll/status'] });
      toast({
        title: "Payslips Generated",
        description: "Payslips have been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate payslips. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ready":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Ready
          </span>
        );
      case "Pending":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
            Pending
          </span>
        );
      case "Processing":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Processing
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-5">
        <CardTitle className="text-lg font-medium">Payroll Status</CardTitle>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          On Track
        </span>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="mb-4">
          <DateRangePicker value={dateRange ?? { from: undefined, to: undefined }} onChange={setDateRange} />
        </div>
        {isLoading ? (
          <>
            <div className="mb-5">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-2.5 w-full mb-1 rounded-full" />
              <div className="flex justify-between mt-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center text-sm mt-1">
                      <Skeleton className="h-3 w-24 mr-1" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <div className="flex items-center text-sm mt-1">
                      <Skeleton className="h-3 w-24 mr-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-6">
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </>
        ) : (
          <>
            <div className="mb-5">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Current Pay Period Progress
              </h4>
              <Progress value={payrollData?.progress || 0} className="h-2.5" />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{payrollData?.periodStart || "Start"}</span>
                <span>{payrollData?.periodEnd || "End"}</span>
              </div>
            </div>

            <div className="space-y-4">
              {payrollData?.groups.map((group, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium text-gray-900">
                      {group.name}
                    </h5>
                    {getStatusBadge(group.status)}
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">Processed:</span>
                    <span className="ml-1 font-medium">
                      {group.processed}/{group.total}
                    </span>
                  </div>
                  <div className="flex items-center text-sm mt-1">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="ml-1 font-medium">
                      ₱{group.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Button
                className="w-full"
                onClick={handleGeneratePayslips}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Generate Payslips
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PayrollStatus;
