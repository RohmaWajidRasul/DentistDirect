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
      required: true,
    },
    locations: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      selectedDentist: null,
      selectedLocation: null,
    };
  },
  emits: ["filter-change"],
  methods: {
    updateFilters() {
      this.$emit("filter-change", {
        dentistId: this.selectedDentist?.id || null,
        location: this.selectedLocation || null,
      });
    },
  },
};
</script>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
