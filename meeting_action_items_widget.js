/**
 * Trilium Frontend Script: Meeting Action Items Dashboard
 * 
 * This script creates an interactive accordion-style dashboard showing all unchecked 
 * action items from notes using a configurable template.
 * 
 * ============================================================================
 * FEATURES
 * ============================================================================
 * ✓ Expandable/collapsible accordion grouped by meeting note
 * ✓ Displays meeting date from #startDate label (falls back to dateModified)
 * ✓ Click checkboxes to mark items complete (updates the source note)
 * ✓ Click note titles to navigate (full Trilium context menu support)
 * ✓ Refresh buttons (top and bottom) to reload the list
 * ✓ Configurable via dashboard note labels
 * ✓ Multiple dashboards supported with different filters
 * ✓ Smart animations and visual feedback
 * 
 * ============================================================================
 * SETUP INSTRUCTIONS
 * ============================================================================
 * 
 * STEP 1: Create the Script Note
 * -------------------------------
 * 1. Create a new note called "Action Items Script"
 * 2. Set type to: JS frontend
 * 3. Paste this entire script into that note
 * 4. Do NOT add any labels to this note (specifically NO #run=frontendStartup)
 * 5. Save and note the noteId (right-click → Note Info → copy Note ID)
 * 
 * STEP 2: Create Dashboard Note(s)
 * ---------------------------------
 * 1. Create a new note with any name (e.g., "2025 Action Items")
 * 2. Set type to: Text (or leave as default)
 * 3. Add a RELATION (not label): ~renderNote=<noteId from Step 1>
 * 4. Optionally add configuration LABELS (see examples below)
 * 5. Open the dashboard note to see the widget!
 * 
 * ============================================================================
 * CONFIGURATION (Optional Dashboard Labels)
 * ============================================================================
 * 
 * Add these labels to your dashboard note to customize what's displayed:
 * 
 * #template=<template_name>
 *   - Specifies which template to search for
 *   - Default: _meetingTemplate
 *   - Example: #template=_projectTemplate
 * 
 * #additionalCriteria=<search_query>
 *   - Additional Trilium search criteria to filter results
 *   - Default: (none - shows all notes with the template)
 *   - Note: Trilium automatically adds quotes around multi-word values
 * 
 * ============================================================================
 * CONFIGURATION EXAMPLES
 * ============================================================================
 * 
 * Example 1: All Meeting Action Items (default)
 * ----------------------------------------------
 * ~renderNote=<script_noteId>
 * (no additional labels needed)
 * 
 * Example 2: Only 2025 Meetings
 * ------------------------------
 * ~renderNote=<script_noteId>
 * #template=_meetingTemplate
 * #additionalCriteria=note.dateCreated >= '2025' and note.dateCreated < '2026'
 * 
 * Example 3: Only 2026 Meetings
 * ------------------------------
 * ~renderNote=<script_noteId>
 * #template=_meetingTemplate
 * #additionalCriteria=#year=2026
 * 
 * Example 4: High Priority Items
 * -------------------------------
 * ~renderNote=<script_noteId>
 * #template=_meetingTemplate
 * #additionalCriteria=#priority=high
 * 
 * Example 5: Important Items from Last 30 Days
 * ---------------------------------------------
 * ~renderNote=<script_noteId>
 * #template=_meetingTemplate
 * #additionalCriteria=#important and note.dateCreated >= MONTH-1
 * 
 * Example 6: Project Template with Specific Category
 * ---------------------------------------------------
 * ~renderNote=<script_noteId>
 * #template=_projectTemplate
 * #additionalCriteria=#category=Development
 * 
 * Example 7: Multiple Conditions
 * -------------------------------
 * ~renderNote=<script_noteId>
 * #template=_meetingTemplate
 * #additionalCriteria=#year=2025 and #priority=high and #!archived
 * 
 * ============================================================================
 * MULTIPLE DASHBOARDS
 * ============================================================================
 * 
 * You can create multiple dashboard notes, each pointing to the same script
 * but with different configuration labels. For example:
 * 
 * Dashboard: "2025 Meetings"
 *   ~renderNote=<script_noteId>
 *   #additionalCriteria=note.dateCreated >= '2025' and note.dateCreated < '2026'
 * 
 * Dashboard: "2026 Meetings"
 *   ~renderNote=<script_noteId>
 *   #additionalCriteria=note.dateCreated >= '2026'
 * 
 * Dashboard: "All Meetings"
 *   ~renderNote=<script_noteId>
 *   (no filter - shows everything)
 * 
 * Each dashboard will independently read its own configuration labels!
 * 
 * ============================================================================
 * TROUBLESHOOTING
 * ============================================================================
 * 
 * Widget not displaying?
 * - Make sure you're using a RELATION ~renderNote, not a label #renderNote
 * - Make sure the script note has NO #run=frontendStartup label
 * - Check browser console (F12) for error messages
 * 
 * Wrong items showing?
 * - Check console for "Final search query" to see what's being searched
 * - Verify your notes have the correct ~template relation
 * - Verify your #additionalCriteria syntax is correct
 * 
 * Items not updating when checked?
 * - Make sure checkboxes in your notes are in the standard Trilium format
 * - Check that notes aren't read-only
 * 
 * Enable Debug Logging:
 * - To see detailed debug information in the console, uncomment these lines:
 *   Lines 171-172, 183-185, 190, 193-200, 202, 205, 213, 225-227, 316-319, 500
 * - Open browser console (F12) to view debug output
 * 
 * ============================================================================
 */

