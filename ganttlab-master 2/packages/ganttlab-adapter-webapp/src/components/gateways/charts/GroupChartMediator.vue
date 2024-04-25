<template>
  <div class="ganttContainer w-full">
    <GanttComponent class="left-ganttContainer" :tasks="tasks"/>
  </div>
</template>
 
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import GanttComponent from './legacy/GanttComponent.vue';
import { getConvertedGroup } from './legacy/index';
import { getLinksFromGroup } from './legacy/index';
import { Group } from 'ganttlab-entities';

@Component({
  components: {
    GanttComponent
  }
})
export default class GroupChartMediator extends Vue {
  @Prop() readonly group!: Group;

  public convertedGroup = getConvertedGroup(this.group);
  public links = getLinksFromGroup(this.group, this.convertedGroup);


  get tasks() {
    console.log(this.convertedGroup);
    return {
      data: this.convertedGroup,
      links: this.links
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
    height: 80vh;
    width: 100%;
  }
  .left-ganttContainer {
    overflow: hidden;
    position: relative;
    height: 100%;
  }
</style>