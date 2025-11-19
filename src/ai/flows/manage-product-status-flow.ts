"use server";
/**
 * @fileOverview Manages the publishing and unpublishing of products.
 */
import { ai } from "@/ai/genkit";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  getApp as getAdminApp,
  cert,
} from "firebase-admin/app";
import { firebaseConfig } from "@/firebase/config";
import { z } from "zod";

// Server-side initialization with Firebase Admin SDK
function initializeAdminFirebase() {
  if (!getAdminApps().length) {
    try {
      let credential;

      // Option 1: Use service account JSON from environment variable (production)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        );
        credential = cert(serviceAccount);
      }
      // Option 2: Use service account file (local development)
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        credential = cert(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      }
      // Option 3: Auto-detect in Google Cloud environments
      else {
        credential = undefined;
      }

      const app = initializeAdminApp({
        credential: credential,
        projectId: firebaseConfig.projectId,
      });

      return { firestore: getAdminFirestore(app) };
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      throw error;
    }
  }
  return { firestore: getAdminFirestore(getAdminApp()) };
}

const { firestore } = initializeAdminFirebase();

// Define schemas directly in the flow file to avoid import issues.
const ManageProductStatusInputSchema = z.object({
  action: z.enum(["publish", "unpublish"]),
  productId: z
    .string()
    .describe("The ID of the product in the drafts collection."),
  db: z
    .string()
    .optional()
    .describe("The target database (e.g., retailers). Required for unpublish."),
  category: z
    .string()
    .optional()
    .describe("The product category. Required for unpublish."),
});
export type ManageProductStatusInput = z.infer<
  typeof ManageProductStatusInputSchema
>;

const ManageProductStatusOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ManageProductStatusOutput = z.infer<
  typeof ManageProductStatusOutputSchema
>;

// Private function containing the core logic for publishing/unpublishing
async function _manageProductStatusLogic(
  input: ManageProductStatusInput,
): Promise<ManageProductStatusOutput> {
  const { action, productId } = input;

  const draftRef = firestore.doc(`drafts/${productId}`);

  try {
    if (action === "publish") {
      const draftDoc = await draftRef.get();

      if (!draftDoc.exists) {
        throw new Error(
          `Draft with ID ${productId} not found in 'drafts' collection.`,
        );
      }

      const productData = draftDoc.data();

      if (!productData || !productData.db || !productData.category) {
        throw new Error(
          `Draft data for '${productId}' is missing required fields: db or category.`,
        );
      }

      const categorySlug = productData.category;
      const liveCollectionPath = `${productData.db}/${categorySlug}/products`;
      const liveDocRef = firestore.doc(`${liveCollectionPath}/${productId}`);

      // Write first, then delete (prevents data loss if write fails)
      await liveDocRef.set({
        ...productData,
        status: "Published",
        publishedAt: new Date().toISOString(),
      });

      await draftRef.delete();

      return {
        success: true,
        message: `Product ${productId} published successfully to ${liveCollectionPath}.`,
      };
    } else if (action === "unpublish") {
      if (!input.db || !input.category) {
        throw new Error("Database and category are required for unpublishing.");
      }

      const categorySlug = input.category;
      const liveCollectionPath = `${input.db}/${categorySlug}/products`;
      const liveDocRef = firestore.doc(`${liveCollectionPath}/${productId}`);

      const liveDoc = await liveDocRef.get();

      if (!liveDoc.exists) {
        throw new Error(
          `Published product with ID ${productId} not found in ${liveCollectionPath}.`,
        );
      }

      const productData = liveDoc.data();

      if (!productData) {
        throw new Error(`Product data for ${productId} is empty or invalid.`);
      }

      // Write first, then delete (prevents data loss if write fails)
      await draftRef.set({
        ...productData,
        status: "Draft",
        unpublishedAt: new Date().toISOString(),
      });

      await liveDocRef.delete();

      return {
        success: true,
        message: `Product ${productId} unpublished and moved to drafts.`,
      };
    }

    return { success: false, message: "Invalid action." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Flow failed for product ${productId} with action ${action}:`,
      errorMessage,
    );
    throw new Error(`Failed to ${action} product: ${errorMessage}`);
  }
}

// Define the Genkit flow at the top level of the module
const manageProductStatusFlow = ai.defineFlow(
  {
    name: "manageProductStatusFlow",
    inputSchema: ManageProductStatusInputSchema,
    outputSchema: ManageProductStatusOutputSchema,
  },
  async (input) => {
    return _manageProductStatusLogic(input);
  },
);

// This is the exported function that will be called from the client
export async function manageProductStatus(
  input: ManageProductStatusInput,
): Promise<ManageProductStatusOutput> {
  // Execute the defined flow
  return manageProductStatusFlow(input);
}

