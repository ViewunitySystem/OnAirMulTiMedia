# ⏰ Global Meeting Clock

**Timezone-Synchronized Meeting Scheduler for International Collaboration**

---

## 🎯 Purpose

The Global Meeting Clock enables seamless scheduling of meetings across timezones with automatic conversion, collision detection, and audit logging.

**Key Features:**
- 🌍 Multi-timezone display (UTC, local, custom zones)
- 📅 Meeting scheduler with conflict detection
- 🔔 Countdown timers and notifications
- 📊 Participant timezone awareness
- 🔗 Integration with Calendar APIs (Google, Outlook)
- 📝 Automatic audit trail

---

## 🏗️ Architecture

```
global-meeting-clock/
├── README.md              # This file
├── blueprint.md           # Technical specification
├── main.js                # Node.js implementation
├── main.rs                # Rust implementation (alternative)
├── ui/
│   ├── index.html         # Web UI
│   ├── styles.css         # Styling
│   └── app.js             # Frontend logic
├── tests/
│   ├── unit.test.js       # Unit tests
│   └── integration.test.js # Integration tests
└── examples/
    └── quickstart.js      # Usage examples
```

---

## 🚀 Quick Start

### Installation

```bash
npm install @onairmultimedia/global-meeting-clock
```

### Usage

```javascript
const { GlobalMeetingClock } = require('./main.js');

// Initialize
const clock = new GlobalMeetingClock({
  defaultTimezones: ['UTC', 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo'],
  auditLogger: auditLogger  // Optional audit integration
});

// Schedule meeting
const meeting = await clock.scheduleMeeting({
  title: 'OnAirMulTiMedia Dev Sync',
  startTime: '2025-01-15T14:00:00Z',  // UTC
  duration: 60,  // minutes
  participants: [
    { name: 'Raymond', timezone: 'Europe/Amsterdam' },
    { name: 'John', timezone: 'America/New_York' },
    { name: 'Yuki', timezone: 'Asia/Tokyo' }
  ],
  recurrence: 'weekly'  // Optional
});

console.log('Meeting scheduled:', meeting);
// Output:
// {
//   id: 'mtg_abc123',
//   title: 'OnAirMulTiMedia Dev Sync',
//   times: {
//     'UTC': '2025-01-15 14:00',
//     'Europe/Amsterdam': '2025-01-15 15:00',
//     'America/New_York': '2025-01-15 09:00',
//     'Asia/Tokyo': '2025-01-15 23:00'
//   },
//   conflicts: [],
//   calendar_url: 'https://...'
// }

// Get next meeting
const next = clock.getNextMeeting();
console.log('Next meeting in:', next.countdown);

// Check conflicts
const conflicts = clock.checkConflicts('2025-01-15T14:00:00Z', 60);
if (conflicts.length > 0) {
  console.warn('Conflicts detected:', conflicts);
}
```

---

## 🌍 Timezone Handling

### Supported Timezones

All IANA timezone database timezones are supported:
- `UTC` - Coordinated Universal Time
- `America/New_York` - Eastern Time (US)
- `America/Los_Angeles` - Pacific Time (US)
- `Europe/Berlin` - Central European Time
- `Europe/London` - British Time
- `Asia/Tokyo` - Japan Standard Time
- `Australia/Sydney` - Australian Eastern Time
- ... and 400+ more

### Daylight Saving Time (DST)

