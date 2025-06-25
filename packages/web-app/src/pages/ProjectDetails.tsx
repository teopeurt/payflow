
import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Pencil, Plus, CalendarDays, CheckCircle2, Clock, CircleAlert, FileText, Receipt } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";
import { MilestoneDialog } from "@/components/projects/MilestoneDialog";
import { DeliverableDialog } from "@/components/projects/DeliverableDialog";
import { StatusUpdateMenu, StatusType } from "@/components/projects/StatusUpdateMenu";
import { MilestoneInvoiceDialog } from "@/components/projects/MilestoneInvoiceDialog";
import { InvoiceStatusBadge } from "@/components/shared/InvoiceStatusBadge";

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [isDeliverableDialogOpen, setIsDeliverableDialogOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [isMilestoneInvoiceDialogOpen, setIsMilestoneInvoiceDialogOpen] = useState(false);
  
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          organization:organizations(name)
        `)
        .eq("id", id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
  
  const { data: milestones = [], isLoading: isLoadingMilestones } = useQuery({
    queryKey: ["milestones", id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from("milestones")
        .select(`
          *,
          deliverables(*)
        `)
        .eq("project_id", id)
        .order("due_date", { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });
  
  // Fetch project invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["project-invoices", id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          payments(*)
        `)
        .eq("project_id", id)
        .order("issue_date", { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });
  
  const handleAddDeliverable = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
    setIsDeliverableDialogOpen(true);
  };

  const handleCloseDeliverableDialog = () => {
    setIsDeliverableDialogOpen(false);
    setSelectedMilestoneId(null);
  };
  
  const handleCreateMilestoneInvoice = () => {
    setIsMilestoneInvoiceDialogOpen(true);
  };
  
  const handleCreateEstimate = () => {
    // Navigate to create estimate page with project ID
    if (id) {
      navigate(`/estimates/new?projectId=${id}`);
    }
  };
  
  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner />
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-medium">Project not found</h2>
        <p className="text-muted-foreground mt-2">
          The project you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMM d, yyyy");
  };
  
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = "";
    let textColor = "";
    let icon = null;
    
    switch (status) {
      case "active":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        icon = <CheckCircle2 className="h-4 w-4 mr-1" />;
        break;
      case "completed":
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        icon = <CheckCircle2 className="h-4 w-4 mr-1" />;
        break;
      case "on-hold":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        icon = <CircleAlert className="h-4 w-4 mr-1" />;
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
        icon = <Clock className="h-4 w-4 mr-1" />;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {icon}
        {status === "active" ? "Active" : status === "completed" ? "Completed" : "On Hold"}
      </span>
    );
  };
  
  const completedMilestonesCount = milestones.filter(
    (milestone) => milestone.status === 'completed'
  ).length;
  
  // Calculate total amount paid for invoices
  const calculateTotalPaid = (invoice: any) => {
    if (!invoice.payments || !invoice.payments.length) return 0;
    return invoice.payments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);
  };
  
  // Determine invoice payment status
  const getInvoiceStatus = (invoice: any) => {
    const totalPaid = calculateTotalPaid(invoice);
    
    if (invoice.status === 'cancelled') return 'cancelled';
    if (invoice.status === 'draft') return 'draft';
    if (totalPaid >= invoice.amount) return 'paid';
    if (totalPaid > 0) return 'partially-paid';
    
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    if (today > dueDate && invoice.status === 'sent') return 'overdue';
    
    return invoice.status;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title={project?.name} 
          description={`Client: ${project?.organization?.name || "Unknown"}`}
        />
        <div className="space-x-2">
          {completedMilestonesCount > 0 && (
            <Button variant="secondary" onClick={handleCreateMilestoneInvoice}>
              Create Invoice
            </Button>
          )}
          <Button variant="secondary" onClick={handleCreateEstimate}>
            <FileText className="mr-2 h-4 w-4" />
            Create Estimate
          </Button>
          <Button asChild>
            <Link to={`/projects/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones & Deliverables</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge status={project.status} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Start Date</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{formatDate(project.start_date)}</span>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>End Date</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{formatDate(project.end_date)}</span>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {project.description ? (
                <p>{project.description}</p>
              ) : (
                <p className="text-muted-foreground">No description provided.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="milestones" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Project Milestones</h3>
            <Button size="sm" onClick={() => setIsMilestoneDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
          
          {isLoadingMilestones ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Spinner />
            </div>
          ) : milestones.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No milestones have been added to this project yet.</p>
                <Button onClick={() => setIsMilestoneDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Milestone
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {milestones.map((milestone) => (
                <Card key={milestone.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{milestone.name}</CardTitle>
                        <CardDescription>Due: {formatDate(milestone.due_date)}</CardDescription>
                      </div>
                      <StatusUpdateMenu 
                        id={milestone.id}
                        currentStatus={milestone.status as StatusType || 'active'} 
                        tableName="milestones" 
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {milestone.description && <p className="mb-4">{milestone.description}</p>}
                    
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Deliverables
                    </h4>
                    {milestone.deliverables && milestone.deliverables.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {milestone.deliverables.map((deliverable: any) => (
                          <div 
                            key={deliverable.id}
                            className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{deliverable.name}</div>
                              {deliverable.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {deliverable.description}
                                </p>
                              )}
                              {deliverable.due_date && (
                                <div className="flex items-center text-xs text-muted-foreground mt-2">
                                  <CalendarDays className="h-3 w-3 mr-1" />
                                  Due: {formatDate(deliverable.due_date)}
                                </div>
                              )}
                            </div>
                            <StatusUpdateMenu 
                              id={deliverable.id}
                              currentStatus={deliverable.status || 'active'} 
                              tableName="deliverables"
                              size="sm" 
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">No deliverables added yet.</p>
                    )}
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddDeliverable(milestone.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Deliverable
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="invoices" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Project Invoices</h3>
            {completedMilestonesCount > 0 && (
              <Button size="sm" onClick={handleCreateMilestoneInvoice}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice from Milestones
              </Button>
            )}
          </div>
          
          {isLoadingInvoices ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Spinner />
            </div>
          ) : invoices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">
                  {completedMilestonesCount > 0 
                    ? "Create an invoice for completed milestones in this project." 
                    : "Complete at least one milestone to create an invoice."}
                </p>
                {completedMilestonesCount > 0 && (
                  <Button onClick={handleCreateMilestoneInvoice}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const status = getInvoiceStatus(invoice);
                const totalPaid = calculateTotalPaid(invoice);
                const remainingAmount = Number(invoice.amount) - totalPaid;
                
                return (
                  <Card key={invoice.id} className="hover:bg-muted/40 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Receipt className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">
                              <Link 
                                to={`/invoices/${invoice.id}`} 
                                className="hover:underline text-primary"
                              >
                                {invoice.invoice_number}
                              </Link>
                            </h4>
                            <div className="flex items-center mt-1 space-x-3 text-sm text-muted-foreground">
                              <span>{formatDate(invoice.issue_date)}</span>
                              <span>•</span>
                              <span>Due: {formatDate(invoice.due_date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="font-medium">${Number(invoice.amount).toFixed(2)}</div>
                            {totalPaid > 0 && totalPaid < invoice.amount && (
                              <div className="text-sm text-muted-foreground">
                                ${remainingAmount.toFixed(2)} remaining
                              </div>
                            )}
                          </div>
                          <InvoiceStatusBadge status={status as any} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {id && (
        <MilestoneDialog 
          projectId={id} 
          isOpen={isMilestoneDialogOpen} 
          onClose={() => setIsMilestoneDialogOpen(false)} 
        />
      )}
      
      {selectedMilestoneId && (
        <DeliverableDialog 
          milestoneId={selectedMilestoneId} 
          isOpen={isDeliverableDialogOpen} 
          onClose={handleCloseDeliverableDialog} 
        />
      )}
      
      {id && (
        <MilestoneInvoiceDialog
          projectId={id}
          isOpen={isMilestoneInvoiceDialogOpen}
          onClose={() => setIsMilestoneInvoiceDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
