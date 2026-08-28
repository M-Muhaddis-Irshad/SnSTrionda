"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const client_1 = require("./generated/prisma/client");
const adapter_neon_1 = require("@prisma/adapter-neon");
// Create the Neon adapter with the pooled connection string
const adapter = new adapter_neon_1.PrismaNeon({
    connectionString: process.env.DATABASE_URL,
});
// Instantiate Prisma Client with the Neon adapter
exports.prisma = new client_1.PrismaClient({ adapter });
//# sourceMappingURL=db.js.map