Automatic DST handling using [Luxon](https://moment.github.io/luxon/) library.

```javascript
// DST transition example
const meeting = clock.scheduleMeeting({
  startTime: '2025-03-30T14:00:00Z',  // During DST transition
  timezone: 'Europe/Berlin'
});

// Automatically accounts for DST change
console.log(meeting.times['Europe/Berlin']);
// Output: '2025-03-30 16:00' (CEST, not CET)
```

---

## 📅 Meeting Scheduling

### Simple Meeting

```javascript
const meeting = await clock.scheduleMeeting({
  title: 'Quick Sync',
  startTime: '2025-01-20T15:00:00Z',
  duration: 30
});
```

### Recurring Meeting

```javascript
const recurring = await clock.scheduleMeeting({
  title: 'Weekly Standup',
  startTime: '2025-01-15T09:00:00-05:00',  // EST
  duration: 15,
  recurrence: {
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: ['MON'],  // Every Monday
    until: '2025-12-31'
  }
});
```

### With Participants

```javascript
const meeting = await clock.scheduleMeeting({
  title: 'Hackathon Kickoff',
  startTime: '2025-02-01T14:00:00Z',
  duration: 120,
  participants: [
    { 
      name: 'Raymond Demitrio Dr. Tel', 
      email: 'gentlyoverdone@outlook.com',
      timezone: 'Europe/Amsterdam',
      role: 'Organizer'
    },
    { 
      name: 'Community Member', 
      timezone: 'America/New_York',
      role: 'Participant'
    }
  ],
  sendInvites: true  // Send calendar invites
});
```

---

## 🔔 Notifications

### Countdown Timer

```javascript
// Get countdown to next meeting
const countdown = clock.getCountdown('mtg_abc123');

console.log(countdown);
// Output:
// {
//   meeting_id: 'mtg_abc123',
//   title: 'Dev Sync',
//   time_until: {
//     days: 2,
//     hours: 5,
//     minutes: 30,
//     seconds: 15
//   },
//   formatted: '2 days, 5 hours, 30 minutes'
// }
```

### Reminders

```javascript
// Set reminder (15 minutes before)
clock.setReminder('mtg_abc123', 15, (meeting) => {
  console.log(`Reminder: ${meeting.title} starts in 15 minutes!`);
  
  // Send notification (browser API)
  new Notification('Meeting Reminder', {
    body: `${meeting.title} starts in 15 minutes`,
    icon: '/icon.png'
  });
});
```

---

## 🎨 Web UI

### Embedding

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="global-meeting-clock/ui/styles.css">
</head>
<body>
  <div id="meeting-clock"></div>
  
  <script src="global-meeting-clock/ui/app.js"></script>
  <script>
    const clock = new GlobalMeetingClockUI('#meeting-clock', {
      timezones: ['UTC', 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo'],
      meetings: [
        {
          title: 'Dev Sync',
          startTime: '2025-01-15T14:00:00Z',
          duration: 60
        }
      ]
    });
  </script>
</body>
</html>
```

### Dark Theme

Automatically adapts to `prefers-color-scheme`:

```css
:root {
  --bg-primary: #0b1020;
  --text-primary: #e5e7eb;
  --accent: #3b82f6;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #ffffff;
    --text-primary: #1f2937;
    --accent: #2563eb;
  }
}
```

---

## 🔗 Calendar Integration

### Google Calendar

```javascript
const gcal = require('@googleapis/calendar');

await clock.exportToGoogleCalendar('mtg_abc123', {
  credentials: googleOAuth2Credentials,
  calendarId: 'primary'
});
```

### Outlook / Microsoft 365

```javascript
const { Client } = require('@microsoft/microsoft-graph-client');

await clock.exportToOutlook('mtg_abc123', {
  accessToken: outlookAccessToken
});
```

### iCal / ICS File

```javascript
const ics = clock.generateICS('mtg_abc123');

// Download
res.setHeader('Content-Type', 'text/calendar');
res.setHeader('Content-Disposition', 'attachment; filename=meeting.ics');
res.send(ics);
```

---

## 📊 Audit Integration

Every meeting action is automatically logged:

```json
{
  "category": "MODULE",
  "type": "meeting_scheduled",
  "payload": {
    "meeting_id": "mtg_abc123",
    "title": "Dev Sync",
    "start_time": "2025-01-15T14:00:00Z",
    "duration": 60,
    "participants": 3,
    "timezones": ["UTC", "Europe/Amsterdam", "America/New_York"],
    "organizer": "DD5BE"
  }
}
```

---

## 🧪 Testing

```bash
npm test
```

**Coverage**: > 90%

```javascript
// Example test
describe('GlobalMeetingClock', () => {
  it('should schedule meeting without conflicts', async () => {
    const clock = new GlobalMeetingClock();
    
    const meeting = await clock.scheduleMeeting({
      title: 'Test Meeting',
      startTime: '2025-01-20T10:00:00Z',
      duration: 30
    });
    
    expect(meeting.id).toMatch(/^mtg_/);
    expect(meeting.conflicts).toHaveLength(0);
  });
  
  it('should detect conflicts', async () => {
    const clock = new GlobalMeetingClock();
    
    await clock.scheduleMeeting({
      title: 'Meeting 1',
      startTime: '2025-01-20T10:00:00Z',
      duration: 60
    });
    
    const conflicts = clock.checkConflicts('2025-01-20T10:30:00Z', 60);
    expect(conflicts).toHaveLength(1);
  });
});
```

---

## 🌐 API Reference

See [`blueprint.md`](./blueprint.md) for complete API documentation.

---

## 📞 Support

- **GitHub Issues**: https://github.com/ViewunitySystem/OnAirMulTiMedia/issues
- **Email**: gentlyoverdone@outlook.com
- **Maintainer**: Raymond Demitrio Dr. Tel (DD5BE)

---

© 2025 ViewunitySystem / TEL Portal  
Global Meeting Clock - Timezone-Synchronized Collaboration

