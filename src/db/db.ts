import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// local.db file at the root of the workspace
const dbPath = path.resolve(process.cwd(), 'local.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });
export type DatabaseType = typeof db;
