'use server';
/**
 * @fileOverview Manages the publishing and unpublishing of products.
 */
import { ai } from '@/ai/genkit';
import { getDoc, setDoc, deleteDoc, doc, type Firestore } from 'firebase/firestore';
import { ManageProductStatusInputSchema, ManageProductStatusOutputSchema, type ManageProductStatusInput } from '@/types';

interface FlowContext {
  firestore: Firestore;
}

// Private function containing the core logic for publishing/unpublishing
async function _manageProductStatusLogic(input: ManageProductStatusInput, context: FlowContext): Promise<ManageProductStatusOutput> {
  const { action, productId } = input;
  const { firestore } = context;

  const draftRef = doc(firestore, 'drafts', productId);

  try {
    if (action === 'publish') {
      const draftDoc = await getDoc(draftRef);
      if (!draftDoc.exists()) {
        throw new Error(`Draft with ID ${productId} not found.`);
      }
      const productData = draftDoc.data()!;
      
      const liveCollectionPath = `${productData.db}/${productData.category}/products`;
      const liveDocRef = doc(firestore, liveCollectionPath, productId);

      await setDoc(liveDocRef, { ...productData, status: 'Published' });
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

       await setDoc(draftRef, { ...productData, status: 'Draft' });
       await deleteDoc(liveDocRef);

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

// Define the Genkit flow at the top level of the module
const manageProductStatusFlow = ai.defineFlow(
  {
    name: 'manageProductStatusFlow',
    inputSchema: ManageProductStatusInputSchema,
    outputSchema: ManageProductStatusOutputSchema,
  },
  async (input, context: FlowContext) => {
    // The flow now correctly calls the private logic function
    return _manageProductStatusLogic(input, context);
  }
);

// This is the exported function that will be called from the client
export async function manageProductStatus(
  input: ManageProductStatusInput,
  firestore: Firestore
) {
  // Execute the defined flow
  return manageProductStatusFlow(input, { firestore });
}
