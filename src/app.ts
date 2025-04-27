/* buttons */
declare var importButton: HTMLButtonElement
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
}

type Table = {
  groups: Cell[]
}

function initTable(): Cell[] {
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
  return cells
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
  input.inputMode = 'numeric'
  input.addEventListener('input', exportTable)
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
  td.appendChild(input)
  return { td, input, group, row: options.row, col: options.col }
}

let cells = initTable()

function getInput(options: {
  row: number
  col: number
}): HTMLInputElement | null {
  let input = sudokuTable.querySelector<HTMLInputElement>(
    `tr:nth-child(${options.row + 1}) td:nth-child(${options.col + 1}) input`,
  )
  if (!input) {
    return null
  }
  return input
}

function focusCell(options: { row: number; col: number }) {
  let row = (options.row + 9) % 9
  let col = (options.col + 9) % 9
  let input = getInput({ row, col })
  input?.focus()
}

function exportTable() {
  let text = ''
  sudokuTable.querySelectorAll('tr').forEach(tr => {
    tr.querySelectorAll('td').forEach(td => {
      let input = td.querySelector('input')
      let value = input?.value || '_'
      text += value
    })
    text += '\n'
  })
  console.log(text)
}

function importTable() {
  let text = importTextarea.value
  let lines = text.split('\n')
  lines.forEach((line, row) => {
    line.split('').forEach((value, col) => {
      if (value == '_') value = ''
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
}
importTextarea.addEventListener('input', importTable)

importButton.addEventListener('click', () => {
  importDialog.showModal()
})

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
      for (let cell of cells) {
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
