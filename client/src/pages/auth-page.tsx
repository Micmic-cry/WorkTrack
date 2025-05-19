import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { SocialLoginButtons } from "@/components/ui/social-login-buttons";

// Create schemas for login and registration
const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showWelcome, setShowWelcome] = useState(true);

  // Redirect to appropriate dashboard based on role if already logged in
  useEffect(() => {
    if (user) {
      console.log("Logged in user:", user); // Debug log for user object
      if (user.role === "Admin") {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  // Show welcome animation on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Setup login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Setup registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "User",
    },
  });

  async function onLoginSubmit(data: LoginFormValues) {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: "Login successful",
        description: "Welcome back! You are now logged in.",
        variant: "default",
      });
    } catch (error) {
      // Error toast is automatically shown by the mutation error handler
    }
  }

  async function onRegisterSubmit(data: RegisterFormValues) {
    try {
      // Remove confirmPassword before submitting
      const { confirmPassword, ...registrationData } = data;
      await registerMutation.mutateAsync(registrationData);
      toast({
        title: "Registration successful",
        description: "Your account has been created. You are now logged in.",
        variant: "default",
      });
    } catch (error) {
      // Error toast is automatically shown by the mutation error handler
    }
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 overflow-auto">
      {/* Welcome animation overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center text-white"
            >
              <motion.h1 
                className="text-5xl font-bold mb-4"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
              >
                Welcome to WorkTrack
              </motion.h1>
              <motion.p
                className="text-xl opacity-90"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your comprehensive manpower management solution
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left column with forms */}
      <div className="w-full lg:w-1/2 p-4 md:p-8 flex items-center justify-center overflow-y-auto py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                WorkTrack
              </CardTitle>
              <CardDescription className="text-center">
                Your comprehensive manpower management solution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full" onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: activeTab === "login" ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeTab === "login" ? 20 : -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === "login" && (
                      <TabsContent value="login">
                        <Form {...loginForm}>
                          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                            <FormField
                              control={loginForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={loginForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <div className="relative">
                                    <FormControl>
                                      <Input 
                                        type={showLoginPassword ? "text" : "password"} 
                                        placeholder="Enter your password" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    >
                                      {showLoginPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                      )}
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox id="showLoginPassword" 
                                checked={showLoginPassword}
                                onCheckedChange={() => setShowLoginPassword(!showLoginPassword)}
                              />
                              <label
                                htmlFor="showLoginPassword"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Show password
                              </label>
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary" 
                              disabled={loginMutation.isPending}
                            >
                              {loginMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Logging in...
                                </>
                              ) : (
                                "Login"
                              )}
                            </Button>
                            
                            <div className="mt-4 relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t"></span>
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                  Or continue with
                                </span>
                              </div>
                            </div>
                            
                            <SocialLoginButtons 
                              onLogin={(provider) => {
                                toast({
                                  title: `${provider} Login Coming Soon`,
                                  description: `Login with ${provider} will be available soon.`,
                                  variant: "default",
                                });
                              }}
                              className="mt-4" 
                            />
                          </form>
                        </Form>
                      </TabsContent>
                    )}
                  
                    {/* Registration Form */}
                    {activeTab === "register" && (
                      <TabsContent value="register">
                        <Form {...registerForm}>
                          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={registerForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="First name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={registerForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Last name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={registerForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Choose a username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="Enter your email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <div className="relative">
                                    <FormControl>
                                      <Input 
                                        type={showRegisterPassword ? "text" : "password"} 
                                        placeholder="Create a password" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    >
                                      {showRegisterPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                      )}
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm Password</FormLabel>
                                  <div className="relative">
                                    <FormControl>
                                      <Input 
                                        type={showRegisterConfirmPassword ? "text" : "password"} 
                                        placeholder="Confirm your password" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    >
                                      {showRegisterConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                      )}
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox id="showRegisterPasswords" 
                                checked={showRegisterPassword && showRegisterConfirmPassword}
                                onCheckedChange={() => {
                                  setShowRegisterPassword(!showRegisterPassword);
                                  setShowRegisterConfirmPassword(!showRegisterConfirmPassword);
                                }}
                              />
                              <label
                                htmlFor="showRegisterPasswords"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Show passwords
                              </label>
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary" 
                              disabled={registerMutation.isPending}
                            >
                              {registerMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Registering...
                                </>
                              ) : (
                                "Register"
                              )}
                            </Button>
                            
                            <div className="mt-4 relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t"></span>
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                  Or sign up with
                                </span>
                              </div>
                            </div>
                            
                            <SocialLoginButtons 
                              onLogin={(provider) => {
                                toast({
                                  title: `${provider} Registration Coming Soon`,
                                  description: `Registration with ${provider} will be available soon.`,
                                  variant: "default",
                                });
                              }}
                              className="mt-4" 
                            />
                          </form>
                        </Form>
                      </TabsContent>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-2">
              <p className="text-sm text-gray-500">
                WorkTrack © {new Date().getFullYear()} - All rights reserved
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-gray-400">
                About Us
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      {/* Right column with hero content */}
      <div className="hidden lg:block lg:w-1/2 bg-primary p-12 text-white overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="min-h-full flex flex-col justify-center py-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Streamline Your<br />Manpower Management
          </h1>
          <p className="text-lg mb-8 opacity-90">
            WorkTrack helps you efficiently manage employees across multiple companies, streamline DTR processing, 
            and automate payroll generation with powerful OCR technology.
          </p>
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                title: "DTR Processing",
                desc: "Automated recognition of different DTR formats with AI assistance"
              },
              {
                title: "Payroll Automation",
                desc: "Generate accurate payrolls based on processed DTR entries"
              },
              {
                title: "Multi-Company",
                desc: "Manage employees across multiple client companies efficiently"
              },
              {
                title: "Insightful Reports",
                desc: "Access comprehensive analytics and reporting tools"
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (i * 0.1), duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors"
              >
                <h3 className="font-medium text-xl mb-2 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-300" />
                  {feature.title}
                </h3>
                <p className="opacity-80">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-10 bg-white/5 rounded-lg p-6"
          >
            <h2 className="text-2xl font-semibold mb-4">About Us</h2>
            <p className="mb-4">
              WorkTrack was founded in 2023 with a mission to simplify manpower management for agencies dealing with multiple client companies. 
              Our platform streamlines the entire process from employee tracking to payroll generation, saving time and reducing errors.
            </p>
            <p>
              We leverage cutting-edge OCR and AI technologies to automatically process various DTR formats, making data entry 
              faster and more accurate for manpower agencies of all sizes.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}