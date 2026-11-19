import "server-only";

type GroupEventListener = (event: { type: string; groupId: number }) => void;

const listeners = new Map<number, Set<GroupEventListener>>();

export function subscribeToGroup(groupId: number, listener: GroupEventListener) {
  const groupListeners = listeners.get(groupId) ?? new Set<GroupEventListener>();
  groupListeners.add(listener);
  listeners.set(groupId, groupListeners);

  return () => {
    groupListeners.delete(listener);
    if (groupListeners.size === 0) listeners.delete(groupId);
  };
}

export function emitGroupEvent(groupId: number, type: string) {
  for (const listener of listeners.get(groupId) ?? []) {
    listener({ groupId, type });
  }
}

