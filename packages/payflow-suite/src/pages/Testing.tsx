import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ComprehensiveTestSuite } from "@/components/testing/ComprehensiveTestSuite";

const Testing: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Security & Access Control Testing" 
        description="Comprehensive test suite for RLS policies, role-based access control, and security validation"
      />
      <ComprehensiveTestSuite />
    </div>
  );
};

export default Testing;