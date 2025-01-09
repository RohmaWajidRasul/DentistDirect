<template>
  <div class="card" @click="changePage()">
    <img :src="imgsrc" alt="Image" />
    <div class="card-body">
      <div class="card-text-container">
        <span>{{ text }}</span>
        <div v-if="$slots.badge" class="badge-container">
          <slot name="badge" style="background-color: #d72f3e;"></slot>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
  export default {
    props: {
      text: String,
      link: String,
      imgsrc: String
      
    },
    methods: {
      changePage() {
        this.$router.push(this.link)
      }
    }
  }
</script>

<style scoped>
.card-text-container {
  display: inline-flex;
  align-items: center; /* Align the badge vertically with the text */
}

.badge-container {
  margin-left: 8px; /* Adds space between the text and badge */
}

.badge {
  background-color: #f8d7da !important; /* Pale pink */
  color: #721c24 !important; /* Dark red text color */
  border-radius: 12px;
  padding: 0.25em 0.5em;
  font-size: 14px;
}
</style>
  