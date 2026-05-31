import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

const adapter = new PrismaLibSql({ url: `file:${path.join(process.cwd(), 'lastlight.db')}` });
export const prisma = new PrismaClient({ adapter });
