import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/shared/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Invite } from "@/types/invite";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Register form schema
const registerSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
  createOrganization: z.boolean().default(false),
  organizationName: z.string().optional(),
  role: z.enum(["admin", "client"]).default("client"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(
  (data) => !data.createOrganization || (data.organizationName && data.organizationName.trim() !== ""),
  {
    message: "Organization name is required when creating an organization",
    path: ["organizationName"],
  }
);

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface InviteData {
  email: string;
  organizationId: string | null;
  organizationName: string | null;
  role: "admin" | "client";
}

const Auth = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const { signIn, signUp, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registrationSuccess = location.state?.registrationSuccess;
  const inviteToken = searchParams.get("invite");

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      createOrganization: false,
      organizationName: "",
      role: "client",
    },
  });

  // Check for invite token and fetch invite data
  useEffect(() => {
    const fetchInviteData = async () => {
      if (!inviteToken) return;
      
      setInviteLoading(true);
      try {
        // We need to cast the result to any since TypeScript doesn't know about our invites table yet
        const result: any = await supabase
          .from('invites')
          .select('*, organizations(name)')
          .eq('token', inviteToken)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();
        
        const invite = result.data as Invite & { organizations: { name: string } | null };
        const inviteError = result.error;
        
        if (inviteError || !invite) {
          toast({
            title: "Invalid or expired invite",
            description: "This invitation is no longer valid",
            variant: "destructive"
          });
          return;
        }
        
        // Set invite data and pre-fill form
        setInviteData({
          email: invite.email,
          organizationId: invite.organization_id,
          organizationName: invite.organizations?.name || null,
          role: invite.role as "admin" | "client"
        });
        
        // Switch to register tab
        setActiveTab("register");
        
        // Prefill the form
        registerForm.setValue("email", invite.email);
        registerForm.setValue("role", invite.role as "admin" | "client");
        
        // Disable fields that shouldn't be editable with an invite
        registerForm.setValue("createOrganization", false);
      } catch (error) {
        console.error("Error fetching invite:", error);
      } finally {
        setInviteLoading(false);
      }
    };
    
    fetchInviteData();
  }, [inviteToken, registerForm]);

  // Watch the createOrganization field to show/hide organization name field
  const createOrganization = registerForm.watch("createOrganization");

  // Handle login submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    await signIn(values.email, values.password);
  };

  // Handle register submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    if (inviteData) {
      // Register with invite
      try {
        // Register the user
        await signUp(
          values.email,
          values.password,
          values.firstName,
          values.lastName,
          inviteData.role,
          inviteData.organizationId ? undefined : values.organizationName
        );
        
        // Mark the invite as used - using any type to avoid TypeScript errors
        if (inviteToken) {
          const updateResult: any = await supabase
            .from('invites')
            .update({ used: true })
            .eq('token', inviteToken);
            
          if (updateResult.error) {
            console.error("Error marking invite as used:", updateResult.error);
          }
        }
      } catch (error) {
        console.error("Registration error:", error);
      }
    } else {
      // Normal registration
      await signUp(
        values.email, 
        values.password, 
        values.firstName, 
        values.lastName, 
        values.role, 
        values.createOrganization ? values.organizationName : undefined
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">PayFlow</CardTitle>
          <CardDescription className="text-center">
            {activeTab === "login" ? "Sign in to your account" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login" disabled={!!inviteData}>Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                {registrationSuccess && (
                  <div className="mb-4 p-2 bg-green-50 text-green-700 rounded-md text-sm">
                    Registration successful! Please check your email for verification before logging in.
                  </div>
                )}
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Your email address" {...field} />
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
                          <FormControl>
                            <Input type="password" placeholder="Your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Spinner /> : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                {inviteData && (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
                    <p className="font-medium">You've been invited!</p>
                    <p className="text-sm mt-1">
                      You're joining as a <span className="font-medium">{inviteData.role}</span>
                      {inviteData.organizationName && (
                        <> for <span className="font-medium">{inviteData.organizationName}</span></>
                      )}
                    </p>
                  </div>
                )}
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your email address" 
                              {...field} 
                              readOnly={!!inviteData}
                              className={inviteData ? "bg-gray-100" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!inviteData && (
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="client" id="client" />
                                  <FormLabel htmlFor="client" className="cursor-pointer">Client</FormLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="admin" id="admin" />
                                  <FormLabel htmlFor="admin" className="cursor-pointer">Admin</FormLabel>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {!inviteData && (
                      <FormField
                        control={registerForm.control}
                        name="createOrganization"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Create a new organization
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    )}
                    {(createOrganization && !inviteData) && (
                      <FormField
                        control={registerForm.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter organization name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Choose a password" {...field} />
                          </FormControl>
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
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Spinner /> : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          {activeTab === "login" ? "Don't have an account? " : "Already have an account? "}
          <Button
            variant="link"
            onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
            className="p-0 ml-1"
            disabled={!!inviteData}
          >
            {activeTab === "login" ? "Register" : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
