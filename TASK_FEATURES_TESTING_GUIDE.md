# 🧪 Complete Testing Guide for New Task Features

## ✅ What Was Fixed

1. **Dialog Structure**: Made dialog properly scrollable with fixed header/footer
2. **Dialog Size**: Increased to `max-w-4xl` (672px) to show all features
3. **Scrolling**: Content area is now scrollable while header/footer stay fixed
4. **Subtask Creation**: Fixed to properly pass `parentId` to API
5. **Comments**: Added comprehensive comments to all code files

## 📍 How to Access the Features

### Step-by-Step Instructions

1. **Navigate to a Project**
   - Click "Projects" in the sidebar
   - Click on any project card

2. **Open Task List**
   - In Project Dashboard, click the **"List"** tab
   - You'll see a table of tasks

3. **Open Task Details**
   - Find a task in the table
   - Click the **three dots (⋯)** in the rightmost column
   - Click **"View Details"** (eye icon)

4. **Scroll Down in Dialog**
   - The dialog now has a **scrollable content area**
   - Scroll down to see:
     - ✅ **Time Tracking Section** (with timer and time logs)
     - ✅ **Subtasks Section** (with progress and "Add Subtask" button)

## 🎯 Testing Time Tracking

### Test 1: Start Timer
1. Open task details
2. Scroll down to **"Time Tracking"** section
3. Click **"Start Timer"** button
4. **Expected**: 
   - Button changes to "Stop Timer"
   - Timer starts counting (updates every second)
   - Duration displays in large text (e.g., "0h 5m")

### Test 2: Stop Timer
1. While timer is running, click **"Stop Timer"**
2. **Expected**:
   - Timer stops
   - A time log entry appears in "Time Logs" section below
   - Task's actualHours updates automatically

### Test 3: Add Manual Time Entry
1. In "Time Logs" section, click **"Add Entry"**
2. Fill in:
   - Start Date & Time: `2025-01-15T10:00`
   - End Date & Time: `2025-01-15T12:00` (or leave empty for current time)
   - Description: "Worked on feature implementation"
3. Click **"Create"**
4. **Expected**:
   - New entry appears in time logs list
   - Shows duration (e.g., "2h 0m")
   - Shows date range and description

### Test 4: View Time Logs
- **Expected**: All entries show:
  - Duration (formatted as "Xh Ym")
  - Date/time range
  - Description
  - User name
  - Delete button (trash icon)

## 🎯 Testing Subtasks

### Test 1: Create a Subtask
1. Open task details
2. Scroll down to **"Subtasks"** section
3. Click **"Add Subtask"** button
4. Fill in the form:
   - Title: "Design mockups"
   - Description: "Create UI mockups for the feature"
   - Priority: "High"
   - Status: "To Do"
   - Estimated Hours: "4"
5. Click **"Create Task"**
6. **Expected**:
   - Dialog closes
   - Subtask appears in subtasks list
   - Progress indicator updates (e.g., "0/1", "0% complete")
   - Toast notification: "Subtask created successfully!"

### Test 2: View Subtasks
- **Expected**: Each subtask shows:
  - Status indicator (✓ for done, ⚠ for blocked, ○ for pending)
  - Title, status badge, priority badge
  - Description (if provided)
  - Assignees (if any)
  - Dependencies (if any)

### Test 3: Progress Indicator
- **Expected**:
  - Shows "X/Y" format (completed/total)
  - Shows percentage (e.g., "40% complete")
  - Updates automatically when subtask status changes

### Test 4: Multiple Subtasks
1. Create 3-4 subtasks
2. Mark 2 as "Done"
3. **Expected**:
   - Progress shows "2/4"
   - Percentage shows "50% complete"

## 🔍 Visual Indicators

### What You Should See

**In the Dialog:**
1. **Header** (fixed at top):
   - Task title with priority icon
   - "Task details and information" subtitle

2. **Scrollable Content** (middle section):
   - Basic task info (status, priority, assignee, dates, tags)
   - **Time Tracking Section** (with border-top separator):
     - Timer card with start/stop button
     - Time logs card with list of entries
   - **Subtasks Section** (with border-top separator):
     - Subtasks card with list and "Add Subtask" button
     - Progress indicator

3. **Footer** (fixed at bottom):
   - "Edit Task" button
   - "Close" button

## 🐛 Troubleshooting

### Issue: Can't see new sections
**Solution**:
- ✅ **Scroll down** in the dialog - the content area is scrollable
- ✅ Dialog is now **wider** (max-w-4xl) to show all features
- ✅ Make sure you're viewing a **task** (not just the list)

### Issue: "Add Subtask" doesn't create subtask
**Solution**:
- Check browser console (F12) for errors
- Verify backend is running: `npm run api:dev`
- Check network tab for API call to `/v1/tasks` with `parentId`

### Issue: Timer doesn't start
**Solution**:
- Check if you already have an active timer on another task
- Only **one timer** can be active per user at a time
- Check browser console for API errors

### Issue: Components don't load
**Solution**:
- Check browser console for import errors
- Verify all files exist:
  - `src/components/tasks/TaskTimer.tsx`
  - `src/components/tasks/TaskTimeLogs.tsx`
  - `src/components/tasks/TaskSubtasks.tsx`
- Restart dev server: `npm run dev`

## 📝 Quick Verification Checklist

- [ ] Dialog opens when clicking "View Details"
- [ ] Dialog is wider than before (should be ~672px)
- [ ] Can scroll down in dialog
- [ ] See "Time Tracking" section with timer card
- [ ] See "Time Logs" section below timer
- [ ] See "Subtasks" section with "Add Subtask" button
- [ ] "Start Timer" button works
- [ ] Timer displays running duration
- [ ] "Stop Timer" creates time log entry
- [ ] "Add Entry" opens manual time log form
- [ ] "Add Subtask" opens subtask creation form
- [ ] Created subtask appears in list
- [ ] Progress indicator shows correct count/percentage

## 🎉 Success!

You'll know everything is working when:
- ✅ Dialog scrolls smoothly showing all sections
- ✅ Timer starts/stops successfully
- ✅ Time logs appear and can be created/deleted
- ✅ Subtasks can be created and appear in list
- ✅ Progress indicator updates correctly
- ✅ No console errors

## 📚 Code Comments Added

All files now have comprehensive comments explaining:
- What each component does
- How features work
- What parameters are used for
- Implementation details

**Files with comments:**
- `src/components/tasks/TaskDetailsDialog.tsx`
- `src/components/tasks/TaskTimer.tsx`
- `src/components/tasks/TaskTimeLogs.tsx`
- `src/components/tasks/TaskSubtasks.tsx`
- `src/components/tasks/TaskForm.tsx`
- `src/hooks/useTimeLogs.ts`
- `src/services/time-logs.service.ts`
- `src/lib/domain-utils/task-utils.ts`

