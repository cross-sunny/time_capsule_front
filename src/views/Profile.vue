<template>
  <div class="profile-container">
    <div class="profile-card animate__animated animate__fadeIn">
      <!-- 头部 -->
      <div class="card-header">
        <!-- 🔥 修复1：加上 class 专门控制颜色 -->
        <el-button circle :icon="ArrowLeft" class="back-btn" @click="goBack" />
        <h3>个人设置</h3>
        <div style="width: 32px"></div>
      </div>

      <div class="card-body">
        <!-- 🔥 修复2：真实的头像上传 -->
        <div class="avatar-section">
          <el-upload
              class="avatar-uploader"
              action="http://localhost:8081/api/file/upload"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              name="file"
          >
            <!-- 如果有头像显示头像，没有显示默认图 -->
            <img v-if="form.avatar" :src="form.avatar" class="avatar" />
            <img v-else src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />

            <!-- 遮罩层，提示点击上传 -->
            <div class="upload-mask">
              <el-icon><Camera /></el-icon>
            </div>
          </el-upload>
          <span class="edit-text">点击图片更换头像</span>
        </div>

        <!-- 表单区 -->
        <el-form label-position="top" class="profile-form" size="large">
          <el-form-item label="昵称">
            <el-input v-model="form.nickname" placeholder="怎么称呼你？" />
          </el-form-item>
          <el-form-item label="个性签名">
            <el-input
                v-model="form.bio"
                type="textarea"
                :rows="3"
                placeholder="写给未来的自己，或者一句座右铭..."
            />
          </el-form-item>
          <el-form-item label="绑定邮箱 (不可修改)">
            <el-input v-model="form.email" disabled />
          </el-form-item>
        </el-form>
      </div>

      <!-- 底部操作 -->
      <div class="card-footer">
        <!-- 🔥 修复3：绑定真实的保存事件 -->
        <el-button type="primary" class="save-btn" :loading="loading" @click="saveProfile">保存修改</el-button>
        <el-button type="danger" plain class="logout-btn" @click="handleLogout">退出登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Camera } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  id: null,
  nickname: '',
  email: '',
  bio: '',
  avatar: ''
})

// 初始化：从 LocalStorage 读取（如果有），最好是页面加载时重新查一次后端
onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    form.id = user.id
    form.email = user.email
    form.nickname = user.nickname
    form.bio = user.bio || ''
    form.avatar = user.avatar || ''
  }
})

// 头像上传成功回调
const handleAvatarSuccess = (response) => {
  if (response.code === 200) {
    // response.data 是后端返回的图片 URL
    form.avatar = response.data
    ElMessage.success('头像上传成功！记得点击保存哦')
  } else {
    ElMessage.error('上传失败：' + response.msg)
  }
}

// 上传前校验
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('头像必须是 JPG 或 PNG 格式!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

const goBack = () => router.push('/home')

// 🔥 保存修改到数据库
const saveProfile = async () => {
  loading.value = true
  try {
    const res = await axios.post('/api/update', form)
    if (res.data.code === 200) {
      ElMessage.success('保存成功！')
      // 更新本地存储，这样刷新页面也不会变回去了
      localStorage.setItem('user', JSON.stringify(res.data.data))
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (error) {
    ElMessage.error('网络异常')
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', { confirmButtonText: '退出', cancelButtonText: '取消', type: 'warning' })
      .then(() => {
        localStorage.removeItem('user')
        router.push('/login')
        ElMessage.success('已退出')
      })
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  justify-content: center;
  padding-top: 50px;
}

.profile-card {
  width: 480px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 30px;
  height: fit-content;
}

.card-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;
}
.card-header h3 { margin: 0; font-size: 18px; color: #1e293b; }

/* 🌟 修复后的返回按钮样式 */
.back-btn {
  color: #7a74f9 !important;      /* 改成深蓝色，清晰可见 */
  background-color: #e0e7ff !important; /* 浅蓝色背景 */
  border: none !important;
  font-size: 18px; /* 稍微加大一点箭头 */
  transition: all 0.3s;
}
.back-btn:hover {
  background-color: #c7d2fe !important; /* 悬停稍微变深 */
  color: #5d54f8 !important; /* 悬停箭头变黑一点 */
  transform: translateX(-3px); /* 悬停时往左动一点点，有返回的感觉 */
}

/* 头像样式 */
.avatar-section {
  display: flex; flex-direction: column; align-items: center; margin-bottom: 30px;
}
.avatar-uploader {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border: 4px solid #fff;
}
.avatar {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.upload-mask {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex; justify-content: center; align-items: center;
  color: #fff; opacity: 0; transition: opacity 0.3s;
}
.avatar-uploader:hover .upload-mask { opacity: 1; }
.edit-text { margin-top: 10px; font-size: 12px; color: #6395f1; }

.save-btn { width: 100%; margin-bottom: 12px; height: 44px; font-weight: bold; }
.logout-btn { width: 100%; margin-left: 0 !important; height: 44px; border-radius: 12px; }
</style>