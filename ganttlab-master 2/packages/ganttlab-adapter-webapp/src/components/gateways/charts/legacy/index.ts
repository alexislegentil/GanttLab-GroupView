import { Group, Task } from 'ganttlab-entities';
import moment from 'moment-timezone';

interface LegacyTask {
  title: string;
  link: string;
  data: [[string, number, string]] | null;
}

interface LegacyDhtmlXgantt {
  id: number;
  name: string;
  start_date: string | null;
  duration: number | null;
  parent: number;
  progress: number;
  state?: TaskState | null;
  user?: string | null;
}

export enum TaskState {
  Opened = 'Opened',
  Closed = 'Closed',
  InProgress = 'InProgress',
  Late = 'Late',
  Unscheduled = 'Unscheduled'
}



export function getConvertedTasks(tasks: Array<Task>): Array<LegacyTask> {
  const convertedTasks: Array<LegacyTask> = [];
  for (const aTask of tasks) {
    // stripping task title to the first 42 characters
    let title = aTask.title;
    if (title.length > 42) {
      title = title.substring(0, 42) + '...';
    }

    // if due date is null, we set it to the task due date, or to the day after the task creation date
    const dueDate = aTask.due
      ? aTask.due
      : moment(aTask.start).add(1, 'days').toDate();

    // determining if the task is late or not
    const today = new Date();
    let status = 1;
    if (dueDate && dueDate < today) {
      status = 0;
    }

    const invalid = 'NaN-NaN-NaN';

    // formatting start and due dates for visavail
    const fDueDate = dueDate
      ? moment(dueDate).format('YYYY-MM-DD HH:mm:ss')
      : invalid;
    const fStartDate = aTask.start
      ? moment(aTask.start).format('YYYY-MM-DD HH:mm:ss')
      : invalid;

    // filtering invalid start or due date
    if (fDueDate === invalid || fStartDate === invalid) {
      console.error('This Task is malformed:');
      console.error(aTask);
      continue;
    }

    // creating the dataset
    const aConvertedTask: LegacyTask = {
      title: title,
      link: aTask.url,
      data: [[fStartDate, status, fDueDate]],
    };

    // adding the dataset built to the main dataset list
    convertedTasks.push(aConvertedTask);
  }
  return convertedTasks;
}

export function getConvertedGroup(group: Group): Array<LegacyDhtmlXgantt> {
  const data: Array<LegacyDhtmlXgantt> = [];
  let taskID = 1;

  // Convert epics
if (group.epics && group.epics.length > 0) {
  for (const epic of group.epics) {
    const epicRow : LegacyDhtmlXgantt = {
      id: taskID,
      name: epic.title,
      start_date: moment(epic.start_date).format('YYYY-MM-DD HH:mm:ss'),
      duration: moment(epic.due_date).diff(moment(epic.start_date), 'days'),
      parent: 0,
      progress: 0,
    };
    taskID++;
    data.push(epicRow);

    if (epic.Tasks && epic.Tasks.list) {
      for (const task of epic.Tasks.list) {

        let taskState: TaskState | null = null;

        if (task.due) {
          switch (task.state) {
            case 'closed':
              taskState = TaskState.Closed;
              break;
            case 'opened':
              taskState = task.user ? TaskState.InProgress : TaskState.Opened;
              if (task.due < new Date()) {
                taskState = TaskState.Late;
              }
              break;
            default:
              taskState = TaskState.Unscheduled;
              break;
          }
        } else {
          taskState = TaskState.Unscheduled;
        }

        const taskRow : LegacyDhtmlXgantt = {
          id: taskID,
          name: task.title,
          start_date: moment(task.start).format('YYYY-MM-DD HH:mm:ss'),
          duration: moment(task.due).diff(moment(task.start), 'days'),
          parent: epicRow.id,
          progress: 0,
          state: taskState ? taskState : null,
          user: task.user ? task.user : null,
        };
        data.push(taskRow);
        taskID++;
      }
    }
  }
}

if (group.projects && group.projects.length > 0) {
  // Convert projects
  for (const project of group.projects) {
    const projectRow : LegacyDhtmlXgantt = {
      id: taskID,
      name: project.name,
      start_date: null,
      duration: null,
      parent: 0,
      progress: 0,
    };
    taskID++;
    data.push(projectRow);
    if (project.tasks && project.tasks.list) {
      for (const task of project.tasks.list) {
        let taskState: TaskState | null = null;

        if (task.due) {
          switch (task.state) {
            case 'closed':
              taskState = TaskState.Closed;
              break;
            case 'opened':
              taskState = task.user ? TaskState.InProgress : TaskState.Opened;
              if (task.due < new Date()) {
                taskState = TaskState.Late;
              }
              break;
            default:
              taskState = TaskState.Unscheduled;
              break;
          }
        } else {
          taskState = TaskState.Unscheduled;
        }
        const taskRow : LegacyDhtmlXgantt = {
          id: taskID,
          name: task.title,
          start_date: moment(task.start).format('YYYY-MM-DD HH:mm:ss'),
          duration: moment(task.due).diff(moment(task.start), 'days'),
          parent: projectRow.id,
          progress: 0,
          state: taskState ? taskState : null,
          user: task.user ? task.user : null,
        };
        data.push(taskRow);
        taskID++;
      }
    }
  }
}

if (group.tasks && group.tasks.list && group.tasks.list.length > 0) {
  // Add standalone tasks
  for (const task of group.tasks.list) {
    let taskState: TaskState | null = null;

    if (task.due) {
      switch (task.state) {
        case 'closed':
          taskState = TaskState.Closed;
          break;
        case 'opened':
          taskState = task.user ? TaskState.InProgress : TaskState.Opened;
          if (task.due < new Date()) {
            taskState = TaskState.Late;
          }
          break;
        default:
          taskState = TaskState.Unscheduled;
          break;
      }
    } else {
      taskState = TaskState.Unscheduled;
    }
    const taskRow : LegacyDhtmlXgantt = {
      id: taskID,
      name: task.title,
      start_date: moment(task.start).format('YYYY-MM-DD HH:mm:ss'),
      duration: moment(task.due).diff(moment(task.start), 'days'),
      parent: 0,
      progress: 0,
      state: taskState ? taskState : null,
      user: task.user ? task.user : null,
    };
    data.push(taskRow);
    taskID++;
  }
}
  return  data ;
}


