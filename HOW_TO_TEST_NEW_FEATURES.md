# 🧪 How to Test the New Task Management Features

## Overview
This guide explains how to access and test the new time tracking and subtasks features that were recently implemented.

## ✅ Features Available

1. **Time Tracking**
   - Start/Stop Timer
   - View Time Logs
   - Add Manual Time Entries
   - Total Hours Display

2. **Subtasks**
   - Create Subtasks
   - View Subtasks List
   - Progress Indicator
   - Subtask Status Tracking

## 📍 Where to Find These Features

### Step 1: Navigate to a Project
1. Go to **Projects** page (click "Projects" in sidebar)
2. Click on any project card to open it
3. You'll see the Project Dashboard

### Step 2: Open Task List
1. In the Project Dashboard, click the **"List"** tab
2. You'll see a table of tasks for that project

### Step 3: Open Task Details
1. Find a task in the table
2. Click the **three dots (⋯)** menu button in the rightmost column
3. Click **"View Details"** (eye icon)
4. The Task Details Dialog will open

### Step 4: Scroll Down in the Dialog
**IMPORTANT**: The dialog is now scrollable! Scroll down to see:

1. **Time Tracking Section** (after basic task info):
   - **Timer Card**: Start/Stop timer button
   - **Time Logs Card**: List of all time entries

2. **Subtasks Section** (below time tracking):
   - **Subtasks Card**: List of subtasks
   - **"Add Subtask"** button
   - Progress indicator (e.g., "2/5" completed, "40% complete")

## 🎯 Testing Time Tracking

### Test 1: Start Timer
1. Open task details (see steps above)
2. Scroll down to "Time Tracking" section
3. Click **"Start Timer"** button
4. You should see:
   - Timer starts running
   - Duration updates every second
   - "Stop Timer" button appears

### Test 2: Stop Timer
1. While timer is running, click **"Stop Timer"**
2. Timer stops and creates a time log entry
3. The entry appears in the "Time Logs" section below

### Test 3: Add Manual Time Entry
1. In "Time Logs" section, click **"Add Entry"** button
2. Fill in:
   - Start Date & Time (required)
   - End Date & Time (optional - defaults to now)
   - Description (optional)
3. Click **"Create"**
4. New entry appears in the time logs list

### Test 4: View Time Logs
- All time entries are listed with:
  - Duration (e.g., "2h 30m")
  - Date range
  - Description
  - User who logged the time
- Total hours are displayed at the top

## 🎯 Testing Subtasks

### Test 1: Create a Subtask
1. Open task details
2. Scroll down to "Subtasks" section
3. Click **"Add Subtask"** button
4. Fill in the form:
   - Title (required)
   - Description (optional)
   - Priority, Status, etc.
5. Click **"Create Task"**
6. The subtask appears in the subtasks list

### Test 2: View Subtasks
- All subtasks are displayed with:
  - Status indicator (✓ for done, ⚠ for blocked, ○ for pending)
  - Title, status, and priority badges
  - Assignees (if any)
  - Dependencies (if any)

### Test 3: Progress Indicator
- Shows completed/total count (e.g., "2/5")
- Shows percentage complete (e.g., "40% complete")
- Updates automatically when subtask status changes

## 🔍 Troubleshooting

### Issue: Can't see the new sections
**Solution**: 
- The dialog is scrollable - scroll down inside the dialog
- The dialog is wider now (max-w-4xl) to accommodate all features
- Make sure you're viewing a task, not just the task list

### Issue: "Add Subtask" button doesn't work
**Solution**:
- Make sure you're in a project (not personal tasks)
- Check browser console for errors
- Ensure backend is running (`npm run api:dev`)

### Issue: Timer doesn't start
**Solution**:
- Check if you already have an active timer on another task
- Only one timer can be active at a time
- Check browser console for API errors

### Issue: Subtasks don't appear
**Solution**:
- Refresh the page
- Check if subtask was created successfully (toast notification)
- Verify backend endpoint is working: `GET /v1/tasks/{taskId}/subtasks`

## 📝 Quick Test Checklist

- [ ] Open a project
- [ ] Go to "List" tab
- [ ] Click task menu → "View Details"
- [ ] Scroll down in dialog
- [ ] See "Time Tracking" section with timer
- [ ] See "Time Logs" section
- [ ] See "Subtasks" section
- [ ] Click "Start Timer" - timer starts
- [ ] Click "Stop Timer" - timer stops, entry created
- [ ] Click "Add Entry" - manual time log form opens
- [ ] Click "Add Subtask" - subtask form opens
- [ ] Create a subtask - it appears in list
- [ ] See progress indicator updates

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Dialog is scrollable and shows all sections
- ✅ Timer starts/stops successfully
- ✅ Time logs appear after timer stops
- ✅ Manual time entries can be created
- ✅ Subtasks can be created and appear in list
- ✅ Progress indicator shows correct count/percentage

## 📞 Need Help?

If features still don't appear:
1. Check browser console for errors (F12)
2. Verify backend is running: `npm run api:dev`
3. Check network tab for API call failures
4. Ensure you're logged in and have project access

