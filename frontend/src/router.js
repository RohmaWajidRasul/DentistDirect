import { createRouter, createWebHistory } from 'vue-router'

import Home from './views/Home.vue'

const routes = [
  { path: '/', name: 'home', component: Home }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
import { createRouter, createWebHistory } from "vue-router";
import SignUp from './views/SignUp.vue';

const routes = [
    { path: '/', name: 'signup', component: SignUp},
]



const router = createRouter({
    history: createWebHistory(),
    routes
  })
  
  export default router
  