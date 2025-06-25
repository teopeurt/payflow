
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Trash } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/shared/Spinner";
import { FileUpload } from "@/components/shared/FileUpload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partially-paid";
type RecurringType = "indefinitely" | "on_date" | "count";

// Client and project types to match database schema
type Client = {
  id: string;
  name: string;
  email?: string;
};

type Project = {
  id: string;
  name: string;
  clientId: string;
};

// Define form validation schema
const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().min(1, "Project is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  purchaseOrder: z.string().optional(),
  issueDate: z.date({
    required_error: "Issue date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  status: z.string().min(1, "Status is required"),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
    rate: z.coerce.number().min(0, "Rate must be greater than or equal to 0"),
    amount: z.coerce.number()
  })).min(1, "At least one item is required"),
  subtotal: z.coerce.number(),
  tax: z.coerce.number(),
  discount: z.coerce.number(),
  total: z.coerce.number(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  recurringStartDate: z.date().optional(),
  recurringUntil: z.string().optional(),
  recurringEndDate: z.date().optional(),
  recurringCount: z.coerce.number().optional(),
});

const NewInvoice = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Initialize form with default values
  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: "",
      projectId: "",
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      purchaseOrder: "",
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Due in 30 days
      status: "draft",
      items: [{
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0
      }],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      notes: "Thank you for your business.",
      terms: "Payment is due within 30 days from the date of invoice.",
      isRecurring: false,
      recurringFrequency: "monthly",
      recurringUntil: "indefinitely",
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Fetch clients from database
  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Fetch organizations (our clients)
        const { data: organizations, error: orgError } = await supabase
          .from('organizations')
          .select('id, name');
        
        if (orgError) throw orgError;

        // Transform organizations to clients format
        const clientsData = organizations.map(org => ({
          id: org.id,
          name: org.name
        }));

        setClients(clientsData);
      } catch (error: any) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Error",
          description: "Failed to load clients. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchClients();
  }, []);

  // Update projects when client changes
  const handleClientChange = async (clientId: string) => {
    try {
      // For now, we're using mock projects data
      // In a real app, you would fetch projects from the database based on the client ID
      const filteredProjects = projects.filter(
        project => project.clientId === clientId
      );
      setClientProjects(filteredProjects);
    } catch (error) {
      console.error("Error fetching client projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects for this client.",
        variant: "destructive",
      });
    }
    
    form.setValue("projectId", ""); // Reset project selection
  };

  // Mock project data - in a real app, this would come from the database
  const projects = [
    { id: "proj-1", name: "Website Redesign", clientId: "client-1" },
    { id: "proj-2", name: "Mobile App Development", clientId: "client-1" },
    { id: "proj-3", name: "ERP Implementation", clientId: "client-2" },
    { id: "proj-4", name: "Cloud Migration", clientId: "client-3" },
  ];

  // Calculate line item amount and update totals
  const calculateLineItemAmount = (index: number) => {
    const items = form.getValues("items");
    const quantity = items[index]?.quantity || 0;
    const rate = items[index]?.rate || 0;
    const amount = quantity * rate;
    
    form.setValue(`items.${index}.amount`, amount);
    
    // Recalculate totals
    calculateTotals();
  };

  // Calculate invoice totals
  const calculateTotals = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = form.getValues("tax") || 0;
    const discount = form.getValues("discount") || 0;
    const total = subtotal + tax - discount;
    
    form.setValue("subtotal", subtotal);
    form.setValue("total", total);
  };

  // Add new line item
  const handleAddItem = () => {
    append({
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    });
  };

  // Handle form submission
  const onSubmit = (data: z.infer<typeof invoiceFormSchema>) => {
    setIsLoading(true);

    // In a real app, save the invoice data to the database
    console.log("Submitting invoice:", data);
    console.log("Logo file:", logoFile);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Invoice created",
        description: `Invoice ${data.invoiceNumber} has been created.`,
      });
      navigate("/invoices");
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Invoice" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleClientChange(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clientProjects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Invoice number and purchase order */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purchaseOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Order (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Status, issue date and due date */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="partially-paid">Partially Paid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Issue Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <FormLabel>Logo (Optional)</FormLabel>
                  <div className="mt-2">
                    <FileUpload
                      onFileChange={(file) => setLogoFile(file)}
                      label=""
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line items card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Line Items</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 font-medium text-sm">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Rate</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-1"></div>
                </div>

                {fields.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Input
                        {...form.register(`items.${index}.description`)}
                        placeholder="Item description"
                        onChange={(e) => {
                          form.setValue(`items.${index}.description`, e.target.value);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        {...form.register(`items.${index}.quantity`, { 
                          valueAsNumber: true 
                        })}
                        placeholder="Qty"
                        onChange={(e) => {
                          form.setValue(`items.${index}.quantity`, parseFloat(e.target.value) || 0);
                          calculateLineItemAmount(index);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        {...form.register(`items.${index}.rate`, { 
                          valueAsNumber: true 
                        })}
                        placeholder="Rate"
                        onChange={(e) => {
                          form.setValue(`items.${index}.rate`, parseFloat(e.target.value) || 0);
                          calculateLineItemAmount(index);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        {...form.register(`items.${index}.amount`, { 
                          valueAsNumber: true 
                        })}
                        disabled
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          remove(index);
                          calculateTotals();
                        }}
                        disabled={fields.length === 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>

                <div className="flex justify-end mt-6">
                  <div className="w-64 space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <Input
                        type="number"
                        {...form.register("subtotal", { valueAsNumber: true })}
                        className="w-32 text-right"
                        disabled
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <Input
                        type="number"
                        {...form.register("tax", { valueAsNumber: true })}
                        className="w-32 text-right"
                        onChange={(e) => {
                          form.setValue("tax", parseFloat(e.target.value) || 0);
                          calculateTotals();
                        }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <Input
                        type="number"
                        {...form.register("discount", { valueAsNumber: true })}
                        className="w-32 text-right"
                        onChange={(e) => {
                          form.setValue("discount", parseFloat(e.target.value) || 0);
                          calculateTotals();
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <Input
                        type="number"
                        {...form.register("total", { valueAsNumber: true })}
                        className="w-32 text-right font-medium"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and terms card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notes to the customer that will display on the invoice"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms and Conditions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Terms and conditions for this invoice"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recurring invoice settings */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Recurring Invoice</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          This invoice will be automatically regenerated on a schedule.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("isRecurring") && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="recurringFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="biannually">Bi-annually</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurringStartDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurringUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Condition</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select end condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="indefinitely">Until cancelled</SelectItem>
                              <SelectItem value="on_date">On specific date</SelectItem>
                              <SelectItem value="count">After number of occurrences</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("recurringUntil") === "on_date" && (
                      <FormField
                        control={form.control}
                        name="recurringEndDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch("recurringUntil") === "count" && (
                      <FormField
                        control={form.control}
                        name="recurringCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Occurrences</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                min={1}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button 
              type="button"
              variant="outline"
              onClick={() => navigate("/invoices")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner size="sm" className="mr-2" />}
              Create Invoice
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewInvoice;
