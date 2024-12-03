<template>
  <vue-cal
    :events="events"
    :selected-date="selectedDate"
    :view="view"
    :time="true"
    :navigation="true"
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
  mounted() {
    console.log("Calendar view:", this.view);
    console.log("Calendar selected date:", this.selectedDate);
    console.log("Events passed to vue-cal on mount:", this.events);
  },
  watch: {
    events: {
      immediate: true,
      handler(newEvents) {
        console.log("Watched events in vue-cal:", newEvents);
      },
    },
    selectedDate: {
      immediate: true,
      handler(newDate) {
        console.log("Watched selectedDate in vue-cal:", newDate);
      },
    },
    view: {
      immediate: true,
      handler(newView) {
        console.log("Watched view in vue-cal:", newView);
      },
    },
  },
  updated() {
    console.log("Calendar updated with events:", this.events);
    this.$nextTick(() => {
      console.log("VueCal DOM updated:", this.$el);
    });
  },
  methods: {
    handleSlotClick(event) {
      console.log("Slot clicked event data:", event); // Log the clicked slot event
      this.$emit("slot-click", event); // Emit event to parent
    },
    handleViewChange(newView) {
      console.log("View changed to:", newView); // Log the new view
      this.$emit("view-change", newView); // Emit view change to parent
    },
  },
};
</script>

<style scoped>
.vue-cal-wrapper {
  /* Ensure no conflicting styles */
  position: relative;
  overflow: visible;
  padding: 0;
  margin: 0;
}
.vuecal {
  all: unset; /* Reset all styles for vue-cal */
  display: block !important; /* Ensure it's visible */
  height: auto !important;  /* Fix height issues */
}

.vuecal__event {
  visibility: visible !important;
  opacity: 1 !important; /* Force events to show */
}

</style>