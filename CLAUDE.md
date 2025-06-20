# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an experimental project demonstrating the Infinite Agentic Loop pattern using Claude Code's custom slash commands. The project orchestrates multiple AI agents in parallel to generate barchart race video renderings based on a specification-driven approach. The goal is to create unique, high-quality UI components iteratively, leveraging the power of AI to explore creative possibilities.
this app works with command line interface and inputs are datafile and configuration file. output will be a video file.
## Key Commands

### Running the Infinite Agentic Loop

```bash
claude
```

Then use the `/project:infinite` slash command with these variants:

```bash
# Single generation
/project:infinite specs/invent_new_ui_v3.md src 1

# Small batch (5 iterations)
/project:infinite specs/invent_new_ui_v3.md src_new 5

# Large batch (20 iterations)
/project:infinite specs/invent_new_ui_v3.md src_new 20

# Infinite mode (continuous generation)
/project:infinite specs/invent_new_ui_v3.md infinite_src_new/ infinite
```

## Architecture & Structure

### Command System
The project uses Claude Code's custom commands feature:
- `.claude/commands/infinite.md` - Main infinite loop orchestrator command
- `.claude/commands/prime.md` - Additional command (if present)
- `.claude/settings.json` - Permissions configuration allowing Write, MultiEdit, Edit, and Bash

### Specification-Driven Generation
- Specifications in `specs/` directory define what type of content to generate
- Current main spec: `specs/invent_new_ui_v3.md` - Themed Hybrid UI Component Specification
- Specs define naming patterns, content structure, design dimensions, and quality standards

### Multi-Agent Orchestration Pattern
The infinite command implements sophisticated parallel agent coordination:
1. **Specification Analysis** - Deeply understands the spec requirements
2. **Directory Reconnaissance** - Analyzes existing iterations to maintain uniqueness
3. **Parallel Sub-Agent Deployment** - Launches multiple agents with distinct creative directions
4. **Wave-Based Generation** - For infinite mode, manages successive agent waves
5. **Context Management** - Optimizes context usage across all agents

### Generated Content Organization
- `src/` - Primary output directory for generated UI components
- `src_infinite/` - Alternative output for infinite generation runs
- `legacy/` - Previous iteration attempts and experiments

### Key Implementation Details
- Sub-agents receive complete context including spec, existing iterations, and unique creative assignments
- Parallel execution managed through Task tool with batch sizes optimized by count
- Progressive sophistication strategy for infinite mode waves
- Each iteration must be genuinely unique while maintaining spec compliance

## Project Constraints and Notes

- I dont need templating feature right now. do not implement this feature until i explicitly to do so

## Tool Memories

### Remotion.js Interpolation Guide
- Official guide for `interpolate()` function in Remotion.js
- Allows mapping a range of values to another using concise syntax
- Key features:
  - Supports fade-in/out effects
  - Can interpolate over multiple points
  - Works with time-based and custom animations
  - Provides advanced options like `extrapolateLeft` and `extrapolateRight`
  - Supports custom easing functions
- Demonstrates usage with examples:
  - Basic opacity interpolation
  - Fade in and out effect
  - Spring animation interpolation
  - Controlling output range with extrapolation options
- Available as a 6-minute video tutorial
- Useful for creating dynamic animations in React-based video rendering