import React from "react";
import { Button } from "./button";
import { 
  Eye, 
  Download, 
  Printer, 
  Edit, 
  Trash, 
  Check, 
  X, 
  FileText, 
  MessageCircle, 
  Copy,
  Calendar,
  Mail,
  MoreHorizontal
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export type ActionType = 
  | "view" 
  | "edit" 
  | "delete" 
  | "download" 
  | "print" 
  | "approve" 
  | "reject" 
  | "copy"
  | "calendar"
  | "email"
  | "details";

export interface Action {
  type: ActionType;
  label?: string;
  onClick: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
}

interface ActionButtonProps {
  action: Action;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action }) => {
  const { type, label, onClick, isDisabled, isLoading } = action;

  // Define icon based on action type
  let icon;
  switch (type) {
    case "view":
      icon = <Eye className="h-4 w-4" />;
      break;
    case "edit":
      icon = <Edit className="h-4 w-4" />;
      break;
    case "delete":
      icon = <Trash className="h-4 w-4" />;
      break;
    case "download":
      icon = <Download className="h-4 w-4" />;
      break;
    case "print":
      icon = <Printer className="h-4 w-4" />;
      break;
    case "approve":
      icon = <Check className="h-4 w-4" />;
      break;
    case "reject":
      icon = <X className="h-4 w-4" />;
      break;
    case "copy":
      icon = <Copy className="h-4 w-4" />;
      break;
    case "calendar":
      icon = <Calendar className="h-4 w-4" />;
      break;
    case "email":
      icon = <Mail className="h-4 w-4" />;
      break;
    case "details":
      icon = <FileText className="h-4 w-4" />;
      break;
    default:
      icon = <MessageCircle className="h-4 w-4" />;
  }

  return (
    <Tooltip content={label || type}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onClick}
        disabled={isDisabled || isLoading}
      >
        {isLoading ? (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          icon
        )}
      </Button>
    </Tooltip>
  );
};

export interface ActionBarProps {
  actions: Action[];
  maxVisibleActions?: number;
  className?: string;
}

export const ActionBar: React.FC<ActionBarProps> = ({ 
  actions, 
  maxVisibleActions = 3,
  className 
}) => {
  const visibleActions = actions.slice(0, maxVisibleActions);
  const moreActions = actions.slice(maxVisibleActions);

  return (
    <div className={`flex items-center justify-end space-x-1 ${className || ""}`}>
      {visibleActions.map((action, index) => (
        <ActionButton key={`${action.type}-${index}`} action={action} />
      ))}

      {moreActions.length > 0 && (
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip content="More actions">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end">
            {moreActions.map((action, index) => (
              <DropdownMenuItem
                key={`more-${action.type}-${index}`}
                onClick={action.onClick}
                disabled={action.isDisabled || action.isLoading}
                className="flex items-center gap-2"
              >
                {action.isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  (() => {
                    switch (action.type) {
                      case "view":
                        return <Eye className="h-4 w-4" />;
                      case "edit":
                        return <Edit className="h-4 w-4" />;
                      case "delete":
                        return <Trash className="h-4 w-4" />;
                      case "download":
                        return <Download className="h-4 w-4" />;
                      case "print":
                        return <Printer className="h-4 w-4" />;
                      case "approve":
                        return <Check className="h-4 w-4" />;
                      case "reject":
                        return <X className="h-4 w-4" />;
                      case "copy":
                        return <Copy className="h-4 w-4" />;
                      case "calendar":
                        return <Calendar className="h-4 w-4" />;
                      case "email":
                        return <Mail className="h-4 w-4" />;
                      case "details":
                        return <FileText className="h-4 w-4" />;
                      default:
                        return <MessageCircle className="h-4 w-4" />;
                    }
                  })()
                )}
                <span>{action.label || action.type}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};