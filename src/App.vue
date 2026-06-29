<script setup>
import { storeToRefs } from 'pinia';
import useScheduleStore from '@/stores/scheduleStore'


const scheduleStore = useScheduleStore();
const {
  load,
  raspis,
  auds,
  teachers,
  preds,
  kafs,

  classroomById,
} = storeToRefs(scheduleStore)


function onPrintClick() {
  const raspis = scheduleStore.getSchedule([2147], 'teacher')
  // код формировния word файла по raspis
}

</script>

<template>
  <div class="q-pa-md">
    123
    {{ classroomById[61] }}<br>
  {{ auds[0] }}

  <br>
  <q-btn icon="print" @click="onPrintClick">Печатать</q-btn>
 </div>
</template>

<style>

</style>
