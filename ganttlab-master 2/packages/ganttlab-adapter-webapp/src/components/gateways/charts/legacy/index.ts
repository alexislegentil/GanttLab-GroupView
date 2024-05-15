import { Group, Task } from 'ganttlab-entities';
import moment from 'moment-timezone';

interface LegacyTask {
  title: string;
  link: string;
  data: [[string, number, string]] | null;
}


interface LegacyDhtmlXgantt {
  id: number;
  task_iid?: number;
  epic_id?: number;
  project_id?: number | string;
  milestone_id?: number;
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  duration?: number | null;
  parent: number;
  progress: number;
  state?: TaskState | null;
  type?: string;
  users?: Array<Object> | null;
  labels?: any[];
  color?: string;
  row_height?: number;
  level: number;
}

interface DhtmlxLink {
  id: number;
  source: number;
  target: number;
  type: string;
}

export enum TaskState {
  Unassigned = 'Unassigned',
  Closed = 'Closed',
  InProgress = 'InProgress',
  Late = 'Late',
  Unscheduled = 'Unscheduled'
}

function getStateFromGitLabState(task: Task): TaskState{
  let taskState: TaskState | null = null;

        if (task.due) {
          switch (task.state) {
            case 'closed':
              taskState = TaskState.Closed;
              break;
            case 'opened':
              taskState = task.users && task.users.length > 0 ? TaskState.InProgress : TaskState.Unassigned;
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
    return taskState;
}

function getTaskIdFromTitle(convertedGroup: Array<LegacyDhtmlXgantt>, title: string): number {
  let id = 0;
  for (const task of convertedGroup) {
    if (task.name === title) {
      id = task.id;
      break;
    }
  }
  return id;
}


/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/class-name-casing */
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
      epic_id: epic.iid,
      name: epic.title,
      start_date: epic.start_date ?  moment(epic.start_date).format('YYYY-MM-DD HH:mm:ss') : null,
      end_date: epic.due_date ?  moment(epic.due_date).format('YYYY-MM-DD HH:mm:ss') : null,
      parent: 0,
      progress: 0,
      type:  epic.start_date  && epic.due_date ? "task" : "project",  //like this, if there are fixed dates there are priorities, and if not the dates are the child issues ones
      color:"#4f4e4e",
      row_height: 25,
      level: 0
    };
    taskID++;
    data.push(epicRow);

    if (epic.Tasks && epic.Tasks) {
      for (const task of epic.Tasks) {
        const taskState: TaskState | null = getStateFromGitLabState(task);
          let labels: any[] = [];
          if (task.labels && task.labels.length > 0) {
            labels = task.labels;
          }
          
        const taskRow : LegacyDhtmlXgantt = {
          id: taskID,
          project_id: task.project_id,
          task_iid: task.iid,
          name: task.title,
          description: task.description,
          start_date: task.start ? moment(task.start).format('YYYY-MM-DD HH:mm:ss') : epicRow.start_date,
          end_date: task.due ? moment(task.due).format('YYYY-MM-DD HH:mm:ss') : null,
          duration: task.due ? null : moment(task.start).diff(moment(epicRow.start_date), 'days'),
          parent: epicRow.id,
          progress: 0,
          state: taskState ? taskState : null,
          users: task.users,
          type: "task",
          labels: labels,
          level: 1
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
      type: "project",
      color:"#4f4e4e",
      row_height: 25,
      level: 0
    };
    taskID++;
    data.push(projectRow);
    if (project.tasks && project.tasks.list) {
      for (const task of project.tasks.list) {
        const taskState: TaskState | null = getStateFromGitLabState(task);
          let labels: any[] = [];
          if (task.labels && task.labels.length > 0) {
            labels = task.labels;
          }
          const taskRow : LegacyDhtmlXgantt = {
            id: taskID,
            project_id: task.project_id,
            task_iid: task.iid,
            name: task.title,
            description: task.description,
            start_date: task.start ? moment(task.start).format('YYYY-MM-DD HH:mm:ss') : projectRow.start_date,
            end_date: task.due ? moment(task.due).format('YYYY-MM-DD HH:mm:ss') : null,
            duration: task.due ? null : moment(task.start).diff(moment(projectRow.start_date), 'days'),
            parent: projectRow.id,
            progress: 0,
            state: taskState ? taskState : null,
            users: task.users,
            type: "task",
            labels: labels,
            level: 1
          };
        data.push(taskRow);
        taskID++;
      }
    }
  }
}

if (group.milestones && group.milestones.length > 0) {
  // Convert milestones
  for (const milestone of group.milestones) {
    const milestoneRow : LegacyDhtmlXgantt = {
      id: taskID,
      name: milestone.name,
      end_date: milestone.due? moment(milestone.due).format('YYYY-MM-DD HH:mm:ss') : null,
      start_date: milestone.start? moment(milestone.start).format('YYYY-MM-DD HH:mm:ss') : null,
      parent: 0,
      progress: 0,
      type: "project",
      color:"#4f4e4e",
      row_height: 25,
      level: 0
    };
    taskID++;
    data.push(milestoneRow);
    if (milestone.tasks && milestone.tasks.list) {
      for (const task of milestone.tasks.list) {
        const taskState: TaskState | null = getStateFromGitLabState(task);
          let labels: any[] = [];
          if (task.labels && task.labels.length > 0) {
            labels = task.labels;
          }
        const taskRow : LegacyDhtmlXgantt = {
          id: taskID,
          project_id: task.project_id,
          task_iid: task.iid,
          name: task.title,
          description: task.description,
          start_date: task.start ? moment(task.start).format('YYYY-MM-DD HH:mm:ss') : milestoneRow.start_date,
          end_date: task.due ? moment(task.due).format('YYYY-MM-DD HH:mm:ss') : null,
          duration: task.due ? null : moment(task.start).diff(moment(milestoneRow.start_date), 'days'),
          parent: milestoneRow.id,
          progress: 0,
          state: taskState ? taskState : null,
          users: task.users,
          type: "task",
          labels: labels,
          level: 1
        };
        data.push(taskRow);
        taskID++;
      }
    }
  }
}

if (group.tasks && group.tasks && group.tasks.length > 0) {
  
  // Add standalone tasks
  for (const task of group.tasks) {
    const taskState: TaskState | null = getStateFromGitLabState(task);
      let labels: any[] = [];
          if (task.labels && task.labels.length > 0) {
            labels = task.labels;
          }

    const taskRow : LegacyDhtmlXgantt = {
      id: taskID,
      project_id: task.project_id,
      task_iid: task.iid,
      name: task.title,
      description: task.description,
      start_date: task.start ? moment(task.start).format('YYYY-MM-DD HH:mm:ss') : null,
      end_date: task.due ? moment(task.due).format('YYYY-MM-DD HH:mm:ss') : null,
      duration: task.due && task.start ? moment(task.start).diff(moment(task.due), 'days') : null,
      parent: 0,
      progress: 0,
      state: taskState ? taskState : null,
      users: task.users,
      type: "task",
      labels: labels,
      level: 1
    };
    data.push(taskRow);
    taskID++;
  }
}
  return  data ;
}

