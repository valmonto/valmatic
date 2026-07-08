import { create } from 'zustand';

// ─── Mobile demo store ───────────────────────────────────────────────────────
//
// The mobile demo runs entirely on in-memory demo data — no API calls. A tiny
// Zustand store (matching the app's notification-store pattern) keeps the
// interactions (completing tasks, reading inbox items) alive while the user
// hops between tabs, so the demo feels like a real app rather than a set of
// disconnected screenshots. State resets on full page reload by design.

export type DemoPriority = 'urgent' | 'high' | 'medium' | 'low';
export type DemoTaskStatus = 'todo' | 'in-progress' | 'done';

export interface DemoSubtask {
  id: string;
  title: string;
  done: boolean;
}

export interface DemoComment {
  id: string;
  author: string;
  initials: string;
  body: string;
  time: string;
}

export interface DemoTask {
  id: string;
  title: string;
  description: string;
  project: string;
  projectColor: string;
  priority: DemoPriority;
  status: DemoTaskStatus;
  due: string;
  dueToday: boolean;
  assignees: { name: string; initials: string }[];
  subtasks: DemoSubtask[];
  comments: DemoComment[];
}

export type DemoNotificationKind = 'mention' | 'comment' | 'system' | 'success';

export interface DemoNotification {
  id: string;
  kind: DemoNotificationKind;
  title: string;
  body: string;
  time: string;
  today: boolean;
  read: boolean;
}

const seedTasks: DemoTask[] = [
  {
    id: 'TSK-128',
    title: 'Ship onboarding redesign',
    description:
      'Roll out the new three-step onboarding flow to all workspaces. Covers the welcome screen, workspace setup and the invite-teammates step.',
    project: 'Mobile App',
    projectColor: 'bg-primary',
    priority: 'urgent',
    status: 'in-progress',
    due: 'Today, 5:00 PM',
    dueToday: true,
    assignees: [
      { name: 'Ada Lovelace', initials: 'AL' },
      { name: 'Grace Hopper', initials: 'GH' },
    ],
    subtasks: [
      { id: 's1', title: 'Welcome screen animations', done: true },
      { id: 's2', title: 'Workspace setup step', done: true },
      { id: 's3', title: 'Invite teammates step', done: false },
      { id: 's4', title: 'QA pass on small screens', done: false },
    ],
    comments: [
      {
        id: 'c1',
        author: 'Grace Hopper',
        initials: 'GH',
        body: 'Invite step is blocked on the new contact picker — landing this afternoon.',
        time: '2h ago',
      },
      {
        id: 'c2',
        author: 'Ada Lovelace',
        initials: 'AL',
        body: 'Animations are in. Let me know once the picker merges and I will wire it up.',
        time: '45m ago',
      },
    ],
  },
  {
    id: 'TSK-127',
    title: 'Fix billing webhook retries',
    description:
      'Stripe webhooks occasionally fail on cold starts. Add exponential backoff and a dead-letter queue so no invoice events are dropped.',
    project: 'API',
    projectColor: 'bg-emerald-500',
    priority: 'high',
    status: 'in-progress',
    due: 'Today, 3:00 PM',
    dueToday: true,
    assignees: [{ name: 'Linus Borg', initials: 'LB' }],
    subtasks: [
      { id: 's1', title: 'Add retry with backoff', done: true },
      { id: 's2', title: 'Dead-letter queue + alerting', done: false },
    ],
    comments: [
      {
        id: 'c1',
        author: 'Linus Borg',
        initials: 'LB',
        body: 'Backoff is merged. DLQ needs an infra review before I can deploy.',
        time: '1h ago',
      },
    ],
  },
  {
    id: 'TSK-125',
    title: 'Dark mode for marketing site',
    description:
      'Bring the marketing pages in line with the app: full dark theme, system preference detection and a persistent toggle in the footer.',
    project: 'Website',
    projectColor: 'bg-sky-500',
    priority: 'medium',
    status: 'todo',
    due: 'Tomorrow',
    dueToday: false,
    assignees: [{ name: 'Margaret Hamilton', initials: 'MH' }],
    subtasks: [
      { id: 's1', title: 'Token audit on landing page', done: false },
      { id: 's2', title: 'Hero illustration dark variant', done: false },
      { id: 's3', title: 'Footer toggle', done: false },
    ],
    comments: [],
  },
  {
    id: 'TSK-124',
    title: 'Quarterly analytics report',
    description:
      'Compile Q2 activation and retention numbers for the board deck. Export charts from the analytics dashboard and annotate the anomalies.',
    project: 'Operations',
    projectColor: 'bg-amber-500',
    priority: 'medium',
    status: 'todo',
    due: 'Fri, Jun 19',
    dueToday: false,
    assignees: [
      { name: 'Katherine Johnson', initials: 'KJ' },
      { name: 'Ada Lovelace', initials: 'AL' },
    ],
    subtasks: [
      { id: 's1', title: 'Pull activation cohort data', done: false },
      { id: 's2', title: 'Annotate retention dip in April', done: false },
    ],
    comments: [],
  },
  {
    id: 'TSK-122',
    title: 'Rotate production API keys',
    description:
      'Scheduled 90-day rotation of all third-party API keys. Update the secrets manager and verify every service picks up the new values.',
    project: 'API',
    projectColor: 'bg-emerald-500',
    priority: 'low',
    status: 'done',
    due: 'Today, 9:00 AM',
    dueToday: true,
    assignees: [{ name: 'Linus Borg', initials: 'LB' }],
    subtasks: [
      { id: 's1', title: 'Rotate keys in secrets manager', done: true },
      { id: 's2', title: 'Verify services restarted cleanly', done: true },
    ],
    comments: [],
  },
  {
    id: 'TSK-119',
    title: 'Design system: empty states',
    description:
      'Add a reusable empty-state primitive with illustration, title, description and an optional call to action. Document the variants in the gallery.',
    project: 'Design System',
    projectColor: 'bg-fuchsia-500',
    priority: 'high',
    status: 'done',
    due: 'Mon, Jun 8',
    dueToday: false,
    assignees: [{ name: 'Margaret Hamilton', initials: 'MH' }],
    subtasks: [
      { id: 's1', title: 'Component API', done: true },
      { id: 's2', title: 'Gallery docs', done: true },
    ],
    comments: [],
  },
];

