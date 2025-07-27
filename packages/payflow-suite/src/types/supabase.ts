export interface Database {
  public: {
    Tables: {
      estimates: {
        Row: {
          id: string;
          reference_number: string;
          amount: number;
          issue_date: string;
          expiry_date: string;
          status: string;
          notes?: string;
          terms?: string;
          deleted: boolean;
          created_at: string;
          updated_at: string;
          company_name?: string;
          company_address?: string;
          company_email?: string;
          company_phone?: string;
          organization_id?: string;
        };
      };
      estimate_items: {
        Row: {
          id: string;
          estimate_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          deleted: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
