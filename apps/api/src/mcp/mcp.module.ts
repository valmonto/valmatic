import { Module } from '@nestjs/common';
import { ApiKeyModule } from '../api-key/index.js';
import { OrgModule } from '../org/org.module.js';
import { McpController } from './mcp.controller.js';
import { McpServerFactory } from './mcp-server.factory.js';
import { McpTools } from './mcp-tools.js';

@Module({
  imports: [ApiKeyModule, OrgModule],
  controllers: [McpController],
  providers: [McpServerFactory, McpTools],
})
export class McpModule {}