const seedNotifications: DemoNotification[] = [
  {
    id: 'n1',
    kind: 'mention',
    title: 'Grace mentioned you',
    body: '"@you can you review the invite step before EOD?" — Ship onboarding redesign',
    time: '12m ago',
    today: true,
    read: false,
  },
  {
    id: 'n2',
    kind: 'success',
    title: 'Deploy succeeded',
    body: 'api@2.14.0 is live in production. 0 errors in the first 10 minutes.',
    time: '38m ago',
    today: true,
    read: false,
  },
  {
    id: 'n3',
    kind: 'comment',
    title: 'New comment on TSK-127',
    body: 'Linus: "Backoff is merged. DLQ needs an infra review before I can deploy."',
    time: '1h ago',
    today: true,
    read: false,
  },
  {
    id: 'n4',
    kind: 'system',
    title: 'Weekly digest is ready',
    body: '14 tasks completed, 3 new teammates, activity up 12% week over week.',
    time: 'Yesterday',
    today: false,
    read: true,
  },
  {
    id: 'n5',
    kind: 'mention',
    title: 'Katherine assigned you',
    body: 'You were added to "Quarterly analytics report" as a reviewer.',
    time: 'Yesterday',
    today: false,
    read: true,
  },
  {
    id: 'n6',
    kind: 'system',
    title: 'API key rotation complete',
    body: 'All production keys were rotated and verified. Next rotation: Sep 10.',
    time: '2d ago',
    today: false,
    read: true,
  },
];

interface MobileDemoState {
  tasks: DemoTask[];
  notifications: DemoNotification[];
  toggleTaskStatus: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addTask: (input: { title: string; project: string; priority: DemoPriority }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const projectColors: Record<string, string> = {
  'Mobile App': 'bg-primary',
  Website: 'bg-sky-500',
  API: 'bg-emerald-500',
  Operations: 'bg-amber-500',
  'Design System': 'bg-fuchsia-500',
};

export const useMobileDemoStore = create<MobileDemoState>((set) => ({
  tasks: seedTasks,
  notifications: seedNotifications,

  toggleTaskStatus: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === 'done' ? 'todo' : 'done' }
          : task,
      ),
    })),

  toggleSubtask: (taskId, subtaskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
              ),
            }
          : task,
      ),
    })),

  addTask: ({ title, project, priority }) =>
    set((state) => ({
      tasks: [
        {
          id: `TSK-${129 + state.tasks.filter((t) => t.id.startsWith('TSK-1')).length}`,
          title,
          description: 'Created from the mobile demo. Demo data only — nothing is persisted.',
          project,
          projectColor: projectColors[project] ?? 'bg-primary',
          priority,
          status: 'todo',
          due: 'Today',
          dueToday: true,
          assignees: [{ name: 'You', initials: 'ME' }],
          subtasks: [],
          comments: [],
        },
        ...state.tasks,
      ],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    })),
}));
