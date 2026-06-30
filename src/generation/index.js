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
                            children: [new Paragraph({ children: [new TextRun({ text: interval })] })]
                        })
                    )
                ]
            })
        ]
        for (let day = 1; day <= 6; day++) {
            const cells = [
                new TableCell({
                    width: { size: COL_DAY, type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({ children: [new TextRun({ text: DAY_NAMES[day] })] })]
                })
            ]
            for (let order = 1; order <= 8; order++) {
                const entries = page.schedule.filter(e => e.day === day && e.order === order)
                cells.push(
                    new TableCell({
                        width: { size: COL_SLOT, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 50, bottom: 50, left: 50, right: 50 },
                        shading: { fill: "FAFAFA", type: ShadingType.CLEAR },
                        children: entries.length > 0
                            ? entries.map(entry => new Paragraph({
                                children: [
                                    new TextRun({ text: entry.discipline ?? '' }),
                                    new TextRun({ text: '  ' + (entry.groups ?? '') }),
                                    new TextRun({ text: '  ' + (entry.classroom ?? '') }),
                                    new TextRun({ text: ' (' + (entry.type ?? '') + ')' }),
                                ]
                            }))
                            : [new Paragraph({})]
                    })
                )
            }
            rows.push(new TableRow({ children: cells }))
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
                        size: {width: 16838, height: 11906}, // A4 landscape in DXA units
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
