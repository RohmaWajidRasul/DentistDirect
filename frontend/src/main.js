import { createApp, reactive } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import './style.css'
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/js/all.js';
import "vue-cal/dist/vuecal.css";

const app = createApp(App);
const globalState = reactive({
    isLoggedIn: false,
    isAdmin: false
  })
app.provide('globalState', globalState)
app.use(createBootstrap());
app.use(router)
app.mount('#app');
