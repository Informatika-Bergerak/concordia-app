import "server-only";

export type GroupRealtimeEvent = {
  type: string;
  groupId?: number;
};

type GroupEventListener = (event: GroupRealtimeEvent) => void;

const groupListeners = new Map<number, Set<GroupEventListener>>();
const userListeners = new Map<number, Set<GroupEventListener>>();

function subscribe(
  listeners: Map<number, Set<GroupEventListener>>,
  id: number,
  listener: GroupEventListener,
) {
  const currentListeners = listeners.get(id) ?? new Set<GroupEventListener>();
  currentListeners.add(listener);
  listeners.set(id, currentListeners);

  return () => {
    currentListeners.delete(listener);
    if (currentListeners.size === 0) listeners.delete(id);
  };
}

export function subscribeToGroup(groupId: number, listener: GroupEventListener) {
  return subscribe(groupListeners, groupId, listener);
}

export function subscribeToUser(userId: number, listener: GroupEventListener) {
  return subscribe(userListeners, userId, listener);
}

export function emitGroupEvent(groupId: number, type: string) {
  for (const listener of groupListeners.get(groupId) ?? []) {
    listener({ groupId, type });
  }
}

/** Notify a user's group list, including tabs that are not inside a group chat. */
export function emitUserEvent(userId: number, type: string, groupId?: number) {
  for (const listener of userListeners.get(userId) ?? []) {
    listener({ groupId, type });
  }
}

