import useScheduleStore from "@/stores/scheduleStore.js";
import { getCurrentDate } from "./utils.js";

import {
    Document, Packer, Paragraph, TextRun,
    Table, TableRow, TableCell,
    AlignmentType, VerticalAlign,
    WidthType, ShadingType, BorderStyle,
    TabStopType, ImageRun, dateTimeValue,
    HeightRule,
} from "docx";
import scheduleStore from "@/stores/scheduleStore.js";

const Types = Object.freeze({
    TEACHER: 'TEACHER',
    SUBGROUP: 'SUBGROUP',
    CLASSROOMS: 'CLASSROOMS',
})

function generateReport(ids, type) {
    const scheduleStore = useScheduleStore();

    const pages = []

    if (type === Types.TEACHER) {
        for (const i in ids) {
            const teacherSchedule = scheduleStore.getTeacherSchedule(ids[i]);
            pages.push({
                busyness: scheduleStore.calculateBusyness(teacherSchedule),
                type: "преподавателя ",
                date: getCurrentDate(),
                name: scheduleStore.getTeacherById(ids[i])?.name,
                schedule: teacherSchedule,
            });
        }
    } else if (type === Types.SUBGROUP) {
        for (const i in ids) {
            const subgroupSchedule = scheduleStore.getSubgroupSchedule(ids[i]);
            pages.push({
                busyness: scheduleStore.calculateBusyness(subgroupSchedule),
                type: "группы ",
                date: getCurrentDate(),
                name: scheduleStore.getGroupById(ids[i])?.obozn,
                schedule: subgroupSchedule,
            });
        }
    } else if (type === Types.CLASSROOMS) {
        for (const i in ids) {
            const classroomSchedule = scheduleStore.getClassroomSchedule(ids[i]);
            pages.push({
                busyness: scheduleStore.calculateBusyness(classroomSchedule),
                type: "аудитории ",
                date: getCurrentDate(),
                name: scheduleStore.getClassroomById(ids[i])?.obozn,
                schedule: classroomSchedule,
            });
        }
    }

    generateDocx(pages, type);
}




