<template>
  <div ref="ganttContainer"></div>
</template>
 
<script>
import {gantt} from 'dhtmlx-gantt';

var dateToStr = gantt.date.date_to_str(gantt.config.task_date);

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
    gantt.plugins({ 
        marker: true 
    }); 
    gantt.config.date_format = "%Y-%m-%d";
    gantt.config.columns = [
    {name: "text", label: "Task name", tree: true, width: 200 },
    {name: "start_date", label: "Start time", align: "center", width: 150 },
    {name: "duration", label: "Duration", align: "center", width: 100 },
    {name: "user", label: "User", align: "center", width: 150 }
    ];
    gantt.addMarker({
    start_date: new Date(), //a Date object that sets the marker's date
    css: "today", //a CSS class applied to the marker
    text: "Now", //the marker title
    title: dateToStr( new Date()) // the marker's tooltip
});
    
    gantt.init(this.$refs.ganttContainer);
    gantt.parse(this.$props.tasks);
  }
}
</script>
 
<style>
    @import "../../../../../../../node_modules/dhtmlx-gantt/codebase/dhtmlxgantt.css";
</style>
