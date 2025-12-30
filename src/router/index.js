import { createRouter, createWebHistory } from 'vue-router'
// 引入 Element Plus 的消息提示组件，用来弹窗报错
import { ElMessage } from 'element-plus'

// 1. 定义路由映射表
const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        // 登录页不需要验证
        meta: { requiresAuth: false }
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        // 🔥 关键标记：这个页面需要登录才能进
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        // 🔥 关键标记：这个页面需要登录才能进
        meta: { requiresAuth: true }
    }
]

// 2. 创建路由实例
const router = createRouter({
    // 保持和 vite.config.js 一致
    history: createWebHistory('/time_capsule/'),
    routes
})

// 3. 👮‍♂️ 全局前置守卫 (保安)
router.beforeEach((to, from, next) => {
    // A. 获取本地存储的用户信息
    const userStr = localStorage.getItem('user')

    // B. 判断目标页面是否需要登录 (检查 meta.requiresAuth)
    if (to.meta.requiresAuth) {
        // 如果需要登录，且没有用户信息
        if (!userStr) {
            ElMessage.error('非法用户，请先登录！') // 弹窗警告
            next('/login') // 强制踢回登录页
        } else {
            // 有用户信息，放行
            next()
        }
    } else {
        // 目标页面不需要登录 (比如去注册、去重置密码)，直接放行
        next()
    }
})

export default router