
import { useState, useEffect } from "react";
import { getSupabase } from "@payflow/core/integrations/supabase/client";
import { useAuth } from "@payflow/core/auth";
import { Document } from "@/types/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/Spinner";
import { toast } from "@/components/ui/use-toast";

const Documents = () => {
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user || !profile?.organization_id) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await getSupabase()
          .from('documents')
          .select('*')
          .eq("organization_id", profile.organization_id);

        if (error) {
          throw error;
        }

        setDocuments(data || []);
      } catch (error: any) {
        console.error("Error fetching documents:", error.message);
        toast({
          title: "Error fetching documents",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Documents" 
        description="View documents shared with your organization"
      />

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No documents available for your organization.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((document) => (
            <Card key={document.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{document.title}</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Updated: {new Date(document.updated_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {document.content || "No content available."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
