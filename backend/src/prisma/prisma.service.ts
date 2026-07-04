import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Database connected");
    } catch (err) {
      this.logger.error(
        "❌  Cannot connect to PostgreSQL. " +
          "Make sure the database is running and DATABASE_URL in backend/.env is correct.\n" +
          "  Quick options:\n" +
          "    1. Docker (recommended):  docker compose up -d\n" +
          "    2. Install locally:       https://www.postgresql.org/download/\n" +
          "    3. Free cloud DB:         https://neon.tech  or  https://supabase.com\n" +
          `  Original error: ${(err as Error).message}`
      );
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

