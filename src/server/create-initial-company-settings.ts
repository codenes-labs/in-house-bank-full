import type { NeonQueryFunction } from '@neondatabase/serverless';
import { createEmptySettings } from '../domain/models/settings';
import { saveSettings } from './user-backup';

type Sql = NeonQueryFunction<false, false>;

export async function createInitialCompanySettings(
  sql: Sql,
  userId: string,
  companyName: string,
  city: string,
): Promise<void> {
  const settings = createEmptySettings();
  settings.businessName = companyName;
  settings.city = city;
  await saveSettings(sql, userId, settings);
}