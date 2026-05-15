import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const absoluteUrl = dbUrl.startsWith("file:/")
    ? dbUrl
    : `file:${path.resolve(process.cwd(), dbUrl.replace("file:", ""))}`;
  const adapter = new PrismaBetterSqlite3({ url: absoluteUrl });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
