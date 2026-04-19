/* buttons */
declare var importButton: HTMLButtonElement
declare var exportButton: HTMLButtonElement
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
  input.addEventListener('input', () => {
    updateCell(cell)
    console.log(exportTable())
  })
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
  cell.possibleValues.container.hidden = value.length > 0
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
  lines.forEach((line, row) => {
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
  for (let cell of table.cells) {
    updateCell(cell)
  }
}
importTextarea.addEventListener('input', importTable)

importButton.addEventListener('click', () => {
  importDialog.showModal()
})

exportButton.addEventListener('click', () => {
  importTextarea.value = exportTable()
  importDialog.showModal()
})

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
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      let group = toGroupIndex({ row, col })
      let input = getInput({ row, col })!
      let value = input.value
      if (value) {
        // this cell is already filled
        continue
      }

      // init all possible values
      let possibleValues = new Set<number>()
      for (let i = 1; i <= 9; i++) {
        possibleValues.add(i)
      }

      // remove values in the same row
      for (let row = 0; row < 9; row++) {
        possibleValues.delete(getValue({ row, col })!)
      }

      // remove values in the same column
      for (let col = 0; col < 9; col++) {
        possibleValues.delete(getValue({ row, col })!)
      }

      // remove values in the same group
      for (let cell of table.cells) {
        if (cell.group == group) {
          possibleValues.delete(getValue(cell)!)
        }
      }

      console.log({ row, col, possibleValues })
    }
  }
}

function getValue(options: { row: number; col: number }): number | null {
  let input = getInput(options)
  if (!input) {
    return null
  }
  return +input.value || null
}

importTable()
