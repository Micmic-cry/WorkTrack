import React from "react";
import jsPDF from "jspdf";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PDFDownloadButton, ExcelDownloadButton } from "@/components/ui/download-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Printer } from "lucide-react";

interface PayslipProps {
  payslip: {
    id: number;
    employeeId: number;
    employeeName: string;
    position?: string;
    department?: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    payDate: string;
    regularPay: number;
    overtimePay: number;
    holidayPay: number;
    allowances: number;
    bonuses: number;
    sssDeduction: number;
    phicDeduction: number;
    hdmfDeduction: number;
    taxDeduction: number;
    otherDeductions: number;
    loans: number;
    cashAdvances: number;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
  };
  onClose?: () => void;
}

const PayslipView: React.FC<PayslipProps> = ({ payslip, onClose }) => {
  console.log('PayslipView received payslip:', payslip);
  if (!payslip) {
    return <div className="p-6 text-center text-red-500">No payslip data available.</div>;
  }

  // Support both legacy and new payroll data shapes
  // If deductions is an array, sum it; otherwise, use the old fields
  const deductionsArray = Array.isArray((payslip as any).deductions) ? (payslip as any).deductions : [];
  const totalDeductions = deductionsArray.length > 0
    ? deductionsArray.reduce((sum: any, d: any): any => sum + (d.amount || 0), 0)
    : payslip.totalDeductions || 0;

  const grossPay =
    (typeof (payslip as any).basicPay === 'number' ? (payslip as any).basicPay : payslip.regularPay || 0) +
    (typeof (payslip as any).overtimePay === 'number' ? (payslip as any).overtimePay : payslip.overtimePay || 0);

  const netPay = typeof payslip.netPay === 'number'
    ? payslip.netPay
    : grossPay - totalDeductions;

  // Function to generate PDF data - would normally connect to an API
  const generatePDF = async () => {
    const doc = new jsPDF();
    // Title
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243); // Blue
    doc.text("PAYSLIP", 10, 18);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    // Pay Period
    doc.text(`Pay Period: ${String(payslip.payPeriodStart ?? '')} - ${String(payslip.payPeriodEnd ?? '')}`, 10, 28);
    // Employee Info
    doc.text(`Employee: ${String(payslip.employeeName ?? '')}`, 10, 38);
    doc.text(`Position: ${String(payslip.position ?? 'Not specified')}`, 10, 46);
    doc.text(`Department: ${String(payslip.department ?? 'Not specified')}`, 10, 54);
    doc.text(`Pay Date: ${String(payslip.payDate ?? '-')}`, 140, 38);
    doc.text(`Employee ID: ${String(payslip.employeeId ?? '')}`, 140, 46);
    // Earnings Table
    let y = 64;
    doc.setFontSize(14);
    doc.text("Earnings", 10, y);
    doc.setFontSize(12);
    y += 6;
    doc.text("Description", 10, y);
    doc.text("Amount", 70, y);
    y += 6;
    doc.text("Regular Pay", 10, y);
    doc.text(String(payslip.regularPay ?? ''), 70, y);
    if (payslip.overtimePay > 0) { y += 6; doc.text("Overtime Pay", 10, y); doc.text(String(payslip.overtimePay ?? ''), 70, y); }
    if (payslip.holidayPay > 0) { y += 6; doc.text("Holiday Pay", 10, y); doc.text(String(payslip.holidayPay ?? ''), 70, y); }
    if (payslip.allowances > 0) { y += 6; doc.text("Allowances", 10, y); doc.text(String(payslip.allowances ?? ''), 70, y); }
    if (payslip.bonuses > 0) { y += 6; doc.text("Bonuses", 10, y); doc.text(String(payslip.bonuses ?? ''), 70, y); }
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text("Gross Pay", 10, y);
    doc.text(String(payslip.grossPay ?? ''), 70, y);
    doc.setFont('helvetica', 'normal');
    // Deductions Table
    y = 64;
    doc.setFontSize(14);
    doc.text("Deductions", 110, y);
    doc.setFontSize(12);
    y += 6;
    doc.text("Description", 110, y);
    doc.text("Amount", 170, y);
    y += 6;
    if (payslip.sssDeduction > 0) { doc.text("SSS", 110, y); doc.text(String(payslip.sssDeduction ?? ''), 170, y); y += 6; }
    if (payslip.phicDeduction > 0) { doc.text("PhilHealth", 110, y); doc.text(String(payslip.phicDeduction ?? ''), 170, y); y += 6; }
    if (payslip.hdmfDeduction > 0) { doc.text("Pag-IBIG", 110, y); doc.text(String(payslip.hdmfDeduction ?? ''), 170, y); y += 6; }
    if (payslip.taxDeduction > 0) { doc.text("Tax", 110, y); doc.text(String(payslip.taxDeduction ?? ''), 170, y); y += 6; }
    if (payslip.loans > 0) { doc.text("Loans", 110, y); doc.text(String(payslip.loans ?? ''), 170, y); y += 6; }
    if (payslip.cashAdvances > 0) { doc.text("Cash Advances", 110, y); doc.text(String(payslip.cashAdvances ?? ''), 170, y); y += 6; }
    if (payslip.otherDeductions > 0) { doc.text("Other Deductions", 110, y); doc.text(String(payslip.otherDeductions ?? ''), 170, y); y += 6; }
    doc.setFont('helvetica', 'bold');
    doc.text("Total Deductions", 110, y);
    doc.text(String(payslip.totalDeductions ?? ''), 170, y);
    doc.setFont('helvetica', 'normal');
    // Net Pay Summary
    y += 14;
    doc.setFillColor(33, 150, 243, 0.1);
    doc.rect(10, y, 190, 12, 'F');
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text("Net Pay", 14, y + 9);
    doc.setFontSize(18);
    doc.text(String(payslip.netPay ?? ''), 60, y + 9);
    doc.setTextColor(0, 0, 0);
    // Footer
    doc.setFontSize(10);
    doc.text("This is a computer-generated document. No signature is required.", 10, 280);
    doc.save(`payslip-${payslip.employeeName}-${payslip.payPeriodEnd}.pdf`);
    return "PDF generated";
  };

  // Function to generate Excel data - would normally connect to an API
  const generateExcel = async () => {
    // Simulate API call by returning a placeholder
    return "EXCEL_DATA"; // In a real app, this would be a base64 string or binary data from an API
  };

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto print:shadow-none">
      <CardHeader className="print:py-2">
        <div className="flex justify-between items-start print:flex-col">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">PAYSLIP</CardTitle>
            <CardDescription>
              Pay Period: {formatDate(payslip.payPeriodStart)} - {formatDate(payslip.payPeriodEnd)}
            </CardDescription>
          </div>
          <div className="flex space-x-2 print:hidden">
            <PDFDownloadButton 
              filename={`payslip-${payslip.employeeName}-${payslip.payPeriodEnd}.pdf`}
              data={generatePDF}
            >
              PDF
            </PDFDownloadButton>
            <ExcelDownloadButton 
              filename={`payslip-${payslip.employeeName}-${payslip.payPeriodEnd}.xlsx`}
              data={generateExcel}
            >
              Excel
            </ExcelDownloadButton>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 print:space-y-3 print:py-2">
        {/* Employee Information */}
        <div className="grid grid-cols-2 gap-4 print:gap-2">
          <div>
            <p className="text-sm font-semibold">Employee</p>
            <p className="text-lg font-bold">{payslip.employeeName}</p>
            <p className="text-sm text-gray-500">{payslip.position || 'Not specified'}</p>
            <p className="text-sm text-gray-500">{payslip.department || 'Not specified'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Pay Date</p>
            <p className="text-base">{formatDate(payslip.payDate)}</p>
            <p className="text-sm font-semibold mt-1">Employee ID</p>
            <p className="text-base">{payslip.employeeId}</p>
          </div>
        </div>

        <Separator className="my-4 print:my-2" />

        {/* Earnings and Deductions Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-2">
          {/* Earnings */}
          <div>
            <h3 className="font-semibold mb-2">Earnings</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Regular Pay</TableCell>
                  <TableCell className="text-right">{formatCurrency((payslip as any).basicPay ?? payslip.regularPay ?? 0)}</TableCell>
                </TableRow>
                {(payslip as any).overtimePay > 0 && (
                  <TableRow>
                    <TableCell>Overtime Pay</TableCell>
                    <TableCell className="text-right">{formatCurrency((payslip as any).overtimePay)}</TableCell>
                  </TableRow>
                )}
                {/* Add more earnings if needed */}
                <TableRow className="font-bold bg-gray-50">
                  <TableCell>Gross Pay</TableCell>
                  <TableCell className="text-right">{formatCurrency(grossPay)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="font-semibold mb-2">Deductions</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deductionsArray.length > 0 ? (
                  deductionsArray.map((ded: any, idx: any): any => (
                    <TableRow key={idx}>
                      <TableCell>{ded.description || ded.type}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ded.amount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-400">No deductions</TableCell>
                  </TableRow>
                )}
                <TableRow className="font-bold bg-gray-50">
                  <TableCell>Total Deductions</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalDeductions)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Net Pay Summary */}
        <div className="bg-primary/10 p-4 rounded-md mt-4 print:mt-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Net Pay</h3>
            <p className="text-2xl font-bold text-primary">{formatCurrency(netPay)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-gray-500 border-t print:pt-2 print:text-xs">
        <div className="w-full">
          <p className="mb-1">This is a computer-generated document. No signature is required.</p>
          <p>For questions about this payslip, please contact the HR department.</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PayslipView;