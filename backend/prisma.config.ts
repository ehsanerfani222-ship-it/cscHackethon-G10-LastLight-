import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: `file:${path.join(__dirname, 'lastlight.db')}`,
  },
  migrate: {
    async adapter() {
      const client = createClient({ url: `file:${path.join(__dirname, 'lastlight.db')}` });
      return new PrismaLibSql(client);
    },
  },
});
