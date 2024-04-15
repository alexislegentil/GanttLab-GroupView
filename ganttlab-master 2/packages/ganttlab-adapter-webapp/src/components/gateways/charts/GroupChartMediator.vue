<template>
  <div class="ganttContainer w-full">
    <GanttComponent class="left-ganttContainer" :tasks="tasks"></GanttComponent>
  </div>
</template>
 
<script>
import GanttComponent from './legacy/GanttComponent.vue';
 
export default {
  name: 'app',
  components: {GanttComponent},
  data () {
    return {
      tasks: {
        data: [
          {id: 1, text: "Project #1", start_date: "2024-04-05", duration: null, parent: 0, progress: 0, open: true},
          {id: 2, text: "Task #1", start_date: "2024-04-05", duration: 5, parent: 1, progress: 1, user: "Antoine"},
          {id: 3, text: "Task #2", start_date: "2024-04-06", duration: 2, parent: 1, progress: 0.5, user: "Alexis"},
          {id: 4, text: "Task #3", start_date: "2024-04-05", duration: null, parent: 1, progress: 0.8, open: true},
          {id: 5, text: "Task #3.1", start_date: "2024-04-09", duration: 2, parent: 4, progress: 0.2, user: "Francesco"},
          {id: 6, text: "Task #3.2", start_date: "2024-04-11", duration: 1, parent: 4, progress: 0, user: "Jerome"},
          {id: 7, text: "Project #2", start_date: null, duration: null, parent: 0, progress: 0, open: true},
          {id: 8, text: "Task #1", start_date: "2024-04-20", duration: 3, parent: 7, progress: 0.7, user: "Irina"},
          {id: 9, text: "Task #2", start_date: "2024-04-24", duration: 4, parent: 7, progress: 0.2, user: "Yao"}
        ],
        links:[
          {id: 1, source: 2, target: 3, type: "0"},
          {id: 2, source: 3, target: 4, type: "0"},
          {id: 3, source: 5, target: 6, type: "0"}
        ]

      },
    }
  }
}
</script>

<style>
  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
  }
  .ganttContainer {
    height: 100vh;
    width: 100%;
  }
  .left-ganttContainer {
    overflow: hidden;
    position: relative;
    height: 100%;
  }
</style>