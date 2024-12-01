<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <!-- Navbar -->
    <Navbar />

    <!-- Main content -->
    <div class="flex-grow-1">
      <router-view/>
    </div>

    <!-- Footer -->
    <MyFooter />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</script>
