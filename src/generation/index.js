import useScheduleStore from "@/stores/scheduleStore.js";
import { getCurrentDate } from "./utils.js";

import {
  Document, Packer, Paragraph, TextRun, Tab,
  Table, TableRow, TableCell,
  AlignmentType, VerticalAlign,
  WidthType, ShadingType, BorderStyle,
  TabStopType, ImageRun, dateTimeValue,
} from "docx";

const Types = Object.freeze({
  TEACHER: 'TEACHER',
  SUBGROUP: 'SUBGROUP',
})

function generateReport(ids, type) {
  const scheduleStore = useScheduleStore();

  const pages = []

  if (type === Types.TEACHER) {
    for (const i in ids) {
      const page = {
        type: "teacher",
        date: getCurrentDate(),
        name: scheduleStore.getTeacherById(ids[i])?.name,
        schedule: {

        }
      }
      pages.push(scheduleStore.getTeacherSchedule(ids[i]));
    }
  }
  else if (type === Types.SUBGROUP) {
    for (const i in ids) {
      pages.push(scheduleStore.getSubgroupSchedule(ids[i]));
    }
  }
  return pages;
  // generateDocx(pages, type);
}

async function generateDocx(pages, type) {
  const logoData = await fetch('/logo.png').then(r => r.arrayBuffer());

  let children = [];
  children.push(
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: 11100 }],
      children: [
        new TextRun({ text: "29.06.2026  Карточка преподавателя  " }),
        new TextRun({ text: "Фунтикова Евгения Александровна", bold: true }),
        new TextRun({ children: [new Tab()] }),
        new TextRun({
          children: [new ImageRun({
            data: logoData,
            transformation: { width: 39, height: 39 },
            type: "png",
          })]
        }),
      ]
    })
  )

  const COL_DAY  = 420;
  const COL_SLOT = 1361;
  const TOTAL    = COL_DAY + COL_SLOT * 8; // 11308

  var cells = [];



  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 16838, height: 11906 }, // A4 landscape in DXA units
          margin: { top: 720, right: 720, bottom: 720, left: 720 } // 0.5 inch
        }
      },
      children: [ /* paragraphs and tables go here */ ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'output.docx';
  a.click();
  URL.revokeObjectURL(url);
}

export { Types };
export default generateReport;
