<template>
  <div class="profile-container">
    <div class="profile-card animate__animated animate__fadeIn">
      <!-- 头部 -->
      <div class="card-header">
        <!-- 🔥 修复3：加上冒号 :icon，箭头就出来了 -->
        <el-button circle :icon="ArrowLeft" class="back-btn" @click="goBack" />
        <h3>个人设置</h3>
        <div style="width: 32px"></div>
      </div>

      <div class="card-body">
        <div class="avatar-section">
          <el-upload
              class="avatar-uploader"
              action="/time_capsule/api/file/upload"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              :on-error="handleAvatarError"
              name="file"
          >
            <!--
               🔥 修复1：Loading 状态不仅仅取决于上传，还取决于图片是否加载完
               element-loading-background 设为半透明白，遮住旧图
            -->
            <div
                class="avatar-wrapper"
                v-loading="uploading || imgLoading"
                element-loading-background="rgba(255, 255, 255, 0.8)"
            >
              <!--
                 🔥 核心修复：@load 事件
                 只有当图片真正显示出来时，才取消 Loading
                 key 是为了强制刷新图片
              -->
              <img
                  v-if="form.avatar"
                  :src="form.avatar"
                  class="avatar"
                  @load="handleImageLoad"
                  :key="form.avatar"
              />
              <img v-else src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />

              <!-- 遮罩层 (悬浮显示) -->
              <div class="upload-mask">
                <el-icon :size="24"><Camera /></el-icon>
              </div>
            </div>
          </el-upload>
          <span class="edit-text">点击图片更换头像</span>
        </div>

        <el-form label-position="top" class="profile-form" size="large">
          <el-form-item label="昵称">
            <el-input v-model="form.nickname" placeholder="怎么称呼你？" />
          </el-form-item>
          <el-form-item label="个性签名">
            <el-input
                v-model="form.bio"
                type="textarea"
                :rows="3"
                placeholder="写给未来的自己..."
            />
          </el-form-item>
          <el-form-item label="绑定邮箱 (不可修改)">
            <el-input v-model="form.email" disabled />
          </el-form-item>
        </el-form>
      </div>

      <div class="card-footer">
        <el-button type="primary" class="save-btn" :loading="saveLoading" @click="saveProfile">保存修改</el-button>
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
const saveLoading = ref(false)
const uploading = ref(false)  // 上传阶段
const imgLoading = ref(false) // 图片渲染阶段

const form = reactive({
  id: null,
  nickname: '',
  email: '',
  bio: '',
  avatar: ''
})

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

// 1. 开始上传
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('仅支持 JPG/PNG 格式')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('图片不能超过 5MB')
    return false
  }
  uploading.value = true // 开启上传 Loading
  return true
}

// 2. 上传成功 (后端返回了 URL)
const handleAvatarSuccess = (response) => {
  uploading.value = false // 上传结束
  if (response.code === 200) {
    // 开启“图片加载”Loading
    imgLoading.value = true
    // 加上时间戳防止浏览器缓存旧图
    form.avatar = response.data + '?t=' + new Date().getTime()
    ElMessage.success('上传成功，请保存修改...')
  } else {
    ElMessage.error('上传失败：' + response.msg)
  }
}

// 3. 图片真正加载完毕 (浏览器下载完了图片)
const handleImageLoad = () => {
  imgLoading.value = false // 关闭所有 Loading，此时图片已显示
}

const handleAvatarError = () => {
  uploading.value = false
  imgLoading.value = false
  ElMessage.error('网络上传失败')
}

const goBack = () => router.push('/home')

const saveProfile = async () => {
  saveLoading.value = true
  try {
    // 去掉 url 后面的时间戳参数再保存到数据库
    const cleanForm = { ...form }
    if(cleanForm.avatar && cleanForm.avatar.includes('?')) {
      cleanForm.avatar = cleanForm.avatar.split('?')[0]
    }

    const res = await axios.post('/api/update', cleanForm)
    if (res.data.code === 200) {
      ElMessage.success('保存成功！')
      localStorage.setItem('user', JSON.stringify(res.data.data))
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (error) {
    ElMessage.error('网络异常')
  } finally {
    saveLoading.value = false
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
.profile-container { min-height: 100vh; background-color: #f8fafc; display: flex; justify-content: center; padding-top: 50px; }
.profile-card { width: 480px; background: #fff; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); padding: 30px; height: fit-content; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.card-header h3 { margin: 0; font-size: 18px; color: #1e293b; }

/* 🌟 修复：返回按钮颜色 */
.back-btn { color: #4f46e5 !important; background-color: #e0e7ff !important; border: none !important; transition: all 0.3s; font-size: 16px; }
.back-btn:hover { background-color: #c7d2fe !important; transform: translateX(-3px); }

/* 头像区域 */
.avatar-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 30px; }

/* 🔥 修复：去掉 el-upload 默认的点击虚线框/高亮 */
.avatar-uploader :deep(.el-upload:focus),
.avatar-uploader :deep(.el-upload:hover) {
  border-color: transparent;
  color: inherit;
  outline: none;
}

/* 包装器：严格限制大小和圆角，防止阴影溢出 */
.avatar-wrapper {
  position: relative;
  width: 100px; height: 100px;
  border-radius: 50%;
  overflow: hidden; /* 关键：超出的部分切掉，防止出现巨大方块 */
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border: 4px solid #fff;
  cursor: pointer;
}

.avatar { width: 100%; height: 100%; object-fit: cover; display: block; }

/* 遮罩层：只在 hover 时显示微弱黑色 */
.upload-mask {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.3); /* 稍微淡一点 */
  display: flex; justify-content: center; align-items: center;
  color: #fff; opacity: 0; transition: opacity 0.3s; pointer-events: none;
}
.avatar-wrapper:hover .upload-mask { opacity: 1; }

.edit-text { margin-top: 10px; font-size: 12px; color: #6366f1; cursor: pointer;}
.save-btn { width: 100%; margin-bottom: 12px; height: 44px; font-weight: bold; }
.logout-btn { width: 100%; margin-left: 0 !important; height: 44px; border-radius: 12px; }
</style>