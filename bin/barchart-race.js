#!/usr/bin/env node

// CLI entry point for the unified CLI
require('tsx/cli').run(['../src/unified-cli.ts'], {
  NODE_ENV: process.env.NODE_ENV || 'production'
});