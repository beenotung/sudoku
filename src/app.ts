/* buttons */
declare var emptyButton: HTMLButtonElement
declare var startButton: HTMLButtonElement
declare var importButton: HTMLButtonElement
declare var exportButton: HTMLButtonElement
declare var resetButton: HTMLButtonElement
declare var showHintButton: HTMLButtonElement
declare var hideHintButton: HTMLButtonElement
declare var solveButton: HTMLButtonElement

/* import dialog */
declare var importDialog: HTMLDialogElement
declare var importTextarea: HTMLTextAreaElement

/* sudoku table */
declare var sudokuTable: HTMLTableElement
declare var sudokuTableBody: HTMLTableSectionElement

type Cell = {
  td: HTMLTableCellElement
  input: HTMLInputElement
  group: number
  row: number
  col: number
  possibleValues: {
    container: HTMLDivElement
    items: HTMLDivElement[]
  }
}

type Table = {
  cells: Cell[]
  rows: Cell[][]
  cols: Cell[][]
  groups: Cell[][]
}

function initTable(): Table {
  let cells: Cell[] = []
  for (let row = 0; row < 9; row++) {
    let tr = document.createElement('tr')
    for (let col = 0; col < 9; col++) {
      let cell = initCell({ row, col })
      cells.push(cell)
      tr.appendChild(cell.td)
    }
    sudokuTableBody.appendChild(tr)
  }
  function createArray() {
    let array = new Array(9)
    for (let i = 0; i < 9; i++) {
      array[i] = []
    }
    return array
  }
  let rows: Cell[][] = createArray()
  let cols: Cell[][] = createArray()
  let groups: Cell[][] = createArray()
  for (let cell of cells) {
    rows[cell.row].push(cell)
    cols[cell.col].push(cell)
    groups[cell.group].push(cell)
  }
  return { cells, rows, cols, groups }
}

function toGroupIndex(options: { row: number; col: number }) {
  let row = Math.floor(options.row / 3)
  let col = Math.floor(options.col / 3)
  let index = row * 3 + col
  return index
}

function initCell(options: { row: number; col: number }): Cell {
  let td = document.createElement('td')
  let input = document.createElement('input')
  let group = toGroupIndex(options)
  td.style.backgroundColor = group % 2 == 0 ? '#ccc' : '#fff'
  td.dataset.row = options.row.toString()
  td.dataset.col = options.col.toString()
  td.dataset.group = group.toString()
  input.inputMode = 'numeric'
  input.addEventListener('input', () => updateCell(cell))
  input.addEventListener('keydown', event => {
    switch (event.key) {
      case 'ArrowLeft':
        focusCell({ row: options.row, col: options.col - 1 })
        break
      case 'ArrowRight':
        focusCell({ row: options.row, col: options.col + 1 })
        break
      case 'ArrowUp':
        focusCell({ row: options.row - 1, col: options.col })
        break
      case 'ArrowDown':
        focusCell({ row: options.row + 1, col: options.col })
        break
    }
  })
  let possibleValues = initPossibleValues()
  td.appendChild(input)
  td.appendChild(possibleValues.container)
  let cell: Cell = {
    td,
    input,
    group,
    row: options.row,
    col: options.col,
    possibleValues,
  }
  return cell
}

function initPossibleValues() {
  let container = document.createElement('div')
  container.className = 'possible-values--container'
  let items: HTMLDivElement[] = []
  for (let i = 1; i <= 9; i++) {
    let item = document.createElement('div')
    item.className = 'possible-values--item'
    item.dataset.value = i.toString()
    item.textContent = i.toString()
    items.push(item)
    container.appendChild(item)
  }
  return { container, items }
}

let table = initTable()

function getCell(options: { row: number; col: number }): Cell {
  let cell = table.rows[options.row]?.[options.col]
  if (!cell) {
    throw new Error(`cell not found: ${options.row}, ${options.col}`)
  }
  return cell
}

function getInput(options: {
  row: number
  col: number
}): HTMLInputElement | null {
  return getCell(options).input
}

function focusCell(options: { row: number; col: number }) {
  let row = (options.row + 9) % 9
  let col = (options.col + 9) % 9
  let input = getInput({ row, col })
  input?.focus()
}

