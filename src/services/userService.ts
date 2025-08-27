
'use client';

import { auth, db } from '@/lib/firebase';
import { 
    updateProfile, 
    updateEmail,
    updatePassword, 
    deleteUser, 
    EmailAuthProvider, 
    reauthenticateWithCredential,
    signOut,
    User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import type { PlanId } from '@/lib/plans';

// Get or create a user profile in Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!uid) return null;
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        // If profile doesn't exist, create it for a new user
        const user = auth.currentUser;
        if (user) {
            const newUserProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                planId: 'hobby', // Default to free plan
                countryCode: 'US', // Default to USA
            };
            await setDoc(userDocRef, newUserProfile);
            return newUserProfile;
        }
    }
    return null;
};

// Update a user's profile in Firestore
export const updateUserFirestoreProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
};


// Upgrade a user's plan
export const upgradeUserPlan = async (uid: string, newPlanId: PlanId) => {
    const userDocRef = doc(db, 'users', uid);
    const upgradeRecord = {
        planId: newPlanId,
        date: new Date().toISOString(),
    };
    try {
        await updateDoc(userDocRef, {
            planId: newPlanId,
            upgradeHistory: arrayUnion(upgradeRecord)
        });
    } catch (error) {
        // If the document doesn't exist, create it
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
            const user = auth.currentUser;
            const newUserProfile: UserProfile = {
                uid: uid,
                email: user?.email || null,
                displayName: user?.displayName || null,
                planId: newPlanId,
                upgradeHistory: [upgradeRecord],
            };
            await setDoc(userDocRef, newUserProfile);
        } else {
            console.error("Error upgrading user plan:", error);
            throw new Error("Could not upgrade user plan");
        }
    }
};

// Reauthenticate the current user
export const reauthenticateUser = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("No user is signed in to reauthenticate.");
    }
    const credential = EmailAuthProvider.credential(user.email, password);
    try {
        await reauthenticateWithCredential(user, credential);
    } catch (error: any) {
        console.error("Reauthentication failed:", error);
        // Map common error codes to more user-friendly messages
        if (error.code === 'auth/wrong-password') {
            throw new Error("The password you entered is incorrect.");
        }
        throw new Error("Reauthentication failed. Please check your password.");
    }
};

// Update user's profile (display name and email in Auth and Firestore)
export const updateUserProfile = async (user: User, profile: { displayName?: string, email?: string }) => {
    if (!user) {
        throw new Error("User not found.");
    }
    
    try {
        const authUpdates: { displayName?: string } = {};
        if (profile.displayName && profile.displayName !== user.displayName) {
             authUpdates.displayName = profile.displayName;
        }
        if (Object.keys(authUpdates).length > 0) {
            await updateProfile(user, authUpdates);
        }
        
        const userDocRef = doc(db, 'users', user.uid);
        const firestoreUpdates: { displayName?: string | null, email?: string | null } = {};
        if (profile.displayName) firestoreUpdates.displayName = profile.displayName;
        
        // Email update requires re-authentication and is more complex
        if (profile.email && profile.email !== user.email) {
            await updateEmail(user, profile.email);
            firestoreUpdates.email = profile.email;
        }
        
        if (Object.keys(firestoreUpdates).length > 0) {
            await updateDoc(userDocRef, firestoreUpdates);
        }

    } catch (error: any) {
        console.error("Error updating profile:", error);
        if (error.code === 'auth/requires-recent-login') {
            throw new Error("This action is sensitive and requires a recent login. Please log out and log back in to update your email.");
        }
        throw new Error("Failed to update profile.");
    }
};


// Update user's password
export const updateUserPassword = async (newPassword: string) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not found.");
    }
    try {
        await updatePassword(user, newPassword);
    } catch (error: any) {
        console.error("Error updating password:", error);
         if (error.code === 'auth/requires-recent-login') {
            throw new Error("This action is sensitive and requires a recent login. Please log out and log back in to change your password.");
        }
        throw new Error("Failed to update password.");
    }
};

// Delete user account
export const deleteUserAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not found.");
    }
    try {
        await deleteUser(user);
        // You might want to sign out here as well, although deleteUser should handle it
        await signOut(auth);
    } catch (error: any) {
        console.error("Error deleting user account:", error);
        if (error.code === 'auth/requires-recent-login') {
            throw new Error("This action is sensitive and requires a recent login. Please log out and log back in to delete your account.");
        }
        throw new Error("Failed to delete account.");
    }
};
