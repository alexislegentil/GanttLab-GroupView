<template>
  <div class="ganttContainer w-full">
    <GanttComponent class="left-ganttContainer" :tasks="tasks"></GanttComponent>
  </div>
</template>
 
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import GanttComponent from './legacy/GanttComponent.vue';
import { getConvertedGroup } from './legacy/index';
import { Group } from 'ganttlab-entities';

@Component({
  components: {
    GanttComponent
  }
})
export default class GroupChartMediator extends Vue {
  @Prop() readonly group!: Group;

  get tasks() {
    return {
      data: getConvertedGroup(this.group),
    };
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