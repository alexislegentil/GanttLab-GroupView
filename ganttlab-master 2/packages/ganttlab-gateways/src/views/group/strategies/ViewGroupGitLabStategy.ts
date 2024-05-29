import {
    ViewSourceStrategy,
    Configuration,
    PaginatedListOfTasks,
    Task,
    Filter,
    Project,
    Group,
    PaginatedList,
    PaginatedListOfProjects,
    Milestone,
    Source,
    User,
} from 'ganttlab-entities';
import { GitLabGateway } from '../../../sources/gitlab/GitLabGateway';
import { GitLabIssue } from '../../../sources/gitlab/types/GitLabIssue';
import {
    getTaskFromGitLabIssue,
    getPaginationFromGitLabHeaders,
    getMilestoneFromGitLabMilestone,
} from '../../../sources/gitlab/helpers';
import { GitLabProject } from '../../../sources/gitlab/types/GitLabProject';
import { Epic } from 'ganttlab-entities/dist/core/Epic';
import { GitLabMilestone } from '../../../sources/gitlab/types/GitLabMilestone';
import { GitLabUser } from '../../../sources/gitlab/types/GitLabUser';

export class ViewGroupGitLabStrategy implements ViewSourceStrategy<Group> {
    async execute(
        source: GitLabGateway,
        configuration: Configuration,
        filter: Filter | null
    ): Promise<Group> {
        const start = performance.now();

        const encodedGroup = encodeURIComponent(
            configuration.group.path as string,
        );

        const state = configuration.addClosedIssue ? 'all' : 'opened';

        let activeGroup: Group | null = null;
        let allTasksPaginated: PaginatedListOfTasks | null = null;
        let allTasksList: Array<Task> = [];

        // Fetch the group
        const groupResponse = await source.safeAxiosRequest<Group>({
            method: 'GET',
            url: `/groups/${encodedGroup}`,
        });

        // Fetch all labels for the group
        const labelsResponse = await source.safeAxiosRequest<Array<any>>({
            method: 'GET',
            url: `/groups/${encodedGroup}/labels`,
        });

        // Create a map of labels for quick lookup
        const labelsMap = new Map();
        for (const label of labelsResponse.data) {
            labelsMap.set(label.name, label);
        }

        // Fetch group members if user is admin
        const users: Array<User> = [];
        if (configuration.admin) {
            const usersResponse = await source.safeAxiosRequest<Array<GitLabUser>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/members/all`,
                params: {
                    per_page: 50,
                },
            });

            for (const gitlabUser of usersResponse.data) {
                const user = new User(
                    gitlabUser.id,
                    gitlabUser.email,
                    gitlabUser.username,
                    gitlabUser.avatar_url,
                    gitlabUser.web_url
                );
                users.push(user);
            }
        }

        const gitlabGroup = groupResponse.data;
        activeGroup = new Group(
            gitlabGroup.name,
            gitlabGroup.path,
            [],
            users,
            gitlabGroup.avatar_url,
            gitlabGroup.web_url,
            gitlabGroup.description
        );

        if (configuration.sortBy === 'epic') {
            // Handle epics
            await this.fetchEpics(source, encodedGroup, state, labelsMap, configuration, users, activeGroup);
        } else if (configuration.sortBy === 'projects') {
            // Handle projects
            await this.fetchProjects(source, encodedGroup, state, labelsMap, configuration, users, activeGroup);
        } else if (configuration.sortBy === 'milestones') {
            // Handle milestones
            await this.fetchMilestones(source, encodedGroup, state, labelsMap, configuration, users, activeGroup);
        }

        console.log(activeGroup);

        const end = performance.now();
        const executionTime = end - start;
        console.log(`Temps d'exécution requête : ${executionTime} millisecondes.`);

        if (!configuration.admin) {
            activeGroup.users = users;
        }

        return activeGroup;
    }

    async fetchEpics(
        source: GitLabGateway,
        encodedGroup: string,
        state: string,
        labelsMap: Map<string, any>,
        configuration: Configuration,
        users: Array<User>,
        activeGroup: Group
    ) {
        let epicPage = 1;
        const epicsList: Array<Epic> = [];

        while (true) {
            const epicsResponse = await source.safeAxiosRequest<Array<Epic>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/epics`,
                params: {
                    state: state,
                    per_page: 100,
                    page: epicPage,
                },
            });

            const epicPagination = getPaginationFromGitLabHeaders(epicsResponse.headers);

            for (const epic of epicsResponse.data) {
                const newEpic = new Epic(
                    epic.title,
                    epic.description,
                    epic.web_url,
                    epic.state,
                    epic.start_date,
                    epic.due_date,
                    epic.iid,
                    epic.created_at
                );

                if (epic.labels.length > 0) {
                    for (const labelName of epic.labels as any) {
                        const label = labelsMap.get(labelName);
                        if (label) {
                            newEpic.addLabel(label.name, label.color);
                        }
                    }
                }
                epicsList.push(newEpic);

                let tasksListByEpic: Task[] = [];
                const { data } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                    method: 'GET',
                    url: `/groups/${encodedGroup}/epics/${epic.iid}/issues`,
                    params: {
                        state: state,
                        per_page: 100,
                    },
                });

                const tasks = await this.processIssues(data, source, configuration, users, labelsMap);
                tasksListByEpic.push(...tasks);
                newEpic.addTasks(tasksListByEpic);
                activeGroup.addEpic(newEpic);
            }

            if (!epicPagination.nextPage) {
                break;
            }
            epicPage++;
        }

        let taskPage = 1;
        let allTasksList: Task[] = [];

        while (true) {
            const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/issues`,
                params: {
                    state: state,
                    epic_id: 'none',
                    scope: 'all',
                    per_page: 100,
                    page: taskPage,
                },
            });

            const pagination = getPaginationFromGitLabHeaders(headers);
            const tasks = await this.processIssues(data, source, configuration, users, labelsMap);
            allTasksList.push(...tasks);

            if (!pagination.nextPage) {
                break;
            }
            taskPage++;
        }

