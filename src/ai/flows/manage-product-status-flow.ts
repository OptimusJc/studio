'use server';
/**
 * @fileOverview Manages the publishing and unpublishing of products.
 */
import { ai } from '@/ai/genkit';
import { getDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { getSdks, initializeFirebase } from '@/firebase/server-init';
import { z } from 'zod';

// Define schemas directly in the flow file to avoid import issues.
const ManageProductStatusInputSchema = z.object({
  action: z.enum(['publish', 'unpublish']),
  productId: z.string().describe('The ID of the product in the drafts collection.'),
  db: z.string().optional().describe('The target database (e.g., retailers). Required for unpublish.'),
  category: z.string().optional().describe('The product category. Required for unpublish.'),
});
export type ManageProductStatusInput = z.infer<typeof ManageProductStatusInputSchema>;

const ManageProductStatusOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ManageProductStatusOutput = z.infer<typeof ManageProductStatusOutputSchema>;

// Initialize Firebase at module level - get the firestore instance directly
const firebaseApp = initializeFirebase();
const { firestore } = getSdks(firebaseApp);

// Private function containing the core logic for publishing/unpublishing
async function _manageProductStatusLogic(input: ManageProductStatusInput): Promise<ManageProductStatusOutput> {
  const { action, productId } = input;

  const draftRef = doc(firestore, 'drafts', productId);

  try {
    if (action === 'publish') {
      const draftDoc = await getDoc(draftRef);
      if (!draftDoc.exists()) {
        throw new Error(`Draft with ID ${productId} not found.`);
      }
      const productData = draftDoc.data()!;
      
      // Validate required fields exist
      if (!productData.db || !productData.category) {
        throw new Error('Product data is missing required fields: db or category');
      }

      const liveCollectionPath = `${productData.db}/${productData.category}/products`;
      const liveDocRef = doc(firestore, liveCollectionPath, productId);

      // Write first, then delete (prevents data loss if write fails)
      await setDoc(liveDocRef, { 
        ...productData, 
        status: 'Published',
        publishedAt: new Date().toISOString() 
      });
      await deleteDoc(draftRef);

      return {
        success: true,
        message: `Product ${productId} published successfully to ${liveCollectionPath}.`,
      };
    } else if (action === 'unpublish') {
      if (!input.db || !input.category) {
        throw new Error("Database and category are required for unpublishing.");
      }

      const liveCollectionPath = `${input.db}/${input.category}/products`;
      const liveDocRef = doc(firestore, liveCollectionPath, productId);

      const liveDoc = await getDoc(liveDocRef);
      if (!liveDoc.exists()) {
        throw new Error(`Published product with ID ${productId} not found in ${liveCollectionPath}.`);
      }
      const productData = liveDoc.data()!;

      // Write first, then delete (prevents data loss if write fails)
      await setDoc(draftRef, { 
        ...productData, 
        status: 'Draft',
        unpublishedAt: new Date().toISOString() 
      });
      await deleteDoc(liveDocRef);

      return {
        success: true,
        message: `Product ${productId} unpublished and moved to drafts.`,
      };
    }

    return { success: false, message: 'Invalid action.' };
  } catch (error) {
    console.error(`Flow failed for product ${productId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to ${action} product: ${errorMessage}`);
  }
}

// Define the Genkit flow at the top level of the module
const manageProductStatusFlow = ai.defineFlow(
  {
    name: 'manageProductStatusFlow',
    inputSchema: ManageProductStatusInputSchema,
    outputSchema: ManageProductStatusOutputSchema,
  },
  async (input) => {
    return _manageProductStatusLogic(input);
  }
);

// This is the exported function that will be called from the client
export async function manageProductStatus(
  input: ManageProductStatusInput,
): Promise<ManageProductStatusOutput> {
  // Execute the defined flow
  return manageProductStatusFlow(input);
}