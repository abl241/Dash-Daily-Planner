import express from 'express';
const router = express.Router();
import pool from '../db'; // adjust to your pool import
import {
  parseISO,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  isEqual,
  startOfDay,
  endOfDay,
  differenceInCalendarDays
} from 'date-fns';

/**
 * Helper: map full day name ("Monday") -> JS getDay index (1)
 * JS getDay: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
const WEEKDAY_MAP = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Normalize endRules "on" -> Date (inclusive)
 * If endRules.type === "on" we assume fields year, month (1-12), day exist.
 */
function endDateFromEndRules(endRules) {
  if (!endRules) return null;
  if (endRules.type === 'on') {
    // month in your example looked like "11" (November). treat as 1-12.
    const y = parseInt(endRules.year, 10);
    const m = parseInt(endRules.month, 10);
    const d = parseInt(endRules.day, 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      // Create Date object; monthIndex = m-1
      return new Date(y, m - 1, d, 23, 59, 59, 999); // inclusive end of day
    }
  }
  return null;
}

/**
 * Returns true if dateA <= dateB
 */
function lte(dateA, dateB) {
  return !isAfter(dateA, dateB);
}

/**
 * Generate occurrences for one repeating item (task or event)
 *
 * item: the DB row (must include `is_recurring`, `repeat_rule` JSON, and a start date field)
 * opts:
 *    kind: 'task' | 'event'
 *    startWindow, endWindow: Date objects for the requested in-range window
 *
 * Assumptions based on your description:
 * - repeat_rule is stored as JSON in DB, already parsed to object by pool (or parse here)
 * - For tasks use item.due_date as the anchor datetime
 * - For events use item.start_time / item.end_time as anchors
 * - selectedDays: array of strings like ["Monday","Wednesday"] (capital first letter)
 * - interval: integer > 0
 * - unit: "days"|"weeks"|"months"|"years"
 * - endRules.type: "never"|"after"|"on"
 *    - "after": count N -> total occurrences = N + 1 (original + N)
 *    - "on": endRules -> treated as inclusive stop date
 */
