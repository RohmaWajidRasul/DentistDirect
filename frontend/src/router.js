import { createRouter, createWebHistory } from 'vue-router'

import Home from './views/Home.vue'
import Slots from './views/Slots.vue'
import SignUp from './views/SignUp.vue';
import Login from'./views/Login.vue'
import MyAppointments from './views/MyAppointments.vue';
import Profile from './views/Profile.vue';
import InboxPage from './components/InboxPage.vue';

const routes = [
  { path: '/', name: 'home-page', component: Home },
  { 
    path: '/slots', 
    name: 'slots-page', 
    component: Slots,
    props: (route) => ({ clinicId: route.query.clinicId || null })
  }, 
  { path: '/signup', name: 'signup', component: SignUp }, 
  { path: '/Login', name: 'login', component: Login }, 
  { path: '/my-appointments', name: 'my-appointments', component: MyAppointments },
  { path: '/profile', name: 'profile', component: Profile },
  { path: '/inbox', name: 'inbox', component: InboxPage }, 
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
