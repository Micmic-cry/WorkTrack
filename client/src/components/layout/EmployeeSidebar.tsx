import * as React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  FileText,
  Receipt,
  User,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type SidebarProps = {
  isOpen: boolean;
};

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

const EmployeeSidebar = ({ isOpen }: SidebarProps) => {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    {
      label: "Home",
      icon: <HomeIcon className="mr-3 h-5 w-5" />,
      href: "/",
    },
    {
      label: "My DTR",
      icon: <FileText className="mr-3 h-5 w-5" />,
      href: "/dtr",
    },
    {
      label: "Payslips",
      icon: <Receipt className="mr-3 h-5 w-5" />,
      href: "/payslips",
    },
    {
      label: "Profile",
      icon: <User className="mr-3 h-5 w-5" />,
      href: "/profile",
    },
  ];

  return (
    <aside
      className={cn(
        "bg-white w-64 border-r border-gray-200 pt-5 pb-2 flex flex-col z-20 transition-all duration-300",
        {
          "w-0 overflow-hidden lg:w-64": !isOpen,
          "w-64": isOpen,
        }
      )}
    >
      <div className="px-4 py-2 mb-4 bg-blue-500 text-white mx-2 rounded-md">
        <h2 className="text-lg font-semibold">Employee Portal</h2>
        <p className="text-xs opacity-80">Manage your work records</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-md",
                location === item.href
                  ? "sidebar-active bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                  : "text-gray-700 hover:bg-gray-50 hover:text-blue-700"
              )}
            >
              {React.cloneElement(item.icon as React.ReactElement, {
                className: cn(
                  "mr-3 h-5 w-5",
                  location === item.href ? "text-blue-500" : "text-gray-500"
                ),
              })}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
              <span className="text-sm font-medium leading-none text-blue-700">
                {user && user.firstName?.[0] && user.lastName?.[0]
                  ? `${user.firstName[0]}${user.lastName[0]}`
                  : 'EU'}
              </span>
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user ? `${user.firstName} ${user.lastName}` : 'Employee User'}</p>
            <p className="text-xs font-medium text-gray-500">{user?.role || 'Employee'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default EmployeeSidebar;