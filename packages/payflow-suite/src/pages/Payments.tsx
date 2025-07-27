
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentStatistics } from "@/components/payments/PaymentStatistics";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { PaymentHistory } from "@/components/payments/PaymentHistory";
import { AddPaymentMethodDialog } from "@/components/payments/AddPaymentMethodDialog";

const Payments = () => {
  const [isAddPaymentMethodDialogOpen, setIsAddPaymentMethodDialogOpen] = useState(false);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Payments" 
        description="Manage your payment methods and view payment history"
        action={{
          label: "Add Payment Method",
          href: "#", // Using href instead of onClick
        }}
      />
      
      <PaymentStatistics />
      
      <Tabs defaultValue="methods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="methods" className="space-y-4">
          <PaymentMethods onAddPaymentMethod={() => setIsAddPaymentMethodDialogOpen(true)} />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <PaymentHistory />
        </TabsContent>
      </Tabs>
      
      <AddPaymentMethodDialog 
        isOpen={isAddPaymentMethodDialogOpen} 
        onClose={() => setIsAddPaymentMethodDialogOpen(false)} 
      />
    </div>
  );
};

export default Payments;
