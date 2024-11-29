import { createApp } from 'vue';
import App from './App.vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import * as BootstrapVueNext from 'bootstrap-vue-next'; 
import router from './router';

const app = createApp(App);
app.use(BootstrapVueNext);  
app.use(router);  
app.mount('#app');
