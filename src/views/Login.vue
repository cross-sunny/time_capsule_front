<template>
  <div class="login-container">
    <div class="glow-bg"></div>
    <div class="login-content animate__animated animate__fadeInUp">
      <div class="glass-panel">
        <div class="header-area">
          <div class="logo-box">⏳</div>
          <!-- 标题根据模式变化 -->
          <h2 class="title">{{ titleText }}</h2>
          <p class="subtitle">{{ subtitleText }}</p>
        </div>

        <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            size="large"
            class="login-form"
        >
          <!-- 1. 邮箱 (三个模式通用) -->
          <el-form-item prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" :prefix-icon="Message" />
          </el-form-item>

          <!-- 2. 验证码 (注册 & 找回密码 模式显示) -->
          <el-form-item prop="code" v-if="mode !== 'login'">
            <div style="display: flex; gap: 10px; width: 100%;">
              <el-input v-model="form.code" placeholder="6位验证码" :prefix-icon="Key" />
              <el-button type="primary" plain @click="sendCode" :disabled="timer > 0">
                {{ timer > 0 ? `${timer}s后重发` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <!-- 3. 昵称 (【需求1】仅注册模式显示，且移到了密码上面) -->
          <el-form-item prop="nickname" v-if="mode === 'register'">
            <el-input v-model="form.nickname" placeholder="您的昵称" :prefix-icon="User" />
          </el-form-item>

          <!-- 4. 密码 (通用，但在找回模式下提示语不同) -->
          <el-form-item prop="password">
            <el-input
                v-model="form.password"
                type="password"
                :placeholder="mode === 'reset' ? '请输入新密码' : '请输入密码'"
                :prefix-icon="Lock"
                show-password
            />
          </el-form-item>

          <!-- 5. 提交按钮 -->
          <el-button type="primary" class="submit-btn" :loading="loading" @click="handleSubmit" round>
            {{ btnText }}
          </el-button>

          <!-- 6. 底部链接区域 -->
          <div class="footer-links">
            <!-- 登录模式：左右对称 -->
            <template v-if="mode === 'login'">
              <span @click="switchMode('register')">没有账号? 去注册</span>
              <span @click="switchMode('reset')">忘记密码?</span>
            </template>

            <!-- 注册模式：居中 (需求2) -->
            <template v-else-if="mode === 'register'">
              <div class="center-link">
                <span @click="switchMode('login')">已有账号? 立即登录</span>
              </div>
            </template>

            <!-- 找回模式：居中 -->
            <template v-else>
              <div class="center-link">
                <span @click="switchMode('login')">想起密码了? 去登录</span>
              </div>
            </template>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Message, Lock, Key, User } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const timer = ref(0)

// 模式状态: 'login' | 'register' | 'reset'
const mode = ref('login')

const form = reactive({ email: '', password: '', code: '', nickname: '' })

// 动态计算文字
const titleText = computed(() => {
  if (mode.value === 'login') return '时光胶囊'
  if (mode.value === 'register') return '注册账号'
  return '重置密码'
})
const subtitleText = computed(() => {
  if (mode.value === 'login') return 'Time Capsule'
  if (mode.value === 'register') return 'Join Us'
  return 'Reset Password'
})
const btnText = computed(() => {
  if (mode.value === 'login') return '开启旅程'
  if (mode.value === 'register') return '立即注册'
  return '确认重置'
})

// 验证规则
const rules = reactive({
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '格式错误', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '至少6位', trigger: 'blur' }],
  code: [{ required: false, message: '请输入验证码', trigger: 'blur' }],
  nickname: [{ required: false, message: '请输入昵称', trigger: 'blur' }]
})

// 切换模式并清空表单
const switchMode = (newMode) => {
  mode.value = newMode
  if(formRef.value) formRef.value.resetFields()
}

// 发送验证码
const sendCode = async () => {
  if (!form.email) return ElMessage.warning('请先输入邮箱！')
  try {
    const res = await axios.post(`/api/auth/send-code?email=${form.email}`)
    if (res.data.code === 200) {
      ElMessage.success('验证码已发送')
      timer.value = 60
      const interval = setInterval(() => {
        timer.value--
        if (timer.value <= 0) clearInterval(interval)
      }, 1000)
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    ElMessage.error('发送失败，请检查网络')
  }
}

// 统一提交处理
const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true

    try {
      let res;
      // 1. 登录
      if (mode.value === 'login') {
        res = await axios.post('/api/login', { email: form.email, password: form.password })
        if (res.data.code === 200) {
          ElMessage.success('登录成功')
          localStorage.setItem('user', JSON.stringify(res.data.data))
          router.push('/home')
        } else {
          ElMessage.error(res.data.msg)
        }
      }
      // 2. 注册
      else if (mode.value === 'register') {
        const registerData = { email: form.email, password: form.password, code: form.code, nickname: form.nickname }
        res = await axios.post('/api/auth/register', registerData)
        if (res.data.code === 200) {
          ElMessage.success('注册成功！')
          switchMode('login') // 切回登录
        } else {
          ElMessage.error(res.data.msg)
        }
      }
      // 3. 重置密码 (新功能)
      else if (mode.value === 'reset') {
        const resetData = { email: form.email, newPassword: form.password, code: form.code }
        res = await axios.post('/api/auth/reset-password', resetData)
        if (res.data.code === 200) {
          ElMessage.success('密码重置成功，请登录')
          switchMode('login') // 切回登录
        } else {
          ElMessage.error(res.data.msg)
        }
      }
    } catch (e) {
      ElMessage.error('网络连接异常')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container { position: relative; width: 100%; height: 100vh; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle at top left, #a5b4fc, #6366f1, #4338ca); overflow: hidden; }
.glow-bg { position: absolute; width: 600px; height: 600px; background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%); border-radius: 50%; top: -100px; left: -100px; filter: blur(80px); }
.glass-panel { width: 380px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); text-align: center; }
.logo-box { width: 60px; height: 60px; background: #eff6ff; border-radius: 16px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 32px; }
.title { color: #1e293b; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
.subtitle { color: #64748b; font-size: 13px; margin-top: 5px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
.submit-btn { width: 100%; margin-top: 10px; height: 44px; font-size: 15px; letter-spacing: 1px; }

/* 底部链接样式 */
.footer-links {
  margin-top: 20px;
  font-size: 13px;
  color: #6366f1;
  display: flex;
  justify-content: space-between; /* 默认左右分布 */
  padding: 0 5px;
}
.footer-links span { cursor: pointer; transition: opacity 0.3s; }
.footer-links span:hover { opacity: 0.8; text-decoration: underline; }

/* 居中样式 (用于注册页和重置页) */
.center-link {
  width: 100%;
  text-align: center;
}
</style>