import { CalendarEvent } from '../types';

function parseICalDate(dateStr: string): Date {
  // Unfold and clean the value part (after colon, handles DTSTART;TZID=... format)
  const value = dateStr.includes(':') ? dateStr.split(':').slice(1).join(':') : dateStr;
  const cleaned = value.replace(/Z$/, '').replace('T', '');

  if (cleaned.length === 8) {
    // Date only: YYYYMMDD
    return new Date(
      parseInt(cleaned.slice(0, 4)),
      parseInt(cleaned.slice(4, 6)) - 1,
      parseInt(cleaned.slice(6, 8))
    );
  }

  // DateTime: YYYYMMDDHHMMSS
  const year = parseInt(cleaned.slice(0, 4));
  const month = parseInt(cleaned.slice(4, 6)) - 1;
  const day = parseInt(cleaned.slice(6, 8));
  const hour = parseInt(cleaned.slice(8, 10));
  const minute = parseInt(cleaned.slice(10, 12));
  const second = parseInt(cleaned.slice(12, 14));

  if (dateStr.endsWith('Z')) {
    // UTC time - convert to local
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(year, month, day, hour, minute, second);
}

export function parseICal(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Unfold lines (continuation lines start with space or tab)
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');

  const eventBlocks = unfolded.split('BEGIN:VEVENT').slice(1);

  for (const block of eventBlocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim());

    let uid = '';
    let summary = '';
    let location = '';
    let description = '';
    let startStr = '';
    let endStr = '';

    for (const line of lines) {
      if (line === 'END:VEVENT') break;

      if (line.startsWith('UID:')) {
        uid = line.slice(4);
      } else if (line.startsWith('SUMMARY:')) {
        summary = line.slice(8);
      } else if (line.startsWith('LOCATION:')) {
        location = line.slice(9);
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.slice(12).replace(/\\n/g, '\n').replace(/\\,/g, ',');
      } else if (line.startsWith('DTSTART')) {
        startStr = line;
      } else if (line.startsWith('DTEND')) {
        endStr = line;
      }
    }

    if (!startStr || !endStr || !summary) continue;

    try {
      const start = parseICalDate(startStr.split(':').slice(1).join(':'));
      const end = parseICalDate(endStr.split(':').slice(1).join(':'));

      events.push({
        id: uid || `ical-${events.length}`,
        title: summary,
        start,
        end,
        type: 'class',
        location: location || undefined,
        description: description || undefined,
      });
    } catch {
      // Skip malformed events
    }
  }

  return events;
}

export async function fetchICalEvents(scheduleUrl: string): Promise<CalendarEvent[]> {
  const httpsUrl = scheduleUrl.replace('webcal://', 'https://');

  const response = await fetch(httpsUrl, {
    headers: { Accept: 'text/calendar' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch iCal: ${response.status}`);
  }

  const text = await response.text();
  return parseICal(text);
}
