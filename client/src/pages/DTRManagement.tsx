import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DTRTable from "@/components/dtr/DTRTable";
import DTRForm from "@/components/dtr/DTRForm";
import DTRCapture from "@/components/dtr/DTRCapture";
import { Plus, Search, Filter, Camera, Upload, Check, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DTR, Employee } from "@shared/schema";

const DTRManagement = () => {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  
  const [addMode, setAddMode] = useState<"form" | "capture" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || "all");
  const [dtrType, setDtrType] = useState("all");
  const [selectedDTRs, setSelectedDTRs] = useState<string[]>([]);
  const [enableBulkActions, setEnableBulkActions] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dtrs = [], isLoading } = useQuery<DTR[]>({
    queryKey: ['/api/dtrs'],
  });
  
  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const filteredDTRs: DTR[] = dtrs.filter((dtr: any) => {
    // Filter by search query (employee name would be implemented in a real app)
    const matchesQuery =
      searchQuery === "" || dtr.employeeId.toString().includes(searchQuery);

    // Filter by tab
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && dtr.status === "Pending") ||
      (activeTab === "approved" && dtr.status === "Approved") ||
      (activeTab === "rejected" && dtr.status === "Rejected") ||
      (activeTab === "processing" && dtr.status === "Processing");
      
    // Filter by DTR type
    const matchesType =
      dtrType === "all" || dtr.type === dtrType;

    return matchesQuery && matchesTab && matchesType;
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL without navigation
    const newSearchParams = new URLSearchParams(location.split("?")[1]);
    newSearchParams.set("status", value);
    setLocation(`/dtr-management?${newSearchParams.toString()}`, { replace: true });
  };
  
  const handleDTRCaptureSuccess = (data: any) => {
    // Refresh DTR list after successful submission
    queryClient.invalidateQueries({ queryKey: ['/api/dtrs'] });
    setAddMode(null);
    
    toast({
      title: "DTR Processed Successfully",
      description: "The DTR has been automatically extracted and submitted.",
    });
  };
  
  const handleDTRCaptureError = (error: string) => {
    toast({
      title: "DTR Processing Error",
      description: error,
      variant: "destructive"
    });
  };
  
  const handleDTRSelection = (selectedIds: string[]) => {
    setSelectedDTRs(selectedIds);
  };

  const renderAddDTROptions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow" 
        onClick={() => setAddMode("form")}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <Plus className="h-8 w-8" />
          </div>
          <h3 className="font-medium mb-2">Manual Entry</h3>
          <p className="text-sm text-gray-500">
            Manually enter DTR details using a form
          </p>
        </div>
      </Card>
      
      <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setAddMode("capture")}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
            <Camera className="h-8 w-8" />
          </div>
          <h3 className="font-medium mb-2">Auto Capture</h3>
          <p className="text-sm text-gray-500">
            Upload or take a photo of a DTR for automatic processing
          </p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            DTR Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage daily time records for all employees with automatic processing.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          {!addMode && (
            <>
              <Button onClick={() => setAddMode("form")}>
                <Plus className="mr-2 h-4 w-4" />
                Add DTR
              </Button>
              
              <Button 
                variant={enableBulkActions ? "default" : "outline"} 
                onClick={() => {
                  setEnableBulkActions(!enableBulkActions);
                  if (enableBulkActions) {
                    setSelectedDTRs([]);
                  }
                }}
              >
                {enableBulkActions ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Exit Bulk Mode
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Bulk Process
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {addMode === "form" ? (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Add New DTR</h3>
          <DTRForm
            employees={employees}
            isLoading={isEmployeesLoading}
            onCancel={() => setAddMode(null)}
            onSubmit={() => setAddMode(null)}
          />
        </Card>
      ) : addMode === "capture" ? (
        <DTRCapture
          onSuccess={handleDTRCaptureSuccess}
          onError={handleDTRCaptureError}
          onCancel={() => setAddMode(null)}
        />
      ) : addMode === null ? (
        <>
          <div className="mb-8">
            {renderAddDTROptions()}
          </div>
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
                <span className="text-sm text-gray-500">Type:</span>
                <Select value={dtrType} onValueChange={setDtrType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="Project-based">Project-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <DTRTable
            dtrs={filteredDTRs}
            isLoading={isLoading}
            employees={employees}
            enableBulkActions={enableBulkActions}
            onBulkSelect={handleDTRSelection}
          />
        </>
      ) : null}
    </div>
  );
};

export default DTRManagement;
