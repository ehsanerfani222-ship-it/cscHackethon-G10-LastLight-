import 'dotenv/config';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const client = createClient({ url: `file:${path.join(__dirname, '../lastlight.db')}` });
const adapter = new PrismaLibSql(client);

export const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