function getConfig() {
    // Read config from the dashboard note's labels each time this is called
    // This ensures fresh config on every render/refresh
    const dashboardNote = api.originEntity;
    
    const config = {
        // The title of the template note to search for
        // Dashboard can override with: #template=_yourTemplate
        templateTitle: dashboardNote?.getLabelValue('template') || "_meetingTemplate",
        
        // Additional search criteria (optional)
        // Dashboard can override with: #additionalCriteria=your criteria
        // Examples:
        //   #additionalCriteria=#year=2026
        //   #additionalCriteria=#priority=high
        //   #additionalCriteria=#important and note.dateCreated >= '2026-01-01'
        // 
        // Note: Trilium automatically adds quotes around multi-word values, so we strip them
        additionalCriteria: (() => {
            let criteria = dashboardNote?.getLabelValue('additionalCriteria') || "";
            // Strip surrounding quotes that Trilium adds (e.g., "#year=2026" becomes #year=2026)
            if (criteria.startsWith('"') && criteria.endsWith('"')) {
                criteria = criteria.slice(1, -1);
            }
            return criteria;
        })()
    };
    
    // Log the configuration being used
    // console.log('Action Items Widget Configuration:', config);
    // console.log('Reading from dashboard note:', dashboardNote ? dashboardNote.title : 'N/A (using defaults)');
    
    return config;
}

