<template>
    <vue-cal
      :events="events"
      :selected-date="selectedDate"
      :view="view"
      time="24"
      @cell-click="handleSlotClick"
      @view-change="handleViewChange"
    />
  </template>
  
  <script>
  import VueCal from "vue-cal";
  import "vue-cal/dist/vuecal.css";
  
  export default {
    name: "Calendar",
    components: { VueCal },
    props: {
      events: {
        type: Array,
        required: true,
      },
      view: {
        type: String,
        default: "month",
      },
      selectedDate: {
        type: Date,
        default: () => new Date(),
      },
    },
    emits: ["slot-click", "view-change"],
    methods: {
      handleSlotClick(event) {
        this.$emit("slot-click", event); // Emit event to parent
      },
      handleViewChange(newView) {
        this.$emit("view-change", newView); // Emit view change to parent
      },
    },
  };
  </script>
  