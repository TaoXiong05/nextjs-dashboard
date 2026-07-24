'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
    values?: {
        customerId?: string;
        amount?: string;
        status?: string;
    };
};

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });


    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
            values: {
                customerId: (formData.get('customerId') as string) || '',
                amount: (formData.get('amount') as string) || '',
                status: (formData.get('status') as string) || '',
            },
        };
    }
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Intl.DateTimeFormat('en-CA').format(new Date());
    // console.log('rawFormData', rawFormData);

    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;

    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}


const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
    const rawFormData = {
        customerId: (formData.get('customerId') as string) || '',
        amount: (formData.get('amount') as string) || '',
        status: (formData.get('status') as string) || '',
    };

    const validatedFields = UpdateInvoice.safeParse(rawFormData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
            values: rawFormData, // 👈 校验失败时，将用户修改后的输入内容返回
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;



    } catch (error) {
        console.error('Error updating invoice:', error);
        // return { message: 'Database Error: Failed to Update Invoice.' };
        throw error;
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');

}

export async function deleteInvoice(id: string) {
    // throw new Error('Failed to Delete Invoice');
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        
    } catch (error) {
        console.error('Error deleting invoice:', error);
        // return { message: 'Database Error: Failed to Delete Invoice.' };
        throw error;
    }
    revalidatePath('/dashboard/invoices');

}

