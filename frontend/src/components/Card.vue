<template>
<div class="card" @click="changePage()">
  <img src='/find_appointment_2.png'>
  <div class="card-body">
    {{ text }}
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