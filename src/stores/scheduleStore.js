import { defineStore } from "pinia";
import {onBeforeMount, computed, ref} from 'vue';
import axios from 'axios';
import _ from 'lodash';

const useScheduleStore = defineStore('scheduleStore', () => {

    const load = ref({})
    const schedule = ref([])
    const classrooms = ref([])
    const teachers = ref([])
    const disciplines = ref([])
    const departments = ref([])

    const classroomById = computed(() => {
        return _.keyBy(classrooms.value, x => x.id)
    })

    async function getSchedule(ids, type) {
        r = await axios.get('/teacher_2147.json')
        schedule.value = r.data.schedule;
        return schedule
    }

    onBeforeMount(async () => {
        let r = await axios.get('/all.json')
        load.value = r.data;



        r = await axios.get('/auds.json')
        classrooms.value = r.data;
        r = await axios.get('/teachers.json')
        teachers.value = r.data;
        r = await axios.get('/preds.json')
        disciplines.value = r.data;
        r = await axios.get('/kafs.json')
        departments.value = r.data;
    })

    return {
        load: load,
        schedule: schedule,
        classrooms: classrooms,
        teachers,
        disciplines: disciplines,
        departments: departments,

        classroomById: classroomById,
        getSchedule: getSchedule,
    }
})

export default useScheduleStore
