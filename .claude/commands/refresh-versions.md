Force refresh ALL framework and model versions in the project registry.

You should:

1. Execute `.claude/hooks/session-start-scan.sh` by calling it via Bash
2. Parse the output to show:
   - Number of frameworks updated
   - List of newly detected frameworks
   - Cache status
3. Read and display the updated `.claude/FRAMEWORK_VERSIONS.md`
4. Confirm that the registry has been updated with current timestamp
5. Remind that all agents and subagents will now use the updated information

This command bypasses the 24-hour cache and forces a fresh check of all framework versions from npm, PyPI, crates.io, and other registries.
