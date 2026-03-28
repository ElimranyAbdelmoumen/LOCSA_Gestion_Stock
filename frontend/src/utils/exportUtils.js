import ExcelJS from 'exceljs'

// Theme colors
const HEADER_BG    = '1E3A5F'   // dark navy
const HEADER_FG    = 'FFFFFF'   // white
const TITLE_BG     = '2563EB'   // blue-600
const TITLE_FG     = 'FFFFFF'
const ROW_ODD      = 'F0F4FF'   // very light blue
const ROW_EVEN     = 'FFFFFF'
const BORDER_COLOR = 'BFDBFE'   // blue-200

const border = {
  top:    { style: 'thin', color: { argb: BORDER_COLOR } },
  left:   { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
  right:  { style: 'thin', color: { argb: BORDER_COLOR } },
}

/**
 * Export styled Excel file.
 * @param {Array}  rows     - array of data objects
 * @param {string} filename - output filename (without .xlsx)
 * @param {Array}  columns  - [{ key, header, width? }]
 * @param {string} title    - report title displayed at top
 */
export const exportToExcel = async (rows, filename, columns, title = filename) => {
  const workbook  = new ExcelJS.Workbook()
  workbook.creator  = 'LOCSA SARL'
  workbook.created  = new Date()

  const sheet = workbook.addWorksheet('Données', {
    views: [{ state: 'frozen', ySplit: 3 }],   // freeze title + header rows
  })

  const colCount = columns.length

  // ── Row 1: Report title (merged) ──────────────────────────────────────────
  sheet.mergeCells(1, 1, 1, colCount)
  const titleCell = sheet.getCell('A1')
  titleCell.value = title
  titleCell.font  = { bold: true, size: 14, color: { argb: TITLE_FG }, name: 'Calibri' }
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_BG } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 32

  // ── Row 2: Export date (merged) ──────────────────────────────────────────
  sheet.mergeCells(2, 1, 2, colCount)
  const dateCell = sheet.getCell('A2')
  dateCell.value = `Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}  •  ${rows.length} enregistrement(s)`
  dateCell.font  = { italic: true, size: 9, color: { argb: 'BFDBFE' }, name: 'Calibri' }
  dateCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(2).height = 18

  // ── Row 3: Column headers ─────────────────────────────────────────────────
  const headerRow = sheet.getRow(3)
  headerRow.height = 24
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = col.header
    cell.font  = { bold: true, size: 10, color: { argb: HEADER_FG }, name: 'Calibri' }
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false }
    cell.border = border
  })

  // ── Rows 4+: Data ─────────────────────────────────────────────────────────
  rows.forEach((row, rowIdx) => {
    const dataRow = sheet.addRow(columns.map(col => row[col.key] ?? ''))
    dataRow.height = 20
    const isOdd = rowIdx % 2 === 0
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: isOdd ? ROW_ODD : ROW_EVEN } }
      cell.border    = border
      cell.font      = { size: 10, name: 'Calibri' }
      cell.alignment = { vertical: 'middle', wrapText: false }
      // Right-align numbers
      const val = columns[colNumber - 1]
      if (val && typeof row[val.key] === 'number') {
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      }
    })
  })

  // ── Column widths ─────────────────────────────────────────────────────────
  columns.forEach((col, idx) => {
    const maxLen = Math.max(
      col.header.length,
      ...rows.map(r => String(r[col.key] ?? '').length)
    )
    sheet.getColumn(idx + 1).width = Math.min(Math.max(maxLen + 4, col.width || 12), 45)
  })

  // ── Download ──────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename + '.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

const addSheet = (workbook, { name, rows, columns, title }) => {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: 3 }],
  })
  const colCount = columns.length

  sheet.mergeCells(1, 1, 1, colCount)
  const titleCell = sheet.getCell('A1')
  titleCell.value = title
  titleCell.font  = { bold: true, size: 14, color: { argb: TITLE_FG }, name: 'Calibri' }
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_BG } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 32

  sheet.mergeCells(2, 1, 2, colCount)
  const dateCell = sheet.getCell('A2')
  dateCell.value = `Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}  •  ${rows.length} enregistrement(s)`
  dateCell.font  = { italic: true, size: 9, color: { argb: 'BFDBFE' }, name: 'Calibri' }
  dateCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(2).height = 18

  const headerRow = sheet.getRow(3)
  headerRow.height = 24
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = col.header
    cell.font  = { bold: true, size: 10, color: { argb: HEADER_FG }, name: 'Calibri' }
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = border
  })

  rows.forEach((row, rowIdx) => {
    const dataRow = sheet.addRow(columns.map(col => row[col.key] ?? ''))
    dataRow.height = 20
    const isOdd = rowIdx % 2 === 0
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: isOdd ? ROW_ODD : ROW_EVEN } }
      cell.border = border
      cell.font   = { size: 10, name: 'Calibri' }
      cell.alignment = { vertical: 'middle', wrapText: false }
      const val = columns[colNumber - 1]
      if (val && typeof row[val.key] === 'number') {
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      }
    })
  })

  columns.forEach((col, idx) => {
    const maxLen = Math.max(col.header.length, ...rows.map(r => String(r[col.key] ?? '').length))
    sheet.getColumn(idx + 1).width = Math.min(Math.max(maxLen + 4, col.width || 12), 45)
  })
}

/**
 * Export styled multi-sheet Excel file.
 * @param {Array}  sheets   - [{ name, rows, columns, title }]
 * @param {string} filename - output filename (without .xlsx)
 */
export const exportToExcelMultiSheet = async (sheets, filename) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'LOCSA SARL'
  workbook.created = new Date()
  sheets.forEach(s => addSheet(workbook, s))
  const buffer = await workbook.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename + '.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}
