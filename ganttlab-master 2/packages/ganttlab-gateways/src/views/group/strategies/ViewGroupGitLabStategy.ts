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
    
    export class ViewGroupGitLabStrategy
        implements ViewSourceStrategy<Group> {
        async execute(
            source: GitLabGateway,
            configuration: Configuration,
            filter: Filter | null,
        ): Promise<Group> {

            const encodedGroup = encodeURIComponent(
                configuration.group.path as string,
            );

            const state = configuration.addClosedIssue ? 'all' : 'opened';

            let activeGroup: Group | null = null;
            let allTasksPaginated: PaginatedListOfTasks | null = null;
            let allTasksList: Array<Task> = [];

            const groupResponse = await source.safeAxiosRequest<Group>({
                method: 'GET',
                url: `/groups/${encodedGroup}`,
            });


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
                    const user = new User(gitlabUser.id, gitlabUser.email, gitlabUser.username, gitlabUser.avatar_url, gitlabUser.web_url);
                    users.push(user);
                }
            }
            
            
      
            
            const gitlabGroup = groupResponse.data;
            activeGroup = new Group(gitlabGroup.name, gitlabGroup.path, [] , users , gitlabGroup.avatar_url , gitlabGroup.web_url , gitlabGroup.description);

         

            if (configuration.sortBy === 'epic') {
            
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
                        const newEpic = new Epic(epic.title, epic.description, epic.web_url, epic.state, epic.start_date, epic.due_date, epic.iid);
                        epicsList.push(newEpic);
                
                        let tasksListByEpic: Task[] = [];
                
                            const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                                method: 'GET',
                                url: `/groups/${encodedGroup}/epics/${epic.iid}/issues`,
                            });
                
                
                            for (const gitlabIssue of data) {
                                if (gitlabIssue.state === 'closed' && !configuration.addClosedIssue) {
                                    continue;
                                }

                                const task = getTaskFromGitLabIssue(gitlabIssue);
                                task.addState(gitlabIssue.state);
                                if (gitlabIssue.assignees) {
                                    for (const user of gitlabIssue.assignees) {
                                        task.addUser(user.username, user.id);
                                    }
                                } 
                                if (gitlabIssue.labels) {
                                    for (const labelName of gitlabIssue.labels) {
                                        const label = await source.safeAxiosRequest<any>({
                                            method: 'GET',
                                            url: `/projects/${gitlabIssue.project_id}/labels/${labelName}`,
                                        });
                                        task.addLabel(labelName, label.data.color);
                                    }
                                }

                                if (configuration.displayLink) {
                                    const blockedBy = await source.safeAxiosRequest<Array<any>>({
                                        method: 'GET',
                                        url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                                    });
                                    for (const link of blockedBy.data) {
                                        if (link.link_type === 'is_blocked_by') {
                                        task.addBlockedBy(link.title);
                                        }
                                    }
                                }
                                
                                tasksListByEpic.push(task);
                            }
                        
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

                for (const gitlabIssue of data) {
                    const task = getTaskFromGitLabIssue(gitlabIssue);
                    task.addState(gitlabIssue.state);

                    if (gitlabIssue.assignees) {
                        for (const user of gitlabIssue.assignees) {
                            task.addUser(user.username, user.id);
                        }
                    }

                    if (configuration.displayLink) {
                        const blockedBy = await source.safeAxiosRequest<Array<any>>({
                            method: 'GET',
                            url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                        });

                        for (const link of blockedBy.data) {
                            if (link.link_type === 'is_blocked_by') {
                                task.addBlockedBy(link.title);
                            }
                        }
                    }

                    allTasksList.push(task);
                }

                if (!pagination.nextPage) {
                    break;
                }

                taskPage++;
            }

            activeGroup.addTasks(allTasksList);
        }


            //does the group have projects?
            else if (configuration.sortBy === 'projects') {

            const projectsResponse = await source.safeAxiosRequest<Array<GitLabProject>>({
                method: 'GET',
                url: `/groups/${encodedGroup}/projects`,
                params: {
                    scope : 'all',
                 //   archived: false,
                },
            });
            const projectPagination = getPaginationFromGitLabHeaders(projectsResponse.headers);
            let tasksForAllProjects: PaginatedListOfTasks | null = null;
            let tasksForActiveGroup: PaginatedListOfProjects | null = null;
            
            const projectsList: Array<Project> = [];
            const tasksList: Array<Task> = [];
            for (
                let projectIndex = 0;
                projectIndex < projectsResponse.data.length;
                projectIndex++
            ) 
                {
                    let tasksForActiveProject: PaginatedListOfTasks | null = null;
                    let activeTaskList: Array<Task> = [];

                    const gitlabProject = projectsResponse.data[projectIndex];
                    const project = new Project(gitlabProject.name, gitlabProject.path_with_namespace, gitlabProject.web_url, gitlabProject.description, gitlabProject.avatar_url);
                    projectsList.push(project);
                    activeGroup.addProjects(projectsList);
                    
                    const encodedProject = encodeURIComponent(
                        gitlabProject.path_with_namespace as string,
                    );
        
                        const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                            method: 'GET',
                            url: `/projects/${encodedProject}/issues`,
                            params: {
                                state: state,
                                scope : 'all',
                            //  group: gitlabProject.name,
                            },
                        });
                    
                        for (const gitlabIssue of data) {
                            const task = getTaskFromGitLabIssue(gitlabIssue);
                            tasksList.push(task);
                            task.addState(gitlabIssue.state);
                            if (gitlabIssue.assignees) {
                                for (const user of gitlabIssue.assignees) {
                                    task.addUser(user.username, user.id);
                                }
                            } 
                            if (gitlabIssue.labels) {
                                for (const labelName of gitlabIssue.labels) {
                                    const label = await source.safeAxiosRequest<any>({
                                        method: 'GET',
                                        url: `/projects/${gitlabIssue.project_id}/labels/${labelName}`,
                                    });
                                    task.addLabel(labelName, label.data.color);
                                }
                            }
                            const blockedBy = await source.safeAxiosRequest<Array<any>>({
                                method: 'GET',
                                url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                            });
                            for (const link of blockedBy.data) {
                                if (link.link_type === 'is_blocked_by') {
                                task.addBlockedBy(link.title);
                                }
                            }
                            activeTaskList.push(task);
                        }   
                        
                        tasksForActiveProject = new PaginatedListOfTasks(
                            activeTaskList,
                            configuration.tasks.page as number,
                            configuration.tasks.pageSize as number,
                            projectPagination.previousPage,
                            projectPagination.nextPage,
                            projectPagination.lastPage,
                            projectPagination.total,
                        );

                        project.addTasks(tasksForActiveProject);
                }
            }

            else if (configuration.sortBy === 'milestones') {
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
                for (const gitlabMilestone of milestonesResponse.data) {
          
                    const milestone = getMilestoneFromGitLabMilestone(gitlabMilestone);
                    milestonesList.push(milestone);
                    let tasksForMilestones: PaginatedListOfTasks | null = null;
                    let tasksListByMilestone: Array<Task> = [];
            
                    const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                        method: 'GET',
                        url: `/groups/${encodedGroup}/issues`,
                        params: {
                            milestone: milestone.name,
                        },
                    });
                    const milestonePagination = getPaginationFromGitLabHeaders(headers);
                    for (const gitlabIssue of data) {
                        const task = getTaskFromGitLabIssue(gitlabIssue);
                        task.addState(gitlabIssue.state);
                        if (gitlabIssue.assignees) {
                            for (const user of gitlabIssue.assignees) {
                                task.addUser(user.username, user.id);
                            }
                        } 
                        if (gitlabIssue.labels) {
                            for (const labelName of gitlabIssue.labels) {
                                const label = await source.safeAxiosRequest<any>({
                                    method: 'GET',
                                    url: `/projects/${gitlabIssue.project_id}/labels/${labelName}`,
                                });
                                task.addLabel(labelName, label.data.color);
                            }
                        }
                        const blockedBy = await source.safeAxiosRequest<Array<any>>({
                            method: 'GET',
                            url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                        });
                        for (const link of blockedBy.data) {
                            if (link.link_type === 'is_blocked_by') {
                                task.addBlockedBy(link.title);
                            }
                        }
                        tasksListByMilestone.push(task);
                    }
            
                    tasksForMilestones = new PaginatedListOfTasks(
                        tasksListByMilestone,
                        configuration.tasks.page as number,
                        configuration.tasks.pageSize as number,
                        milestonePagination.previousPage,
                        milestonePagination.nextPage,
                        milestonePagination.lastPage,
                        milestonePagination.total,
                    );
            
                    milestone.addTasks(tasksForMilestones);
                }
                activeGroup.addMilestones(milestonesList);
            
              let allTaskPage = 1;
                let allTasksList: Task[] = [];

                while (true) {
                    const { data, headers } = await source.safeAxiosRequest<Array<GitLabIssue>>({
                        method: 'GET',
                        url: `/groups/${encodedGroup}/issues`,
                        params: {
                            per_page: 100,
                            page: allTaskPage,
                            state: state,
                            milestone: 'none',
                        },
                    });

                    const pagination = getPaginationFromGitLabHeaders(headers);

                    for (const gitlabIssue of data) {
                        const task = getTaskFromGitLabIssue(gitlabIssue);
                        task.addState(gitlabIssue.state);

                        if (gitlabIssue.assignees) {
                            for (const user of gitlabIssue.assignees) {
                                task.addUser(user.username, user.id);
                            }
                        }

                        if (gitlabIssue.labels) {
                            for (const labelName of gitlabIssue.labels) {
                                const label = await source.safeAxiosRequest<any>({
                                    method: 'GET',
                                    url: `/projects/${gitlabIssue.project_id}/labels/${labelName}`,
                                });
                                task.addLabel(labelName, label.data.color);
                            }
                        }

                        const blockedBy = await source.safeAxiosRequest<Array<any>>({
                            method: 'GET',
                            url: `/projects/${gitlabIssue.project_id}/issues/${gitlabIssue.iid}/links`,
                        });

                        for (const link of blockedBy.data) {
                            if (link.link_type === 'is_blocked_by') {
                                task.addBlockedBy(link.title);
                            }
                        }

                        allTasksList.push(task);
                    }

                    if (!pagination.nextPage) {
                        break;
                    }

                    allTaskPage++;
                }

                activeGroup.addTasks(allTasksList);}

            console.log(activeGroup);            
            return activeGroup;
          //  return tasksForAllProjects as PaginatedListOfTasks;
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
                        description = `GanttStart: ${task.start_date}\n${description}`;
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
  