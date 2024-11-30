<template>
<div class="card" @click="changePage()">
  <div class="card-body">
    {{ text }}
  </div>
</div>
</template>

<script>
export default {
  props: {
    text: String,
    link: String
    
  },
  methods: {
    changePage() {
        this.$router.push(this.link)
    }
  }
}
</script>