import useScheduleStore from "@/stores/scheduleStore.js";

const Types = Object.freeze({
  TEACHER: 'TEACHER',
  SUBGROUP: 'SUBGROUP',
})

function generateReport(ids, type) {
  const scheduleStore = useScheduleStore();

  if (type === Types.TEACHER) {
    return scheduleStore.getTeacherSchedule(ids[0])
  }
  else if (type === Types.SUBGROUP) {
    return scheduleStore.getSubgroupSchedule(ids[0])
  }
}

export { Types };
export default generateReport;
