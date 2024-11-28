<template>
    <div class="filters">
      <!-- Dentist Filter -->
      <div class="filter">
        <label for="dentist">Filter by Dentist:</label>
        <multiselect
          id="dentist"
          v-model="selectedDentist"
          :options="dentists"
          :searchable="true"
          :close-on-select="true"
          :clear-on-select="true"
          :allow-empty="true"
          label="name"
          track-by="id"
          placeholder="Search and select a dentist"
          @input="updateFilters"
        />
      </div>
  
      <!-- Location Filter -->
      <div class="filter">
        <label for="location">Filter by Location:</label>
        <multiselect
          id="location"
          v-model="selectedLocation"
          :options="locations"
          :searchable="true"
          :close-on-select="true"
          :clear-on-select="true"
          :allow-empty="true"
          placeholder="Search and select a location"
          @input="updateFilters"
        />
      </div>
    </div>
  </template>
  
  <script>
  import Multiselect from "vue-multiselect";
  import "vue-multiselect/dist/vue-multiselect.min.css";
  
  export default {
    name: "Filters",
    components: { Multiselect },
    props: {
      dentists: {
        type: Array,
        required: true, // Array of dentists: [{ id: "1", name: "Dr. John Doe" }, ...]
      },
      locations: {
        type: Array,
        required: true, // Array of locations: ["Downtown", "Uptown", ...]
      },
    },
    data() {
      return {
        selectedDentist: null, // The selected dentist
        selectedLocation: null, // The selected location
      };
    },
    emits: ["filter-change"],
    methods: {
      updateFilters() {
        // Emit the selected dentist and location to the parent component
        this.$emit("filter-change", {
          dentistId: this.selectedDentist?.id || null, // Return the selected dentist's ID
          location: this.selectedLocation || null, // Return the selected location
        });
      },
    },
  };
  </script>
  
  <style scoped>
  .filters {
    display: flex;
    flex-direction: column;
    gap: 20px; /* Adds space between filters */
    margin-top: 20px;
  }
  
  .filter label {
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .multiselect {
    width: 100%;
  }
  </style>
  