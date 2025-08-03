import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  getInvoicesWithRelations,
  getInvoiceWithItems,
  getPaymentsWithInvoice,
  getOrganizationMembersWithDetails,
  getProjectsWithRelations,
} from '../queries/cross-schema';

const app = new Hono();

app.use('/*', cors());

// Get invoices with organization, project, and client details
app.get('/invoices', async (c) => {
  try {
    const limit = Number(c.req.query('limit')) || 10;
    const invoices = await getInvoicesWithRelations(limit);
    return c.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return c.json({ error: 'Failed to fetch invoices' }, 500);
  }
});

// Get single invoice with all relations including items
app.get('/invoices/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const invoice = await getInvoiceWithItems(id);
    
    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }
    
    return c.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return c.json({ error: 'Failed to fetch invoice' }, 500);
  }
});

// Get payments with invoice and client information
app.get('/payments', async (c) => {
  try {
    const limit = Number(c.req.query('limit')) || 10;
    const payments = await getPaymentsWithInvoice(limit);
    return c.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return c.json({ error: 'Failed to fetch payments' }, 500);
  }
});

// Get organization members with organization and user details
app.get('/organization-members', async (c) => {
  try {
    const limit = Number(c.req.query('limit')) || 10;
    const members = await getOrganizationMembersWithDetails(limit);
    return c.json(members);
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return c.json({ error: 'Failed to fetch organization members' }, 500);
  }
});

// Get projects with organization and client details
app.get('/projects', async (c) => {
  try {
    const limit = Number(c.req.query('limit')) || 10;
    const projects = await getProjectsWithRelations(limit);
    return c.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

export default app;