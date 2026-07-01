<script setup>
import { ref, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import useScheduleStore from '@/stores/scheduleStore'
import generateReport, { Types } from "./generation/index.js";


const scheduleStore = useScheduleStore();
const {
  groups,
  classrooms,
  teachers,
  departments,
  blocks,
} = storeToRefs(scheduleStore)

const { getTeachersByKafId, getClassroomByBlockId } = scheduleStore

let model = ref(Types.TEACHER)
const selectedOption = ref([])
let searchModel = ref('')
const selectedRows = ref([])
const isChoose = ref(false)

function selectAll(isChoose) {
  if (isChoose) {
    selectedRows.value = [...data.value]
  }
  else {
    selectedRows.value = []
  }
}

const data = computed(() => {
  let result = []

  switch (model.value) {
    case Types.TEACHER:
      if (selectedOption.value.length===0) {
        result = teachers.value ? [...teachers.value] : []
      }
      else {
        result = getTeachersByKafId(selectedOption.value.id)
      }
      break
    case Types.SUBGROUP:
      result = groups.value ? [...groups.value] : []
      break
    case Types.CLASSROOMS:
      if (selectedOption.value.length===0) {
        result = classrooms.value ? [...classrooms.value] : []
      }
      else result = getClassroomByBlockId(selectedOption.value.id)
      break
    default:
      result = []
  }

  if (searchModel.value && searchModel.value.trim() !== '') {
    const search = searchModel.value.trim().toLowerCase()

    if (model.value === Types.TEACHER) {
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
  selectedRows.value = []
  selectedOption.value = []
})



</script>

<template>
  <div class="q-pa-md container">
    <div class="q-gutter-y-md">
      <q-btn-toggle v-model="model" spread no-caps toggle-color="purple" color="white" text-color="black" :options="[
        { value: Types.TEACHER, slot: 'one' },
        { value: Types.SUBGROUP, slot: 'two' },
        { value: Types.CLASSROOMS, slot: 'three' }
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

      <div v-if="model === Types.TEACHER" class="model">

        <q-select standout="bg-teal text-white" v-model="selectedOption" :options="departments" option-label="kaf"
          label="Кафедра" />

        <q-table flat bordered title="Преподаватели" :rows="data"
          :columns="[{ name: 'name', label: 'ФИО', field: 'name' }]" row-key="id" selection="multiple"
          v-model:selected="selectedRows" hide-header-selection
          :selected-rows-label="(rowsCount) => `Выбрано строк: ${rowsCount}`" rows-per-page-label="Записей на странице:"
          no-data-label="Нет доступных данных">
          <template v-slot:header-selection="all">
            <q-checkbox v-model="isChoose" @click="selectAll(isChoose)" />
          </template>
        </q-table>
      </div>

      <div v-if="model === Types.SUBGROUP" class="model">
        <q-table flat bordered title="Группы" :rows="data"
          :columns="[{ name: 'name', label: 'Группы', field: 'obozn' }]" row-key="id" selection="multiple"
          v-model:selected="selectedRows" hide-header-selection
          :selected-rows-label="(rowsCount) => `Выбрано строк: ${rowsCount}`" rows-per-page-label="Записей на странице:"
          no-data-label="Нет доступных данных">
          <template v-slot:header-selection="all">
            <q-checkbox v-model="isChoose" @click="selectAll(isChoose)" />
          </template>
        </q-table>
      </div>

      <div v-if="model === Types.CLASSROOMS" class="model">

        <q-select standout="bg-teal text-white" v-model="selectedOption" :options="blocks" option-label="korp"
          label="Корпус" />

        <q-table flat bordered title="Преподаватели" :rows="data"
          :columns="[{ name: 'name', label: 'Аудитори', field: 'obozn' }]" row-key="id" selection="multiple"
          v-model:selected="selectedRows" hide-header-selection
          :selected-rows-label="(rowsCount) => `Выбрано строк: ${rowsCount}`" rows-per-page-label="Записей на странице:"
          no-data-label="Нет доступных данных">
          <template v-slot:header-selection="all">
            <q-checkbox v-model="isChoose" @click="selectAll(isChoose)" />
          </template>

        </q-table>
      </div>
    </div>
    
    <q-btn icon="print" @click="generateReport(selectedRows.map(row => row.id), model)">Печатать</q-btn>
  </div>
</template>

<style>
.container {
  display: flex;
  flex-direction: column;
  margin: 40px;
  justify-content: center;
  border-radius: 15px;
  background-color: Snow;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.selectedBlock {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0;
}

.model {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
