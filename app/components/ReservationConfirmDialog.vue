<template>
    <v-dialog v-model="model">
        <v-card>
            <v-card-title class="text-h5 text-center mt-4">予約内容の確認</v-card-title>
            <v-card-text>
                <v-alert v-if="errorAlert" type="error" variant="tonal" class="mb-4">
                    送信中にエラーが発生しました。時間をおいて再度お試しください。
                </v-alert>
                <v-table class="confirm-table w-100">
                    <tbody>
                        <tr>
                            <td>コース</td>
                            <td>{{ store.selectedCourse?.label }}</td>
                        </tr>
                        <tr>
                            <td>クラス</td>
                            <td>{{ store.selectedClass?.label ?? '未選択' }}</td>
                        </tr>
                        <tr>
                            <td>日付</td>
                            <td>{{ store.selectedSlot?.date ?? '未選択' }}</td>
                        </tr>
                        <tr>
                            <td>時間</td>
                            <td>{{ store.selectedSlot?.timeslot.time ?? '未選択' }}</td>
                        </tr>
                        <tr>
                            <td>体験時間</td>
                            <td>{{ store.selectedClass?.duration }}分(目安)</td>
                        </tr>
                        <tr>
                            <td>備考欄</td>
                            <td>
                                <div>
                                    <v-textarea v-model="remarks" variant="outlined" rows="2" no-resize hide-details
                                        density="comfortable" class="mt-4" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </v-table>

                <v-divider class="my-4" />
                <v-alert type="info" variant="tonal" class="mb-2">
                    予約を送信した段階では確定しておらず、数日以内にスクールから連絡をいたします。
                    この連絡をもってご予約が確定となります。
                </v-alert>
                <!-- チェック必須 -->
                <v-checkbox v-model="agree" hide-details="auto" density="comfortable" label="上記の確認事項を理解し、同意します" />

            </v-card-text>
            <v-card-actions class="d-flex justify-center gap-3 flex-wrap mb-4">
                <v-btn color="secondary" variant="flat" @click="model = false">
                    戻る
                </v-btn>

                <v-btn color="primary" variant="flat" :disabled="!agree" @click="onConfirm">
                    予約を確定する
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import { useReservationStore } from '#imports';
import liff from '@line/liff';
const model = defineModel<boolean>({ type: Boolean, required: true, default: false })
const store = useReservationStore();
const remarks = ref('');

const emit = defineEmits<{ (e: 'update:model'): void }>()

const onConfirm = async () => {
    send().then(() => {
        console.log('Reservation confirmed')
        emit('update:model');
        model.value = false;
    }).catch((e) => {
        console.error('Error sending reservation confirmation:', e)
        errorAlert.value = true
    })
}

// const text= ref(`ご予約ありがとうございます！`);
const sending = ref(false)
// const status = ref('')
const lastLog = ref('')
const errorAlert = ref(false);
const debugLogs = useState<string[]>('__debug_logs', () => []);
const liffReady = ref(false)

onMounted(() => {
    liffReady.value = true;
})

function buildMessage() {
    const course = store.selectedCourse?.label ?? '未選択'
    const klass = store.selectedClass?.label ?? '未選択'
    const date = store.selectedSlot?.date
        ? store.selectedSlot.date.replace(/-/g, '/')
        : '未選択'
    const time = store.selectedSlot?.timeslot?.time ?? '未選択'
    const dur = store.selectedClass?.duration
        ? `${store.selectedClass.duration}分（目安）`
        : '未設定'
    const note = remarks.value?.trim() ? remarks.value.trim() : 'なし'

    return `ご予約ありがとうございます！🎉
下記の内容で受付いたしました👇

コース：${course}
クラス：${klass}
日付　：${date}
時間　：${time}
体験時間：${dur}
備考　：${note}

ご変更があればこのトークにご返信ください。
当日お会いできるのを楽しみにしています😊`
}

async function send() {
  if (!liffReady.value) return // 念のためガード

  const message = buildMessage()
  const idToken = liff.getIDToken()
  const resp = await fetch('/api/line/push', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken, text: message }),
  })
  const data = await resp.json().catch(() => null)
  console.log('push result', resp.status, data)
}

// リトライしてIDトークンを取るやつ
async function getFreshIdTokenOrRelogin(options?: {
  maxRetry?: number
  intervalMs?: number
  graceSec?: number
}): Promise<{ idToken: string; exp: number; aud: string; sub: string }> {
  const maxRetry = options?.maxRetry ?? 10      // 最大10回トライ
  const intervalMs = options?.intervalMs ?? 150 // 150ms間隔
  const graceSec = options?.graceSec ?? 30

  let tok: string | null = null
  let decoded: any = null

  // ① まずは何回か頑張って取る
  for (let i = 0; i < maxRetry; i++) {
    tok = liff.getIDToken?.() ?? null
    decoded = liff.getDecodedIDToken?.() ?? null
    if (tok && decoded) break
    await new Promise((r) => setTimeout(r, intervalMs))
  }

  // ② それでもダメなら本当にログインが必要な状態
  if (!tok || !decoded) {
    // ここでログインに飛ぶ
    liff.login({ redirectUri: location.href })
    // 呼び出し側に「今ログイン飛ばしただけ」と知らせる
    throw new Error('LOGIN_REDIRECT')
  }

  // ③ 有効期限チェック
  const now = Math.floor(Date.now() / 1000)
  const remain = (decoded.exp ?? 0) - now
  console.log('[LIFF] aud=', decoded.aud, 'sub=', decoded.sub, 'remain=', remain)

  if (remain <= graceSec) {
    liff.login({ redirectUri: location.href })
    throw new Error('LOGIN_REDIRECT')
  }

  return {
    idToken: tok,
    exp: decoded.exp,
    aud: decoded.aud,
    sub: decoded.sub,
  }
}


const agree = ref(false)
</script>

<style scoped>
.confirm-table td:first-child {
    text-align: right;
    white-space: nowrap;
    font-weight: 600;
    padding-right: 12px;
}

/* .row--middle > td { vertical-align: middle !important; } */
</style>