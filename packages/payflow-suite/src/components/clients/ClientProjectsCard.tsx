
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Briefcase } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";
import { formatDate, formatCurrency } from "@/lib/formatters";

interface Project {
  id: string;
  name: string;
  startDate: string;
  dueDate: string;
  status: string;
  value: number;
}

interface ClientProjectsCardProps {
  clientId: string;
  projects?: Project[];
  isLoading: boolean;
  error: Error | null;
}

export const ClientProjectsCard = ({ 
  clientId, 
  projects = [], 
  isLoading, 
  error 
}: ClientProjectsCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Client Projects</CardTitle>
        <Button asChild size="sm">
          <Link to={`/projects/new?client=${clientId}`}>
            <Briefcase className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">
            <Spinner className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="py-4 text-center text-destructive">
            <p>Error loading projects</p>
          </div>
        ) : projects && projects.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{formatDate(project.startDate)}</TableCell>
                  <TableCell>{formatDate(project.dueDate)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : project.status === "active"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {project.status === "completed" 
                        ? "Completed" 
                        : project.status === "active" 
                        ? "Active" 
                        : "On Hold"}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(project.value)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/projects/${project.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No projects found for this client</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new project for this client.
            </p>
            <Button className="mt-4" asChild>
              <Link to={`/projects/new?client=${clientId}`}>Create Project</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
