<template>
  <div class="gantt-container">
    <button class="button" @click="toggleRightContainer">{{ rightContainerVisible ? 'Hide' : 'Show' }} logs</button>
    <transition name="slide">
    <div class="right-container" v-show="rightContainerVisible">
      <div class="gantt-selected-info">
        <div v-if="selectedTask">
          <h2>{{ selectedTask.name }}</h2>
          <span><b>ID: </b>{{ selectedTask.id }}</span
          ><br />
          <span><b>Progress: </b> {{ progressPercentage }}</span
          ><br />
          <span><b>Start Date: </b
            >{{ formattedStartDate }}</span
          ><br />
          <span><b>End Date: </b>{{ formattedEndDate }}</span
          ><br />
          <span><b>Assign to: </b>{{ formattedAssignTo }}</span
          ><br />
          <span><b>State: </b>{{ formattedState }}</span
          ><br />
        </div>
        <div v-else class="select-task-prompt">
          <h2>Click any task</h2>
        </div>
      </div>
      <ul class="gantt-messages">
        <h2>Logs</h2>
        <li
          class="gantt-message"
          v-for="(message, index) in messages"
          v-bind:key="index"
        >
          {{ message }}
        </li>
      </ul>
    </div>
  </transition>
    <GanttComponent
      class="left-ganttContainer"
      :tasks="tasks"
      :requests-queue="requestsQueue"
      :users="users"
      @task-updated="logTaskUpdate"
      @link-updated="logLinkUpdate"
      @task-selected="selectTask"
      @upload-tasks="uploadTasks"
    ></GanttComponent>
  </div>
</template>
 
<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
import { Component, Prop, Vue } from 'vue-property-decorator';
import GanttComponent from './legacy/GanttComponent.vue';
import { getConvertedGroup } from './legacy/index';
import { getLinksFromGroup } from './legacy/index';
import { Group, Project, User } from 'ganttlab-entities';
import { gantt } from 'dhtmlx-gantt';

@Component({
  components: {
    GanttComponent
  }
})

export default class GroupChartMediator extends Vue {
  @Prop() readonly group!: Group;

  public convertedGroup = getConvertedGroup(this.group);
  public links = getLinksFromGroup(this.group, this.convertedGroup);
  public messages: Array<string> = [];
  public selectedTask: any = null;
  public rightContainerVisible = false;
  public requestsQueue: Array<any> = [];
  public users: Array<User> = this.group.users;

  selectTask(task:any){
      this.selectedTask = task
  }

  get tasks() {
    console.log(this.convertedGroup);
    return {
      data: this.convertedGroup,
      links: this.links
    };
  }

  addMessage (message: string) {
      this.messages.unshift(message)
      if (this.messages.length > 40) {
        this.messages.pop()
      }
  }

  mounted() {
    this.$on('task-updated', this.logTaskUpdate);
  }

  logTaskUpdate (id: number, mode: string, task:any) {
      const text = (task && task.name ? ` (${task.name})`: '');
      const message = `Task ${mode}: ${id} ${text}`;
      this.addMessage(message);
      this.convertToRequest(task);
  }

  logLinkUpdate (id: number, mode: string, link:any) {
    let message = `Link ${mode}: ${id}`
    if (link) {
      message += ` ( source: ${link.source}, target: ${link.target} )`
    }
    this.addMessage(message)
  }

