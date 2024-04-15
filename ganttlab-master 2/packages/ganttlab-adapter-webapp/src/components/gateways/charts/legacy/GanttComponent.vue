<template>
  <div ref="ganttContainer"></div>
</template>
 
<script>
import {gantt} from 'dhtmlx-gantt';
export default {
  props: {
    tasks: {
      type: Object,
      default () {
        return {data: [], links: []}
      }
    }
  },
 
  mounted: function () {
    gantt.config.date_format = "%Y-%m-%d";
 
    gantt.init(this.$refs.ganttContainer);
    gantt.parse(this.$props.tasks);
  }
}
</script>
 
<style>
    @import "../../../../../../../node_modules/dhtmlx-gantt/codebase/dhtmlxgantt.css";
</style>
