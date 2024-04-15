<template>
  <div class="container">
    <GanttComponent class="left-container" :tasks="tasks"></GanttComponent>
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
          {id: 1, text: 'Task #1', start_date: '2020-01-17', duration: 3, progress: 0.6},
          {id: 2, text: 'Task #2', start_date: '2020-01-20', duration: 3, progress: 0.4}
        ],
        links: [
          {id: 1, source: 1, target: 2, type: '0'}
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
  .container {
    height: 100vh;
    width: 100%;
  }
  .left-container {
    overflow: hidden;
    position: relative;
    height: 100%;
  }
</style>