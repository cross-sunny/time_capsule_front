import { createApp } from 'vue'
import './style.css' // 默认样式
import App from './App.vue'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入 Vue Router
import router from './router'

const app = createApp(App)

app.use(ElementPlus) // 使用 Element Plus
app.use(router)      // 使用 Vue Router

app.mount('#app')