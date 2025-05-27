import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Search, Filter, DollarSign, Clock, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { PDFDownloadButton } from "@/components/ui/download-button";

type PayslipType = {
  id: number;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  basicPay: number;
  overtimePay: number;
  deductions: {
    tax: number;
    sss: number;
    philhealth: number;
    pagibig: number;
    others: number;
  };
  netPay: number;
};

const EmployeePayroll = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("2023");
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch employee payslips
  const { data: payslips, isLoading } = useQuery({
    queryKey: ["/api/employee/payslips"],
    enabled: !!user,
  });

  // Use real payslips data from API
  const realPayslips: PayslipType[] = Array.isArray(payslips) ? payslips : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // Generate a single PDF for all payslips
  const generateAllPayslipsPDF = async () => {
    const doc = new jsPDF();
    realPayslips.forEach((payslip, idx) => {
      if (idx > 0) doc.addPage();
      doc.setFontSize(16);
      doc.text(`Payslip for Pay Period: ${payslip.periodStart} - ${payslip.periodEnd}`, 10, 20);
      doc.setFontSize(12);
      doc.text(`Pay Date: ${payslip.payDate}`, 10, 30);
      doc.text(`Gross Pay: ${formatCurrency(payslip.basicPay + payslip.overtimePay)}`, 10, 40);
      doc.text(`Overtime Pay: ${formatCurrency(payslip.overtimePay)}`, 10, 50);
      doc.text(`Deductions:`, 10, 60);
      let y = 70;
      Object.entries(payslip.deductions).forEach(([key, value]) => {
        doc.text(`${key.toUpperCase()}: ${formatCurrency(value)}`, 20, y);
        y += 8;
      });
      doc.text(`Net Pay: ${formatCurrency(payslip.netPay)}`, 10, y + 8);
    });
    return doc.output("blob");
  };

  // Generate a tax summary PDF
  const generateTaxSummaryPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Tax Summary", 10, 20);
    doc.setFontSize(12);
    let y = 30;
    let totalTax = 0, totalSSS = 0, totalPhilhealth = 0, totalPagibig = 0, totalOthers = 0;
    realPayslips.forEach((payslip) => {
      totalTax += payslip.deductions.tax;
      totalSSS += payslip.deductions.sss;
      totalPhilhealth += payslip.deductions.philhealth;
      totalPagibig += payslip.deductions.pagibig;
      totalOthers += payslip.deductions.others;
    });
    doc.text(`Total Tax: ${formatCurrency(totalTax)}`, 10, y);
    doc.text(`Total SSS: ${formatCurrency(totalSSS)}`, 10, y + 10);
    doc.text(`Total PhilHealth: ${formatCurrency(totalPhilhealth)}`, 10, y + 20);
    doc.text(`Total Pag-IBIG: ${formatCurrency(totalPagibig)}`, 10, y + 30);
    doc.text(`Total Other Deductions: ${formatCurrency(totalOthers)}`, 10, y + 40);
    doc.text(`Total Deductions: ${formatCurrency(totalTax + totalSSS + totalPhilhealth + totalPagibig + totalOthers)}`, 10, y + 55);
    return doc.output("blob");
  };

  // Generate a single payslip PDF
  const generatePayslipPDF = async (payslip: PayslipType) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Payslip for Pay Period: ${payslip.periodStart} - ${payslip.periodEnd}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Pay Date: ${payslip.payDate}`, 10, 30);
    doc.text(`Gross Pay: ${formatCurrency(payslip.basicPay + payslip.overtimePay)}`, 10, 40);
    doc.text(`Overtime Pay: ${formatCurrency(payslip.overtimePay)}`, 10, 50);
    doc.text(`Deductions:`, 10, 60);
    let y = 70;
    Object.entries(payslip.deductions).forEach(([key, value]) => {
      doc.text(`${key.toUpperCase()}: ${formatCurrency(value)}`, 20, y);
      y += 8;
    });
    doc.text(`Net Pay: ${formatCurrency(payslip.netPay)}`, 10, y + 8);
    return doc.output("blob");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Payslips</h1>
        </div>
        <div className="flex gap-2">
          <PDFDownloadButton
            filename="all-payslips.pdf"
            data={generateAllPayslipsPDF}
          >
            Download All
          </PDFDownloadButton>
        </div>
      </div>

      {/* Earnings Summary Card - now dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings (2023)</CardTitle>
            <CardDescription>Year to date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(realPayslips.reduce((sum, p: any) => sum + (p.basicPay || 0) + (p.overtimePay || 0), 0))}</p>
                <p className="text-xs text-gray-500">{realPayslips.length > 0 ? `Across ${realPayslips.length} payslips` : ''}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Monthly</CardTitle>
            <CardDescription>Based on 2023</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(realPayslips.length > 0 ? realPayslips.reduce((sum, p: any) => sum + (p.basicPay || 0) + (p.overtimePay || 0), 0) / realPayslips.length : 0)}</p>
                <p className="text-xs text-gray-500">{realPayslips.length > 0 ? `Across ${realPayslips.length} months` : ''}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overtime Earnings</CardTitle>
            <CardDescription>Year to date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-purple-700">{formatCurrency(realPayslips.reduce((sum, p: any) => sum + (p.overtimePay || 0), 0))}</p>
                <p className="text-xs text-gray-500">{realPayslips.length > 0 ? `${Math.round(100 * realPayslips.reduce((sum, p: any) => sum + (p.overtimePay || 0), 0) / (realPayslips.reduce((sum, p: any) => sum + (p.basicPay || 0) + (p.overtimePay || 0), 0) || 1))}% of total earnings` : ''}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips List */}
      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
          <CardDescription>View and download your payslips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="2023">2023</TabsTrigger>
                <TabsTrigger value="2022">2022</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search payslips" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-10 border rounded-md">Loading...</div>
          ) : realPayslips.length === 0 ? (
            <div className="text-center py-10 border rounded-md">
              <DollarSign className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium">No Payslips Available</h3>
              <p className="text-gray-500">There are no payslips for the selected period.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-gray-500 border-b min-w-[900px]">
                <div className="col-span-4">Pay Period</div>
                <div className="col-span-2">Pay Date</div>
                <div className="col-span-2">Gross Pay</div>
                <div className="col-span-2">Deductions</div>
                <div className="col-span-2">Net Pay</div>
              </div>
              {realPayslips.map((payslip: any) => {
                const totalDeductions = (Object.values(payslip.deductions) as number[]).reduce((sum, val) => sum + val, 0);
                const grossPay = payslip.basicPay + payslip.overtimePay;
                return (
                  <div key={payslip._id || payslip.id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50 min-w-[900px]">
                    <div className="col-span-4 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <div>
                        <p className="font-medium">{new Date(payslip.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(payslip.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        <p className="text-xs text-gray-500">Pay Period</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p>{new Date(payslip.payDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                      <p className="text-xs text-gray-500">Pay Date</p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-medium">{formatCurrency(grossPay)}</p>
                      {payslip.overtimePay > 0 && (
                        <p className="text-xs text-blue-600">
                          Incl. {formatCurrency(payslip.overtimePay)} OT
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="font-medium text-red-600">-{formatCurrency(totalDeductions)}</p>
                      <p className="text-xs text-gray-500">Tax, SSS, etc.</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-600">{formatCurrency(payslip.netPay)}</p>
                        <p className="text-xs text-gray-500">Final Amount</p>
                      </div>
                      <PDFDownloadButton
                        filename={`payslip-${payslip.periodStart}-${payslip.periodEnd}.pdf`}
                        data={() => generatePayslipPDF(payslip)}
                      >
                        <Download className="h-4 w-4" />
                      </PDFDownloadButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex justify-center mt-4">
            <PDFDownloadButton
              filename="tax-summary.pdf"
              data={generateTaxSummaryPDF}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Tax Summary
            </PDFDownloadButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeePayroll;