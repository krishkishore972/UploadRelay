import net from "node:net";
import { PrismaClient, Prisma } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Node's Happy Eyeballs ("autoSelectFamily") gives each resolved address only
// ~250ms to connect. Against high-latency hosts that also publish unreachable
// IPv6 records (e.g. Neon from some networks), every attempt expires before the
// TCP handshake completes and the driver reports ETIMEDOUT even though plain
// IPv4 connects fine. Allow more time per address before giving up.
if (typeof net.setDefaultAutoSelectFamilyAttemptTimeout === "function") {
  net.setDefaultAutoSelectFamilyAttemptTimeout(2_500);
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });
export { Prisma, prisma };