  convertToRequest (task:any) {
    const request = {
      id: task.id,
      task_iid: task.task_iid,
      project_id: task.project_id,
      epic_id: task.epic_id,
      name: task.name,
      description: task.description,
      start_date: task.start_date,
      end_date: task.end_date,
      progress: task.progress,
      user: task.users,
      state: task.state,
      type: task.type? task.type : 'task'
    }
    if (this.requestsQueue.some(req => req.id === request.id)) {
      const oldtask = gantt.getTask(request.id);
      
      for (const attr in request) {
        // eslint-disable-next-line no-prototype-builtins
        if (request.hasOwnProperty(attr) && oldtask.hasOwnProperty(attr) && request[attr as keyof typeof request] !== oldtask[attr as keyof typeof oldtask]) {
          switch (attr) {
            case 'name':
            case 'description':
            case 'start_date':
            case 'end_date':
            case 'state':
            case 'user': {
              const indexToUpdate = this.requestsQueue.findIndex(req => req.id === request.id);
              if (indexToUpdate !== -1) {
                const updatedRequest = { ...this.requestsQueue[indexToUpdate], [attr]: request[attr] };
                this.requestsQueue.splice(indexToUpdate, 1, updatedRequest);
              }
              break;
            }
          }
        }
      }
      return;
    }
    else {
      this.requestsQueue.push(request)
    }
  }

async uploadTasks () {
  try {
    await this.$emit('upload-tasks', this.requestsQueue);
  } catch (error) {
    console.error("Une erreur s'est produite lors de l'envoi des tâches :", error);
  } finally {
    this.requestsQueue = [];
  }
}
  

  toggleRightContainer() {
    this.rightContainerVisible = !this.rightContainerVisible;
  }

  get progressPercentage() {
      const taskProgress = this.selectedTask.progress;
      if (!taskProgress) {
        return "0";
      }
      return `${Math.round(+taskProgress * 100)} %`;
    }

  get formattedStartDate() {
      const taskStart = this.selectedTask.start_date;
      return `${taskStart.getFullYear()} / ${taskStart.getMonth() + 1} / ${taskStart.getDate()}`;
    }

  get formattedEndDate() {
      const taskEnd = this.selectedTask.end_date;
      return `${taskEnd.getFullYear()} / ${taskEnd.getMonth() + 1} / ${taskEnd.getDate()}`;
  }

  get formattedAssignTo() {
      return this.selectedTask.user;
  }
  
  get formattedState() {
      return this.selectedTask.state;
  }
  
}

</script>

<style>
  .gantt-container {
    height: 92vh;
    width: 100%;
  }
  .left-ganttContainer {
    overflow: hidden;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .right-container {
    border-right: 1px solid #cecece;
    float: right;
    height: 100%;
    width: 340px;
    box-shadow: 0 0 5px 2px #aaa;
    position: relative;
    z-index:2;
    background-color: #f9f9f9;
  }
  .gantt-messages {
    list-style-type: none;
    height: 65%;
    margin: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding-left: 5px;
  }

  .gantt-messages > h2 {
    font-weight: bold;
    text-align: center;
    font-size: larger;
    border-bottom: 1px solid #cecece;
  }

  .gantt-messages > .gantt-message {
    background-color: #f4f4f4;
    box-shadow:inset 5px 0 #d69000;
    font-size: 14px;
    margin: 5px 0;
    padding: 8px 0 8px 10px;
  }
  .gantt-selected-info {
    border-bottom: 1px solid #cecece;
    box-sizing: border-box;
    height: 30%;
    line-height: 15px;
    padding: 10px;
  background-color: #f9f9f9; 
  border: 1px solid #ddd; 
  border-radius: 5px; 
  margin-bottom: 20px;
  }
  .gantt-selected-info h2 {
    border-bottom: 1px solid #cecece;
    font-weight: bold;
    margin-bottom: 1em;
    padding: 10px;
  }

  .gantt-selected-info span {
  display: block; 
}
  .select-task-prompt h2{
    color: #d9d9d9;
  }

  .button {
  background-color: #4CAF50; 
  border: none; 
  color: white; 
  padding: 5px 10px; 
  border-radius: 5px;
  text-align: center; 
  text-decoration: none; 
  display: inline-block;
  font-size: 13px;
  margin: 4px 2px;
  cursor: pointer; 
  transition-duration: 0.4s; 
}

.button:hover {
  background-color: #45a049;
}

.slide-enter-active, .slide-leave-active {
  transition: all .5s ease;
}
.slide-enter, .slide-leave-to {
  transform: translateX(100%);
}
</style>