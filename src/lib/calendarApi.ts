import { CalendarMeeting } from '../types';

export const fetchGoogleCalendarEvents = async (
  accessToken: string
): Promise<CalendarMeeting[]> => {
  try {
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&singleEvents=true&orderBy=startTime&maxResults=20`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Calendar API HTTP error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const items = data.items || [];

    const parsedMeetings: CalendarMeeting[] = items.map((item: any, index: number) => {
      // Detect Google Meet link
      let meetLink = item.hangoutLink || '';
      if (!meetLink && item.conferenceData?.entryPoints) {
        const videoEntry = item.conferenceData.entryPoints.find(
          (ep: any) => ep.entryPointType === 'video'
        );
        if (videoEntry?.uri) {
          meetLink = videoEntry.uri;
        }
      }

      // Check description or location for meet.google.com regex
      if (!meetLink) {
        const textToSearch = `${item.description || ''} ${item.location || ''}`;
        const match = textToSearch.match(/https?:\/\/meet\.google\.com\/[a-z0-9-]+/i);
        if (match) {
          meetLink = match[0];
        }
      }

      const isGoogleMeet = Boolean(meetLink && meetLink.includes('meet.google.com'));

      const startTime =
        item.start?.dateTime || item.start?.date || new Date().toISOString();
      const endTime =
        item.end?.dateTime ||
        item.end?.date ||
        new Date(Date.now() + 1000 * 60 * 30).toISOString();

      return {
        id: item.id || `gcal-${index}-${Date.now()}`,
        title: item.summary || 'Untitled Meeting',
        description: item.description || '',
        startTime,
        endTime,
        meetLink: meetLink || 'https://meet.google.com/new',
        isGoogleMeet,
        organizer: {
          name: item.organizer?.displayName || item.organizer?.email?.split('@')[0] || 'Meeting Host',
          email: item.organizer?.email || 'host@google.com',
        },
        attendeesCount: item.attendees?.length || 1,
        napModeApproved: false,
        autoAttendConfigured: false,
        botStatus: 'scheduled',
      };
    });

    return parsedMeetings;
  } catch (error) {
    console.error('Failed to fetch events from Google Calendar API:', error);
    throw error;
  }
};
