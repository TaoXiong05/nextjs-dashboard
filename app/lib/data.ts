import postgres from 'postgres';
import {
  CustomerField,
  CustomerForm,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue[]>`SELECT * FROM revenue`;

    console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? '0');
    const numberOfCustomers = Number(data[1][0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2][0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2][0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
  customerId: string | null = null,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        (${customerId}::uuid IS NULL OR invoices.customer_id = ${customerId}::uuid) AND (
          customers.name ILIKE ${`%${query}%`} OR
          customers.email ILIKE ${`%${query}%`} OR
          invoices.amount::text ILIKE ${`%${query}%`} OR
          invoices.date::text ILIKE ${`%${query}%`} OR
          invoices.status ILIKE ${`%${query}%`}
        )
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(
  query: string,
  customerId: string | null = null,
) {
  try {
    const data = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      (${customerId}::uuid IS NULL OR invoices.customer_id = ${customerId}::uuid) AND (
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      )
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));
    console.log(invoice); // Invoice is an empty array []
    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await sql<CustomerField[]>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

// 'all' 全部客户；'pending' 有未结清账单；'paid' 无未结清账单但有已付款记录；'none' 尚无任何账单
export type CustomerStatusFilter = 'all' | 'pending' | 'paid' | 'none';

const CUSTOMERS_PER_PAGE = 8;

export async function fetchFilteredCustomers(
  query: string,
  currentPage: number = 1,
  status: CustomerStatusFilter = 'all',
) {
  const offset = (currentPage - 1) * CUSTOMERS_PER_PAGE;

  try {
    const data = await sql<CustomersTableType[]>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.phone,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  COALESCE(SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END), 0) AS total_pending,
		  COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END), 0) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
		  customers.email ILIKE ${`%${query}%`} OR
		  customers.phone ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.phone, customers.image_url
		HAVING
		  ${status} = 'all' OR
		  (${status} = 'pending' AND COALESCE(SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END), 0) > 0) OR
		  (${status} = 'paid' AND COALESCE(SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END), 0) = 0 AND COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END), 0) > 0) OR
		  (${status} = 'none' AND COUNT(invoices.id) = 0)
		ORDER BY customers.name ASC
		LIMIT ${CUSTOMERS_PER_PAGE} OFFSET ${offset}
	  `;

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function fetchCustomersPages(
  query: string,
  status: CustomerStatusFilter = 'all',
) {
  try {
    const data = await sql`
      SELECT COUNT(*) FROM (
        SELECT customers.id
        FROM customers
        LEFT JOIN invoices ON customers.id = invoices.customer_id
        WHERE
          customers.name ILIKE ${`%${query}%`} OR
          customers.email ILIKE ${`%${query}%`} OR
          customers.phone ILIKE ${`%${query}%`}
        GROUP BY customers.id
        HAVING
          ${status} = 'all' OR
          (${status} = 'pending' AND COALESCE(SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END), 0) > 0) OR
          (${status} = 'paid' AND COALESCE(SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END), 0) = 0 AND COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END), 0) > 0) OR
          (${status} = 'none' AND COUNT(invoices.id) = 0)
      ) AS filtered_customers
    `;

    return Math.ceil(Number(data[0].count) / CUSTOMERS_PER_PAGE);
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch total number of customers.');
  }
}

export async function fetchCustomerById(id: string) {
  try {
    const data = await sql<CustomerForm[]>`
      SELECT id, name, email, phone, image_url
      FROM customers
      WHERE id = ${id};
    `;

    return data[0];
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer.');
  }
}

export async function fetchAllCustomersForExport() {
  try {
    const data = await sql<CustomersTableType[]>`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.phone,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        COALESCE(SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END), 0) AS total_pending,
        COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END), 0) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      GROUP BY customers.id, customers.name, customers.email, customers.phone, customers.image_url
      ORDER BY customers.name ASC
    `;

    return data;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customers for export.');
  }
}
