import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

type PayrollFormProps = {
  onSubmit: () => void;
  onCancel: () => void;
  payrollPeriod: DateRange;
  setPayrollPeriod: (period: DateRange) => void;
};

const PayrollForm = ({ onSubmit, onCancel, payrollPeriod, setPayrollPeriod }: PayrollFormProps) => {
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<string>("all");
  const [includeSettings, setIncludeSettings] = useState({
    applyTaxes: true,
    includeOvertime: true,
    includeHolidayPay: true,
    processOnlyApprovedDTRs: true,
  });

  const { data: companies } = useQuery({
    queryKey: ['/api/companies'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Payroll Period</h3>
          <div className="flex flex-col space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Payroll Period</label>
              <DateRangePicker value={payrollPeriod} onChange={setPayrollPeriod} />
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-md font-medium mb-2">Standard Pay Periods</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                  const fifteenthDay = new Date(now.getFullYear(), now.getMonth(), 15);
                  setPayrollPeriod({ from: firstDay, to: fifteenthDay });
                }}
              >
                1st - 15th
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  const now = new Date();
                  const sixteenthDay = new Date(now.getFullYear(), now.getMonth(), 16);
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  setPayrollPeriod({ from: sixteenthDay, to: lastDay });
                }}
              >
                16th - End of Month
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  setPayrollPeriod({ from: firstDay, to: lastDay });
                }}
              >
                Full Month
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  const now = new Date();
                  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                  setPayrollPeriod({ from: prevMonth, to: lastDayPrevMonth });
                }}
              >
                Previous Month
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Filters</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {Array.isArray(companies) ? companies.map((company: any) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Employee Type</label>
              <Select value={selectedEmployeeType} onValueChange={setSelectedEmployeeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Project-based">Project-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-6">
              <h4 className="text-md font-medium mb-2">Processing Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="apply-taxes" 
                    checked={includeSettings.applyTaxes}
                    onCheckedChange={(checked) => 
                      setIncludeSettings({ ...includeSettings, applyTaxes: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="apply-taxes"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Apply taxes and deductions
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-overtime" 
                    checked={includeSettings.includeOvertime}
                    onCheckedChange={(checked) => 
                      setIncludeSettings({ ...includeSettings, includeOvertime: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="include-overtime"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include overtime pay
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-holiday-pay" 
                    checked={includeSettings.includeHolidayPay}
                    onCheckedChange={(checked) => 
                      setIncludeSettings({ ...includeSettings, includeHolidayPay: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="include-holiday-pay"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include holiday pay adjustment
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="approved-dtrs-only" 
                    checked={includeSettings.processOnlyApprovedDTRs}
                    onCheckedChange={(checked) => 
                      setIncludeSettings({ ...includeSettings, processOnlyApprovedDTRs: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="approved-dtrs-only"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Process only approved DTRs
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 rounded-md text-blue-800 text-sm">
        This will generate payroll items for all qualifying employees based on their DTR entries within the selected period.
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Generate Payroll
        </Button>
      </div>
    </form>
  );
};

export default PayrollForm;
