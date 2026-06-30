<script setup>
import { ref, watch, computed } from 'vue';
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

const { getTeacherSchedule, getTeachersByKafId } = scheduleStore

let model = ref('teachers')
const selectedDepartments = ref(null)
const selectedBlock = ref(null)
let searchModel = ref('')
const selectedGroups = ref([])
const isChoose = ref(false)
let filtredData = ref([])

function onPrintClick() {
  const raspis = scheduleStore.getTeacherSchedule([2147], 'teacher')
  // код формировния word файла по raspis
}

function selectAll(isChoose) {
  if (isChoose) {
    selectedGroups.value = [...data.value]
  }
  else {
    selectedGroups.value = []
  }
}

const data = computed(() => {
  let result = []

  switch (model.value) {
    case 'teachers':
      if (!selectedDepartments.value) {
        result = teachers.value ? [...teachers.value] : []
      }
      else { 
        console.log(selectedDepartments.value.id)
        result = getTeachersByKafId(selectedDepartments.value.id) 
      }
      break
    case 'groups':
      result = groups.value ? [...groups.value] : []
      break
    case 'classrooms':
      result = classrooms.value ? [...classrooms.value] : []
      break
    default:
      result = []
  }

  if (searchModel.value && searchModel.value.trim() !== '') {
    const search = searchModel.value.trim().toLowerCase()

    if (model.value === 'teachers') {
      return result.filter(item =>
        item.name?.toLowerCase().includes(search)
      )
    } else {
      return result.filter(item =>
        item.obozn?.toLowerCase().includes(search)
      )
    }
  }

  return result
})

watch(model, () => {
  searchModel.value = ''
  isChoose.value = false
  selectedGroups.value = []
  selectedDepartments.value = null
})



</script>

<template>
  <div class="q-pa-md container">
    <div class="q-gutter-y-md">
      <q-btn-toggle v-model="model" spread no-caps toggle-color="purple" color="white" text-color="black" :options="[
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

      <div v-if="model === 'teachers'" style="display: flex; flex-direction: column; gap: 10px;">

        <q-select standout="bg-teal text-white" v-model="selectedDepartments" :options="departments" option-label="kaf"
          label="Кафедра" placeholder="Выберите кафедру" />

        <q-table flat bordered title="Преподаватели" :rows="data"
          :columns="[{ name: 'name', label: 'ФИО', field: 'name' }]" row-key="id" selection="multiple"
          v-model:selected="selectedGroups" hide-header-selection
          :selected-rows-label="(rowsCount) => `Выбрано строк: ${rowsCount}`"
          rows-per-page-label="Записей на странице:" no-data-label="Нет доступных данных">
          <template v-slot:header-selection="all">
            <q-checkbox v-model="isChoose" @click="selectAll(isChoose)" />
          </template>
        </q-table>

        <div class="q-mt-md"> Выбрано: {{ selectedGroups.length }} преподователей </div>
      </div>

      <div v-if="model === 'groups'">
        <q-table flat bordered title="Группы" :rows="data"
          :columns="[{ name: 'name', label: 'Группы', field: 'obozn' }]" row-key="id" selection="multiple"
          v-model:selected="selectedGroups" hide-header-selection
          :selected-rows-label="(rowsCount) => `Выбрано строк: ${rowsCount}`"
          rows-per-page-label="Записей на странице:" no-data-label="Нет доступных данных">
          <template v-slot:header-selection="all">
            <q-checkbox v-model="isChoose" @click="selectAll(isChoose)" />
          </template>
        </q-table>


        <div class="q-mt-md"> Выбрано: {{ selectedGroups.length }} групп </div>
      </div>

      <div v-if="model === 'classrooms'">
        корпусы
        <!-- <q-select standout="bg-teal text-white" v-model="selectedBlock"
          :options="departments.map(item => item.kaf.trim())" label="Корпус" /> -->
      </div>
    </div>

    <!-- {{ getTeacherSchedule(2147) }}<br> -->
    <!-- {{ generateReport([475020], Types.SUBGROUP)}} -->
    <q-btn icon="print" @click="generateReport([2147], Types.TEACHER)">Печатать</q-btn>
  </div>
</template>

<style>
.container {
  display: flex;
  flex-direction: column;
  margin: 40px;
  justify-content: center;
}

.selectedBlock {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0;
}
</style>