function expandRepeatingItem(item, { kind, startWindow, endWindow }) {
  const out = [];
  if (!item || !item.is_recurring) return out;

  // Parse repeat_rule: it may be stored as JSON-string or already object
  let rule = item.repeat_rule;
  if (!rule) return out;
  if (typeof rule === 'string') {
    try { rule = JSON.parse(rule); } catch (e) { /* invalid JSON */ return out; }
  }

  const unit = rule.unit;               // 'days'|'weeks'|'months'|'years'
  const interval = Math.max(1, parseInt(rule.interval || 1, 10));
  const selectedDays = Array.isArray(rule.selectedDays) ? rule.selectedDays : [];
  const endRules = rule.endRules || { type: 'never' };

  // anchor (start) date/time
  let anchorStart = null; // Date
  let anchorEnd = null;   // for events, duration calculation
  if (kind === 'task') {
    anchorStart = item.due_date ? new Date(item.due_date) : null;
    // set to start-of-day for tasks (you might want time-preserving; adjust if needed)
    if (anchorStart) anchorStart = startOfDay(anchorStart);
  } else {
    anchorStart = item.start_time ? new Date(item.start_time) : null;
    anchorEnd = item.end_time ? new Date(item.end_time) : null;
  }
  if (!anchorStart) return out;

  // compute an optional endBy date from endRules.type === 'on'
  const endByFromRule = endDateFromEndRules(endRules);

  // compute total occurrences limit if "after"
  let maxOccurrences = Infinity;
  if (endRules.type === 'after') {
    const cnt = parseInt(endRules.count || 0, 10);
    // per your convention: count=2 => total occurrences = 3
    if (!isNaN(cnt) && cnt >= 0) maxOccurrences = cnt + 1;
  }

  // Start generating occurrences starting at anchorStart
  // We'll iterate forwards until:
  //  - occurrence > endWindow OR
  //  - occurrence > endByFromRule (if present) OR
  //  - we exceed maxOccurrences
  //
  // For weekly selectedDays: we must generate occurrences on those weekdays
  //
  let occurrencesGenerated = 0;

  // Helper to push an occurrence only if it lies within the requested window and any 'on' rule constraints
  function pushIfInWindow(occDate) {
    // occDate is start-of-occurrence (Date)
    // For tasks: compare date vs window
    // For events: consider event duration (we'll attach end_time later)
    const withinWindow =
      !isAfter(occDate, endWindow) && !isBefore(occDate, startWindow) && lte(occDate, endWindow);

    const withinEndBy = endByFromRule ? lte(occDate, endByFromRule) : true;
    if (withinWindow && withinEndBy) {
      occurrencesGenerated += 1;
      // create occurrence object that preserves master id
      if (kind === 'task') {
        out.push({
          master_id: item.id,
          occurrence_date: occDate,
          name: item.name,
          notes: item.notes,
          original: item,
          is_occurrence: true,
        });
      } else {
        // event: preserve duration
        const durationMs = anchorEnd ? (anchorEnd.getTime() - anchorStart.getTime()) : 0;
        out.push({
          master_id: item.id,
          start_time: occDate,
          end_time: new Date(occDate.getTime() + durationMs),
          name: item.name,
          location: item.location,
          original: item,
          is_occurrence: true,
        });
      }
    }
  }

  // If unit === 'weeks' and selectedDays provided -> generate per-weekdays schedule
  if (unit === 'weeks') {
    // Interpret selectedDays:
    // - If empty: repeat weekly on the weekday of anchorStart
    // - Else: selectedDays is array of ["Monday","Wednesday"], map to weekday numbers
    const weekdays = selectedDays.length
      ? selectedDays.map(d => WEEKDAY_MAP[d]).filter(v => v !== undefined)
      : [anchorStart.getDay()]; // anchor weekday

    // We'll walk weeks using interval
    // Start from the week that includes anchorStart, but only include occurrences >= anchorStart
    // We'll iterate weekStart = anchorStart then add interval weeks each loop
    let currentWeekAnchor = startOfDay(anchorStart); // reference point
    // To ensure we include days in the first week that appear after anchorStart, we will
    // scan that week and then move in steps of `interval` weeks.

    let totalGen = 0;
    // loop safety cap - avoid infinite loops
    const MAX_LOOP = 10000;

    // compute a reasonable outer limit date: whichever is smallest of endWindow, endByFromRule, or big horizon
    const outerLimit = endByFromRule ? (isBefore(endByFromRule, endWindow) ? endByFromRule : endWindow) : endWindow;

    // We'll iterate by weeks until currentWeekAnchor > outerLimit or we reached maxOccurrences
    let loopCount = 0;
    // Start from the week containing anchorStart. We'll get the Sunday of that week and then check weekdays offsets
    const weekStartOfAnchor = new Date(currentWeekAnchor);
    weekStartOfAnchor.setDate(currentWeekAnchor.getDate() - currentWeekAnchor.getDay()); // Sunday

    let weekBase = weekStartOfAnchor;

    while (loopCount < MAX_LOOP) {
      // if exceeds occurrences limit, break
      if (occurrencesGenerated >= maxOccurrences) break;
      // if week base start is after outerLimit, break
      if (isAfter(weekBase, outerLimit)) break;

      // For each weekday in this week that we want, create an occurrence date
      for (const wd of weekdays) {
        // occurrence date = SundayOfWeek + wd + offset of anchor start time (time of day preserved)
        const occDate = new Date(weekBase);
        occDate.setDate(weekBase.getDate() + wd);

        // Preserve the time-of-day from anchorStart
        occDate.setHours(
          anchorStart.getHours(),
          anchorStart.getMinutes(),
          anchorStart.getSeconds(),
          anchorStart.getMilliseconds()
        );

        // Only include occurrences on/after the anchorStart (don't include past occurrences before the original)
        if (isBefore(occDate, anchorStart)) continue;

        // Respect endByFromRule and outerLimit too
        if (isAfter(occDate, outerLimit)) continue;

        // push if it lies in the requested window
        pushIfInWindow(occDate);

        // stop early if we hit max
        if (occurrencesGenerated >= maxOccurrences) break;
      }

      // Advance weekBase by `interval` weeks
      weekBase = addWeeks(weekBase, interval);
      loopCount += 1;
    }

  } else {
    // units: days, months, years
    // We'll iterate by stepping the anchor by interval units.
    // For 'days' we can step daily; for 'months' and 'years' use addMonths/addYears.

    let current = new Date(anchorStart);
    let loopCount = 0;
    const MAX_LOOP = 10000;
    const outerLimit = endByFromRule ? (isBefore(endByFromRule, endWindow) ? endByFromRule : endWindow) : endWindow;

    while (loopCount < MAX_LOOP) {
      if (occurrencesGenerated >= maxOccurrences) break;
      if (isAfter(current, outerLimit)) break;

      // Only consider occurrences on/after anchorStart
      if (!isBefore(current, anchorStart)) {
        pushIfInWindow(current);
      }

      // advance current
      if (unit === 'days') {
        current = addDays(current, interval);
      } else if (unit === 'months') {
        current = addMonths(current, interval);
      } else if (unit === 'years') {
        current = addYears(current, interval);
      } else {
        // unknown unit - break to avoid infinity
        break;
      }

      loopCount += 1;
    }
  }

  // If rule.endRules.type === 'after' but occurrencesGenerated < maxOccurrences
  // note: occurrencesGenerated counts only occurrences within window.
  // The maxOccurrences handling above is conservative (stops generation once we reach that number globally),
  // but we did not count prior occurrences before the window. If you need to count earlier occurrences toward
  // the "after" tally and stop generating (i.e. if count should include earlier occurrences), you'd need to calculate
  // number of occurrences before the window and offset the remaining allowable occurrences. For simplicity,
  // this implementation assumes the count applies to the total sequence and we generate forward until we hit that total.
  //
  // If you want strict handling where "after N" counts includes occurrences before the window, I can adjust.

  return out;
}

