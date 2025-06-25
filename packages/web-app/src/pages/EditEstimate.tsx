
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/Spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEditEstimateData } from "@/hooks/useEditEstimateData";

// Define form schema for validation
const formSchema = z.object({
  clientName: z.string().min(1, { message: "Client name is required" }),
  clientEmail: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  clientPhone: z.string().optional().or(z.literal('')),
  clientAddress: z.string().optional().or(z.literal('')),
  projectName: z.string().optional().or(z.literal('')),
  date: z.string().min(1, { message: "Date is required" }),
  dueDate: z.string().min(1, { message: "Due date is required" }),
  notes: z.string().optional(),
  terms: z.string().optional(),
  tax: z.number().optional()
});

type FormValues = z.infer<typeof formSchema>;

const EditEstimate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tax, setTax] = useState(0);
  
  // Use our custom hook to fetch and manage estimate data
  const {
    estimate,
    lineItems,
    loading,
    saving,
    updateLineItem,
    addLineItem,
    removeLineItem,
    saveEstimate
  } = useEditEstimateData(id || '');
  
  // Setup form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      projectName: "",
      date: "",
      dueDate: "",
      notes: "",
      terms: "",
      tax: 0
    },
  });
  
  // Set form values when estimate data is loaded
  useEffect(() => {
    if (estimate) {
      form.reset({
        clientName: estimate.client.name,
        clientEmail: estimate.client.email || "",
        clientPhone: estimate.client.phone || "",
        clientAddress: estimate.client.address || "",
        projectName: estimate.project.name,
        date: estimate.date,
        dueDate: estimate.dueDate,
        notes: estimate.notes,
        terms: estimate.terms,
        tax: tax
      });
    }
  }, [estimate, form, tax]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    const success = await saveEstimate({
      ...data,
      tax
    });
    
    if (success) {
      // Navigate back to estimate details
      navigate(`/estimates/${id}`);
    }
  };

  // Handle tax input change
  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTax = Number(e.target.value) || 0;
    setTax(newTax);
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal + tax;
  
  // Get currency from estimate
  const currency = estimate?.currency || 'USD';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-medium">Estimate not found</h2>
        <p className="mt-2 text-muted-foreground">
          The estimate you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button 
          className="mt-4"
          onClick={() => navigate("/estimates")}
        >
          Back to Estimates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Edit Estimate: ${id}`}
        description="Update the estimate details and line items"
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Client Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Project & Date Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Line Items</h3>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={addLineItem}
                  className="flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Item
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input 
                            value={item.description} 
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                            className="w-20 text-right ml-auto"
                            min="1"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">{currency}</span>
                            <Input 
                              type="number" 
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                              className="w-24 text-right"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {currency} {item.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                            className="h-8 w-8"
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lineItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No items added. Click "Add Item" to add line items to this estimate.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 flex justify-end">
                <div className="w-full md:w-72">
                  <div className="flex justify-between py-2">
                    <span>Subtotal:</span>
                    <span>{currency} {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span>Tax:</span>
                    <div className="flex items-center">
                      <span className="mr-1">{currency}</span>
                      <Input
                        type="number"
                        value={tax}
                        onChange={handleTaxChange}
                        className="w-24 text-right"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between py-2 font-bold border-t">
                    <span>Total:</span>
                    <span>{currency} {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormDescription>Additional notes for the client</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/estimates/${id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Save size={16} />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditEstimate;
