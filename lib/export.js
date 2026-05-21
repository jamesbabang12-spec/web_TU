// Export utilities for Excel and PDF
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportToExcel(data, filename, sheetName = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportToPDF({ title, subtitle, columns, rows, filename, orientation = 'portrait' }) {
  const doc = new jsPDF({ orientation })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(subtitle, 14, 25)
    doc.setTextColor(0)
  }
  autoTable(doc, {
    startY: subtitle ? 30 : 25,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  })
  doc.save(`${filename}.pdf`)
}
