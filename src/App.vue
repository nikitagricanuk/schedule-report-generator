<script setup>
import { storeToRefs } from 'pinia';
import useScheduleStore from '@/stores/scheduleStore'
import generateReport, { Types } from "./generation/index.js";


const scheduleStore = useScheduleStore();
const {
  load,
  schedule,
  classrooms,
  teachers,
  disciplines,
  departments,
  classroomById,
} = storeToRefs(scheduleStore)


function onPrintClick() {
  const raspis = scheduleStore.getTeacherSchedule([2147], 'teacher')
  // код формировния word файла по raspis
}

</script>

<template>
  <div class="q-pa-md">
    123
    {{ classroomById[61] }}<br>
    {{ generateReport([475020], Types.SUBGROUP)}}

  <br>
  <q-btn icon="print" @click="onPrintClick">Печатать</q-btn>
 </div>
</template>

<style>

</style>
