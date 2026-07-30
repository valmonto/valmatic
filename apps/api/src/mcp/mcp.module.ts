import { Module } from '@nestjs/common';
import { ApiKeyModule } from '../api-key';
import { OrgModule } from '../org/org.module';
import { McpController } from './mcp.controller';
import { McpServerFactory } from './mcp-server.factory';
import { McpTools } from './mcp-tools';

@Module({
  imports: [ApiKeyModule, OrgModule],
  controllers: [McpController],
  providers: [McpServerFactory, McpTools],
})
export class McpModule {}
