
'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase/server-init';
import { doc, setDoc } from 'firebase/firestore';


const companyProfileSchema = z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters.'),
});
type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;


export async function updateCompanyProfile(data: CompanyProfileFormValues) {
    const { firestore } = initializeFirebase();

    const validatedData = companyProfileSchema.safeParse(data);
    if (!validatedData.success) {
        throw new Error('Invalid data provided for company profile update.');
    }
    
    const { name } = validatedData.data;

    try {
        const companyProfileRef = doc(firestore, 'settings', 'companyProfile');
        await setDoc(companyProfileRef, { name }, { merge: true });
        return { success: true, message: 'Company profile updated successfully.' };
    } catch(error) {
        console.error("Error updating company profile:", error);
        throw new Error('Could not update company profile in Firestore.');
    }
}
