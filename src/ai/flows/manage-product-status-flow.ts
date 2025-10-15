'use server';
/**
 * @fileOverview Manages the publishing and unpublishing of products.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const ManageProductStatusInputSchema = z.object({
  action: z.enum(['publish', 'unpublish']),
  productId: z.string().describe('The ID of the product in the drafts collection.'),
  db: z.string().optional().describe('The target database (e.g., retailers). Required for unpublish.'),
  category: z.string().optional().describe('The product category. Required for unpublish.'),
});
export type ManageProductStatusInput = z.infer<typeof ManageProductStatusInputSchema>;

export const ManageProductStatusOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ManageProductStatusOutput = z.infer<typeof ManageProductStatusOutputSchema>;

export async function manageProductStatus(
  input: ManageProductStatusInput
): Promise<ManageProductStatusOutput> {
  return manageProductStatusFlow(input);
}

const manageProductStatusFlow = ai.defineFlow(
  {
    name: 'manageProductStatusFlow',
    inputSchema: ManageProductStatusInputSchema,
    outputSchema: ManageProductStatusOutputSchema,
  },
  async (input) => {
    const { action, productId } = input;
    const draftRef = db.collection('drafts').doc(productId);

    try {
      if (action === 'publish') {
        const draftDoc = await draftRef.get();
        if (!draftDoc.exists) {
          throw new Error(`Draft with ID ${productId} not found.`);
        }
        const productData = draftDoc.data()!;
        
        const liveCollectionName = `${productData.db}-${productData.category}`;
        const liveDocRef = db.collection(liveCollectionName).doc(productId);

        // Copy data to live collection and delete from drafts
        await db.runTransaction(async (transaction) => {
            transaction.set(liveDocRef, { ...productData, status: 'Published' });
            transaction.delete(draftRef);
        });

        return {
          success: true,
          message: `Product ${productId} published successfully to ${liveCollectionName}.`,
        };
      } else if (action === 'unpublish') {
        if (!input.db || !input.category) {
            throw new Error("Database and category are required for unpublishing.");
        }

        const liveCollectionName = `${input.db}-${input.category}`;
        const liveDocRef = db.collection(liveCollectionName).doc(productId);

        const liveDoc = await liveDocRef.get();
        if (!liveDoc.exists) {
            throw new Error(`Published product with ID ${productId} not found in ${liveCollectionName}.`);
        }
        const productData = liveDoc.data()!;

        // Copy data to drafts collection and delete from live
         await db.runTransaction(async (transaction) => {
            transaction.set(draftRef, { ...productData, status: 'Draft' });
            transaction.delete(liveDocRef);
        });

        return {
          success: true,
          message: `Product ${productId} unpublished and moved to drafts.`,
        };
      }

      return { success: false, message: 'Invalid action.' };
    } catch (error) {
      console.error(`Flow failed for product ${productId}:`, error);
      throw new Error(`Failed to ${action} product: ${(error as Error).message}`);
    }
  }
);
