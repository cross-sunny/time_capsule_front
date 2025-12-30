<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="240px" class="aside">
      <div class="logo">
        <div class="logo-circle">⏳</div>
        <span>时光胶囊</span>
      </div>
      <el-menu
          :default-active="activeMenu"
          class="menu-vertical"
          :router="false"
          @select="handleMenuSelect"
      >
        <el-menu-item index="1">
          <el-icon><Odometer /></el-icon> <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="2">
          <el-icon><EditPen /></el-icon> <span>埋下胶囊</span>
        </el-menu-item>
        <el-menu-item index="3">
          <el-icon><Collection /></el-icon> <span>我的胶囊</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="breadcrumb">
          {{ activeMenu === '1' ? '仪表盘 / 概览' : '我的胶囊 / 列表' }}
        </div>
        <div class="user-profile-area" @click="goToProfile">
          <span class="username">{{ user.nickname || 'Web01同学' }}</span>
          <el-avatar
              :size="36"
              :src="user.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'"
          />
        </div>
      </el-header>

      <el-main>
        <!-- 🔴 视图 1：仪表盘 -->
        <div v-if="activeMenu === '1'" class="dashboard-view animate__animated animate__fadeIn">
          <div class="welcome-section">
            <div class="welcome-text">
              <!-- 🔥 改动1：使用 dynamicGreeting 变量 -->
              <h2>{{ dynamicGreeting }}，{{ user.nickname }} 👋</h2>
              <p>今天是 {{ currentDate }}，要把此刻的心情封存起来吗？</p>
            </div>
            <el-button type="primary" size="large" class="action-btn" :icon="Edit" @click="openDialog">
              写封信
            </el-button>
          </div>

          <el-row :gutter="24" style="margin-top: 30px;">
            <el-col :span="8">
              <div class="stat-card">
                <div class="icon-bg blue"><el-icon><files /></el-icon></div>
                <div class="stat-info">
                  <!-- 🔥 改动2：真实数据 - 总数 -->
                  <div class="num">{{ capsuleList.length }}</div>
                  <div class="label">已埋藏</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card">
                <div class="icon-bg purple"><el-icon><timer /></el-icon></div>
                <div class="stat-info">
                  <!-- 🔥 改动3：真实数据 - 待开启 (通过计算属性计算) -->
                  <div class="num">{{ pendingCount }}</div>
                  <div class="label">待开启</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card">
                <div class="icon-bg green"><el-icon><chat-line-round /></el-icon></div>
                <div class="stat-info">
                  <!-- 说明：社区功能还没做，这里暂时写死或者显示个随机活跃数 -->
                  <div class="num">1,024</div>
                  <div class="label">社区互动</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 🔵 视图 2：我的胶囊列表 -->
        <div v-if="activeMenu === '3'" class="capsule-list-view animate__animated animate__fadeIn">
          <h2 style="margin-bottom: 20px; color: #1e293b;">📦 我的胶囊列表</h2>

          <el-empty v-if="capsuleList.length === 0" description="还没有埋下胶囊哦，快去写一封吧！">
            <el-button type="primary" @click="openDialog">去写信</el-button>
          </el-empty>

          <el-row :gutter="20" v-else>
            <el-col :span="8" v-for="item in capsuleList" :key="item.id" style="margin-bottom: 20px;">
              <div class="capsule-card">
                <div class="capsule-icon">💊</div>
                <div class="capsule-info">
                  <h4>{{ item.title }}</h4>
                  <p class="date">开启时间：{{ formatTime(item.openTime) }}</p>
                  <div class="status-tag">
                    <el-tag v-if="item.status === 0" type="info" effect="dark" round>封存中</el-tag>
                    <el-tag v-else type="success" effect="dark" round>已开启</el-tag>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 弹窗 -->
        <el-dialog v-model="dialogVisible" title="埋下一颗时光胶囊 🌱" width="500px" class="capsule-dialog" :close-on-click-modal="false">
          <el-form :model="capsuleForm" label-position="top">
            <el-form-item label="给胶囊起个标题"><el-input v-model="capsuleForm.title" placeholder="例如：给毕业后的自己" size="large" /></el-form-item>
            <el-form-item label="什么时候开启？"><el-date-picker v-model="capsuleForm.openTime" type="datetime" placeholder="选择未来的某个时刻" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" size="large" /></el-form-item>
            <el-form-item label="想说的话"><el-input v-model="capsuleForm.content" type="textarea" :rows="6" placeholder="写下现在的期许、烦恼，或者对未来的预测..." /></el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">取消</el-button>
              <el-button type="primary" @click="submitCapsule" :loading="submitting">埋下胶囊</el-button>
            </span>
          </template>
        </el-dialog>

      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue' // 引入 computed
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { Odometer, EditPen, Collection, Files, Timer, ChatLineRound, Edit } from '@element-plus/icons-vue'

const router = useRouter()
const user = ref({})
const currentDate = new Date().toLocaleDateString()
const dialogVisible = ref(false)
const submitting = ref(false)
const activeMenu = ref('1')
const capsuleList = ref([])
const capsuleForm = reactive({ title: '', openTime: '', content: '' })

