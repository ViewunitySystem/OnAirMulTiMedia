/**
 * Global Meeting Clock - Unit Tests
 */

const { GlobalMeetingClock } = require('../main');
const { DateTime } = require('luxon');

describe('GlobalMeetingClock', () => {
  let clock;
  
  beforeEach(() => {
    clock = new GlobalMeetingClock();
  });
  
  afterEach(() => {
    clock.destroy();
  });
  
  describe('scheduleMeeting', () => {
    it('should schedule a meeting successfully', async () => {
      const meeting = await clock.scheduleMeeting({
        title: 'Test Meeting',
        startTime: '2025-01-20T10:00:00Z',
        duration: 60
      });
      
      expect(meeting.id).toMatch(/^mtg_/);
      expect(meeting.title).toBe('Test Meeting');
      expect(meeting.duration).toBe(60);
      expect(meeting.conflicts).toHaveLength(0);
    });
    
    it('should throw error for missing fields', async () => {
      await expect(clock.scheduleMeeting({})).rejects.toThrow('Missing required fields');
    });
    
    it('should generate times for all timezones', async () => {
      const meeting = await clock.scheduleMeeting({
        title: 'Multi-TZ Meeting',
        startTime: '2025-01-20T14:00:00Z',
        duration: 30
      });
      
      expect(meeting.times).toHaveProperty('UTC');
      expect(meeting.times).toHaveProperty('America/New_York');
      expect(meeting.times).toHaveProperty('Europe/Berlin');
      expect(meeting.times).toHaveProperty('Asia/Tokyo');
    });
  });
  
  describe('checkConflicts', () => {
    it('should detect overlapping meetings', async () => {
      await clock.scheduleMeeting({
        title: 'Meeting 1',
        startTime: '2025-01-20T10:00:00Z',
        duration: 60
      });
      
      const conflicts = clock.checkConflicts('2025-01-20T10:30:00Z', 60);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].title).toBe('Meeting 1');
    });
    
    it('should not detect non-overlapping meetings', async () => {
      await clock.scheduleMeeting({
        title: 'Meeting 1',
        startTime: '2025-01-20T10:00:00Z',
        duration: 60
      });
      
      const conflicts = clock.checkConflicts('2025-01-20T12:00:00Z', 60);
      expect(conflicts).toHaveLength(0);
    });
  });
  
  describe('getNextMeeting', () => {
    it('should return next upcoming meeting', async () => {
      const future = DateTime.now().plus({ days: 1 }).toISO();
      
      await clock.scheduleMeeting({
        title: 'Future Meeting',
        startTime: future,
        duration: 30
      });
      
      const next = clock.getNextMeeting();
      expect(next).not.toBeNull();
      expect(next.title).toBe('Future Meeting');
      expect(next.countdown).toBeDefined();
    });
    
    it('should return null if no upcoming meetings', () => {
      const next = clock.getNextMeeting();
      expect(next).toBeNull();
    });
  });
  
  describe('generateICS', () => {
    it('should generate valid iCal format', async () => {
      const meeting = await clock.scheduleMeeting({
        title: 'ICS Test',
        startTime: '2025-01-20T14:00:00Z',
        duration: 60
      });
      
      const ics = clock.generateICS(meeting.id);
      
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:ICS Test');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });
  });
});

