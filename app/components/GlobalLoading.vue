<template>
    <ClientOnly>
        <Teleport to="body">
            <v-dialog :model-value="ui.isLoading" persistent :scrim="'rgba(255,255,255,0.75)'" :z-index="9999"
                scroll-strategy="block" transition="fade-transition" width="auto">
                <v-card class="px-8 py-6 rounded-xl text-center elevation-2" width="340"
                    style="background-color: rgba(255, 255, 255, 0.3);">
                    <div class="d-flex flex-column align-center justify-center">
                        <v-progress-circular indeterminate size="36" />
                        <div class="text-body-1 mt-2">
                            {{ ui.message || '読み込み中です…' }}
                        </div>
                    </div>
                </v-card>
            </v-dialog>
        </Teleport>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'
const ui = useUiStore()
</script>
