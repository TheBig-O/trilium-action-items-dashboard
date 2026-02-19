## 📋 Changelog

### v1.2 (February 2026)
**Implementation Fix:**
- Changed the part of the script that looks for the `#template` attribute to `#tmpl` since `#template` creates templates in new note options.

### v1.1 (February 2026)
**Bug Fixes:**
- Fixed OR logic in `#additionalCriteria` - now automatically wraps OR statements in parentheses
- Fixed refresh button not responding to clicks - improved event handler reliability
- Added debug logging for search queries (visible in browser console)

**Examples of fixed functionality:**
```
#additionalCriteria=#host *=* 'Ops Center' OR note.title *=* huddle
#additionalCriteria=#priority=high OR #priority=urgent
```

### v1.0 (Initial Release)
- Basic action items tracking
- Template-based filtering
- Checkbox completion
- Additional criteria support
