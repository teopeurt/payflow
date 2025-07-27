
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSupabase } from '@payflow/core/integrations/supabase/client';
import { fetchQuoteItems, fetchQuoteByReference, type Quote, type QuoteItem } from '@/services/quotesService';

export const useQuoteDetailData = (quoteId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lineItems, setLineItems] = useState<QuoteItem[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!quoteId) {
        setError(new Error('Quote ID is missing'));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching quote with ID:', quoteId);
        
        // Fetch quote by reference number
        const fetchedQuote = await fetchQuoteByReference(quoteId);
        
        if (!fetchedQuote) {
          setError(new Error('Quote not found'));
          return;
        }
        
        console.log('Quote data:', fetchedQuote);
        
        if (fetchedQuote) {
          setQuote(fetchedQuote);
          const fetchedItems = await fetchQuoteItems(fetchedQuote.id);
          setLineItems(fetchedItems || []);
        } else {
          setError(new Error('Quote not found'));
        }
      } catch (err) {
        console.error("Error fetching quote details:", err);
        setError(err instanceof Error ? err : new Error('Failed to fetch quote details'));
        toast({
          title: 'Error',
          description: 'Could not load quote details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteData();
  }, [quoteId, toast]);

  return { quote, lineItems, loading, error };
};