async function loadActionItems() {
    // Get fresh config each time
    const CONFIG = getConfig();
    // Build the search query using configuration
    let searchQuery = `#!notToDo and ~template.title="${CONFIG.templateTitle}" and note.title != "${CONFIG.templateTitle}"`;
    
    // console.log('additionalCriteria value:', CONFIG.additionalCriteria);
    // console.log('additionalCriteria type:', typeof CONFIG.additionalCriteria);
    // console.log('additionalCriteria length:', CONFIG.additionalCriteria ? CONFIG.additionalCriteria.length : 0);
    
    // Add additional criteria if specified
    if (CONFIG.additionalCriteria && CONFIG.additionalCriteria.trim() !== "") {
        // Check if the criteria contains OR - if so, wrap in parentheses
        const criteriaToAdd = CONFIG.additionalCriteria.toUpperCase().includes(' OR ') 
            ? `(${CONFIG.additionalCriteria})`
            : CONFIG.additionalCriteria;
        
        searchQuery += ` and ${criteriaToAdd}`;
        // console.log('Added additional criteria to query');
        
        // DEBUG: Test the additional criteria alone
        // try {
        //     const testNotes = await api.searchForNotes(CONFIG.additionalCriteria);
        //     console.log(`DEBUG: Notes matching ONLY the additional criteria: ${testNotes.length}`);
        //     if (testNotes.length > 0) {
        //         console.log(`Sample note: ${testNotes[0].title}`);
        //     }
        // } catch (e) {
        //     console.error('ERROR: Additional criteria search failed:', e.message);
        // }
    } else {
        // console.log('No additional criteria to add (empty or null)');
    }
    
    console.log(`Final search query: ${searchQuery}`);
    
    // Search for all notes using the template with unchecked checkboxes
    const notes = await api.searchForNotes(searchQuery);
    
    const actionItems = [];
    
    // console.log(`Found ${notes.length} meeting notes to process`);
    
    for (const note of notes) {
        const noteDetails = await api.getNote(note.noteId);
        const content = await noteDetails.getContent();
        
        // Get the meeting date from #startDate label
        const startDateLabel = noteDetails.getLabelValue('startDate');
        const meetingDate = startDateLabel || noteDetails.dateModified;
        
        // Debug: Log the first few to see what we're getting
        // if (actionItems.length < 5) {
        //     console.log(`Note: ${noteDetails.title}, startDate: ${startDateLabel}, using: ${meetingDate}`);
        // }
        
        // Parse HTML to find unchecked checkboxes with non-empty content
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // Find all checkbox inputs that are not checked (including disabled ones)
        const allCheckboxes = doc.querySelectorAll('input[type="checkbox"]');
        const checkboxes = Array.from(allCheckboxes).filter(cb => !cb.hasAttribute('checked'));
        
        checkboxes.forEach((checkbox, index) => {
            // Get the text content after the checkbox
            let textContent = '';
            
            // Check if this is in a todo-list structure
            const listItem = checkbox.closest('li[data-list-item-id]');
            if (listItem) {
                // Extract from todo-list structure
                const labelDesc = listItem.querySelector('.todo-list__label__description');
                if (labelDesc) {
                    textContent = labelDesc.textContent.trim();
                }
            }
            
            // Fallback to original method if not found
            if (!textContent) {
                let nextNode = checkbox.nextSibling;
                let parent = checkbox.parentElement;
                
                // Try to get text from parent element first
                if (parent) {
                    textContent = parent.textContent.trim();
                }
                
                // If parent doesn't have good text, traverse siblings
                if (!textContent || textContent === '') {
                    while (nextNode) {
                        if (nextNode.nodeType === Node.TEXT_NODE) {
                            textContent += nextNode.textContent;
                        } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
                            textContent += nextNode.textContent;
                        }
                        nextNode = nextNode.nextSibling;
                    }
                }
            }
            
            textContent = textContent.trim();
            
            // Filter out empty content (just whitespace or &nbsp;)
            const isEmpty = !textContent || 
                           textContent === '' || 
                           textContent.replace(/\u00a0/g, '').trim() === '' ||
                           textContent === '☐';
            
            if (!isEmpty) {
                // Clean up the text (remove checkbox symbols)
                textContent = textContent.replace(/^☐\s*/, '').replace(/^\[\s*\]\s*/, '').trim();
                
                actionItems.push({
                    noteId: note.noteId,
                    noteTitle: noteDetails.title,
                    dateCreated: noteDetails.dateCreated,
                    meetingDate: meetingDate,
                    dateModified: noteDetails.dateModified,
                    itemText: textContent,
                    checkboxIndex: index
                });
            }
        });
    }
    
    return actionItems;
}