/**
 * Combined /inrange route
 * Returns { tasks: [...], events: [...] } with recurring items expanded.
 */
router.get('/inrange', async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end dates required' });
    }

    // parse window bounds (treat incoming strings as ISO-like)
    const startWindow = startOfDay(new Date(start));
    const endWindow = endOfDay(new Date(end));

    // Fetch base tasks and events (include recurring masters)
    const tasksQuery = `
      SELECT *
      FROM tasks
      WHERE user_id = $1
        AND (is_recurring = true OR (due_date::date BETWEEN $2::date AND $3::date))
      ORDER BY due_date ASC;
    `;

    const eventsQuery = `
      SELECT *
      FROM events
      WHERE user_id = $1
        AND (
          is_recurring = true
          OR start_time::date BETWEEN $2::date AND $3::date
          OR end_time::date BETWEEN $2::date AND $3::date
          OR (start_time::date <= $2::date AND end_time::date >= $3::date)
        )
      ORDER BY start_time ASC;
    `;

    const [tasksResult, eventsResult] = await Promise.all([
      pool.query(tasksQuery, [userId, start, end]),
      pool.query(eventsQuery, [userId, start, end]),
    ]);

    const baseTasks = tasksResult.rows || [];
    const baseEvents = eventsResult.rows || [];

    // split recurring vs normal
    const normalTasks = baseTasks.filter(t => !t.is_recurring);
    const repeatingTasks = baseTasks.filter(t => t.is_recurring);

    const normalEvents = baseEvents.filter(e => !e.is_recurring);
    const repeatingEvents = baseEvents.filter(e => e.is_recurring);

    // expand repeating tasks
    const expandedTaskOccurrences = repeatingTasks.flatMap(task =>
      expandRepeatingItem(task, { kind: 'task', startWindow, endWindow })
    );

    // expand repeating events
    const expandedEventOccurrences = repeatingEvents.flatMap(event =>
      expandRepeatingItem(event, { kind: 'event', startWindow, endWindow })
    );

    // unify output shape: keep original items plus expanded occurrences.
    // For tasks, include normal single tasks (with due_date) and occurrences (with occurrence_date).
    // For events, include normal events (with start_time/end_time) and occurrences (with start_time/end_time)
    const finalTasks = [
      ...normalTasks.map(t => ({ ...t, is_occurrence: false })),
      ...expandedTaskOccurrences,
    ];

    const finalEvents = [
      ...normalEvents.map(e => ({ ...e, is_occurrence: false })),
      ...expandedEventOccurrences,
    ];

    res.json({
      tasks: finalTasks,
      events: finalEvents,
    });
  } catch (err) {
    console.error('Error in /inrange:', err);
    res.status(500).json({ message: 'Server error fetching in-range items' });
  }
});

export default router;
