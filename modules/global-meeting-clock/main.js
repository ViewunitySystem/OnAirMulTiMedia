/**
 * Global Meeting Clock - Timezone-Synchronized Meeting Scheduler
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 */

const { DateTime } = require('luxon');
const { nanoid } = require('nanoid');
const EventEmitter = require('events');

class GlobalMeetingClock extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.defaultTimezones = options.defaultTimezones || ['UTC', 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo'];
    this.meetings = new Map();
    this.reminders = new Map();
    this.auditLogger = options.auditLogger || null;
    
    // Start reminder check interval (every minute)
    this.reminderInterval = setInterval(() => this.checkReminders(), 60000);
  }
  
  /**
   * Schedule a new meeting
   */
  async scheduleMeeting(options) {
    const {
      title,
      startTime,  // ISO 8601 string or Date
      duration,   // minutes
      participants = [],
      recurrence = null,
      sendInvites = false
    } = options;
    
    // Validate
    if (!title || !startTime || !duration) {
      throw new Error('Missing required fields: title, startTime, duration');
    }
    
    // Parse start time
    const start = DateTime.fromISO(startTime, { zone: 'utc' });
    if (!start.isValid) {
      throw new Error(`Invalid startTime: ${startTime}`);
    }
    
    // Generate meeting ID
    const id = `mtg_${nanoid()}`;
    
    // Calculate end time
    const end = start.plus({ minutes: duration });
    
    // Check conflicts
    const conflicts = this.checkConflicts(start.toISO(), duration);
    
    // Generate times for all timezones
    const times = {};
    for (const tz of this.defaultTimezones) {
      times[tz] = start.setZone(tz).toFormat('yyyy-MM-dd HH:mm');
    }
    
    // Create meeting object
    const meeting = {
      id,
      title,
      startTime: start.toISO(),
      endTime: end.toISO(),
      duration,
      times,
      participants: participants.map(p => ({
        name: p.name,
        email: p.email || null,
        timezone: p.timezone || 'UTC',
        role: p.role || 'Participant',
        localTime: start.setZone(p.timezone || 'UTC').toFormat('yyyy-MM-dd HH:mm')
      })),
      recurrence,
      conflicts,
      created_at: DateTime.now().toISO()
    };
    
    // Store meeting
    this.meetings.set(id, meeting);
    
    // Audit log
    if (this.auditLogger) {
      await this.auditLogger.log({
        category: 'MODULE',
        type: 'meeting_scheduled',
        payload: {
          meeting_id: id,
          title,
          start_time: start.toISO(),
          duration,
          participants: participants.length,
          timezones: Object.keys(times)
        }
      });
    }
    
    // Emit event
    this.emit('meeting:scheduled', meeting);
    
    // Send invites if requested
    if (sendInvites && participants.length > 0) {
      await this.sendInvites(meeting);
    }
    
    return meeting;
  }
  
  /**
   * Check for scheduling conflicts
   */
  checkConflicts(startTime, duration) {
    const start = DateTime.fromISO(startTime);
    const end = start.plus({ minutes: duration });
    
    const conflicts = [];
    
    for (const [id, meeting] of this.meetings) {
      const meetingStart = DateTime.fromISO(meeting.startTime);
      const meetingEnd = DateTime.fromISO(meeting.endTime);
      
      // Check for overlap
      if (
        (start >= meetingStart && start < meetingEnd) ||  // starts during existing meeting
        (end > meetingStart && end <= meetingEnd) ||      // ends during existing meeting
        (start <= meetingStart && end >= meetingEnd)      // encompasses existing meeting
      ) {
        conflicts.push({
          meeting_id: meeting.id,
          title: meeting.title,
          start: meeting.startTime,
          end: meeting.endTime
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * Get next upcoming meeting
   */
  getNextMeeting() {
    const now = DateTime.now();
    
    let nextMeeting = null;
    let minDiff = Infinity;
    
    for (const [id, meeting] of this.meetings) {
      const start = DateTime.fromISO(meeting.startTime);
      const diff = start.diff(now).as('milliseconds');
      
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextMeeting = meeting;
      }
    }
    
    if (!nextMeeting) {
      return null;
    }
    
    // Calculate countdown
    const duration = DateTime.fromISO(nextMeeting.startTime).diff(now);
    const countdown = {
      days: Math.floor(duration.as('days')),
      hours: Math.floor(duration.as('hours') % 24),
      minutes: Math.floor(duration.as('minutes') % 60),
      seconds: Math.floor(duration.as('seconds') % 60)
    };
    
    return {
      ...nextMeeting,
      countdown,
      formatted: this.formatCountdown(countdown)
    };
  }
  
  /**
   * Get countdown to specific meeting
   */
  getCountdown(meetingId) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting not found: ${meetingId}`);
    }
    
    const now = DateTime.now();
    const start = DateTime.fromISO(meeting.startTime);
    const duration = start.diff(now);
    
    const countdown = {
      days: Math.floor(duration.as('days')),
      hours: Math.floor(duration.as('hours') % 24),
      minutes: Math.floor(duration.as('minutes') % 60),
      seconds: Math.floor(duration.as('seconds') % 60)
    };
    
    return {
      meeting_id: meetingId,
      title: meeting.title,
      time_until: countdown,
      formatted: this.formatCountdown(countdown)
    };
  }
  
  /**
   * Format countdown nicely
   */
  formatCountdown(countdown) {
    const parts = [];
    
    if (countdown.days > 0) {
      parts.push(`${countdown.days} day${countdown.days !== 1 ? 's' : ''}`);
    }
    if (countdown.hours > 0) {
      parts.push(`${countdown.hours} hour${countdown.hours !== 1 ? 's' : ''}`);
    }
    if (countdown.minutes > 0 || parts.length === 0) {
      parts.push(`${countdown.minutes} minute${countdown.minutes !== 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  }
  
  /**
   * Set reminder for meeting
   */
  setReminder(meetingId, minutesBefore, callback) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting not found: ${meetingId}`);
    }
    
    const reminderId = `reminder_${nanoid()}`;
    const reminderTime = DateTime.fromISO(meeting.startTime).minus({ minutes: minutesBefore });
    
    this.reminders.set(reminderId, {
      id: reminderId,
      meeting_id: meetingId,
      remind_at: reminderTime.toISO(),
      callback
    });
    
    return reminderId;
  }
  
  /**
   * Check and fire due reminders
   */
  checkReminders() {
    const now = DateTime.now();
    
    for (const [id, reminder] of this.reminders) {
      const remindAt = DateTime.fromISO(reminder.remind_at);
      
      if (now >= remindAt) {
        const meeting = this.meetings.get(reminder.meeting_id);
        if (meeting) {
          reminder.callback(meeting);
          this.emit('reminder:fired', { reminder, meeting });
        }
        
        // Remove fired reminder
        this.reminders.delete(id);
      }
    }
  }
  
  /**
   * Generate iCal/ICS file
   */
  generateICS(meetingId) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting not found: ${meetingId}`);
    }
    
    const start = DateTime.fromISO(meeting.startTime);
    const end = DateTime.fromISO(meeting.endTime);
    
    const formatICal = (dt) => dt.toFormat("yyyyMMdd'T'HHmmss'Z'");
    
    const participants = meeting.participants
      .map(p => `ATTENDEE;CN=${p.name}${p.email ? `;RSVP=TRUE:mailto:${p.email}` : ''}`)
      .join('\r\n');
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OnAirMulTiMedia//Global Meeting Clock//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${meeting.id}@onairmultimedia.tel
DTSTAMP:${formatICal(DateTime.now())}
DTSTART:${formatICal(start)}
DTEND:${formatICal(end)}
SUMMARY:${meeting.title}
DESCRIPTION:OnAirMulTiMedia Meeting
${participants}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
  }
  
  /**
   * Send calendar invites
   */
  async sendInvites(meeting) {
    // This would integrate with email service
    // For now, just log
    console.log(`Would send invites for meeting: ${meeting.title}`);
    console.log(`Recipients: ${meeting.participants.length}`);
    
    if (this.auditLogger) {
      await this.auditLogger.log({
        category: 'MODULE',
        type: 'invites_sent',
        payload: {
          meeting_id: meeting.id,
          recipients: meeting.participants.length
        }
      });
    }
  }
  
  /**
   * List all meetings
   */
  list(filter = {}) {
    const { upcoming = false, past = false } = filter;
    const now = DateTime.now();
    
    const meetings = Array.from(this.meetings.values());
    
    if (upcoming) {
      return meetings.filter(m => DateTime.fromISO(m.startTime) > now);
    }
    
    if (past) {
      return meetings.filter(m => DateTime.fromISO(m.endTime) < now);
    }
    
    return meetings;
  }
  
  /**
   * Get meeting by ID
   */
  get(meetingId) {
    return this.meetings.get(meetingId);
  }
  
  /**
   * Delete meeting
   */
  async delete(meetingId) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting not found: ${meetingId}`);
    }
    
    this.meetings.delete(meetingId);
    
    // Remove associated reminders
    for (const [id, reminder] of this.reminders) {
      if (reminder.meeting_id === meetingId) {
        this.reminders.delete(id);
      }
    }
    
    if (this.auditLogger) {
      await this.auditLogger.log({
        category: 'MODULE',
        type: 'meeting_deleted',
        payload: { meeting_id: meetingId, title: meeting.title }
      });
    }
    
    this.emit('meeting:deleted', { meeting_id: meetingId });
    
    return true;
  }
  
  /**
   * Cleanup
   */
  destroy() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }
    this.meetings.clear();
    this.reminders.clear();
    this.removeAllListeners();
  }
}

module.exports = { GlobalMeetingClock };

