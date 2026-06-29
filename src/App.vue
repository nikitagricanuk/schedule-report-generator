<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import useScheduleStore from '@/stores/scheduleStore'
import generateReport, { Types } from "./generation/index.js";


const scheduleStore = useScheduleStore();
const {
  load,
  schedule,
  groups,
  classrooms,
  teachers,
  disciplines,
  departments,
  classroomById,
} = storeToRefs(scheduleStore)

const model = ref('teachers')
const selectedDepartments = ref(null)
const selectedBlock = ref(null)
const searchModel = ref(null)
const selectedGroups = ref([])

function onPrintClick() {
  const raspis = scheduleStore.getTeacherSchedule([2147], 'teacher')
  // код формировния word файла по raspis
}

function getSelectedString() {
  return selectedGroups.value.length === 0
    ? ''
    : `${selectedGroups.value.length} record${selectedGroups.value.length > 1 ? 's' : ''} selected of ${rows.length}`
}

</script>

<template>
  <div class="q-pa-md container">
    <div class="q-gutter-y-md">
      <q-btn-toggle q-btn-toggle v-model="model" spread no-caps toggle-color="purple" color="white" text-color="black"
        :options="[
          { value: 'teachers', slot: 'one' },
          { value: 'groups', slot: 'two' },
          { value: 'classrooms', slot: 'three' }
        ]">

        <template v-slot:one>
          <div class="row items-center no-wrap">
            <div class="text-center">Преподаватели</div>
            <q-icon name="person" class="q-ml-sm" />
          </div>
        </template>

        <template v-slot:two>
          <div class="row items-center no-wrap">
            <div class="text-center">Группы</div>
            <q-icon name="groups" class="q-ml-sm" />
          </div>
        </template>

        <template v-slot:three>
          <div class="row items-center no-wrap">
            <div class="text-center">Аудитории</div>
            <q-icon right name="meeting_room" />
          </div>
        </template>

      </q-btn-toggle>
    </div>
    <div class="selectedBlock">
      <q-input color="purple-12" v-model="searchModel" label="Поиск">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <div v-if="model === 'teachers'">
        <q-select standout="bg-teal text-white" v-model="selectedDepartments"
          :options="departments.map(item => item.kaf.trim())" label="Кафедра" />
      </div>
      <div v-if="model === 'groups'">
        <q-table flat bordered title="Группы" :rows="groups"
          :columns="[{ name: 'name', label: 'Группы', field: 'obozn' }]" row-key="id" selection="multiple"
          v-model:selected="selectedGroups" />

        <div class="q-mt-md"> Выбрано: {{ selectedGroups.length }} групп </div>
      </div>
      <div v-if="model === 'classrooms'">
        корпусы
        <!-- <q-select standout="bg-teal text-white" v-model="selectedBlock"
          :options="departments.map(item => item.kaf.trim())" label="Корпус" /> -->
      </div>
    </div>

    <!-- {{ classroomById[61] }}<br>
    {{ classrooms[0] }} -->
    <!-- {{ generateReport([475020], Types.SUBGROUP)}} -->
    <q-btn icon="print" @click="onPrintClick">Печатать</q-btn>
  </div>
</template>

<style>
.container {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  justify-content: center;
}

.selectedBlock {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0;
}
</style>
