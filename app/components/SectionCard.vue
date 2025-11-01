<template>
    <v-card class="ma-4">
        <v-card-title class="pa-4">{{ cardTitle }}</v-card-title>
        <v-card-item>
            <slot name="cardItem"></slot>
        </v-card-item>
    </v-card>
</template>
<script setup lang="ts">
const props = defineProps<{
    cardTitle: string
}>()
</script>