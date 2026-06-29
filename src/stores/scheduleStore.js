import { defineStore } from "pinia";
import {onBeforeMount, computed, ref} from 'vue';
import axios from 'axios';
import _ from 'lodash';

const useScheduleStore = defineStore('scheduleStore', () => {

    const nagruzka = ref({})
    const raspis = ref([])
    const auds = ref([])
    const teachers = ref([])
    const preds = ref([])
    const kafs = ref([])

    const audsById = computed(() => {
        return _.keyBy(auds.value, x => x.id)
    })

    async function getRaspis(ids, type) {
        r = await axios.get('/teacher_2147.json')
        raspis.value = r.data.raspis;
        return raspis
    }

    onBeforeMount(async () => {
        let r = await axios.get('/all.json')
        nagruzka.value = r.data;


        
        r = await axios.get('/auds.json')
        auds.value = r.data;
        r = await axios.get('/teachers.json')
        teachers.value = r.data;
        r = await axios.get('/preds.json')
        preds.value = r.data;
        r = await axios.get('/kafs.json')
        kafs.value = r.data;
    })

    return {
        nagruzka,
        raspis,
        auds,
        teachers,
        preds,
        kafs,

        audsById,
        getRaspis,
    }
})

export default useScheduleStore