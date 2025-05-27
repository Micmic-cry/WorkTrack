import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Receipt, Calendar, Bell, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import DTRForm from "@/components/dtr/DTRForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import DTRCapture from "@/components/dtr/DTRCapture";
import { useToast } from "@/hooks/use-toast";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [showDTRDialog, setShowDTRDialog] = useState(false);
  const { toast } = useToast();

  // Fetch employee profile
  const { data: employeeProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["/api/employee/profile"],
    queryFn: async () => {
      const res = await fetch("/api/employee/profile");
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!user,
  });

  // Fetch DTRs for current week
  const { data: weekDTRs, isLoading: isWeekDTRsLoading } = useQuery({
    queryKey: ["/api/employee/dtrs", "week"],
    queryFn: async () => {
      const res = await fetch("/api/employee/dtrs?week=current");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  // Calculate weekly hours
  const totalWeekHours = weekDTRs?.reduce((sum: number, dtr: any) => sum + (dtr.regularHours || 0) + (dtr.overtimeHours || 0), 0) || 0;
  const requiredWeekHours = 40; // You can make this dynamic if needed
  const remainingWeekHours = Math.max(requiredWeekHours - totalWeekHours, 0);
  function formatHours(hours: number) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  // Fetch latest payslip
  const { data: latestPayslip, isLoading: isPayslipLoading } = useQuery({
    queryKey: ["/api/employee/payslip-latest"],
    queryFn: async () => {
      const res = await fetch("/api/employee/payslip-latest");
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!user,
  });

  // Fetch recent DTRs
  const { data: recentDTRs, isLoading: isRecentDTRsLoading } = useQuery({
    queryKey: ["/api/employee/dtrs", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/employee/dtrs?recent=1");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  // Fetch notifications
  const { data: notifications, isLoading: isNotificationsLoading } = useQuery({
    queryKey: ["/api/employee/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/employee/notifications");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  function formatCurrency(amount: number) {
    if (typeof amount !== "number") return "₱0.00";
    return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
  function formatDate(date: string) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {isProfileLoading ? "Loading..." : employeeProfile ? `Welcome, ${employeeProfile.firstName}!` : "Welcome!"}
        </h1>
        <div className="flex gap-2">
          <Button size="sm" className="flex items-center gap-1" onClick={() => setShowDTRDialog(true)}>
            <FileText className="w-4 h-4" />
            Submit DTR
          </Button>
        </div>
      </div>

      {/* Daily Time Record Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CardDescription>Weekly summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">
                  {isWeekDTRsLoading ? "..." : formatHours(totalWeekHours)}
                </p>
                <p className="text-xs text-gray-500">
                  {isWeekDTRsLoading ? "..." : `${formatHours(remainingWeekHours)} remaining`}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Payslip</CardTitle>
            <CardDescription>{isPayslipLoading ? "Loading..." : latestPayslip ? formatDate(latestPayslip.payPeriodEnd || latestPayslip.periodEnd) : "No payslip available"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">
                  {isPayslipLoading ? "..." : latestPayslip ? formatCurrency(latestPayslip.netPay) : "₱0.00"}
                </p>
                <p className="text-xs text-gray-500">
                  {isPayslipLoading ? "..." : latestPayslip && (latestPayslip.paymentDate || latestPayslip.payPeriodEnd || latestPayslip.periodEnd) ? `Paid on ${formatDate(latestPayslip.paymentDate || latestPayslip.payPeriodEnd || latestPayslip.periodEnd)}` : ""}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent DTRs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent DTRs</CardTitle>
          <CardDescription>Your latest time records</CardDescription>
        </CardHeader>
        <CardContent>
          {isRecentDTRsLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : recentDTRs && recentDTRs.length > 0 ? (
            <div className="space-y-2">
              {recentDTRs.map((dtr: any, index: number) => (
                <div key={dtr.id || index} className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {formatDate(dtr.date)}
                      </p>
                      <p className="text-xs text-gray-500">{dtr.timeIn} - {dtr.timeOut}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatHours((dtr.regularHours || 0) + (dtr.overtimeHours || 0))}</p>
                    <p className="text-xs text-gray-500">{dtr.type || "Regular"}</p>
                  </div>
                </div>
              ))}
              <div className="text-center mt-4">
                <Button variant="outline" asChild>
                  <Link href="/dtr">View All DTRs</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No recent DTRs found.</div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Important updates</CardDescription>
        </CardHeader>
        <CardContent>
          {isNotificationsLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notif: any, idx: number) => (
                <div key={notif.id || idx} className="flex gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full h-min">
                    <Bell className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{notif.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{notif.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(notif.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No new notifications.</div>
          )}
        </CardContent>
      </Card>

      {/* Submit DTR Dialog */}
      <Dialog open={showDTRDialog} onOpenChange={setShowDTRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit DTR (via OCR)</DialogTitle>
          </DialogHeader>
          <DTRCapture
            onSuccess={() => {
              setShowDTRDialog(false);
              toast({ title: "DTR Submitted", description: "Your DTR has been processed and submitted." });
            }}
            onError={(error) => {
              setShowDTRDialog(false);
              toast({ title: "DTR Submission Error", description: error, variant: "destructive" });
            }}
            onCancel={() => setShowDTRDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDashboard;