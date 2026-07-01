import { defineStore } from "pinia";
import { onBeforeMount, computed, ref } from 'vue';
import axios from 'axios';
import _ from 'lodash';


const useScheduleStore = defineStore('scheduleStore', () => {
    const load = ref({})
    const schedule = ref([])
    const classrooms = ref([])
    const teachers = ref([])
    const disciplines = ref([])
    const departments = ref([])
    const groups = ref([])
    const blocks = ref([])

    const classroomById = computed(() => _.keyBy(classrooms.value, x => x.id))
    const teacherById = computed(() => _.keyBy(teachers.value, t => t.id))
    const disciplineById = computed(() => _.keyBy(disciplines.value, d => d.id))
    const groupsById = computed(() => _.keyBy(groups.value, g => g.id))

    function makeScheduleEntry(slot, day, everyweek) {
        return {
            everyweek,
            day,
            type: { 1: 'лк', 2: 'пр', 3: 'лб' }[slot.nt] ?? slot.nt,
            order: slot.para,
            discipline: slot.discipline,
            classroom: slot.classroom,
            teacher: slot.teacher,
            groups: Array.isArray(slot.groups) ? slot.groups.join(', ') : slot.groups,
        }
    }

    function rebuildSchedule(slots) {
        const scheduleRebuild = []
        for (let i = 1; i <= 7; ++i) {
            for (const slot of slots) {
                if (slot.day === i) {
                    if (slot.everyweek === 2) {
                        scheduleRebuild.push(makeScheduleEntry(slot, i, true))
                    }
                    else if (slots.some(s => s.day === i + 7 && s.para === slot.para)) {
                        scheduleRebuild.push([
                            makeScheduleEntry(slot, i, false),
                            makeScheduleEntry(slot, i + 7, false),
                        ])
                    }
                    else {
                        scheduleRebuild.push(makeScheduleEntry(slot, i, false))
                    }
                }
                // slot on the second week only
                else if (slot.day === i + 7 && !slots.some(s => s.day === i && s.para === slot.para)) {
                    scheduleRebuild.push(makeScheduleEntry(slot, i + 7, false))
                }
            }
        }
        return scheduleRebuild
    }

    function mapSlot(slot, teacherId) {
        const workload = load.value[slot.raspnagr]
        return {
            day: slot.day,
            para: slot.para,
            everyweek: slot.everyweek,
            nt: workload.nt,
            teacher: teacherById.value[teacherId]?.full_name?.trim(),
            groups: workload.subgroups.map(sgId => groupsById.value[sgId]?.obozn),
            discipline: disciplineById.value[workload.pred]?.pred,
            classroom: classroomById.value[slot.auds[0]]?.obozn?.trim(),
        }
    }

    function calculateBusyness(scheduleArr) {
        const TOTAL_SLOTS = 96 // 6 days * 8 periods * 2 weeks
        const occupiedSlots = scheduleArr.reduce((sum, item) => {
            if (Array.isArray(item)) return sum + item.length
            return sum + (item.everyweek ? 2 : 1)
        }, 0)
        return Math.round((occupiedSlots / TOTAL_SLOTS) * 100)
    }

    function getTeacherSchedule(id) {
        if (!schedule.value?.raspis) return [] // not initialised guard
        const slots = schedule.value.raspis
            .map(slot => mapSlot(slot, id))
            .filter(e => e.teacher)
        return rebuildSchedule(slots)
    }

    function getSubgroupSchedule(id) {
        if (!schedule.value?.raspis) return []
        const slots = schedule.value.raspis
            .filter(slot => load.value[slot.raspnagr]?.subgroups.includes(id))
            .map(slot => mapSlot(slot, load.value[slot.raspnagr].teachers[0]))
        return rebuildSchedule(slots)
    }

    function getClassroomSchedule(id) {
        if (!schedule.value?.raspis) return []
        const slots = schedule.value.raspis
            .filter(slot => slot.auds.includes(id))
            .map(slot => mapSlot(slot, load.value[slot.raspnagr].teachers[0]))
        return rebuildSchedule(slots)
    }

    function getTeacherById(id) {
        return Object.values(teachers.value).find(e => e.id === id)
    }

    function getTeachersByKafId(id) {
        const loadArray = Object.values(load.value)
        const arrayAlleachers = loadArray.filter(item => item.kaf === id)
        const idTeachers = _.flatMap(arrayAlleachers, 'teachers')
        const arrayTeachers = teachers.value.filter(item => idTeachers.includes(item.id))
        return arrayTeachers
    }

    function getClassroomByBlockId(id) {
        return Object.values(classrooms.value).filter(item => item.korp === id)
    }


    function getClassroomById(id) {
        return Object.values(classrooms.value).find(e => e.id === id)
    }

    function getGroupById(id) {
        return Object.values(groups.value).find(e => e.id === id)
    }

    onBeforeMount(async () => {
        let r = await axios.get('/all.json')
        load.value = r.data;

        r = await axios.get('/teacher_2147.json')
        schedule.value = r.data;
        r = await axios.get('/corpus.json')
        blocks.value = r.data;
        r = await axios.get('/auds.json')
        classrooms.value = r.data;
        r = await axios.get('/teachers.json')
        teachers.value = r.data;
        r = await axios.get('/schedule-pred.json')
        disciplines.value = r.data;
        r = await axios.get('/schedule-kaf.json')
        departments.value = r.data;
        r = await axios.get('/groups.json')
        groups.value = r.data;
    })

    return {
        load: load,
        schedule: schedule,
        groups: groups, classrooms: classrooms,
        teachers: teachers,
        disciplines: disciplines,
        departments: departments,
        blocks: blocks,

        classroomById: classroomById,
        getGroupById: getGroupById,
        calculateBusyness: calculateBusyness,
        getTeacherSchedule: getTeacherSchedule,
        getSubgroupSchedule: getSubgroupSchedule,
        getTeacherById: getTeacherById,
        getTeachersByKafId: getTeachersByKafId,
        getClassroomByBlockId: getClassroomByBlockId,
        getClassroomById: getClassroomById,
        getClassroomSchedule: getClassroomSchedule,
    }
})

export default useScheduleStore