async function generateDocx(pages, type) {
    // const logoData = await fetch('/logo.png').then(r => r.arrayBuffer());

    const allChildren = [];

    for (const [pageIndex, page] of pages.entries()) {
        allChildren.push(
            new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: 11100 }],
                pageBreakBefore: pageIndex > 0,
                children: [
                    new TextRun({ text: page.date }),
                    new TextRun({ text: " Карточка " }),
                    new TextRun({ text: page.type }),
                    new TextRun({ text: page.name, bold: true }),
                    new TextRun({ text: `Занятость: ${page.busyness}%`, bold: true, break: 1 }),
                ]
            })
        )

        const COL_DAY = 180;
        const COL_SLOT = 1361;
        const TOTAL = COL_DAY + COL_SLOT * 8; // 11308
        const ROW_HEIGHT = 1600; 

        const DAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
        const CLASS_INTERVALS = ['', '8:15 - 9.45', '10:00 - 11:30', '11:45 - 13:15', '13:45 - 15:15', '15:30 - 17:00', '17:10 - 18:40', '18:45 - 20:15', '20:20 - 21:50']
        //Время пар
        const rows = [
            new TableRow({
                children: [
                    ...CLASS_INTERVALS.map((interval, i) =>
                        new TableCell({
                            width: { size: i === 0 ? COL_DAY : COL_SLOT, type: WidthType.DXA },
                            verticalAlign: VerticalAlign.CENTER,
                            shading: {
                                fill: "F5F5F5",
                                type: ShadingType.CLEAR,
                            },
                            children: [new Paragraph({ children: [new TextRun({ text: interval, size: 16 })] })]
                        })
                    )
                ]
            })
        ]
        for (let day = 1; day <= 6; day++) {
            // Normalisation
            const flatSchedule = page.schedule.flatMap(item =>
                Array.isArray(item)
                    ? item.map(e => ({ ...e, splitWeek: true,  }))
                    : [{ ...item, splitWeek: false }]
            );

            const daySchedule = flatSchedule.filter(e => e.day === day || e.day === day + 7);
            const hasSplitToday = daySchedule.some(e => e.splitWeek === true || e.everyweek === false);
            //Пары
            const makeParagraphs = (entry) => {
                if (entry) {
                    switch (type) {
                        case Types.TEACHER: {
                            return [new Paragraph({
                                children: [
                                    new TextRun({ text: (entry.classroom + (' [' + (entry.type ?? '') + ']' ?? '') ?? ''), bold: true }),
                                    new TextRun({ text: entry.discipline ?? '', size: 16, break: 1 }),
                                    new TextRun({ text: entry.groups ?? '', size: 16, break: 1 }),
                                ]
                            })]
                        }
                        case Types.SUBGROUP: {
                            return [new Paragraph({
                                children: [
                                    new TextRun({ text: (entry.classroom + (' [' + (entry.type ?? '') + ']' ?? '') ?? ''), size: 16, bold: true }),
                                    new TextRun({ text: entry.discipline ?? '', size: 16, break: 1 }),
                                    new TextRun({ text: entry.teacher ?? '', size: 16, break: 1 }),
                                    new TextRun({ text: entry.groups ?? '', size: 16, break: 1 }),
                                ]
                            })]
                        }
                        case Types.CLASSROOMS: {
                            return [new Paragraph({
                                children: [
                                    new TextRun({ text: entry.discipline ?? '', size: 16, break: 1 }),
                                    new TextRun({ text: (entry.teacher + '' ?? '') + ('[' + (entry.type ?? '') + ']' ?? ''), size: 16, bold:true, break: 1 }),
                                    new TextRun({ text: entry.groups ?? '', size: 16, break: 1 }),
                                ]
                            })]
                        }
                    }
                } else return [new Paragraph({})];
            }
            //Дни недели
            const cells = [
                new TableCell({
                    width: { size: COL_DAY, type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                    rowSpan: hasSplitToday ? 2 : undefined,
                    shading: {
                        fill: "F5F5F5",
                        type: ShadingType.CLEAR,
                    },
                    children: [new Paragraph({ children: [new TextRun({ text: DAY_NAMES[day], size: 16 })] })]
                })
            ]
            const double_cells = [];

            for (let order = 1; order <= 8; order++) {
                const entries = daySchedule.filter(e => e.order === order);

                if (entries[0]?.splitWeek === true) {
                    // split slot: top half -> cells, bottom half -> double_cells
                    cells.push(new TableCell({
                        width: { size: COL_SLOT, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        shading: {
                            fill: "FFF3A8",
                            type: ShadingType.CLEAR,
                        },
                        children: makeParagraphs(entries[0]),
                    }));
                    double_cells.push(new TableCell({
                        width: { size: COL_SLOT, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        shading: {
                            fill: "FFF3A8",
                            type: ShadingType.CLEAR,
                        },
                        children: makeParagraphs(entries[1]),
                    }));
                }
                else if (entries[0]?.everyweek === false) {
                    cells.push(new TableCell({
                        width: { size: COL_SLOT, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        shading: {
                            fill: "FFF3A8",
                            type: ShadingType.CLEAR,
                        },
                        children: makeParagraphs(entries[0]),
                    }));
                    double_cells.push(new TableCell({
                        width: { size: COL_SLOT, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        shading: {
                            fill: "FFFFFF",
                            type: ShadingType.CLEAR,
                        },
                        children: [new Paragraph({})]
                    }));
                }
                else {
                    cells.push(new TableCell({
                        width: { size: COL_SLOT, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        shading: { fill: entries.length > 0 ? "FFF3A8" : "ffffff", type: ShadingType.CLEAR },
                        rowSpan: hasSplitToday ? 2 : undefined,
                        children: entries.length > 0 ? makeParagraphs(entries[0]) : [new Paragraph({})]
                    }));
                }
            }

            rows.push(new TableRow({
                children: cells,
                height: { value: hasSplitToday ? ROW_HEIGHT / 2 : ROW_HEIGHT, rule: HeightRule.ATLEAST },
            }))
            if (double_cells.length > 0) {
                rows.push(new TableRow({
                    children: double_cells,
                    height: { value: ROW_HEIGHT / 2, rule: HeightRule.ATLEAST },
                }))
            }
        }

        allChildren.push(new Table({
            width: { size: TOTAL, type: WidthType.DXA },
            columnWidths: [COL_DAY, 1361, 1361, 1361, 1361, 1361, 1361, 1361, 1361],
            rows: rows
        }));
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { width: 11906, height: 16838 }, // A4 portrait in DXA units
                    margin: { top: 720, right: 720, bottom: 720, left: 720 } // 0.5 inch
                }
            },
            children: allChildren
        }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.docx';
    a.click();
    URL.revokeObjectURL(url);
}

export { Types };
export default generateReport;