async function renderWidget() {
    const actionItems = await loadActionItems();
    const CONFIG = getConfig(); // Get fresh config for display
    
    // Sort by meeting date (most recent first)
    // Handle cases where meetingDate might be invalid
    actionItems.sort((a, b) => {
        const dateA = new Date(a.meetingDate);
        const dateB = new Date(b.meetingDate);
        
        // Handle invalid dates by putting them at the end
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB - dateA; // Most recent first
    });
    
    // Debug: Show the sorted order
    // console.log('\nSorted action items (first 10):');
    // actionItems.slice(0, 10).forEach((item, idx) => {
    //     console.log(`${idx + 1}. ${item.noteTitle} - ${item.meetingDate} (${formatDate(item.meetingDate)})`);
    // });
    
    // Group items by note
    const groupedItems = {};
    actionItems.forEach(item => {
        if (!groupedItems[item.noteId]) {
            groupedItems[item.noteId] = {
                noteId: item.noteId,
                noteTitle: item.noteTitle,
                meetingDate: item.meetingDate,
                items: []
            };
        }
        groupedItems[item.noteId].items.push(item);
    });
    
    // Convert to array and maintain sort order
    const groupedArray = Object.values(groupedItems);
    
    // Create the widget HTML
    const html = `
        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 10px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #2c3e50;">
                    📋 Meeting Action Items
                    <span style="font-size: 14px; color: #7f8c8d; font-weight: normal;">
                        (${actionItems.length} unchecked item${actionItems.length !== 1 ? 's' : ''} from ${groupedArray.length} meeting${groupedArray.length !== 1 ? 's' : ''})
                    </span>
                </h3>
                <button class="refreshActionItems" style="
                    padding: 6px 14px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
                    transition: all 0.2s;
                "
                onmouseover="this.style.background='#2980b9'; this.style.transform='translateY(-1px)';"
                onmouseout="this.style.background='#3498db'; this.style.transform='translateY(0)';">
                    🔄 Refresh
                </button>
            </div>
            
            ${actionItems.length === 0 ? 
                `<div style="padding: 30px; text-align: center; background: white; border-radius: 6px;">
                    <p style="color: #27ae60; font-size: 18px; margin: 0;">🎉 All action items completed!</p>
                    ${CONFIG.additionalCriteria ? 
                        `<p style="color: #7f8c8d; font-size: 14px; margin-top: 10px;">
                            No items found matching: <code style="background: #ecf0f1; padding: 2px 6px; border-radius: 3px;">${CONFIG.additionalCriteria}</code>
                        </p>` 
                        : ''}
                </div>` :
                `<div class="action-items-accordion">
                    ${groupedArray.map(group => `
                        <div class="accordion-group" data-note-id="${group.noteId}" style="
                            background: white;
                            border-radius: 6px;
                            margin-bottom: 8px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        ">
                            <div class="accordion-header" style="
                                padding: 12px 15px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                border-bottom: 1px solid #ecf0f1;
                                background: #f8f9fa;
                                border-radius: 6px 6px 0 0;
                            ">
                                <div style="display: flex; align-items: center; flex: 1;">
                                    <span class="accordion-toggle" style="
                                        font-size: 18px;
                                        margin-right: 10px;
                                        transition: transform 0.2s;
                                        user-select: none;
                                    ">▼</span>
                                    <a href="#root/${group.noteId}" 
                                       class="note-link" 
                                       data-note-id="${group.noteId}"
                                       style="
                                           color: #2c3e50;
                                           text-decoration: none;
                                           font-weight: 600;
                                           flex: 1;
                                       ">
                                        ${group.noteTitle}
                                    </a>
                                    <span style="
                                        background: #3498db;
                                        color: white;
                                        padding: 2px 8px;
                                        border-radius: 12px;
                                        font-size: 12px;
                                        font-weight: 600;
                                        margin: 0 10px;
                                    ">${group.items.length}</span>
                                    <span style="
                                        color: #7f8c8d;
                                        font-size: 13px;
                                        font-weight: normal;
                                    ">${formatDate(group.meetingDate)}</span>
                                </div>
                            </div>
                            <div class="accordion-content" style="
                                max-height: 1000px;
                                overflow: hidden;
                                transition: max-height 0.3s ease-out;
                            ">
                                ${group.items.map(item => `
                                    <div class="action-item-row" 
                                         data-note-id="${item.noteId}" 
                                         data-checkbox-index="${item.checkboxIndex}"
                                         style="
                                             padding: 10px 15px 10px 45px;
                                             border-bottom: 1px solid #f0f0f0;
                                             display: flex;
                                             align-items: center;
                                             transition: background 0.2s;
                                         "
                                         onmouseover="this.style.background='#f8f9fa'"
                                         onmouseout="this.style.background='white'">
                                        <input type="checkbox" 
                                               class="action-item-checkbox" 
                                               data-note-id="${item.noteId}"
                                               data-checkbox-index="${item.checkboxIndex}"
                                               style="
                                                   cursor: pointer;
                                                   width: 18px;
                                                   height: 18px;
                                                   margin-right: 12px;
                                                   flex-shrink: 0;
                                               ">
                                        <span style="flex: 1; line-height: 1.5;">
                                            ${item.itemText}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>`
            }
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #7f8c8d; font-size: 13px;">
                    Click meeting titles to open notes
                </span>
                <button id="refreshActionItems" style="
                    padding: 10px 20px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
                    transition: all 0.2s;
                "
                onmouseover="this.style.background='#2980b9'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(52, 152, 219, 0.4)';"
                onmouseout="this.style.background='#3498db'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(52, 152, 219, 0.3)';">
                    🔄 Refresh
                </button>
            </div>
        </div>
    `;
    
    // Check if container exists (it won't exist when run as frontendStartup)
    if (api.$container && api.$container.html) {
        api.$container.html(html);
        // Add event listeners
        attachEventListeners();
    } else {
        // Uncomment for debugging: console.log('Action Items Widget: Container not available. Use #renderNote to display this widget.');
    }
}

function formatDate(dateString) {
    // Handle both "YYYY-MM-DD" format and full ISO timestamps
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks}w ago`;
    }
    
    // For older dates, show the actual date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function attachEventListeners() {
    // Handle accordion toggle
    api.$container.find('.accordion-header').on('click', function(e) {
        // Don't toggle if clicking on the note link
        if ($(e.target).hasClass('note-link') || $(e.target).closest('.note-link').length) {
            return;
        }
        
        const $group = $(this).closest('.accordion-group');
        const $content = $group.find('.accordion-content');
        const $toggle = $group.find('.accordion-toggle');
        
        const isOpen = $content.css('max-height') !== '0px';
        
        if (isOpen) {
            // Collapse
            $content.css('max-height', '0px');
            $toggle.css('transform', 'rotate(-90deg)');
        } else {
            // Expand
            $content.css('max-height', '1000px');
            $toggle.css('transform', 'rotate(0deg)');
        }
    });
    
    // Handle note link clicks - let Trilium's native link handling work
    api.$container.find('.note-link').on('click', function(e) {
        e.stopPropagation(); // Just prevent accordion toggle, let link work naturally
    });
    
    // Handle checkbox clicks (mark as complete)
    api.$container.find('.action-item-checkbox').on('change', async function() {
        const noteId = $(this).data('note-id');
        const checkboxIndex = $(this).data('checkbox-index');
        const isChecked = $(this).is(':checked');
        
        if (isChecked) {
            await markItemAsComplete(noteId, checkboxIndex);
            
            const $itemRow = $(this).closest('.action-item-row');
            const $group = $(this).closest('.accordion-group');
            
            // Remove the row with animation
            $itemRow.fadeOut(300, function() {
                $itemRow.remove();
                
                // Check if this was the last item in the group
                const remainingItems = $group.find('.action-item-row').length;
                
                if (remainingItems === 0) {
                    // Remove the entire group
                    $group.fadeOut(300, function() {
                        $group.remove();
                        updateItemCount();
                    });
                } else {
                    // Update the count badge
                    $group.find('.accordion-header span[style*="background: #3498db"]').text(remainingItems);
                    updateItemCount();
                }
            });
        }
    });
    
    // Handle refresh button (both top and bottom) - use delegation for better reliability
    api.$container.off('click', '.refreshActionItems, #refreshActionItems');
    api.$container.on('click', '.refreshActionItems, #refreshActionItems', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Refresh button clicked!');
        renderWidget();
    });
}

async function markItemAsComplete(noteId, checkboxIndex) {
    try {
        const note = await api.getNote(noteId);
        let content = await note.getContent();
        
        // Parse the HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // Find all unchecked checkboxes (including disabled ones)
        const allCheckboxes = doc.querySelectorAll('input[type="checkbox"]');
        const checkboxes = Array.from(allCheckboxes).filter(cb => !cb.hasAttribute('checked'));
        
        if (checkboxes[checkboxIndex]) {
            // Mark the checkbox as checked
            checkboxes[checkboxIndex].setAttribute('checked', 'checked');
            
            // Serialize back to HTML
            const serializer = new XMLSerializer();
            const updatedContent = serializer.serializeToString(doc.body);
            
            // Remove the outer <body> tags that get added
            const cleanContent = updatedContent.replace(/^<body[^>]*>/, '').replace(/<\/body>$/, '');
            
            // Update the note
            await api.runOnBackend((noteId, newContent) => {
                const note = api.getNote(noteId);
                note.setContent(newContent);
            }, [noteId, cleanContent]);
            
            api.showMessage('Action item marked as complete! ✓');
        }
    } catch (error) {
        console.error('Error marking item as complete:', error);
        api.showError('Failed to update the note. Please try again.');
    }
}

function updateItemCount() {
    const remainingItems = api.$container.find('.action-item-row').length;
    const remainingMeetings = api.$container.find('.accordion-group').length;
    
    api.$container.find('h3 span').text(
        `(${remainingItems} unchecked item${remainingItems !== 1 ? 's' : ''} from ${remainingMeetings} meeting${remainingMeetings !== 1 ? 's' : ''})`
    );
    
    // If no items left, show completion message
    if (remainingItems === 0) {
        api.$container.find('.action-items-accordion').replaceWith(
            '<p style="color: #27ae60; font-style: italic;">🎉 All action items completed!</p>'
        );
    }
}

// Initialize and render the widget
renderWidget();
