// Open a task's page from anywhere in a dashboard (Earnings, Payments,
// notification links). The dashboard switches to its "My Tasks" tab and the
// task list opens that task. A pending id is kept so the list can pick it up
// when it mounts after the tab switch.
const pending = {};

export function requestOpenTask(scope, taskId) {
  if (!taskId) return;
  pending[scope] = String(taskId);
  window.dispatchEvent(new CustomEvent('open-task', { detail: { scope, taskId: String(taskId) } }));
}

export function takePendingTask(scope) {
  const id = pending[scope] || null;
  delete pending[scope];
  return id;
}
