
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Mail, Phone, User, Globe } from "lucide-react";

interface ClientInfoCardProps {
  clientName: string;
  contactName: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  status: string;
}

export const ClientInfoCard = ({
  clientName,
  contactName,
  email,
  phone,
  address,
  website,
  status
}: ClientInfoCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Client Information Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
                <p>{contactName || "No contact assigned"}</p>
              </div>
            </div>
            
            {email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{email}</p>
                </div>
              </div>
            )}
            
            {phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{phone}</p>
                </div>
              </div>
            )}
            
            {address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="break-words">{address}</p>
                </div>
              </div>
            )}
          </div>
          
          {website && (
            <div className="pt-2">
              <p className="text-sm font-medium text-muted-foreground">Website</p>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {website}
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Client Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
