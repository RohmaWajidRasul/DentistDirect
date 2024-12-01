import { createRouter, createWebHistory } from "vue-router";
import login from './views/loginPage.vue';

const routes = [
    { path: '/', name: 'login', component: login},
]



const router = createRouter({
    history: createWebHistory(),
    routes
  })
  
  export default router
