
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Project = {
  id: string;
  name: string;
  organization_id: string;
  organization: {
    name: string;
  };
  created_at: string;
  status: string;
};

export const ProjectList: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id, 
          name, 
          status,
          created_at,
          organization_id,
          organization:organizations(name)
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
  });
  
  // Delete project mutation
  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the project. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject.mutate(id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="mt-2 text-muted-foreground">Loading projects...</p>
      </div>
    );
  }
  
  if (projects.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No projects found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first project.
        </p>
        <Button className="mt-4" asChild>
          <Link to="/projects/new">Create Project</Link>
        </Button>
      </div>
    );
  }
  
  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>
                <Link 
                  to={`/clients/${project.organization_id}`}
                  className="text-primary hover:underline"
                >
                  {project.organization?.name || "Unknown"}
                </Link>
              </TableCell>
              <TableCell>{formatDate(project.created_at)}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.status === "active"
                      ? "bg-green-100 text-green-800"
                      : project.status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {project.status === "active"
                    ? "Active"
                    : project.status === "completed"
                    ? "Completed"
                    : "On Hold"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link to={`/projects/${project.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link to={`/projects/${project.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
