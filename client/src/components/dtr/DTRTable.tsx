import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, MoreVertical, CheckCircle, XCircle, Edit, CreditCard, 
  Check, ChevronDown, AlertCircle, Loader2
} from "lucide-react";
import { DTR, Employee } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tooltip } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DTRTableProps = {
  dtrs?: DTR[];
  isLoading: boolean;
  employees?: Employee[];
  enableBulkActions?: boolean;
  onBulkSelect?: (selectedIds: string[]) => void;
};

const DTRTable = ({ 
  dtrs = [], 
  isLoading, 
  employees = [],
  enableBulkActions = false,
  onBulkSelect
}: DTRTableProps) => {
  const { toast } = useToast();
  const [selectedDTRs, setSelectedDTRs] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showBulkApproveAlert, setShowBulkApproveAlert] = useState(false);
  const [showBulkRejectAlert, setShowBulkRejectAlert] = useState(false);
  const [showBulkPayrollAlert, setShowBulkPayrollAlert] = useState(false);
  
  // Handle bulk selection
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDTRs([]);
    } else {
      const pendingDTRs = dtrs.filter(dtr => dtr.status === "Pending").map(dtr => (dtr as any).id);
      setSelectedDTRs(pendingDTRs);
    }
    setIsAllSelected(!isAllSelected);
    
    if (onBulkSelect) {
      onBulkSelect(isAllSelected ? [] : dtrs.map(dtr => (dtr as any).id));
    }
  };
  
  const handleSelectDTR = (dtrId: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedDTRs, dtrId];
    } else {
      newSelected = selectedDTRs.filter(id => id !== dtrId);
    }
    setSelectedDTRs(newSelected);
    
    if (onBulkSelect) {
      onBulkSelect(newSelected);
    }
    
    // Update all selected state
    setIsAllSelected(dtrs.length > 0 && newSelected.length === dtrs.length);
  };

  const handleViewDTR = (dtrId: string) => {
    toast({
      title: "View DTR",
      description: `Viewing DTR #${dtrId}`,
    });
  };

  const handleApproveDTR = async (dtrId: string) => {
    try {
      await apiRequest("PATCH", `/api/dtrs/${dtrId}/approve`, {});
      await queryClient.invalidateQueries({ queryKey: ['/api/dtrs'] });
      toast({
        title: "DTR Approved",
        description: "The DTR has been approved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve DTR. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectDTR = async (dtrId: string) => {
    try {
      await apiRequest("PATCH", `/api/dtrs/${dtrId}/reject`, {});
      await queryClient.invalidateQueries({ queryKey: ['/api/dtrs'] });
      toast({
        title: "DTR Rejected",
        description: "The DTR has been rejected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject DTR. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProcessPayroll = async (dtrId: string) => {
    try {
      await apiRequest("POST", `/api/payroll/process/${dtrId}`, {});
      await queryClient.invalidateQueries({ queryKey: ['/api/dtrs'] });
      toast({
        title: "Processing Payroll",
        description: "The payroll is being processed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payroll. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="px-2 py-1 inline-flex text-fit-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
            Pending
          </span>
        );
      case "Approved":
        return (
          <span className="px-2 py-1 inline-flex text-fit-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2 py-1 inline-flex text-fit-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case "Processing":
        return (
          <span className="px-2 py-1 inline-flex text-fit-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Processing
          </span>
        );
      case "Paid":
        return (
          <span className="px-2 py-1 inline-flex text-fit-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Paid
          </span>
        );
      case "Processed":
        return (
          <span className="px-2 py-1 inline-flex text-fit-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-800">
            Processed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex text-fit-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => (e as any).id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${employeeId}`;
  };

  // Handle bulk operations
  const handleBulkApprove = async () => {
    if (selectedDTRs.length === 0) return;
    
    setIsBulkProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/dtrs/bulk/approve", { dtrIds: selectedDTRs });
      const result = await response.json();
      
      await queryClient.invalidateQueries({ queryKey: ['/api/dtrs'] });
      setSelectedDTRs([]);
      
      toast({
        title: "Bulk Approval Complete",
        description: `Successfully approved ${result.processed} out of ${result.total} DTRs.`,
      });
      
      if (result.errors.length > 0) {
        console.error("Some DTRs could not be approved:", result.errors);
      }
    } catch (error) {
      toast({
        title: "Bulk Approval Failed",
        description: "An error occurred while processing DTRs",
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
      setShowBulkApproveAlert(false);
    }
  };
  
  const handleBulkReject = async () => {
    if (selectedDTRs.length === 0) return;
    
    setIsBulkProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/dtrs/bulk/reject", { dtrIds: selectedDTRs });
      const result = await response.json();
      
      await queryClient.invalidateQueries({ queryKey: ['/api/dtrs'] });
      setSelectedDTRs([]);
      
      toast({
        title: "Bulk Rejection Complete",
        description: `Successfully rejected ${result.processed} out of ${result.total} DTRs.`,
      });
      
      if (result.errors.length > 0) {
        console.error("Some DTRs could not be rejected:", result.errors);
      }
    } catch (error) {
      toast({
        title: "Bulk Rejection Failed",
        description: "An error occurred while processing DTRs",
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
      setShowBulkRejectAlert(false);
    }
  };
  
  const handleBulkPayrollProcess = async () => {
    if (selectedDTRs.length === 0) return;
    
    setIsBulkProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/dtrs/bulk/process-payroll", { dtrIds: selectedDTRs });
      const result = await response.json();
      
      await queryClient.invalidateQueries({ queryKey: ['/api/dtrs'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/payrolls'] });
      setSelectedDTRs([]);
      
      toast({
        title: "Bulk Payroll Processing Complete",
        description: `Successfully processed payroll for ${result.processed} out of ${result.total} DTRs.`,
      });
      
      if (result.errors.length > 0) {
        console.error("Some payroll records could not be processed:", result.errors);
      }
    } catch (error) {
      toast({
        title: "Bulk Payroll Processing Failed",
        description: "An error occurred while processing payroll",
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
      setShowBulkPayrollAlert(false);
    }
  };
  
  // Count DTRs by status
  const pendingDTRs = dtrs.filter(dtr => dtr.status === "Pending").length;
  const approvedDTRs = dtrs.filter(dtr => dtr.status === "Approved").length;

  return (
    <Card className="overflow-hidden">
      {/* Bulk Action Alerts */}
      <AlertDialog open={showBulkApproveAlert} onOpenChange={setShowBulkApproveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-fit">Approve Multiple DTRs</AlertDialogTitle>
            <AlertDialogDescription className="text-fit-sm">
              Are you sure you want to approve {selectedDTRs.length} DTR{selectedDTRs.length !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing} className="text-fit-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkApprove}
              disabled={isBulkProcessing}
              className="bg-green-600 hover:bg-green-700 text-fit-sm"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                  <span className="truncate-dynamic">Processing...</span>
                </>
              ) : (
                <><span className="truncate-dynamic">Approve</span></>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showBulkRejectAlert} onOpenChange={setShowBulkRejectAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-fit">Reject Multiple DTRs</AlertDialogTitle>
            <AlertDialogDescription className="text-fit-sm">
              Are you sure you want to reject {selectedDTRs.length} DTR{selectedDTRs.length !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkReject}
              disabled={isBulkProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Reject</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showBulkPayrollAlert} onOpenChange={setShowBulkPayrollAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-fit">Process Payroll for Multiple DTRs</AlertDialogTitle>
            <AlertDialogDescription className="text-fit-sm">
              Are you sure you want to process payroll for {selectedDTRs.length} DTR{selectedDTRs.length !== 1 ? 's' : ''}? 
              This will create payroll records for all selected DTRs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkPayrollProcess}
              disabled={isBulkProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Process Payroll</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Bulk Actions Bar */}
      {enableBulkActions && (
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all" 
                checked={isAllSelected} 
                onCheckedChange={handleSelectAll} 
              />
              <label htmlFor="select-all" className="text-fit-sm font-medium text-gray-700">
                Select All
              </label>
              {selectedDTRs.length > 0 && (
                <span className="text-fit-sm text-gray-600 ml-2">
                  ({selectedDTRs.length} selected)
                </span>
              )}
            </div>
            
            {selectedDTRs.length > 0 && (
              <div className="flex items-center space-x-2">
                <Tooltip content="Approve selected DTRs">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 overflow-hidden text-ellipsis whitespace-nowrap"
                    onClick={() => setShowBulkApproveAlert(true)}
                    disabled={pendingDTRs === 0}
                  >
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mr-1" />
                    <span className="truncate">Approve ({pendingDTRs})</span>
                  </Button>
                </Tooltip>
                
                <Tooltip content="Reject selected DTRs">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 overflow-hidden text-ellipsis whitespace-nowrap"
                    onClick={() => setShowBulkRejectAlert(true)}
                    disabled={pendingDTRs === 0}
                  >
                    <XCircle className="h-4 w-4 flex-shrink-0 mr-1" />
                    <span className="truncate">Reject ({pendingDTRs})</span>
                  </Button>
                </Tooltip>
                
                <Tooltip content="Process payroll for selected DTRs">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 overflow-hidden text-ellipsis whitespace-nowrap"
                    onClick={() => setShowBulkPayrollAlert(true)}
                    disabled={approvedDTRs === 0}
                  >
                    <CreditCard className="h-4 w-4 flex-shrink-0 mr-1" />
                    <span className="truncate">Payroll ({approvedDTRs})</span>
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="w-full">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {enableBulkActions && (
                <th className="pl-6 pr-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="sr-only">Select</span>
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th scope="col" className="px-6 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th scope="col" className="px-6 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-fit-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </td>
                  </tr>
                ))
            ) : dtrs.length > 0 ? (
              dtrs.map((dtr) => {
                console.log('DTR row object:', dtr);
                return (
                  <tr key={(dtr as any).id} className={`hover:bg-gray-50 ${selectedDTRs.includes((dtr as any).id) ? 'bg-blue-50' : ''}`}
                    onClick={() => console.log('Row clicked:', (dtr as any).id, (dtr as any).status)}
                  >
                    {enableBulkActions && (
                      <td className="pl-6 pr-3 py-4 whitespace-nowrap">
                        <Checkbox 
                          id={`select-dtr-${(dtr as any).id}`}
                          checked={selectedDTRs.includes((dtr as any).id)}
                          onCheckedChange={(checked) => handleSelectDTR((dtr as any).id, !!checked)}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-fit-sm font-medium text-gray-900 truncate max-w-[180px]" title={getEmployeeName((dtr as any).employeeId)}>
                        {getEmployeeName((dtr as any).employeeId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-fit-sm text-gray-900 truncate-dynamic">{(dtr as any).date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-fit-sm text-gray-900 truncate-dynamic">
                        {(dtr as any).timeIn} - {(dtr as any).timeOut}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-fit-sm text-gray-900 truncate-dynamic">
                        {(dtr as any).regularHours} hrs
                        {(dtr as any).overtimeHours > 0 && (
                          <span className="ml-1 text-primary">
                            (+{(dtr as any).overtimeHours} OT)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-fit-sm text-gray-900 truncate-dynamic">{(dtr as any).type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge((dtr as any).status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDTR((dtr as any).id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                console.log('Approve clicked for DTR:', (dtr as any).id, (dtr as any).status);
                                if ((dtr as any).status === 'Pending') handleApproveDTR((dtr as any).id);
                              }}
                              disabled={(dtr as any).status !== 'Pending'}
                              className={(dtr as any).status !== 'Pending' ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-success" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                console.log('Reject clicked for DTR:', (dtr as any).id, (dtr as any).status);
                                if ((dtr as any).status === 'Pending') handleRejectDTR((dtr as any).id);
                              }}
                              disabled={(dtr as any).status !== 'Pending'}
                              className={(dtr as any).status !== 'Pending' ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-error" />
                              Reject
                            </DropdownMenuItem>
                            {(dtr as any).status === "Approved" && (
                              <DropdownMenuItem onClick={() => handleProcessPayroll((dtr as any).id)}>
                                <CreditCard className="mr-2 h-4 w-4 text-primary" />
                                Process Payroll
                              </DropdownMenuItem>
                            )}
                            {(dtr as any).status === "Rejected" && (
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4 text-warning" />
                                Request Revision
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={enableBulkActions ? 8 : 7}
                  className="px-6 py-4 text-center text-gray-500 text-fit-sm"
                >
                  No DTR records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default DTRTable;
