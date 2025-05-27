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
  const [showClockDialog, setShowClockDialog] = useState(false);
  const [showDTRDialog, setShowDTRDialog] = useState(false);
  const { toast } = useToast();
  
  // Fetch employee DTRs
  const { data: dtrs, isLoading: isDtrsLoading } = useQuery({
    queryKey: ["/api/employee/dtrs"],
    enabled: !!user,
  });

  // Fetch employee payslips
  const { data: payslips, isLoading: isPayslipsLoading } = useQuery({
    queryKey: ["/api/employee/payslips"],
    enabled: !!user,
  });

  // Fetch full employee profile for the logged-in user
  const { data: employeeProfile } = useQuery({
    queryKey: ["/api/employees", user?._id],
    queryFn: async () => {
      if (!user?._id) return null;
      const res = await fetch(`/api/employees/${user._id}`);
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!user?._id,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.firstName}!</h1>
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
                <p className="text-2xl font-bold">32h 15m</p>
                <p className="text-xs text-gray-500">7h 45m remaining</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Payslip</CardTitle>
            <CardDescription>May 2023</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">₱24,500.00</p>
                <p className="text-xs text-gray-500">Paid on May 15, 2023</p>
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
          {isDtrsLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="space-y-2">
              {/* Sample DTR data */}
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(2023, 4, 25 - index).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-500">8:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">8h 00m</p>
                    <p className="text-xs text-gray-500">Regular</p>
                  </div>
                </div>
              ))}
              <div className="text-center mt-4">
                <Button variant="outline" asChild>
                  <Link href="/dtr">View All DTRs</Link>
                </Button>
              </div>
            </div>
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
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-yellow-100 p-2 rounded-full h-min">
                <Bell className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-sm">DTR Approval Required</p>
                <p className="text-xs text-gray-500">Your DTR for May 24, 2023 needs manager approval.</p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-green-100 p-2 rounded-full h-min">
                <Briefcase className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Payslip for May is ready</p>
                <p className="text-xs text-gray-500">Your payslip for the period of May 1-15, 2023 is now available.</p>
                <p className="text-xs text-gray-400 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
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