import useScheduleStore from "@/stores/scheduleStore.js";
import {getCurrentDate} from "./utils.js";

import {
    Document, Packer, Paragraph, TextRun, Tab,
    Table, TableRow, TableCell,
    AlignmentType, VerticalAlign,
    WidthType, ShadingType, BorderStyle,
    TabStopType, ImageRun, dateTimeValue,
} from "docx";
import scheduleStore from "@/stores/scheduleStore.js";

const Types = Object.freeze({
    TEACHER: 'TEACHER',
    SUBGROUP: 'SUBGROUP',
    CLASSROOMS: 'CLASSROOMS',
})

function generateReport(ids, type) {
    const scheduleStore = useScheduleStore();
    console.log(ids)
    const pages = []

    if (type === Types.TEACHER) {
        for (const i in ids) {
            pages.push({
                type: "преподавателя ",
                date: getCurrentDate(),
                name: scheduleStore.getTeacherById(ids[i])?.name,
                schedule: scheduleStore.getTeacherSchedule(ids[i]),
            });
        }
    } else if (type === Types.SUBGROUP) {
        for (const i in ids) {
            pages.push({
                type: "группы ",
                date: getCurrentDate(),
                name: scheduleStore.getGroupById(ids[i])?.name,
                schedule: scheduleStore.getTeacherSchedule(ids[i]),
            });
        }
    }
    // return pages;
    generateDocx(pages, type);
}

function slotCell(currentWeek, nextWeek, COL_SLOT) {
    const innerTable = new Table({
        width: { size: COL_SLOT - 100, type: WidthType.DXA }, // slightly narrower than cell
        columnWidths: [COL_SLOT - 100],
        rows: [
            // upper slot — current week
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: COL_SLOT - 100, type: WidthType.DXA },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, // divider line
                        },
                        margins: { top: 40, bottom: 40, left: 50, right: 50 },
                        children: currentWeek
                            ? [new Paragraph({ children: [
                                new TextRun({ text: currentWeek.discipline ?? '', size: 16 }),
                                new TextRun({ text: '  ' + (currentWeek.groups ?? ''), size: 16 }),
                                new TextRun({ text: '  ' + (currentWeek.classroom ?? ''), size: 16 }),
                                new TextRun({ text: ' (' + (currentWeek.type ?? '') + ')', size: 16 }),
                            ]})]
                            : [new Paragraph({ children: [] })],
                    })
                ]
            }),

            // lower slot — next week
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: COL_SLOT - 100, type: WidthType.DXA },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                        },
                        margins: { top: 40, bottom: 40, left: 50, right: 50 },
                        children: nextWeek
                            ? [new Paragraph({ children: [
                                new TextRun({ text: nextWeek.discipline ?? '', size: 16 }),
                                new TextRun({ text: '  ' + (nextWeek.groups ?? ''), size: 16 }),
                                new TextRun({ text: '  ' + (nextWeek.classroom ?? ''), size: 16 }),
                                new TextRun({ text: ' (' + (nextWeek.type ?? '') + ')', size: 16 }),
                            ]})]
                            : [new Paragraph({ children: [] })],
                    })
                ]
            }),
        ]
    });

    return new TableCell({
        width: { size: COL_SLOT, type: WidthType.DXA },
        verticalAlign: VerticalAlign.TOP,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        children: [innerTable],
    });
}



async function generateDocx(pages, type) {
    // const logoData = await fetch('/logo.png').then(r => r.arrayBuffer());

    for (const page of pages) {
        let children = [];
        children.push(
            new Paragraph({
                tabStops: [{type: TabStopType.RIGHT, position: 11100}],
                children: [
                    new TextRun({text: page.date}),
                    new TextRun({text: " Карточка "}),
                    new TextRun({text: page.type}),
                    new TextRun({text: page.name, bold: true}),
                ]
            })
        )

        const COL_DAY = 420;
        const COL_SLOT = 1361;
        const TOTAL = COL_DAY + COL_SLOT * 8; // 11308

        const DAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
        const CLASS_INTERVALS = ['', '8:15 - 9.45', '10:00 - 11:30', '11:45 - 13:15', '13:45 - 15:15', '15:30 - 17:00', '17:10 - 18:40', '18:45 - 20:15', '20:20 - 21:50']
        const rows = [
            new TableRow({
                children: [
                    ...CLASS_INTERVALS.map(interval =>
                        new TableCell({
                            width: { size: COL_SLOT, type: WidthType.DXA },
                            verticalAlign: VerticalAlign.CENTER,
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
                    ? item.map(e => ({ ...e, repeating: true }))
                    : [{ ...item, repeating: false }]
            );

            const daySchedule = flatSchedule.filter(e => e.day === day || e.day === day + 7);
            const hasSplitToday = daySchedule.some(e => e.repeating === true);

            const makeParagraphs = (entry) => entry
                ? [new Paragraph({
                    children: [
                        new TextRun({ text: entry.discipline ?? '', size: 16 }),
                        new TextRun({ text: '  ' + (entry.groups ?? ''), size: 16 }),
                        new TextRun({ text: '  ' + (entry.classroom ?? ''), size: 16 }),
                        new TextRun({ text: ' (' + (entry.type ?? '') + ')', size: 16 }),
                    ]
                })]
                : [new Paragraph({})];

            const cells = [
                new TableCell({
                    width: { size: COL_DAY, type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                    rowSpan: hasSplitToday ? 2 : undefined,
                    children: [new Paragraph({ children: [new TextRun({ text: DAY_NAMES[day], size: 16 })] })]
                })
            ]
            const double_cells = [];

            for (let order = 1; order <= 8; order++) {
                const entries = daySchedule.filter(e => e.order === order);

                if (entries[0]?.repeating === true) {
                    // split slot: top half -> cells, bottom half -> double_cells
                    cells.push(new TableCell({
                        width: { size: COL_SLOT, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        shading: { fill: "FAFAFA", type: ShadingType.CLEAR },
                        children: makeParagraphs(entries[0]),
                    }));
                    double_cells.push(new TableCell({
                        width: { size: COL_SLOT, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        shading: { fill: "FAFAFA", type: ShadingType.CLEAR },
                        children: makeParagraphs(entries[1]),
                    }));
                } else {
                    cells.push(new TableCell({
                        width: { size: COL_SLOT, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        shading: { fill: "FAFAFA", type: ShadingType.CLEAR },
                        rowSpan: hasSplitToday ? 2 : undefined,
                        children: entries.length > 0 ? makeParagraphs(entries[0]) : [new Paragraph({})]
                    }));
                }
            }

            rows.push(new TableRow({ children: cells }))
            if (double_cells.length > 0) {
                rows.push(new TableRow({ children: double_cells }))
            }
        }

        children.push(new Table({
            width: { size: TOTAL, type: WidthType.DXA },
            columnWidths: [COL_DAY, 1361, 1361, 1361, 1361, 1361, 1361, 1361, 1361],
            rows: rows
        }));

        var doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: {width: 11906, height: 16838}, // A4 portrait in DXA units
                        margin: {top: 720, right: 720, bottom: 720, left: 720} // 0.5 inch
                    }
                },
                children: children
            }]
        });
    }

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.docx';
    a.click();
    URL.revokeObjectURL(url);
}

export {Types};
export default generateReport;