export function getLinksFromGroup(group: Group, convertedGroup: Array<LegacyDhtmlXgantt>): Array<DhtmlxLink> {
  const links: Array<DhtmlxLink> = [];
  let linkID = 1;

  // Convert epics
  if (group.epics && group.epics.length > 0) {
    for (const epic of group.epics) {
      if (epic.Tasks && epic.Tasks) {
        for (const task of epic.Tasks) {
          if (task.blockedBy && task.blockedBy.length > 0) {
            for (const blockedBy of task.blockedBy) {
              const link : DhtmlxLink = {
                id: linkID,
                source: getTaskIdFromTitle(convertedGroup, blockedBy),
                target: getTaskIdFromTitle(convertedGroup, task.title),
                type: "0"
              };
              links.push(link);
              linkID++;
            }
          }
        }
      }
    }
  }

  if (group.projects && group.projects.length > 0) {
    // Convert projects
    for (const project of group.projects) {
      if (project.tasks && project.tasks.list) {
        for (const task of project.tasks.list) {
          if (task.blockedBy && task.blockedBy.length > 0) {
            for (const blockedBy of task.blockedBy) {
              const link : DhtmlxLink = {
                id: linkID,
                source: getTaskIdFromTitle(convertedGroup, blockedBy),
                target: getTaskIdFromTitle(convertedGroup, task.title),
                type: "0"
              };
              links.push(link);
              linkID++;
            }
          }
        }
      }
    }
  }

  if (group.tasks && group.tasks && group.tasks.length > 0) {
    // Add standalone tasks
    for (const task of group.tasks) {
      if (task.blockedBy && task.blockedBy.length > 0) {
        for (const blockedBy of task.blockedBy) {
          const link : DhtmlxLink = {
            id: linkID,
            source: getTaskIdFromTitle(convertedGroup, blockedBy),
            target: getTaskIdFromTitle(convertedGroup, task.title),
            type: "0"
          };
          links.push(link);
          linkID++;
        }
      }
    }
  }
  return links;
}





