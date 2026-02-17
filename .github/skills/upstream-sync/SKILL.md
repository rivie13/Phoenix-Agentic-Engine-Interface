---
name: upstream-sync
description: Understand upstream Godot sync impact on the Interface SDK. Use when user asks about upstream sync, fork updates, or how Godot upstream changes affect the Interface contracts.
---

# Upstream Sync Awareness — Phoenix Agentic Engine Interface

## Context

This repo does NOT sync from upstream — it is an original project, not a fork.

However, upstream Godot syncs in the Engine repo can indirectly affect contract types:

| Engine change | Interface impact |
|--------------|-----------------|
| Godot scene/node API changes | May require new contract fields for Shadow Tree payloads |
| New tool types in Godot | May need new tool invoke contract schemas |
| Editor plugin changes | No direct impact |

## What to do after an Engine upstream sync

1. Check if Backend updated `contracts/fixtures/v1/` in response to the Engine sync
2. If so, update golden fixtures in `contracts/v1/` to match
3. Run `npm test` and `npm run typecheck` to verify compatibility