function updateCell(cell: Cell) {
  let input = cell.input
  let value = input.value
  if (value.length > 1) {
    value = value.slice(-1).trim()
    input.value = value
  }
  cell.possibleValues.container.hidden = +value > 0
  populatePossibleValues(cell)
}

function resetPossibleValues() {
  for (let cell of table.cells) {
    for (let item of cell.possibleValues.items) {
      item.hidden = false
    }
  }
}

function populatePossibleValues(cell: Cell): { changed: boolean } {
  let value = +cell.input.value
  let { row, col, group } = cell

  let changed = false
  function setHidden(item: HTMLDivElement) {
    if (item.hidden) return
    item.hidden = true
    changed = true
  }

  if (value) {
    let index = value - 1
    for (let item of cell.possibleValues.items) {
      item.hidden = true
    }

    // remove direct values in the same row/col/group
    for (let col = 0; col < 9; col++) {
      setHidden(getCell({ row, col }).possibleValues.items[index])
    }
    for (let row = 0; row < 9; row++) {
      setHidden(getCell({ row, col }).possibleValues.items[index])
    }
    for (let cell of table.groups[group]) {
      setHidden(cell.possibleValues.items[index])
    }
    return { changed }
  }

  // remove combo-values in the same row/col/group
  let possibleValues = getPossibleValues(cell)
  if (possibleValues.length > 1) {
    // scan same row/col/group
    let sameRowCells: Cell[] = []
    let sameColCells: Cell[] = []
    let sameGroupCells: Cell[] = []
    for (let col = 0; col < 9; col++) {
      checkOtherCell(sameRowCells, getCell({ row, col }))
    }
    for (let row = 0; row < 9; row++) {
      checkOtherCell(sameColCells, getCell({ row, col }))
    }
    for (let cell of table.groups[group]) {
      checkOtherCell(sameGroupCells, cell)
    }
    function checkOtherCell(sameCells: Cell[], cell: Cell) {
      let otherPossibleValues = getPossibleValues(cell)
      if (
        getIsSamePossibleValues(possibleValues, otherPossibleValues) ||
        getIsSetSetPossibleValues(possibleValues, otherPossibleValues)
      ) {
        sameCells.push(cell)
      }
    }

    // remove combo-values
    if (sameRowCells.length === possibleValues.length) {
      for (let col = 0; col < 9; col++) {
        let cell = getCell({ row, col })
        if (sameRowCells.includes(cell)) continue
        for (let value of possibleValues) {
          let index = value - 1
          setHidden(cell.possibleValues.items[index])
        }
      }
    }
    if (sameColCells.length === possibleValues.length) {
      for (let row = 0; row < 9; row++) {
        let cell = getCell({ row, col })
        if (sameColCells.includes(cell)) continue
        for (let value of possibleValues) {
          let index = value - 1
          setHidden(cell.possibleValues.items[index])
        }
      }
    }
    if (sameGroupCells.length === possibleValues.length) {
      for (let cell of table.groups[group]) {
        if (sameGroupCells.includes(cell)) continue
        for (let value of possibleValues) {
          let index = value - 1
          setHidden(cell.possibleValues.items[index])
        }
      }
    }

    // remove other row/col, due to being same row/col in the same group for the same value
    for (let value of possibleValues) {
      let index = value - 1
      let groupRows = new Set<number>()
      let groupCols = new Set<number>()
      for (let cell of table.groups[group]) {
        if (cell.possibleValues.items[index].hidden) continue
        groupRows.add(cell.row)
        groupCols.add(cell.col)
      }
      if (groupRows.size === 1) {
        let row = Array.from(groupRows)[0]
        for (let col = 0; col < 9; col++) {
          let cell = getCell({ row, col })
          if (cell.group === group) continue
          setHidden(cell.possibleValues.items[index])
        }
      }
      if (groupCols.size === 1) {
        let col = Array.from(groupCols)[0]
        for (let row = 0; row < 9; row++) {
          let cell = getCell({ row, col })
          if (cell.group === group) continue
          setHidden(cell.possibleValues.items[index])
        }
      }
    }
  }
  return { changed }
}

