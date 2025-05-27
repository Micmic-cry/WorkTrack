import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, FileUp, FileCheck, AlertCircle, Search, Filter } from "lucide-react";
import { DTR } from "@shared/schema";
import DTRCapture from "@/components/dtr/DTRCapture";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const EmployeeDTR = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDTRDialog, setShowDTRDialog] = useState(false);
  const { toast } = useToast();
  
  // Fetch employee DTRs
  const { data: dtrs, isLoading } = useQuery<DTR[]>({
    queryKey: ["/api/employee/dtrs"],
    enabled: !!user,
  });

  // Filter DTRs based on search query and status
  const filteredDtrs = dtrs ? dtrs.filter(dtr => {
    const matchesSearch = searchQuery === "" || 
      dtr.date.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || dtr.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Group DTRs by month for "Current" and "History" tabs
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Mock data for display
  const mockDtrs = [
    { id: 1, date: "2023-05-26", status: "Approved", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8, type: "Regular" },
    { id: 2, date: "2023-05-25", status: "Approved", timeIn: "08:15 AM", timeOut: "05:30 PM", hours: 8.25, type: "Regular" },
    { id: 3, date: "2023-05-24", status: "Pending", timeIn: "08:00 AM", timeOut: "06:00 PM", hours: 9, type: "Overtime" },
    { id: 4, date: "2023-05-23", status: "Rejected", timeIn: "09:00 AM", timeOut: "05:00 PM", hours: 7, type: "Regular" },
    { id: 5, date: "2023-05-22", status: "Approved", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8, type: "Regular" },
    { id: 6, date: "2023-04-28", status: "Approved", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8, type: "Regular" },
    { id: 7, date: "2023-04-27", status: "Approved", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8, type: "Regular" },
  ];

  const currentMonthDtrs = mockDtrs.filter(dtr => {
    const dtrDate = new Date(dtr.date);
    return dtrDate.getMonth() === currentMonth && dtrDate.getFullYear() === currentYear;
  });

  const historyDtrs = mockDtrs.filter(dtr => {
    const dtrDate = new Date(dtr.date);
    return dtrDate.getMonth() !== currentMonth || dtrDate.getFullYear() !== currentYear;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Daily Time Records</h1>
        <div className="flex gap-2">
          <Button size="sm" className="flex items-center gap-1" onClick={() => setShowDTRDialog(true)}>
            <FileUp className="w-4 h-4" />
            Submit DTR
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Time Records</CardTitle>
          <CardDescription>View and manage your time records</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <TabsList>
                <TabsTrigger value="current">Current Month</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search DTRs" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value="current" className="mt-0">
              {currentMonthDtrs.length === 0 ? (
                <div className="text-center py-10 border rounded-md">
                  <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No DTRs for Current Month</h3>
                  <p className="text-gray-500 mb-4">There are no time records for the current month.</p>
                  <Button variant="outline" size="sm" onClick={() => setShowDTRDialog(true)}>Submit DTR</Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-gray-500 border-b">
                    <div className="col-span-3">Date</div>
                    <div className="col-span-2">Time In</div>
                    <div className="col-span-2">Time Out</div>
                    <div className="col-span-2">Hours</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  
                  {currentMonthDtrs.map((dtr) => (
                    <div key={dtr.id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50">
                      <div className="col-span-3 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          {new Date(dtr.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="col-span-2">{dtr.timeIn}</div>
                      <div className="col-span-2">{dtr.timeOut}</div>
                      <div className="col-span-2">
                        <span className={dtr.type === "Overtime" ? "text-blue-600 font-medium" : ""}>
                          {dtr.hours}h
                        </span>
                        {dtr.type === "Overtime" && 
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full ml-1.5">OT</span>
                        }
                      </div>
                      <div className="col-span-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(dtr.status)}`}>
                          {dtr.status}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon">
                          <FileCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              {historyDtrs.length === 0 ? (
                <div className="text-center py-10 border rounded-md">
                  <Clock className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Historical DTRs</h3>
                  <p className="text-gray-500">There are no previous time records.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-gray-500 border-b">
                    <div className="col-span-3">Date</div>
                    <div className="col-span-2">Time In</div>
                    <div className="col-span-2">Time Out</div>
                    <div className="col-span-2">Hours</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  
                  {historyDtrs.map((dtr) => (
                    <div key={dtr.id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50">
                      <div className="col-span-3 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          {new Date(dtr.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="col-span-2">{dtr.timeIn}</div>
                      <div className="col-span-2">{dtr.timeOut}</div>
                      <div className="col-span-2">{dtr.hours}h</div>
                      <div className="col-span-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(dtr.status)}`}>
                          {dtr.status}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon">
                          <FileCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="mt-0">
              {mockDtrs.filter(dtr => dtr.status === "Pending").length === 0 ? (
                <div className="text-center py-10 border rounded-md">
                  <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Pending DTRs</h3>
                  <p className="text-gray-500">All your DTRs have been processed.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-gray-500 border-b">
                    <div className="col-span-3">Date</div>
                    <div className="col-span-2">Time In</div>
                    <div className="col-span-2">Time Out</div>
                    <div className="col-span-2">Hours</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  
                  {mockDtrs.filter(dtr => dtr.status === "Pending").map((dtr) => (
                    <div key={dtr.id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50">
                      <div className="col-span-3 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          {new Date(dtr.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="col-span-2">{dtr.timeIn}</div>
                      <div className="col-span-2">{dtr.timeOut}</div>
                      <div className="col-span-2">
                        <span className={dtr.type === "Overtime" ? "text-blue-600 font-medium" : ""}>
                          {dtr.hours}h
                        </span>
                        {dtr.type === "Overtime" && 
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full ml-1.5">OT</span>
                        }
                      </div>
                      <div className="col-span-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(dtr.status)}`}>
                          {dtr.status}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon">
                          <FileCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* DTR OCR Dialog */}
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

export default EmployeeDTR;