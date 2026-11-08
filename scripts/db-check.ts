import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
    const times: number[] = [];
    let failed = 0;
    for (let i = 0; i < 20; i++) {
        const start = Date.now();
        try {
            await prisma.user.count();
            times.push(Date.now() - start);
        } catch {
            failed++;
        }
    }
    times.sort((a, b) => a - b);
    console.log({ min: times[0], median: times[Math.floor(times.length / 2)], max: times[times.length - 1], failed });
}
main().finally(() => prisma.$disconnect());
