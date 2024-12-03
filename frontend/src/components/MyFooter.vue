<template>
  <b-container fluid class="footer">
    <b-row class="align-items-center justify-content-between">
      <b-col cols="auto">
        <p class="text-white mb-0">&copy; 2024 DentistDirect</p>
      </b-col>
      <b-col cols="auto" class="d-flex align-items-center">
        <!-- Email Icon -->
        <a href="mailto:contact@mealmate.com" target="_blank" class="footer-icon">
          <i class="fas fa-envelope"></i> Email
        </a>
        <!-- GitHub Icon -->
        <a href="https://github.com/yourrepo" target="_blank" class="footer-icon">
          <i class="fab fa-github"></i> GitHub
        </a>
        <!-- Instagram Icon -->
        <a href="https://instagram.com/yourpage" target="_blank" class="footer-icon">
          <i class="fab fa-instagram"></i> Instagram
        </a>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {

};
</script>

<style scoped>
.footer {
  background-color: var(--footer-bg-color);
  color: var(--footer-text-color);
  text-align: center;
}

.footer-icon {
  margin: 0 10px;
  font-size: 1em;
  color: white;
  cursor: pointer;
  text-decoration: none;
}

.footer-icon:hover {
  color: var(--navbar-active-text-color);
}

.text-white {
  color: white;
}
</style>
