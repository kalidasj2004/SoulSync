/**
 * utils/journalCheck.js
 *
 * Handles the "did this user complete their previous-day journal?" logic.
 *
 * Rules:
 *  - "Previous day" = yesterday in the user's LOCAL timezone.
 *  - We check for an entry whose created_at falls within that calendar day.
 *  - We filter by user_id so one user's entry never satisfies another's check.
 *  - If the user opens the app at midnight (e.g. 00:01), "yesterday" is the
 *    calendar day that just ended — still correct.
 */

/**
 * getPreviousDay()
 * Returns an object with the ISO date string of yesterday (YYYY-MM-DD)
 * and start/end timestamps for the full day in UTC, used for Supabase query.
 */
export const getPreviousDay = () => {
  const now = new Date();

  // Yesterday in local time
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  // Build YYYY-MM-DD string in local timezone
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getDate()).padStart(2, '0');
  const dateString = `${y}-${m}-${d}`; // e.g. "2026-09-26"

  // Full day window in UTC for Supabase timestamp comparison
  const startOfDay = new Date(`${dateString}T00:00:00`);
  const endOfDay   = new Date(`${dateString}T23:59:59.999`);

  return {
    dateString,          // "2026-09-26"
    startISO: startOfDay.toISOString(),
    endISO:   endOfDay.toISOString(),
    label:    yesterday.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
};

/**
 * checkPreviousDayJournal(supabase, userId)
 *
 * Returns:
 *   { needed: true,  dateInfo }  → user has NOT written yesterday's journal
 *   { needed: false, dateInfo }  → user HAS written it, no reminder needed
 *   { needed: false, dateInfo }  → supabase not ready, fail open (don't block user)
 */
export const checkPreviousDayJournal = async (supabase, userId) => {
  const dateInfo = getPreviousDay();

  if (!supabase || !userId) {
    // If not ready, fail open — never block the user due to a config issue
    return { needed: false, dateInfo };
  }

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', dateInfo.startISO)
      .lte('created_at', dateInfo.endISO)
      .limit(1);

    if (error) {
      console.warn('[JournalCheck] Query error:', error.message);
      return { needed: false, dateInfo }; // fail open
    }

    const hasEntry = data && data.length > 0;
    return { needed: !hasEntry, dateInfo };
  } catch (e) {
    console.warn('[JournalCheck] Unexpected error:', e.message);
    return { needed: false, dateInfo }; // fail open
  }
};

/**
 * savePreviousDayJournal(supabase, userId, { title, content, moodTag }, dateInfo)
 *
 * Saves the journal entry with a created_at timestamp set to noon of yesterday,
 * so it always falls within the previous day's window regardless of when submitted.
 */
export const savePreviousDayJournal = async (supabase, userId, { title, content, moodTag }, dateInfo) => {
  if (!supabase || !userId) throw new Error('Not connected');

  // Set timestamp to noon of the previous day so the query always finds it
  const entryTimestamp = new Date(`${dateInfo.dateString}T12:00:00`).toISOString();

  const { error } = await supabase.from('journal_entries').insert({
    user_id:    userId,
    title:      title.trim(),
    content:    content.trim(),
    mood_tag:   moodTag,
    created_at: entryTimestamp,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return true;
};
