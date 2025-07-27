
import React from "react";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/projects/ProjectList";
import { PageHeader } from "@/components/shared/PageHeader";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Projects: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Projects" description="Manage your client projects" />
        <Button asChild>
          <Link to="/projects/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Project
          </Link>
        </Button>
      </div>
      
      <ProjectList />
    </div>
  );
};

export default Projects;
