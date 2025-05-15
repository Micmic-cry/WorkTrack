import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import NotificationCenter from "@/components/NotificationCenter";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

type HeaderProps = {
  toggleSidebar: () => void;
  isAdminView?: boolean;
};

const Header = ({ toggleSidebar, isAdminView = false }: HeaderProps) => {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Tooltip content="Toggle Navigation Menu">
              <button
                onClick={toggleSidebar}
                className="lg:hidden mr-2 text-gray-600 focus:outline-none hover:text-primary transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </Tooltip>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary-dark mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-xl font-medium text-primary-dark">
                {isAdminView ? "WorkTrack Admin" : "WorkTrack"}
              </h1>
              {isAdminView && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <DropdownMenu>
              <Tooltip content="Account Settings">
                <DropdownMenuTrigger className="flex items-center focus:outline-none hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`} 
                      alt={user?.username || "User"} 
                    />
                    <AvatarFallback>
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600 ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </DropdownMenuTrigger>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/profile")}>
                  Profile
                </DropdownMenuItem>
                {user?.role === "Admin" && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/settings")}>
                    Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600 hover:text-red-700" 
                  onClick={() => {
                    logoutMutation.mutate(undefined, {
                      onSuccess: () => setLocation("/auth")
                    });
                  }}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    "Logout"
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