        activeGroup.addTasks(allTasksList);
    }

    async fetchProjects(
        source: GitLabGateway,
        encodedGroup: string,
        state: string,
        labelsMap: Map<string, any>,
        configuration: Configuration,
        users: Array<User>,
        activeGroup: Group
    ) {
        const projectsResponse = await source.safeAxiosRequest<Array<GitLabProject>>({
            method: 'GET',
            url: `/groups/${encodedGroup}/projects`,
            params: {
                scope: 'all',
            },
        });

        const projectsList: Array<Project> = [];
        const tasksList: Array<Task> = [];
        for (const gitlabProject of projectsResponse.data) {
            let tasksForActiveProject: PaginatedListOfTasks | null = null;
            let activeTaskList: Array<Task> = [];

            const project = new Project(
                gitlabProject.name,
                gitlabProject.path_with_namespace,
                gitlabProject.web_url,
                gitlabProject.description,
                gitlabProject.avatar_url
            );
            projectsList.push(project);
            activeGroup.addProjects(projectsList);

            const encodedProject = encodeURIComponent(
                gitlabProject.path_with_namespace as string,
            );

            let page = 1;
            let hasNextPage = true;

            while (hasNextPage) {
                const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                    method: 'GET',
                    url: `/projects/${encodedProject}/issues`,
                    params: {
                        state: state,
                        scope: 'all',
                        page: page,
                        per_page: 100,
                    },
                });

                const taskByProjectPagination = getPaginationFromGitLabHeaders(headers);
                const tasks = await this.processIssues(data, source, configuration, users, labelsMap);
                activeTaskList.push(...tasks);

                hasNextPage = taskByProjectPagination.nextPage ? true : false;
                page++;
            }
            project.addTasks(activeTaskList);
        }
    }

    async fetchMilestones(
        source: GitLabGateway,
        encodedGroup: string,
        state: string,
        labelsMap: Map<string, any>,
        configuration: Configuration,
        users: Array<User>,
        activeGroup: Group
    ) {
        const milestonesResponse = await source.safeAxiosRequest<
            Array<GitLabMilestone>
            >({
            method: 'GET',
            url: `/groups/${encodedGroup}/milestones`,
            params: {
                state: 'active',
            },
        });

        const milestonesList: Array<Milestone> = [];
        for (const milestone of milestonesResponse.data) {
            const newMilestone = getMilestoneFromGitLabMilestone(milestone);
            milestonesList.push(newMilestone);

            let milestoneIssuesList: Task[] = [];
            const { data } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/issues`,
                params: {
                    milestone: milestone.title,
                    state: state,
                    per_page: 100,
                },
            });

            const tasks = await this.processIssues(data, source, configuration, users, labelsMap);
            milestoneIssuesList.push(...tasks);
            newMilestone.addTasks(milestoneIssuesList);
        }
        activeGroup.addMilestones(milestonesList);

        let taskPage = 1;
        let allTasksList: Task[] = [];

        while (true) {
            const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/issues`,
                params: {
                    state: state,
                    milestone: 'none',
                    scope: 'all',
                    per_page: 100,
                    page: taskPage,
                },
            });

            const pagination = getPaginationFromGitLabHeaders(headers);
            const tasks = await this.processIssues(data, source, configuration, users, labelsMap);
            allTasksList.push(...tasks);

            if (!pagination.nextPage) {
                break;
            }
            taskPage++;
        }

        activeGroup.addTasks(allTasksList);
    }

    async processIssues(
        issues: Array<GitLabIssue>,
        source: GitLabGateway,
        configuration: Configuration,
        users: Array<User>,
        labelsMap: Map<string, any>
    ): Promise<Task[]> {
        return Promise.all(issues.map(async (gitlabIssue) => {
            if (gitlabIssue.state === 'closed' && !configuration.addClosedIssue) return null;

            const task = getTaskFromGitLabIssue(gitlabIssue);
            task.addState(gitlabIssue.state);

            if (gitlabIssue.assignees) {
                for (const user of gitlabIssue.assignees) {
                    task.addUser(user.username, user.id);
                }
            }

            if (gitlabIssue.labels) {
                for (const labelName of gitlabIssue.labels) {
                    const label = labelsMap.get(labelName);
                    if (label) {
                        task.addLabel(label.name, label.color);
                    }
                }
            }

            return task;
        })).then(results => results.filter(task => task !== null) as Task[]);
    }
    
    

    async uploadTasks(source: GitLabGateway, configuration: Configuration, tasks: Array<any>): Promise<void> {
        
        for (const task of tasks) {
           
            if (task.type === 'task'  && task.task_iid && task.project_id) {

                let assignee_ids: Array<number> = [];
                for (const user of task.user) {
                    if (user != "") assignee_ids.push(user.id) ;
                }
                let description = task.description || '';
                const ganttStartRegex = /GanttStart: \d{4}-\d{2}-\d{2}/;
                
                if (ganttStartRegex.test(description)) {
                    // Si la description contient déjà "GanttStart: date", remplacez la date
                    description = description.replace(ganttStartRegex, `GanttStart: ${task.start_date}`);
                } else {
                    // Sinon, ajoutez "GanttStart: date" au début de la description
                    description = `GanttStart: ${task.start_date}\n\n${description}`;
                }

                let state_event = '';
                if (task.state === "Closed") {
                    state_event = 'close';
                }
                else {
                    state_event = 'reopen';
                }
                
                const data = {
                    title: task.name,
                    description: description,
                    due_date: task.end_date,
                    assignee_ids: assignee_ids,
                    state_event: state_event,
                };
        
                try {
                    await source.safeAxiosRequest({
                        method: 'PUT',
                        url: `/projects/${task.project_id}/issues/${task.task_iid}`,
                        data: data
                    });
                    console.log(`Task ${task.id} updated successfully.`);
                } catch (error) {
                    console.error(`Failed to update task ${task.id}: ${error}`);
                }
            }
            else if (task.type === "task" && task.epic_id) {
                const encodedGroup = encodeURIComponent(
                    configuration.group.path as string,
                );
                const data = {
                    title: task.name,
                    start_date_fixed : task.start_date,
                    due_date_fixed : task.end_date
                };
        
                try {
                    await source.safeAxiosRequest({
                        method: 'PUT',
                        url: `/groups/${encodedGroup}/epics/${task.epic_id}`,
                        data: data
                    });
                    console.log(`Project ${task.id} updated successfully.`);
                } catch (error) {
                    console.error(`Failed to update project ${task.id}: ${error}`);
                }
            }
        }
    }
}








    