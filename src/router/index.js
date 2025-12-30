import { createRouter, createWebHistory } from 'vue-router'

// 1. 定义路由映射表
const routes = [
    {
        path: '/',
        redirect: '/login' // 访问根路径时，重定向到登录
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue') // 懒加载
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('../views/Home.vue') // 【关键】必须要有这一行！
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue') // 个人中心
    }
]

// 2. 创建路由实例
const router = createRouter({
    history: createWebHistory('/time_capsule/'), // 【关键】设置路由基础路径
    routes
})

export default router