function getIsSamePossibleValues(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  let n = a.length
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function getIsSetSetPossibleValues(a: number[], b: number[]): boolean {
  return a.length > 0 && b.length > 0 && b.every(value => a.includes(value))
}

function removeByValue(cells: Cell[], cell: Cell) {
  let index = cells.indexOf(cell)
  if (index !== -1) cells.splice(index, 1)
}

function exportTable() {
  let text = ''
  for (let row = 0; row < 9; row++) {
    let cols = table.rows[row]
    for (let col = 0; col < 9; col++) {
      let cell = cols[col]
      text += cell.input.value || '_'
    }
    text += '\n'
  }
  return text
}

function importTable() {
  let text = importTextarea.value
  let lines = text.split('\n')
  while (lines.length < 9) {
    lines.push('')
  }
  lines = lines.slice(0, 9)
  lines.forEach((line, row) => {
    while (line.length < 9) {
      line += ' '
    }
    line = line.slice(0, 9)
    line.split('').forEach((value, col) => {
      if (value == '_') value = ''
      if (value == ' ') value = ''
      let input = getInput({ row, col })
      if (!input) {
        console.error(`input not found:`, { row, col })
        return
      }
      input.value = value
      if (value) {
        input.readOnly = true
        input.dataset.state = 'fixed'
      } else {
        input.readOnly = false
        input.dataset.state = 'unknown'
      }
    })
  })
  resetPossibleValues()
  for (let cell of table.cells) {
    updateCell(cell)
  }
}
importTextarea.addEventListener('input', importTable)

emptyButton.addEventListener('click', () => {
  importTextarea.value = ''
  importTable()
})

startButton.addEventListener('click', () => {
  importTextarea.value = exportTable()
  importTable()
})

importButton.addEventListener('click', () => {
  importDialog.showModal()
})

exportButton.addEventListener('click', () => {
  importTextarea.value = exportTable()
  importDialog.showModal()
})

resetButton.addEventListener('click', importTable)

showHintButton.addEventListener('click', () => {
  showHintButton.hidden = true
  hideHintButton.hidden = false
  sudokuTable.classList.remove('hide-hint')
})
hideHintButton.addEventListener('click', () => {
  showHintButton.hidden = false
  hideHintButton.hidden = true
  sudokuTable.classList.add('hide-hint')
})
showHintButton.hidden = true
hideHintButton.hidden = false

solveButton.addEventListener('click', solveTable)

function solveTable() {
  solve_loop: for (;;) {
    for (let cell of table.cells) {
      let possibleValues = getPossibleValues(cell)

      // check for only one possible value
      if (possibleValues.length === 1) {
        cell.input.value = possibleValues[0].toString()
        updateCell(cell)
        continue solve_loop
      }

      // check for unique position possible values
      let { row, col, group } = cell
      for (let value of possibleValues) {
        let index = value - 1
        let otherInRow: Cell | null = null
        let otherInCol: Cell | null = null
        let otherInGroup: Cell | null = null
        for (let col = 0; col < 9; col++) {
          let otherCell = getCell({ row, col })
          if (otherCell === cell) continue
          if (otherCell.possibleValues.items[index].hidden) continue
          otherInRow = otherCell
        }
        for (let row = 0; row < 9; row++) {
          let otherCell = getCell({ row, col })
          if (otherCell === cell) continue
          if (otherCell.possibleValues.items[index].hidden) continue
          otherInCol = otherCell
        }
        for (let otherCell of table.groups[group]) {
          if (otherCell === cell) continue
          if (otherCell.possibleValues.items[index].hidden) continue
          otherInGroup = otherCell
        }
        if (!otherInRow || !otherInCol || !otherInGroup) {
          cell.input.value = value.toString()
          updateCell(cell)
          continue solve_loop
        }
      }

      // check for inferrable possible values
      if (possibleValues.length > 1) {
        if (populatePossibleValues(cell).changed) {
          continue solve_loop
        }
      }
    }
    break
  }
}

function getPossibleValues(cell: Cell): number[] {
  let possibleValues: number[] = []
  for (let item of cell.possibleValues.items) {
    if (item.hidden) continue
    possibleValues.push(+item.dataset.value!)
  }
  return possibleValues
}

function getValue(options: { row: number; col: number }): number | null {
  let input = getInput(options)
  if (!input) {
    return null
  }
  return +input.value || null
}

importTable()
