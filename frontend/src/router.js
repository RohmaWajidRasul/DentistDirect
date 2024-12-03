import { createRouter, createWebHistory } from 'vue-router'

import Home from './views/Home.vue'
import Slots from './views/Slots.vue'
import Login from'./views/Login.vue'

const routes = [
  { path: '/', name: 'home-page', component: Home },
  { path: '/slots', name: 'slots-page', component: Slots }, 
  { path: '/Login', name: 'login', component: Login }, 
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
