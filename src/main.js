import { createApp } from 'vue'
import './style.css'  // 引入全局样式
import App from './App.vue'

const app = createApp(App)
app.mount('#app') // 挂载到 index.html 里的 <div id="app">
