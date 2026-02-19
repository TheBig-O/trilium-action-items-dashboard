# Trilium Action Items Dashboard

An interactive, accordion-style dashboard for [Trilium Notes](https://github.com/TriliumNext/Trilium) that aggregates and manages unchecked action items (check boxes) across your meeting notes (or any templated notes).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Trilium](https://img.shields.io/badge/Trilium-0.58+-green.svg)

## ✨ Features

- 📋 **Accordion View** - Groups action items by meeting note with expandable/collapsible sections
- 📅 **Smart Date Display** - Shows meeting dates with relative formatting (Today, Yesterday, 3d ago, etc.)
- ✅ **Interactive Checkboxes** - Check off items directly in the dashboard; updates source notes automatically
- 🔗 **Native Trilium Links** - Full context menu support (open in new tab, split, window, quick edit)
- 🔄 **Dual Refresh Buttons** - Positioned at top and bottom for easy access
- ⚙️ **Highly Configurable** - Filter by template, date range, labels, or any Trilium search criteria
- 🎯 **Multiple Dashboards** - One script supports unlimited dashboards with different filters
- 🎨 **Beautiful UI** - Clean, modern interface with smooth animations

## 📸 Screenshot

```
📋 Meeting Action Items (15 unchecked items from 8 meetings)         🔄 Refresh

▼ Ops Center Meeting (6)                                        Feb 10
  ☐ Follow up with Paula on data integration
  ☐ Send quarterly report to Michael
  ☐ Schedule API requirements meeting
  ☐ Review data sharing agreement
  ☐ Update project timeline
  ☐ Prepare budget presentation

▼ Team Huddle (3)                                              Feb 9
  ☐ Test new search functionality
  ☐ Deploy staging environment
  ☐ Document API endpoints

▶ Engineering Staff Meeting (2)                                 Feb 6
```

## 🎯 Use Cases

### 1. **Personal Task Management**
Keep track of action items from all your meeting notes in one centralized dashboard. Never lose track of commitments made during meetings.

### 2. **Project Management**
Create separate dashboards for different projects, teams, or time periods:
- "Q1 2025 Action Items"
- "Engineering Team Tasks"
- "High Priority Items"

### 3. **Meeting Follow-ups**
Quickly review what needs to be done from recent meetings without opening each note individually.

### 4. **Time-based Reviews**
Filter by date ranges to see:
- What's outstanding from this year
- What's left from last quarter
- Items from the past 30 days

## 📦 Installation

### Step 1: Create the Script Note

1. In Trilium, create a new note (any location)
2. Name it: `Action Items Script`
3. Set note type to: **JS frontend**
4. Paste the [complete script code](#script-code) into the note
5. **Important:** Do NOT add any labels (specifically no `#run=frontendStartup`)
6. Save the note and copy its Note ID:
   - Right-click the note → "Note Info" → Copy the Note ID

### Step 2: Create a Dashboard Note

1. Create a new note where you want your dashboard
2. Name it something like: `Action Items Dashboard`
3. Add a **relation** (not a label):
   ```
   ~renderNote=<paste the script noteId or title here>
   ```
4. Optionally add configuration labels (see [Configuration](#configuration))
5. Open the dashboard note to see your action items!

## ⚙️ Configuration

Configure your dashboard by adding **labels** to the dashboard note (not the script note):

### Basic Configuration

```
~renderNote=<script_noteId>
```

That's it! This will show all action items from notes using the `_meetingTemplate` template.

### Advanced Configuration

Add these optional labels to customize:

#### `#tmpl=<template_name>`
Specifies which template to search for.
- Default: `_meetingTemplate`
- Example: `#tmpl=_projectTemplate`

#### `#additionalCriteria=<search_query>`
Additional Trilium search criteria to filter results.
- Uses standard Trilium search syntax
- Trilium automatically adds quotes around multi-word values

## 📚 Configuration Examples

### Example 1: All Meeting Action Items (Default)
```
~renderNote=<script_noteId>
```
Shows all unchecked items from notes using `_meetingTemplate`.

### Example 2: Only 2025 Meetings
```
~renderNote=<script_noteId>
#tmpl=_meetingTemplate
#additionalCriteria=note.dateCreated >= '2025' and note.dateCreated < '2026'
```

### Example 3: Current Year Only
```
~renderNote=<script_noteId>
#additionalCriteria=note.dateCreated=2026
```

### Example 4: High Priority Items
```
~renderNote=<script_noteId>
#additionalCriteria="#priority=high"
```

### Example 5: Important Items from Last 30 Days
```
~renderNote=<script_noteId>
#additionalCriteria="#important and note.dateCreated >= MONTH-1"
```

### Example 6: Project Notes with Specific Category
```
~renderNote=<script_noteId>
#tmpl=_projectTemplate
#additionalCriteria="#category=Development"
```

### Example 7: Multiple Conditions
```
~renderNote=<script_noteId>
#additionalCriteria="#year=2025 and #priority=high and #!archived"
```

## 🎭 Multiple Dashboards

Create multiple dashboards using the same script with different filters:

**Dashboard 1: "2025 Meetings"**
```
~renderNote=<script_noteId>
#additionalCriteria="note.dateCreated >= '2025' and note.dateCreated < '2026'"
```

**Dashboard 2: "2026 Meetings"**
```
~renderNote=<script_noteId>
#additionalCriteria="note.dateCreated >= '2026'"
```

**Dashboard 3: "All Meetings"**
```
~renderNote=<script_noteId>
```

Each dashboard reads its own configuration independently!

## 📋 Changelog
 - See the [CHANGELOG](CHANGELOG.md) file in this repository

## 🔧 Troubleshooting

### Widget not displaying?
- Make sure you're using a **RELATION** `~renderNote`, not a label `#renderNote`
- Verify the script note has **NO** `#run=frontendStartup` label
- Check browser console (F12) for error messages

### Wrong items showing?
- Check console for "Final search query" to see what's being searched
- Verify your notes have the correct `~template` relation
- Verify your `#additionalCriteria` syntax matches Trilium search syntax

### Items not updating when checked?
- Ensure checkboxes in your notes use standard Trilium format
- Check that notes aren't read-only
- Verify you have permission to edit the source notes

### Enable Debug Logging
To see detailed debug information:
1. Open the script note
2. Uncomment lines: 171-172, 183-185, 190, 193-200, 202, 205, 213, 225-227, 316-319, 500
3. Open browser console (F12) to view debug output

## 📋 Requirements

- **Trilium Notes**: v0.58 or higher (tested on v0.101.3)
- **Note Structure**: Your meeting/project notes should:
  - Use a template (default: `_meetingTemplate`)
  - Have a `~template` relation to your template note
  - Contain checkboxes for action items
  - Optionally have a `#startDate` label for meeting dates

## 🎨 Customization

The script uses inline styles for easy customization. Key style sections:

- **Accordion headers** (line ~260): Change colors, fonts, spacing
- **Action items** (line ~440): Modify checkbox appearance, text styles
- **Date formatting** (line ~504): Customize relative date display
- **Buttons** (line ~347, ~474): Adjust button styles and hover effects

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs by opening an issue
- Suggest new features
- Submit pull requests with improvements
- Share your customizations

## 📄 License

MIT License - feel free to use, modify, and distribute as needed.

## 🙏 Acknowledgments

- Built for the [Trilium Notes](https://github.com/TriliumNext/Trilium) community
- Inspired by the need for better task aggregation across meeting notes
- Thanks to all who provided feedback during development

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/TheBig-O/trilium-action-items-dashboard/issues)
- **Discussions**: [Trilium Discussion Forum](https://github.com/TriliumNext/Trilium/discussions)
- **Documentation**: [Trilium Documentation](https://docs.triliumnotes.org/)

---

## Script Code

Save this as a JS frontend note in Trilium:

```javascript
[See meeting_action_items_widget.js file in this repository]
```

---

**Made for personal use and shared to the Trilium community**
