
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Mail, 
  Building, 
  Save,
  Loader2 
} from "lucide-react";
import { useAuth } from "@payflow/core/auth";
import { schemaClient } from "@/lib/database";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Form validation schema
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  organizationName: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { user, profile, isAdmin, isClient, roles } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizationName, setOrganizationName] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      organizationName: "",
    },
  });

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        organizationName: "",
      });
      
      // Note: Organization info will be fetched differently with new schema
    }
  }, [profile, form]);

  const fetchOrganizationName = async (orgId: string) => {
    try {
      const { data, error } = await schemaClient.app
        .organizations()
        .select("name")
        .eq("id", orgId)
        .single();
        
      if (error) throw error;
      if (data) {
        setOrganizationName(data.name);
        form.setValue("organizationName", data.name);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !profile) return;
    
    setIsSubmitting(true);
    try {
      // Update profile information
      const { error } = await schemaClient.app
        .profiles()
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update organization name if user is admin and has an organization
      if (isAdmin && data.organizationName && data.organizationName !== organizationName) {
        // Note: Organization update logic needs to be implemented with new schema
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message || "There was an error updating your profile.",
      });
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = () => {
    if (!profile) return "U";
    return `${(profile.first_name || "").charAt(0)}${(profile.last_name || "").charAt(0)}`;
  };

  // Define user role display text
  const userRoleText = isAdmin ? "Administrator" : isClient ? "Client" : "User";

  return (
    <div className="container max-w-4xl mx-auto">
      <PageHeader 
        title="Profile" 
        description="Manage your account settings and profile information"
      />

      <div className="space-y-6">
        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder.svg" alt={profile?.first_name || "User"} />
                <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2 text-center md:text-left">
                <h3 className="text-xl font-semibold">
                  {profile?.first_name} {profile?.last_name}
                </h3>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center justify-center md:justify-start gap-1">
                    <Mail className="h-4 w-4" /> 
                    {user?.email}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-1 mt-1">
                    <User className="h-4 w-4" /> 
                    {userRoleText}
                  </div>
                  {organizationName && (
                    <div className="flex items-center justify-center md:justify-start gap-1 mt-1">
                      <Building className="h-4 w-4" /> 
                      {organizationName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">Email</h3>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Only show organization name edit for admins */}
                {isAdmin && organizationName && (
                  <>
                    <Separator />

                    <FormField
                      control={form.control}
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
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
