<template>
    <template v-if="isReservationCompleted"><thank-you-view /></template>
    <template v-else>
        <v-card class="pa-4" elevation="1">
            <div class="text-subtitle-1 mb-2">テスト送信</div>
            <v-text-field v-model="text" label="本文" placeholder="予約ありがとうございます！" />
            <v-btn :loading="sending" :disabled="!text" color="primary" @click="send">
                このユーザーに送信
            </v-btn>
            <div class="mt-2 text-caption" v-if="status">{{ status }}</div>
        </v-card>
        <reservation-course />
        <reservation-class />
        <reservation-date id="dateSection" ref="dateSection" />
        <div class="d-flex justify-center mb-16">
            <v-btn class="my-4" :disabled="store.selectedSlot === undefined || store.selectedSlot === null" rounded
                color="success" size="x-large" @click="showConfirmDialog = true">
                入力内容を確認する
            </v-btn>
        </div>
        <reservation-confirm-dialog v-model="showConfirmDialog" @update:model="onReservationComplete" />
    </template>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useReservationStore } from '~/stores/reservation';
import { useGoTo } from '#imports';
import liff from '@line/liff';

defineEmits<{ (e: 'select', iso: string): void }>()
const goTo = useGoTo();
const dateSection = ref<HTMLElement | null>(null);

const store = useReservationStore();
const showConfirmDialog = ref(false);
const isReservationCompleted = ref(false);

watch(() => store.selectedClass, (newClass) => {
    if (newClass) {
        // コース選択後に日付セクションへスクロール
        console.log('Class selected, scrolling to date section', newClass);
        if (dateSection.value) {
            goTo(dateSection.value, { offset: -80 });
        }
    }
});

onMounted(async () => {
    store.loadSettings();
    console.log('ReservationForm mounted')

    // const token = liff.getIDToken() // 文字列のIDトークン
    // const { userId } = await $fetch('/api/line/session', {
    //     method: 'POST',
    //     body: { idToken: token }
    // })
    // console.log('LINE User ID:', userId)

    // await $fetch('/api/line/push', {
    //     method: 'POST',
    //     body: { userId: 'Uc582ba3923d8895426cc6434e81fb651', text: 'こんにちは！' }
    // })

})

const checkUserId = async () => {
    const token = liff.getIDToken() // 文字列のIDトークン
    // const { userId } = await $fetch('/api/line/session', {
    //     method: 'POST',
    //     body: { idToken: token }
    // })
    console.log('LINE User ID:', token)
}

watch(showConfirmDialog, (newVal) => {
    console.log('Show confirm dialog:', store.selectedSlot)
})

const onReservationComplete = () => {
    isReservationCompleted.value = true;
}

const text = ref('予約ありがとうございます！このままトークでご連絡ください。')
const sending = ref(false)
const status = ref('')
const lastLog = ref('')

async function send() {
  sending.value = true
  lastLog.value = ''
  try {
    const { idToken, aud, sub, exp } = await getFreshIdTokenOrRelogin()

    const resp = await fetch('/api/line/push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken, text: text.value }),
    })
    const data = await resp.json().catch(() => null)

    console.log('[push] status=', resp.status, 'body=', data, { aud, sub, exp })
    lastLog.value = JSON.stringify({ status: resp.status, body: data }, null, 2)
  } catch (e: any) {
    // ここで見えている "InvalidCharacterError" は以前の atob() 由来でした
    console.error('[push] client-error', e)
    lastLog.value = `client-error: ${e?.message || e}`
  } finally {
    sending.value = false
  }
}

async function waitForIdToken(timeoutMs = 8000) {
    const t0 = Date.now()
    for (; ;) {
        const tok = liff.getIDToken?.()
        if (tok) return tok
        if (Date.now() - t0 > timeoutMs) throw new Error('LIFFのIDトークンが取得できません（ログイン/設定を確認）')
        await new Promise(r => setTimeout(r, 120))
    }
}

function decodeJwt<T = any>(jwt: string): T {
    const [, payload] = jwt.split('.')
    if (!payload) {
        throw new Error('Invalid JWT: missing payload')
    }
    return JSON.parse(atob(payload))
}

async function getFreshIdTokenOrRelogin(graceSec = 30): Promise<{ idToken: string; exp: number; aud: string; sub: string }> {
  const tok = liff.getIDToken?.()
  const decoded: any = liff.getDecodedIDToken?.() // ← これを信頼して使う

  if (!tok || !decoded) {
    liff.login({ redirectUri: location.href })
    throw new Error('redirecting to login')
  }

  const now = Math.floor(Date.now() / 1000)
  const remain = (decoded.exp ?? 0) - now
  console.log('[LIFF] aud=', decoded.aud, 'sub=', decoded.sub, 'remain=', remain)

  if (remain <= graceSec) {
    console.warn('[LIFF] token expiring/expired → re-login')
    liff.login({ redirectUri: location.href })
    throw new Error('redirecting to login')
  }
  return { idToken: tok, exp: decoded.exp, aud: decoded.aud, sub: decoded.sub }
}

</script>

<style scoped>
/* アイテムの幅を揃えると内蔵矢印のスクロールが安定します */
.date-slide-group {
    min-height: 72px;
}

.day-chip {
    margin: 4px;
    width: 88px;
    height: 64px;
    justify-content: center;
}

.day-chip__inner {
    display: grid;
    grid-template-rows: auto auto;
    line-height: 1.1;
    text-align: center;
}

.dow {
    font-size: 12px;
    opacity: .9;
}

.date-slide-group.wide {
    --item-w: 72px;
    /* ←ここで1日の横幅を増やす（例: 64〜80） */
    --item-gap: 12px;
    /* アイテム間の余白 */
}

/* 必要なら .wide の指定はそのまま併用可 */
.date-item {
    width: 72px;
    margin: 0 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 8px 4px;
    border-radius: 8px;
    transition: background-color .15s;
}

.date-item:hover {
    background-color: rgba(0, 0, 0, 0.02);
}

.date-number {
    width: 40px;
    height: 40px;
    line-height: 40px;
    border-radius: 10%;
    text-align: center;
    transition: background-color .15s, color .15s;
    cursor: pointer;
    background-color: transparent;
}

.date-number:hover:not(.selected) {
    background-color: rgba(0, 0, 0, 0.04);
}

/* 選択時の色を明示的に指定 */
.date-number.selected {
    background-color: #1976d2 !important;
    /* プライマリブルー */
    color: white !important;
}

/* Vuetifyテーマ変数が利用可能な場合 */
.v-theme--light .date-number.selected {
    background-color: rgb(var(--v-theme-primary)) !important;
    color: rgb(var(--v-theme-on-primary)) !important;
}

.v-theme--dark .date-number.selected {
    background-color: rgb(var(--v-theme-primary)) !important;
    color: rgb(var(--v-theme-on-primary)) !important;
}
</style>
