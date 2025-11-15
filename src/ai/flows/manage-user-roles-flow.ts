
'use server';
/**
 * @fileOverview Manages user roles and custom claims.
 */
import { ai } from '@/ai/genkit';
import { initializeFirebase } from '@/firebase/server-init';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';

const ManageUserRoleInputSchema = z.object({
  uid: z.string().describe('The UID of the user to update.'),
  role: z.enum(['Admin', 'Editor']).describe('The role to assign to the user.'),
});
export type ManageUserRoleInput = z.infer<typeof ManageUserRoleInputSchema>;

const ManageUserRoleOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ManageUserRoleOutput = z.infer<typeof ManageUserRoleOutputSchema>;


// The Admin SDK is required for setting custom claims.
// It is automatically initialized by App Hosting.
const adminAuth = getAuth(initializeFirebase().firebaseApp);

async function _manageUserRoleLogic(input: ManageUserRoleInput): Promise<ManageUserRoleOutput> {
  const { uid, role } = input;

  try {
    const claims = {
        admin: role === 'Admin',
        editor: role === 'Editor',
    };
    await adminAuth.setCustomUserClaims(uid, claims);

    return {
      success: true,
      message: `Successfully set custom claims for user ${uid}.`,
    };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Failed to set custom claims: ${errorMessage}`);
  }
}

const manageUserRoleFlow = ai.defineFlow(
  {
    name: 'manageUserRoleFlow',
    inputSchema: ManageUserRoleInputSchema,
    outputSchema: ManageUserRoleOutputSchema,
  },
  async (input) => {
    return _manageUserRoleLogic(input);
  }
);

export async function manageUserRole(
  input: ManageUserRoleInput,
): Promise<ManageUserRoleOutput> {
  return manageUserRoleFlow(input);
}
