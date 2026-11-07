import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  username: string;
  profileImage: string | null;
  headerImage: string | null;
  bio: string | null;
  roles: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Synchronize or register user into Google Cloud SQL on sign-in
 */
export async function getOrCreateUser(
  uid: string,
  email: string,
  username?: string,
  profileImage?: string,
  accountType?: 'user' | 'project'
): Promise<DbUser> {
  const derivedUsername = username || email.split('@')[0] || `user_${uid.slice(0, 6)}`;
  const initialRoles = accountType === 'project'
    ? JSON.stringify(['USER', 'PROJECT_REPRESENTATIVE'])
    : JSON.stringify(['USER']);

  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        username: derivedUsername,
        profileImage: profileImage || null,
        headerImage: null,
        bio: accountType === 'project' ? 'Verified Project Representative' : 'Elysium Ecosystem Explorer',
        roles: initialRoles,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(profileImage ? { profileImage } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Cloud SQL getOrCreateUser failed:', error);
    // Fallback: attempt to retrieve existing record
    const existing = await getUserByUid(uid);
    if (existing) return existing;
    throw new Error('Database user synchronization failed.', { cause: error });
  }
}

export async function getUserByUid(uid: string): Promise<DbUser | null> {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Cloud SQL getUserByUid failed:', error);
    throw new Error('Failed to retrieve user from database.', { cause: error });
  }
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  try {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Cloud SQL getUserByEmail failed:', error);
    throw new Error('Failed to retrieve user by email.', { cause: error });
  }
}

/**
 * Update user profile (PFP, Header Image, Bio, Username)
 */
export async function updateUserProfile(
  uid: string,
  updates: {
    username?: string;
    bio?: string;
    profileImage?: string;
    headerImage?: string;
  }
): Promise<DbUser> {
  try {
    const setFields: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (updates.username !== undefined) setFields.username = updates.username;
    if (updates.bio !== undefined) setFields.bio = updates.bio;
    if (updates.profileImage !== undefined) setFields.profileImage = updates.profileImage;
    if (updates.headerImage !== undefined) setFields.headerImage = updates.headerImage;

    const result = await db
      .update(users)
      .set(setFields)
      .where(eq(users.uid, uid))
      .returning();

    if (!result[0]) {
      throw new Error(`User with uid ${uid} not found.`);
    }
    return result[0];
  } catch (error) {
    console.error('Cloud SQL updateUserProfile failed:', error);
    throw new Error('Failed to update user profile in Cloud SQL.', { cause: error });
  }
}

export async function getAllUsers(): Promise<DbUser[]> {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Cloud SQL getAllUsers failed:', error);
    throw new Error('Failed to query users from Cloud SQL.', { cause: error });
  }
}
