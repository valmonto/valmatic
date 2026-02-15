import { act } from '@testing-library/react';

import { useNotificationStore } from '@/context/notification-store';

describe('notification-store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store state before each test
    useNotificationStore.setState({ notifications: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addNotification', () => {
    it('adds a notification with correct properties', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification('success', 'Operation completed');
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        id: 'test-uuid-1234',
        type: 'success',
        message: 'Operation completed',
      });
      expect(notifications[0]!.createdAt).toBeInstanceOf(Date);
    });

    it('adds multiple notifications', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification('success', 'First');
        addNotification('error', 'Second');
        addNotification('info', 'Third');
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(3);
      expect(notifications.map((n) => n.type)).toEqual(['success', 'error', 'info']);
    });

    it('auto-dismisses notification after 5 seconds', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification('info', 'Auto dismiss test');
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      // Advance time by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('dismissNotification', () => {
    it('removes a specific notification by id', () => {
      const store = useNotificationStore.getState();

      // Manually set notifications to control IDs
      useNotificationStore.setState({
        notifications: [
          { id: 'id-1', type: 'success', message: 'First', createdAt: new Date() },
          { id: 'id-2', type: 'error', message: 'Second', createdAt: new Date() },
          { id: 'id-3', type: 'info', message: 'Third', createdAt: new Date() },
        ],
      });

      act(() => {
        store.dismissNotification('id-2');
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(2);
      expect(notifications.map((n) => n.id)).toEqual(['id-1', 'id-3']);
    });

    it('does nothing when dismissing non-existent id', () => {
      useNotificationStore.setState({
        notifications: [{ id: 'id-1', type: 'success', message: 'Test', createdAt: new Date() }],
      });

      const { dismissNotification } = useNotificationStore.getState();

      act(() => {
        dismissNotification('non-existent');
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });
  });

  describe('clearAll', () => {
    it('removes all notifications', () => {
      useNotificationStore.setState({
        notifications: [
          { id: 'id-1', type: 'success', message: 'First', createdAt: new Date() },
          { id: 'id-2', type: 'error', message: 'Second', createdAt: new Date() },
        ],
      });

      const { clearAll } = useNotificationStore.getState();

      act(() => {
        clearAll();
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it('works when already empty', () => {
      const { clearAll } = useNotificationStore.getState();

      act(() => {
        clearAll();
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('outside React usage', () => {
    it('can be called outside React components', () => {
      // Simulating axios interceptor usage
      const addNotificationOutsideReact = () => {
        useNotificationStore.getState().addNotification('error', 'Request failed');
      };

      act(() => {
        addNotificationOutsideReact();
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]!.message).toBe('Request failed');
    });

    it('can subscribe to state changes', () => {
      const callback = vi.fn();
      const unsubscribe = useNotificationStore.subscribe(callback);

      act(() => {
        useNotificationStore.getState().addNotification('info', 'Test');
      });

      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });
  });
});
