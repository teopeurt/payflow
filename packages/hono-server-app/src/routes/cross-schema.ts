import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth-optimized';
import {
  getInvoicesWithRelations,
  getInvoiceWithItems,
  getPaymentsWithInvoice,
  getOrganizationMembersWithDetails,
  getProjectsWithRelations,
  getMessageThreadsWithRelations,
  getMessagesForThread,
  createMessage,
} from '../queries/cross-schema';

const app = new Hono();


app.use('/*', authMiddleware);

// Get invoices with organization, project, and client details
app.get('/invoices', async (c) => {
  try {
    const user = c.get('user');
    const limit = Number(c.req.query('limit')) || 10;
    const invoices = await getInvoicesWithRelations(limit, user);
    return c.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return c.json({ error: 'Failed to fetch invoices' }, 500);
  }
});

// Get single invoice with all relations including items
app.get('/invoices/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const invoice = await getInvoiceWithItems(id, user);
    
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
    const user = c.get('user');
    const limit = Number(c.req.query('limit')) || 10;
    const payments = await getPaymentsWithInvoice(limit, user);
    return c.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return c.json({ error: 'Failed to fetch payments' }, 500);
  }
});

// Get organization members with organization and user details
app.get('/organization-members', async (c) => {
  try {
    const user = c.get('user');
    const limit = Number(c.req.query('limit')) || 10;
    const members = await getOrganizationMembersWithDetails(limit, user);
    return c.json(members);
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return c.json({ error: 'Failed to fetch organization members' }, 500);
  }
});

// Get projects with organization and client details
app.get('/projects', async (c) => {
  try {
    const user = c.get('user');
    const limit = Number(c.req.query('limit')) || 10;
    const projects = await getProjectsWithRelations(limit, user);
    return c.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// Get message threads with creator and project details
app.get('/message-threads', async (c) => {
  try {
    const user = c.get('user');
    const limit = Number(c.req.query('limit')) || 10;
    const threads = await getMessageThreadsWithRelations(limit, user);
    return c.json(threads);
  } catch (error) {
    console.error('Error fetching message threads:', error);
    return c.json({ error: 'Failed to fetch message threads' }, 500);
  }
});

// Get messages for a specific thread with sender details
app.get('/messages/:threadId', async (c) => {
  try {
    const user = c.get('user');
    const threadId = c.req.param('threadId');
    const messages = await getMessagesForThread(threadId, user);
    return c.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Create a new message in a thread
app.post('/messages', async (c) => {
  try {
    const user = c.get('user');
    
    if (!user?.userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { threadId, content } = body;

    if (!threadId || !content?.trim()) {
      return c.json({ error: 'Thread ID and message content are required' }, 400);
    }

    console.log('Creating message:', {
      threadId,
      senderId: user.userId,
      contentLength: content.length,
      userRole: user.role
    });

    const message = await createMessage(threadId, content.trim(), user.userId, user);

    if (!message) {
      return c.json({ error: 'Failed to create message or access denied' }, 403);
    }

    console.log('Message created successfully:', message.id);
    return c.json(message, 201);
  } catch (error) {
    console.error('Error creating message:', error);
    return c.json({ error: 'Failed to create message' }, 500);
  }
});

export default app;