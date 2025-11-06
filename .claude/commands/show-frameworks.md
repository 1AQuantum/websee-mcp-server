Display the current framework registry for this project.

You should:

1. Read `.claude/FRAMEWORK_VERSIONS.md` and display it to the user
2. Additionally read `.claude/framework-versions.json` and show:
   - Total number of frameworks tracked
   - Last updated timestamp
   - How old the cache is (in hours)
3. Identify frameworks that might need updates:
   - Check `last_checked` timestamp for each framework
   - Flag any that are older than 7 days
4. Offer to refresh if:
   - Cache is older than 24 hours
   - Any framework hasn't been checked in over 7 days
   - User explicitly asks

Provide a summary table showing:
- Framework name
- Current version
- Documentation URL
- Last checked (relative time like "2 hours ago")

This gives users visibility into what framework versions the project is using without triggering an expensive refresh operation.
