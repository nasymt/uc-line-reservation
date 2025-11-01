<template>
  <v-card max-width="420">
    <v-card-title>ログイン</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="onSubmit" :disabled="loading">
        <v-text-field
          v-model="username"
          label="ユーザー名 または メールアドレス"
          autocomplete="username"
          required
        />
        <v-text-field
          v-model="password"
          label="パスワード"
          type="password"
          autocomplete="current-password"
          required
        />
        <v-btn type="submit" color="primary" :loading="loading" block>ログイン</v-btn>
      </v-form>

      <div class="mt-3" v-if="msg" :style="{color: msgColor}">{{ msg }}</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const { $supabase } = useNuxtApp()

const username = ref('')
const password = ref('')
const loading  = ref(false)
const msg      = ref('')
const msgColor = ref('')

const onSubmit = async () => {
  msg.value = ''; msgColor.value = ''; loading.value = true
  console.log('Submitting', username.value, password.value)
  try {
    // 1) ユーザー名 → メール解決
    // const { email } = await $fetch<{email:string}>('/api/resolve-email', {
    //   method: 'POST',
    //   body: { usernameOrEmail: username.value }
    // })
    const email = username.value.includes('@') ? username.value : `${username.value}@example.com`
    // 2) Supabase でパスワード認証
    const { error } = await $supabase.auth.signInWithPassword({
      email,
      password: password.value
    })
    if (error) throw error
    msg.value = 'ログインしました'
    msgColor.value = 'green'
    console.log('Login successful')
  } catch (e: any) {
    msg.value = e?.message ?? 'ログインに失敗しました'
    msgColor.value = 'crimson'
    console.log('Login error:', e)
  } finally {
    loading.value = false
  }
}
</script>
