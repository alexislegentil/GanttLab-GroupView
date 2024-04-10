import { Group, Task } from 'ganttlab-entities';
import moment from 'moment-timezone';

interface LegacyTask {
  title: string;
  link: string;
  data: [[string, number, string]] | null;
}

interface LegacyContainer {
  name: string;
  tasks: Array<LegacyTask>;
}

interface LegacyGroup {
  name: string;
  groupTaskContainers: Array<LegacyContainer>;
  TasksNotContained: Array<LegacyTask>;
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

export function getConvertedGroups(group: Group): LegacyGroup{
  const convertedGroup: LegacyGroup = {} as LegacyGroup;
  convertedGroup.name = group.name;
  if (group.epics && group.epics.length > 0) {
    convertedGroup.groupTaskContainers = [];
    for (const epic of group.epics) {
      if (epic.Tasks) {
        const convertedContainer: LegacyContainer = {} as LegacyContainer;
        convertedContainer.name = epic.title;
        convertedContainer.tasks = getConvertedTasks(epic.Tasks.list);
        convertedGroup.groupTaskContainers.push(convertedContainer);
      }
    }
  }
  else if (group.projects && group.projects.length > 0) {
    convertedGroup.groupTaskContainers = [];
    for (const project of group.projects) {
      if (project.tasks && project.tasks.list.length > 0) {
        const convertedContainer: LegacyContainer = {} as LegacyContainer;
        convertedContainer.name = project.name;
        convertedContainer.tasks = getConvertedTasks(project.tasks.list);
        convertedGroup.groupTaskContainers.push(convertedContainer);
      }
    }
  }

  if (group.tasks && group.tasks.list.length > 0) {
    convertedGroup.TasksNotContained = getConvertedTasks(group.tasks.list);
  }

  return convertedGroup;
}

