
import React from "react";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { PageHeader } from "@/components/shared/PageHeader";

const NewProject: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create New Project" 
        description="Create a new project and assign it to a client" 
      />
      
      <div className="rounded-md border p-6 bg-card">
        <ProjectForm />
      </div>
    </div>
  );
};

export default NewProject;