// 🔥 核心逻辑1：根据时间动态生成问候语
const dynamicGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早安'
  if (hour < 13) return '午安'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 🔥 核心逻辑2：计算待开启的胶囊数量
// 这里不需要请求后端，直接从 capsuleList 里数一下有多少个 status 为 0 的即可
const pendingCount = computed(() => {
  return capsuleList.value.filter(item => item.status === 0).length
})

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    user.value = JSON.parse(userStr)
    fetchCapsules() // 加载列表，这样数量统计就准了
  } else {
    router.push('/login')
  }
})

const fetchCapsules = async () => {
  try {
    const res = await axios.get('/api/capsule/list', { headers: { 'X-User-Id': user.value.id } })
    if (res.data.code === 200) {
      capsuleList.value = res.data.data
    }
  } catch (e) { console.error(e) }
}

const handleMenuSelect = (index) => {
  if (index === '2') { openDialog(); return }
  activeMenu.value = index
  if (index === '3') fetchCapsules()
}

const goToProfile = () => { router.push('/profile') }
const openDialog = () => {
  capsuleForm.title = ''
  capsuleForm.content = ''
  capsuleForm.openTime = ''
  dialogVisible.value = true
}

const submitCapsule = async () => {
  if (!capsuleForm.title || !capsuleForm.content || !capsuleForm.openTime) return ElMessage.warning('请填写完整')
  submitting.value = true
  try {
    const res = await axios.post('/api/capsule/add', capsuleForm, { headers: { 'X-User-Id': user.value.id } })
    if (res.data.code === 200) {
      ElMessage.success('胶囊已埋下！')
      dialogVisible.value = false
      fetchCapsules() // 重新获取数据，更新统计数字
    } else { ElMessage.error(res.data.msg) }
  } catch (error) { ElMessage.error('系统繁忙') }
  finally { submitting.value = false }
}

const formatTime = (timeStr) => { if(!timeStr) return ''; return timeStr.replace('T', ' ') }
</script>

<style scoped>
/* 样式保持不变，使用我们之前优化过的圆角和颜色 */
.layout-container { height: 100vh; background-color: #f8fafc; }
.aside { background-color: #fff; border-right: 1px solid #f1f5f9; }
.logo { height: 80px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #1e293b; letter-spacing: 1px; }
.logo-circle { width: 32px; height: 32px; background: #e0e7ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 16px; }
.menu-vertical { border: none; padding: 10px; }
:deep(.el-menu-item) { border-radius: 8px; margin-bottom: 5px; color: #64748b; height: 50px; }
:deep(.el-menu-item.is-active) { background-color: #eff6ff; color: #4f46e5; font-weight: 600; }
:deep(.el-menu-item:hover) { background-color: #f8fafc; }
.header { background: transparent; padding: 0 40px; height: 80px; display: flex; align-items: center; justify-content: space-between; }
.breadcrumb { color: #94a3b8; font-size: 14px; }
.user-profile-area { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 5px 10px; border-radius: 50px; transition: background 0.2s; }
.user-profile-area:hover { background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.username { color: #334155; font-weight: 500; font-size: 14px; }

/* 欢迎卡片 */
.welcome-section { background: #fff; border-radius: 20px; padding: 40px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); position: relative; overflow: hidden; }
.welcome-section::after { content: ''; position: absolute; right: 0; top: 0; width: 300px; height: 100%; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, #eff6ff 100%); pointer-events: none; }
.welcome-text h2 { margin: 0 0 8px 0; color: #0f172a; font-size: 24px; }
.welcome-text p { margin: 0; color: #64748b; }

/* 写封信按钮 */
.action-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  border: none !important;
  box-shadow: 0 8px 20px -4px rgba(79, 70, 229, 0.5) !important;
  height: 56px; padding: 0 40px; font-size: 16px; font-weight: 600; letter-spacing: 1px; color: #ffffff !important; border-radius: 16px !important; transition: all 0.3s ease;
}
.action-btn:hover { transform: translateY(-3px); background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%) !important; box-shadow: 0 12px 25px -4px rgba(79, 70, 229, 0.6) !important; }

/* 统计卡片 */
.stat-card { background: #fff; border-radius: 16px; padding: 25px; display: flex; align-items: center; gap: 20px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
.icon-bg { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.icon-bg.blue { background: #eff6ff; color: #4f46e5; }
.icon-bg.purple { background: #f5f3ff; color: #7c3aed; }
.icon-bg.green { background: #f0fdf4; color: #16a34a; }
.stat-info .num { font-size: 24px; font-weight: 700; color: #1e293b; line-height: 1.2; }
.stat-info .label { font-size: 13px; color: #94a3b8; }

/* 胶囊列表 */
.capsule-card { background: #fff; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); transition: all 0.3s; border: 1px solid #f1f5f9; }
.capsule-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); border-color: #e0e7ff; }
.capsule-icon { width: 50px; height: 50px; background: #fdf2f8; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.capsule-info h4 { margin: 0 0 5px 0; color: #334155; font-size: 16px; }
.date { font-size: 12px; color: #94a3b8; margin: 0 0 10px 0; }
</style>