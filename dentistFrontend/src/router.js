import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './views/HomePage.vue';
import AddTimeSlots from './views/AddTimeSlots.vue';
import ViewBookedSlots from './views/ViewBookedSlots.vue';
import LoginDentist from './views/LoginDentist.vue';
import RegisterDentist from './views/RegisterDentist.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/add-time-slots',
    name: 'AddTimeSlots',
    component: AddTimeSlots,
  },
  {
    path: '/view-booked-slots',
    name: 'ViewBookedSlots',
    component: ViewBookedSlots,
  },
  { 
    path: '/login',
    name: 'LoginDentist',
    component: LoginDentist
  },
  {
    path: '/register',
    name: 'RegisterDentist',
    component: RegisterDentist
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;