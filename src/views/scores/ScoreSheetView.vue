<template>
  <div class="score-sheet">
    <!-- Toolbar -->
    <div class="sheet-toolbar">
      <button class="tb-btn" @click="goBack" title="Back">
        <i class="bi bi-arrow-left"></i>
      </button>
      <div class="offering-info">
        <strong>{{ data?.subject?.name || 'Subject' }}</strong>
        <span class="text-muted">
          <span class="term-badge">{{ data?.term?.name }}</span>
          <span v-if="className" class="class-badge">
            <School :size="12" />
            {{ className }}
          </span>
          <template v-if="data?.offerings?.length">
            · {{ data.offerings.map(o => o.teacher_name).filter(Boolean).join(', ') }}
          </template>
        </span>
      </div>
      <div class="toolbar-spacer"></div>
      <div class="toolbar-actions">
        <div class="btn-group">
          <button class="tb-btn" @click="showAddColumn = true" title="Add Column"><i class="bi bi-plus-lg"></i> <span>Add</span></button>
          <button class="tb-btn" @click="showWeights = true" title="Weight Configuration"><i class="bi bi-sliders"></i> <span>Weights</span></button>
          <button class="tb-btn" @click="syncToGoogle" title="Export to Google Sheets" :disabled="syncing"><i :class="syncing ? 'bi bi-arrow-repeat spinning' : 'bi bi-google'"></i><span>{{ syncing ? 'Exporting...' : 'Google Sheets' }}</span></button>
          <button class="tb-btn" @click="showImport = true" title="Import CSV, Excel, or PDF file"><i class="bi bi-cloud-upload"></i> <span>Import</span></button>
          <div class="export-dropdown" @click.stop>
            <button class="tb-btn" @click="showExportMenu = !showExportMenu" title="Export" ref="exportBtnRef"><i class="bi bi-download"></i> <span>Export</span> <i class="bi bi-chevron-down" style="font-size:0.6rem;margin-left:2px"></i></button>
            <div v-if="showExportMenu" class="export-menu">
              <div class="export-menu-item" @click="exportFormat('xlsx')"><i class="bi bi-file-earmark-excel"></i> Export as Excel (.xlsx)</div>
              <div class="export-menu-item" @click="exportFormat('pdf')"><i class="bi bi-filetype-pdf"></i> Export as PDF</div>
            </div>
          </div>
          <button class="tb-btn" @click="refreshData" title="Refresh"><i class="bi bi-arrow-clockwise" :class="{ spinning: loading }"></i></button>
        </div>
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input v-model="searchQuery" type="text" placeholder="Search student..." />
        </div>
        <div class="save-status" :class="saveStatusClass" :title="saveStatusText">
          <i :class="saveStatusIcon"></i>
          <span class="status-text">{{ saveStatusText }}</span>
        </div>
        <button class="tb-btn kb-btn" @click="showKeyboardShortcuts = true" title="Keyboard shortcuts (?)">
          <i class="bi bi-keyboard"></i>
        </button>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar" v-if="data">
      <div class="stat-item"><span class="stat-label">Students</span><span class="stat-value">{{ filteredRows.length }}</span></div>
      <div class="stat-item"><span class="stat-label">Avg Score</span><span class="stat-value">{{ averageScore.toFixed(1) }}</span></div>
      <div class="stat-item"><span class="stat-label">Pass Rate</span><span class="stat-value">{{ passRate.toFixed(1) }}%</span></div>
      <div class="stat-item"><span class="stat-label">Top</span><span class="stat-value">{{ topStudent }}</span></div>
      <div class="stat-item" v-if="data.offerings?.length">
        <span class="stat-label">Teachers</span>
        <span class="stat-value">{{ data.offerings.map(o => o.teacher_name).filter(Boolean).join(', ') }}</span>
      </div>
    </div>

    <!-- Spreadsheet Table -->
    <div class="sheet-wrapper" tabindex="0" @keydown="onGlobalKeydown" ref="sheetContainer" @paste="onPaste" @copy="onCopy" @cut="onCut">
      <div class="sheet-scroll" @scroll="onScroll">
        <table class="sheet-table">
          <thead>
            <tr>
              <th class="cell-header cell-frozen row-num-header" :class="{ 'header-highlighted': isRowHeaderHighlighted() }">#</th>
              <th class="cell-header cell-frozen student-name-header" :class="{ 'header-highlighted': selectedCol === -1 }">Student Name</th>
              <th class="cell-header cell-frozen student-id-header" :class="{ 'header-highlighted': selectedCol === 0 }">ID</th>
              <th v-for="col in columns" :key="col.id" class="cell-header" :class="[getColumnTypeClass(col.type), { 'header-highlighted': selectedCol === col.id }]" :style="{ minWidth: '80px' }">
                <div class="header-content column-header-content">
                  <span class="column-label" :title="col.label" @lclick.stop="startRenameColumn(col)">{{ col.label }}</span>
                  <select v-model="columnTypes[col.id]" @change="onColumnTypeChange(col, $event)" class="column-type-select" @click.stop @mousedown.stop>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="project">Project</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="custom">Custom</option>
              </select>
                  <div class="column-actions">
                    <button class="col-action-btn" @click="startRenameColumn(col)" title="Rename"><i class="bi bi-pencil"></i></button>
                    <button class="col-action-btn text-danger" @click="confirmDeleteColumn(col)" title="Delete"><i class="bi bi-trash3"></i></button>
                  </div>
                </div>
                <div v-if="col.max_score" class="max-score-label">/ {{ col.max_score }}</div>
              </th>
              <th class="cell-header cell-total">Total</th>
              <th class="cell-header cell-grade">Grade</th>
              <th class="cell-header add-col-header">
                <div class="add-col-trigger" @click.stop="showInlineAddColumn = !showInlineAddColumn" title="Add column"><i class="bi bi-plus-lg"></i></div>
                <div v-if="showInlineAddColumn" class="inline-add-col" @click.stop>
                  <input v-model="inlineColName" placeholder="Column name" class="inline-input" @keydown.enter="doAddColumnInline" />
                  <select v-model="inlineColType" class="inline-select" @keydown.enter.prevent>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input v-model.number="inlineColMax" type="number" class="inline-input" placeholder="Max" @keydown.enter="doAddColumnInline" />
                  <button class="inline-btn" @click="doAddColumnInline">Add</button>
                  <button class="inline-btn-cancel" @click="showInlineAddColumn = false">&times;</button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in visibleRows" :key="row.enrollment_id"
              :class="{ 'row-selected': editingRow === null && isRowSelected(rowIndex) }"
              @contextmenu.prevent="showContextMenu($event, rowIndex)">
              <td class="cell cell-frozen row-num"
                :class="{ 'row-num-highlighted': editingRow === null && isRowSelected(rowIndex) }"
                @click.stop>{{ rowIndex + 1 }}</td>

              <td class="cell cell-frozen cell-student-name"
                :class="getStudentNameCellClass(rowIndex)"
                :data-row-idx="rowIndex"
                :data-col-id="-1"
                @mousedown.prevent="onCellMouseDown($event, rowIndex, -1)"
                @dblclick.prevent.stop="startEditing(rowIndex, -1)"
              >
                <div class="student-name-cell-inner">
                  <div v-if="editingRow === rowIndex && editingCol === -1" class="cell-editor-wrapper">
                    <input ref="cellEditor" v-model="editValue" type="text" class="cell-editor"
                      @keydown="onEditKeydown" @blur="saveEdit()" @input="onEditInput" />
                  </div>
                  <span v-else class="cell-value" :title="row.student_name">{{ row.student_name }}</span>
                  <div v-if="showFillHandle(rowIndex, -1)" class="fill-handle fill-handle-frozen"
                    @mousedown.prevent.stop="fillNextStudentName(rowIndex)" @click.stop title="Fill next name down">+</div>
                </div>
              </td>


              <td class="cell cell-frozen cell-student-id"
                :class="getStudentIdCellClass(rowIndex)"
                :data-row-idx="rowIndex"
                :data-col-id="0"
                @mousedown.prevent="onCellMouseDown($event, rowIndex, 0)"
                @dblclick.prevent.stop="startEditing(rowIndex, 0)"
              >
                <div class="student-id-cell-inner">
                  <div v-if="editingRow === rowIndex && editingCol === 0" class="cell-editor-wrapper id-editor-wrapper">
                    <input ref="cellEditor" v-model="editValue" type="text" class="cell-editor id-editor-input" list="student-numbers-list"
                      @keydown="onEditKeydown" @blur="saveEdit()" @input="onEditInput" placeholder="Select or type ID..." />
                  </div>
                  <span v-else class="cell-value" :title="row.student_number">{{ row.student_number }}</span>
                  <div v-if="showFillHandle(rowIndex, 0)" class="fill-handle fill-handle-frozen"
                    @mousedown.prevent.stop="fillNextStudentId(rowIndex)" @click.stop title="Fill next ID down">+</div>
                </div>
              </td>

              <td v-for="col in columns" :key="col.id"
                class="cell cell-score"
                :data-row-idx="rowIndex"
                :data-col-id="col.id"
                :class="getScoreCellClass(rowIndex, col)"
                @mousedown.prevent="onCellMouseDown($event, rowIndex, col.id)"
              >
                <div v-if="editingRow === rowIndex && editingCol === col.id" class="cell-editor-wrapper">
                  <input ref="cellEditor" v-model="editValue" type="text" inputmode="decimal" class="cell-editor"
                    @keydown="onEditKeydown" @blur="saveEdit()" @input="onEditInput" />
                </div>
                <span v-else class="cell-value" :title="getCellTitle(col, row)">{{ formatCellValue(getCellMark(row, col.id)) }}</span>

                <!-- Fill handle: show on active cell when not editing and not in range selection -->
                <div v-if="showFillHandle(rowIndex, col.id)" class="fill-handle"
                  @mousedown.prevent.stop="onFillHandleMouseDown($event, rowIndex, col.id)" @click.stop>+</div>
              </td>

              <td class="cell cell-total" :class="getTotalCellClass(row)">{{ row.total !== null ? row.total.toFixed(2) : '-' }}</td>
              <td class="cell cell-grade" :class="'grade-' + (row.grade?.toLowerCase().replace('+', '-plus') || 'none')">{{ row.grade || '-' }}</td>
            </tr>
            <tr class="add-row-row" @click="showAddRowPopup = true">
              <td :colspan="3 + columns.length + 2" class="cell-frozen add-row-cell">
                <i class="bi bi-plus-lg"></i> Add Student Row
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Import Progress Bar (overlays the sheet, not full page) -->
    <div v-if="importProgress > 0" class="import-progress-overlay">
      <div class="import-progress-card">
        <div class="import-progress-status">{{ importStatusText }}</div>
        <div class="import-progress-bar-track">
          <div class="import-progress-bar-fill" :style="{ width: importProgress + '%' }"></div>
        </div>
        <div class="import-progress-pct">{{ Math.round(importProgress) }}%</div>
      </div>
    </div>

    <!-- Right-click Context Menu -->
    <div v-if="contextMenu" class="context-menu" :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }">
      <div class="context-menu-item" @click="insertRowAbove(contextMenu.rowIdx)">
        <i class="bi bi-plus-lg"></i> Insert Row Above
      </div>
      <div class="context-menu-item" @click="insertRowBelow(contextMenu.rowIdx)">
        <i class="bi bi-plus-lg"></i> Insert Row Below
      </div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item text-danger" @click="deleteRow(contextMenu.rowIdx)">
        <i class="bi bi-trash3"></i> Delete Row
      </div>
    </div>

    <!-- Datalist for student ID suggestions (must be outside table) -->
    <datalist id="student-numbers-list">
      <option v-for="num in studentNumbers" :key="num" :value="num"></option>
    </datalist>

    <!-- Page Size Selector -->
    <div class="table-footer">
      <div class="page-size-selector">
        <span class="page-size-label">Show</span>
        <select v-model="pageSize" class="page-size-select">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option value="all">All</option>
        </select>
        <span class="page-size-label">of {{ filteredRows.length }} rows</span>
      </div>
    </div>

    <!-- Modals (unchanged) -->
    <div v-if="renamingColumn" class="modal-overlay" @click.self="renamingColumn = null">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Rename Column</h5><button class="modal-close" @click="renamingColumn = null">&times;</button></div>
        <div class="modal-body"><div class="form-group"><label>New Label</label><input v-model="renameValue" class="form-input" ref="renameInput" @keydown.enter="doRenameColumn" /></div></div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="renamingColumn = null">Cancel</button><button class="btn btn-primary" @click="doRenameColumn">Rename</button></div>
      </div>
    </div>
    <div v-if="showAddColumn" class="modal-overlay" @click.self="showAddColumn = false">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Add New Column</h5><button class="modal-close" @click="showAddColumn = false">&times;</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Type</label><select v-model="newColumn.type" class="form-input"><option value="quiz">Quiz</option><option value="assignment">Assignment</option><option value="project">Project</option><option value="midterm">Midterm</option><option value="final">Final</option></select></div>
          <div class="form-group"><label>Label</label><input v-model="newColumn.label" class="form-input" placeholder="e.g. Quiz 1" /></div>
          <div class="form-group"><label>Max Score</label><input v-model.number="newColumn.max_score" type="number" min="1" class="form-input" placeholder="100" /></div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="showAddColumn = false">Cancel</button><button class="btn btn-primary" @click="doAddColumn">Add</button></div>
      </div>
    </div>
    <div v-if="showWeights" class="modal-overlay" @click.self="showWeights = false">
      <div class="modal-content">
        <div class="modal-header"><h5>Weight Configuration</h5><button class="modal-close" @click="showWeights = false">&times;</button></div>
        <div class="modal-body">
          <table class="weight-table" v-if="assessments.length">
            <thead><tr><th>Component</th><th>Weight (%)</th></tr></thead>
            <tbody>
              <tr v-for="at in assessments" :key="at.id">
                <td><span class="weight-name">{{ at.name }}</span><span class="weight-code">{{ at.code }}</span></td>
                <td><input v-model.number="weightEdits[at.id]" type="number" min="0" max="100" step="0.5" class="form-input weight-input" /></td>
              </tr>
            </tbody>
          </table>
          <div class="weight-total-bar" :class="{ 'weight-ok': totalWeight === 100, 'weight-warn': totalWeight !== 100 }">Total: {{ totalWeight.toFixed(1) }}% {{ totalWeight === 100 ? '✓' : '(must be 100%)' }}</div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="showWeights = false">Cancel</button><button class="btn btn-primary" :disabled="totalWeight !== 100" @click="doUpdateWeights">Save & Recalculate</button></div>
      </div>
    </div>
    <div v-if="deleteConfirm" class="modal-overlay" @click.self="deleteConfirm = null">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Delete Column</h5><button class="modal-close" @click="deleteConfirm = null">&times;</button></div>
        <div class="modal-body"><p>Delete "<strong>{{ deleteConfirm.label }}</strong>"? This removes it for all students.</p></div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="deleteConfirm = null">Cancel</button><button class="btn btn-danger" @click="doDeleteColumn">Delete</button></div>
      </div>
    </div>
    <div v-if="showAddRowPopup" class="modal-overlay" @click.self="showAddRowPopup = false">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Add Student Rows</h5><button class="modal-close" @click="showAddRowPopup = false">&times;</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>Number of rows to add:</label>
            <input v-model.number="addRowCount" type="number" min="1" max="50" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddRowPopup = false">Cancel</button>
          <button class="btn btn-primary" @click="doAddRows">Add {{ addRowCount }} Row{{ addRowCount > 1 ? 's' : '' }}</button>
        </div>
      </div>
    </div>
    <div v-if="showImport" class="modal-overlay" @click.self="showImport = false">
      <div class="import-modal">
        <!-- Header -->
        <div class="import-modal-header">
          <div class="import-modal-header-icon"><i class="bi bi-cloud-upload"></i></div>
          <div class="import-modal-header-text">
            <h5>Import Scores</h5>
            <p>Import student scores from an Excel file</p>
          </div>
          <button class="modal-close" @click="showImport = false; selectedFileName = ''; filePreview = null">&times;</button>
        </div>

        <div class="import-modal-body">
          <!-- Format badges -->
          <div class="import-format-badges">
            <span class="import-badge import-badge-excel"><i class="bi bi-file-earmark-excel"></i> Excel</span>
            <span class="import-badge import-badge-pdf"><i class="bi bi-filetype-pdf"></i> PDF</span>
          </div>

          <!-- Drop zone when NO file selected -->
          <div v-if="!selectedFileName" class="import-drop-zone"
            @drop.prevent="onFileDrop" @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            :class="{ 'import-drop-active': dragOver }"
            @click="openFilePicker">
            <input ref="fileInputRef" type="file" accept=".xlsx,.xls" hidden @change="onFileSelected" />
            <div class="import-drop-icon">
              <i class="bi bi-file-earmark-arrow-up"></i>
            </div>
            <div class="import-drop-text">
              <span class="import-drop-title">Drop your file here</span>
              <span class="import-drop-sub">or click to browse</span>
            </div>
          </div>

          <!-- File card when file IS selected -->
          <div v-if="selectedFileName" class="import-file-card">
            <div class="import-file-card-main">
              <div class="import-file-icon"><i class="bi bi-file-earmark-spreadsheet"></i></div>
              <div class="import-file-info">
                <span class="import-file-name">{{ selectedFileName }}</span>
                <span class="import-file-size">{{ fileSizeFormatted }}</span>
              </div>
              <button class="import-file-remove" @click="clearFile" title="Remove file">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Preview section -->
            <div v-if="filePreview" class="import-preview">
              <div class="import-preview-divider"></div>
              <div class="import-preview-header">
                <i class="bi bi-table"></i>
                <span>File Preview</span>
              </div>
              <div class="import-preview-grid">
                <div class="import-preview-stat">
                  <span class="import-preview-stat-value">{{ filePreview.rowCount }}</span>
                  <span class="import-preview-stat-label">Students</span>
                </div>
                <div class="import-preview-stat">
                  <span class="import-preview-stat-value">{{ filePreview.colCount }}</span>
                  <span class="import-preview-stat-label">Columns</span>
                </div>
                <div class="import-preview-stat import-preview-stat-wide">
                  <span class="import-preview-stat-value import-preview-col-names" :title="filePreview.colNames.join(', ')">
                    {{ filePreview.colNames.slice(0, 3).join(' · ') }}<span v-if="filePreview.colNames.length > 3"> …</span>
                  </span>
                  <span class="import-preview-stat-label">Detected columns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="import-modal-footer">
          <button class="import-btn import-btn-secondary" @click="showImport = false; selectedFileName = ''; filePreview = null">
            Cancel
          </button>
          <button class="import-btn import-btn-primary" :disabled="!pendingFile" @click="processImportFile">
            <i class="bi bi-upload"></i>
            <span>Import {{ filePreview?.rowCount ? filePreview.rowCount + ' student' + (filePreview.rowCount > 1 ? 's' : '') : '' }}</span>
          </button>
        </div>
      </div>
    </div>
    <!-- Keyboard Shortcuts Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showKeyboardShortcuts" class="overlay" @click.self="showKeyboardShortcuts = false">
          <div class="modal-card shortcuts-modal">
            <div class="modal-head">
              <div class="modal-icon icon-add">
                <i class="bi bi-keyboard" style="font-size:1.2rem"></i>
              </div>
              <div>
                <h3>Keyboard Shortcuts</h3>
                <p>All available shortcuts for the score sheet</p>
              </div>
              <button class="modal-x" @click="showKeyboardShortcuts = false">&times;</button>
            </div>
            <div class="shortcuts-body">
              <!-- Navigation -->
              <div class="shortcut-group">
                <h4 class="shortcut-group-title"><i class="bi bi-arrows-move"></i> Navigation</h4>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span><span class="shortcut-desc">Move between cells</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Tab</kbd> <kbd>Shift</kbd>+<kbd>Tab</kbd></span><span class="shortcut-desc">Next / previous cell</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Home</kbd></span><span class="shortcut-desc">Go to first row (same column)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>End</kbd></span><span class="shortcut-desc">Go to last row (same column)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>Home</kbd></span><span class="shortcut-desc">Go to first cell (top-left)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>End</kbd></span><span class="shortcut-desc">Go to last cell (bottom-right)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>↑</kbd></span><span class="shortcut-desc">Jump to first row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>↓</kbd></span><span class="shortcut-desc">Jump to last row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>←</kbd></span><span class="shortcut-desc">Go to student name</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>→</kbd></span><span class="shortcut-desc">Go to last column</span></div>
              </div>
              <!-- Selection -->
              <div class="shortcut-group">
                <h4 class="shortcut-group-title"><i class="bi bi-ui-checks"></i> Selection</h4>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Shift</kbd>+<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></span><span class="shortcut-desc">Extend selection in direction</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Shift</kbd>+<kbd>Click</kbd></span><span class="shortcut-desc">Range select from anchor to clicked cell</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Shift</kbd>+<kbd>Home</kbd></span><span class="shortcut-desc">Extend selection to first row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Shift</kbd>+<kbd>End</kbd></span><span class="shortcut-desc">Extend selection to last row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>A</kbd></span><span class="shortcut-desc">Select all rows in current column</span></div>
              </div>
              <!-- Editing -->
              <div class="shortcut-group">
                <h4 class="shortcut-group-title"><i class="bi bi-pencil"></i> Editing</h4>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Enter</kbd> <kbd>F2</kbd></span><span class="shortcut-desc">Edit the selected cell</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Enter</kbd></span><span class="shortcut-desc">Save edit &amp; move to next cell</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Escape</kbd></span><span class="shortcut-desc">Cancel editing</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Delete</kbd> <kbd>Backspace</kbd></span><span class="shortcut-desc">Clear cell value(s)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>C</kbd></span><span class="shortcut-desc">Copy selected cell(s)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>V</kbd></span><span class="shortcut-desc">Paste into selected cell(s)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>X</kbd></span><span class="shortcut-desc">Cut selected cell(s)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>Z</kbd></span><span class="shortcut-desc">Undo last change</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>Y</kbd> <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd></span><span class="shortcut-desc">Redo last undone change</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>S</kbd></span><span class="shortcut-desc">Save all changes</span></div>
                <div class="shortcut-row"><span class="shortcut-keys">Type a digit</span><span class="shortcut-desc">Type any number to start editing the selected score cell</span></div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="loading" class="loading-overlay"><div class="spinner"></div><span>Loading scores...</span></div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch, nextTick, reactive, triggerRef, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { School } from '@lucide/vue'
import {
  getSpreadsheetBySubjectAndTerm, updateCellMark, addColumn, deleteColumn,
  renameColumn, updateWeights, syncToGoogleSheets, createGoogleSheet,
  addEnrollment, deleteEnrollment, updateStudentInfo,
  changeColumnType, getStudentNumbers, importFile,
  type SpreadsheetColumn, type SpreadsheetRow, type AssessmentTypeWeight, type SpreadsheetResponse,
} from '@/services/scoreService'

const router = useRouter()
const route = useRoute()
const subjectId = computed(() => Number(route.params.subjectId))
const termId = computed(() => Number(route.params.termId))
const classId = computed(() => route.query.class_id ? Number(route.query.class_id) : null)
const className = computed(() => (route.query.class_name as string) || '')

// ─── Core State ──────────────────────────────────────────────────────
const data = shallowRef<SpreadsheetResponse | null>(null)
const loading = ref(false)
const syncing = ref(false)
const searchQuery = ref('')
const saveStatus = ref<'saving' | 'saved' | 'failed' | 'idle'>('idle')
const sheetContainer = ref<HTMLElement | null>(null)
const pageSize = ref<number | 'all'>(20)
const importProgress = ref(0)
const importStatusText = ref('')

// ─── Selection State ─────────────────────────────────────────────────
const selectedRowIndex = ref(0)
const selectedCol = ref<number | null>(null)
const selectionStartRow = ref<number | null>(null)
const selectionStartCol = ref<number | null>(null)
const isRangeSelecting = ref(false)

// ─── Editing State ───────────────────────────────────────────────────
const editingRow = ref<number | null>(null)
const editingCol = ref<number | null>(null)
const editValue = ref('')
const cellEditor = ref<HTMLInputElement | null>(null)

// ─── Fill Handle ─────────────────────────────────────────────────────
const fillPreviewSet = ref<Set<string>>(new Set())
const fillDrag = ref<{
  active: boolean; sourceRow: number; sourceColId: number;
  startClientX: number; startClientY: number;
  destRow: number; destColId: number;
  previewDestRow: number; previewDestColId: number;
} | null>(null)

// ─── Modal State ─────────────────────────────────────────────────────
const showAddColumn = ref(false)
const showInlineAddColumn = ref(false)
const inlineColName = ref('')
const inlineColType = ref('quiz')
const inlineColMax = ref<number | null>(100)
const showWeights = ref(false)
const showImport = ref(false)
const renamingColumn = ref<SpreadsheetColumn | null>(null)
const renameValue = ref('')
const deleteConfirm = ref<{ col: SpreadsheetColumn; label: string } | null>(null)
const contextMenu = ref<{ x: number; y: number; rowIdx: number } | null>(null)

// ─── Export Dropdown State ────────────────────────────────────────────
const showExportMenu = ref(false)
const exportBtnRef = ref<HTMLElement | null>(null)
const showKeyboardShortcuts = ref(false)

function onDocumentClick(e: MouseEvent) {
  if (showExportMenu.value && exportBtnRef.value && !exportBtnRef.value.contains(e.target as Node)) {
    showExportMenu.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

// ─── Import File State ────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')
const pendingFile = ref<File | null>(null)
const dragOver = ref(false)
const filePreview = ref<{ rowCount: number; colCount: number; colNames: string[] } | null>(null)

const fileSizeFormatted = computed(() => {
  if (!pendingFile.value) return ''
  const bytes = pendingFile.value.size
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
})

function clearFile() {
  pendingFile.value = null
  selectedFileName.value = ''
  filePreview.value = null
  dragOver.value = false
}

async function previewExcelFile(file: File) {
  try {
    const { read, utils } = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const workbook = read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return
    const sheet = workbook.Sheets[sheetName]
    const jsonData: any[][] = utils.sheet_to_json(sheet, { header: 1 })
    if (jsonData.length < 2) return
    const header = (jsonData[0] as any[]).map(c => String(c).trim()).filter(Boolean)
    const scoreColumns = header.filter(h => !/name|student|id|number|code|no/i.test(h) && !/total|grade|remark/i.test(h))
    filePreview.value = {
      rowCount: jsonData.length - 1,
      colCount: header.length,
      colNames: scoreColumns.length > 0 ? scoreColumns : header.slice(2).filter(h => !/total|grade|remark/i.test(h)),
    }
  } catch {
    // Preview is best-effort, ignore errors
  }
}
const newColumn = reactive({ type: 'quiz', label: '', max_score: null as number | null })
const weightEdits = reactive<Record<number, number>>({})
const assessments = ref<AssessmentTypeWeight[]>([])
const studentNumbers = ref<string[]>([])
const columnTypes = reactive<Record<number, string>>({})

// ─── Auto-fill next student ID ───────────────────────────────────────
type StudentNumberSequence = {
  prefix: string
  sequence: number
  width: number
}

function parseStudentNumberSequence(value: string | null | undefined): StudentNumberSequence | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(.*?)(\d+)$/)
  if (!match || match.length < 3) return null
  const prefix = match[1] ?? ''
  const digits = match[2] ?? ''
  if (!digits) return null
  const sequence = Number.parseInt(digits, 10)
  if (Number.isNaN(sequence)) return null
  return {
    prefix,
    sequence,
    width: digits.length,
  }
}

function formatStudentNumberSequence(sequence: StudentNumberSequence, nextSequence = sequence.sequence): string {
  return `${sequence.prefix}${String(nextSequence).padStart(sequence.width, '0')}`
}

function getKnownStudentNumberSequences(): StudentNumberSequence[] {
  return [...studentNumbers.value, ...rows.value.map(r => r.student_number)]
    .map(parseStudentNumberSequence)
    .filter((value): value is StudentNumberSequence => value !== null)
}

function getHighestKnownStudentNumberSequence(): StudentNumberSequence | null {
  const sequences = getKnownStudentNumberSequences()
  if (!sequences.length) return null

  const currentYearPrefix = `PNC${new Date().getFullYear()}-`
  const currentYearSequences = sequences.filter(seq => seq.prefix === currentYearPrefix)
  const pool = currentYearSequences.length ? currentYearSequences : sequences

  return pool.reduce((best, candidate) => {
    if (candidate.prefix === best.prefix && candidate.sequence > best.sequence) return candidate
    if (candidate.prefix === best.prefix) return best
    return candidate.sequence > best.sequence ? candidate : best
  })
}

function getNextStudentNumber(baseValue?: string | null): string {
  const parsedBase = parseStudentNumberSequence(baseValue)
  if (parsedBase) return formatStudentNumberSequence(parsedBase, parsedBase.sequence + 1)

  const highest = getHighestKnownStudentNumberSequence()
  if (highest) return formatStudentNumberSequence(highest, highest.sequence + 1)

  const year = new Date().getFullYear()
  return `PNC${year}-001`
}

function syncStudentNumbersCache(oldValue: string | null, newValue: string | null) {
  const next = new Set(studentNumbers.value)
  if (oldValue) next.delete(oldValue)
  if (newValue) next.add(newValue)
  studentNumbers.value = [...next]
}

async function fillNextStudentId(rowIdx: number) {
  const row = filteredRows.value[rowIdx]
  if (!row) return

  if (editingRow.value !== null && (editingRow.value !== rowIdx || editingCol.value !== 0)) {
    saveEdit()
  }

  const isTargetIdCell = editingRow.value === rowIdx && editingCol.value === 0
  const currentValue = isTargetIdCell ? editValue.value.trim() : row.student_number.trim()
  const currentSequence = parseStudentNumberSequence(currentValue)

  // If the current row already has a sequential ID, treat it as the seed and fill the next row.
  if (currentSequence) {
    const nextRowIdx = rowIdx + 1
    if (nextRowIdx >= filteredRows.value.length) return

    const nextValue = getNextStudentNumber(currentValue)
    startEditing(nextRowIdx, 0)
    await nextTick()
    editValue.value = nextValue
    await nextTick()
    scrollToCell(nextRowIdx, 0)

    const editor = Array.isArray(cellEditor.value) ? cellEditor.value[0] : cellEditor.value
    editor?.focus()
    editor?.select()
    return
  }

  const nextValue = getNextStudentNumber(currentValue || row.student_number)

  if (!isTargetIdCell) {
    startEditing(rowIdx, 0)
    await nextTick()
  }

  editValue.value = nextValue
  saveEdit()

  const nextRowIdx = rowIdx + 1
  if (nextRowIdx >= filteredRows.value.length) return

  const suggestedNext = getNextStudentNumber(nextValue)
  startEditing(nextRowIdx, 0)
  await nextTick()
  editValue.value = suggestedNext
  await nextTick()
  scrollToCell(nextRowIdx, 0)

  const editor = Array.isArray(cellEditor.value) ? cellEditor.value[0] : cellEditor.value
  editor?.focus()
  editor?.select()
}

async function fillNextStudentName(rowIdx: number) {
  const row = filteredRows.value[rowIdx]
  if (!row) return

  if (editingRow.value !== null && (editingRow.value !== rowIdx || editingCol.value !== -1)) {
    saveEdit()
  }

  const isTargetNameCell = editingRow.value === rowIdx && editingCol.value === -1
  const currentValue = isTargetNameCell ? editValue.value.trim() : row.student_name.trim()
  if (!currentValue) return

  const nextRowIdx = rowIdx + 1
  if (nextRowIdx >= filteredRows.value.length) return

  startEditing(nextRowIdx, -1)
  await nextTick()
  editValue.value = currentValue
  await nextTick()
  scrollToCell(nextRowIdx, -1)

  const editor = Array.isArray(cellEditor.value) ? cellEditor.value[0] : cellEditor.value
  editor?.focus()
  editor?.select()
}

// ─── Undo/Redo ───────────────────────────────────────────────────────
const maxUndo = 50
const undoStack = ref<Array<{ enrollmentId: number; detailId: number; oldValue: number | null }>>([])
const redoStack = ref<Array<{ enrollmentId: number; detailId: number; oldValue: number | null }>>([])



// ─── Computed ────────────────────────────────────────────────────────
const columns = computed(() => data.value?.columns || [])
const rows = computed(() => data.value?.rows || [])

const filteredRows = computed(() => {
  let result = rows.value

  // Filter by class if a class is selected
  if (className.value) {
    result = result.filter(r => r.class_name === className.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r => r.student_name.toLowerCase().includes(q) || r.student_number.toLowerCase().includes(q))
  }

  return result
})

const visibleRows = computed(() => {
  if (pageSize.value === 'all') return filteredRows.value
  return filteredRows.value.slice(0, pageSize.value)
})

const averageScore = computed(() => {
  const withScores = visibleRows.value.filter(r => r.total !== null)
  if (!withScores.length) return 0
  return withScores.reduce((acc, r) => acc + (r.total || 0), 0) / withScores.length
})

const passRate = computed(() => {
  const graded = visibleRows.value.filter(r => r.grade !== null)
  if (!graded.length) return 0
  return (graded.filter(r => isPassing(r.grade!)).length / graded.length) * 100
})

const topStudent = computed(() => {
  const sorted = [...visibleRows.value].filter(r => r.total !== null).sort((a, b) => (b.total || 0) - (a.total || 0))
  return sorted[0]?.student_name ?? '-'
})

const totalWeight = computed(() => Object.values(weightEdits).reduce((s, v) => s + (v || 0), 0))

const saveStatusClass = computed(() => ({
  'status-saving': saveStatus.value === 'saving',
  'status-saved': saveStatus.value === 'saved',
  'status-failed': saveStatus.value === 'failed',
  'status-idle': saveStatus.value === 'idle',
}))

const saveStatusIcon = computed(() => ({
  saving: 'bi bi-arrow-repeat', saved: 'bi bi-check-circle-fill',
  failed: 'bi bi-exclamation-circle-fill', idle: 'bi bi-check-circle',
}[saveStatus.value]))

const saveStatusText = computed(() => ({
  saving: 'Saving...', saved: 'Saved', failed: 'Failed', idle: '',
}[saveStatus.value]))

// ─── Add Row Popup ──────────────────────────────────────────────────
const showAddRowPopup = ref(false)
const addRowCount = ref(1)

async function doAddRows() {
  const count = addRowCount.value
  showAddRowPopup.value = false
  showSaveStatus('saving')
  try {
    for (let i = 0; i < count; i++) {
      await addEnrollment(subjectId.value, termId.value, null, classId.value)
    }
    showSaveStatus('saved')
    pageSize.value = 'all'
    await refreshData()
  } catch (err) {
    showSaveStatus('failed')
    console.error('Failed to add rows:', err)
    alert('Error adding students. Check console for details.')
  }
  addRowCount.value = 1
}

// ─── Helper Functions ────────────────────────────────────────────────
// Returns the student-specific ScoreDetail ID for a given canonical column ID
function getActualDetailId(row: SpreadsheetRow, colId: number): number {
  return row.detail_ids[colId] ?? colId
}

function getCellMark(row: SpreadsheetRow, detailId: number): number | null {
  const m = row.details[detailId]
  return m !== undefined ? m : null
}

function formatCellValue(value: number | null): string {
  if (value === null || value === undefined) return ''
  return value % 1 === 0 ? String(value) : value.toFixed(1)
}

function getCellTitle(col: SpreadsheetColumn, row: SpreadsheetRow): string {
  const mark = getCellMark(row, col.id)
  if (mark !== null && col.max_score) return `${mark} / ${col.max_score} (${((mark / col.max_score) * 100).toFixed(1)}%)`
  return `${col.label}: ${mark !== null ? mark : '-'}`
}

function getColumnTypeClass(type: string): string { return `col-type-${type}` }
function isPassing(grade: string): boolean { return !['F', 'D'].includes(grade) }
function cellKey(rowIdx: number, colId: number): string { return `${rowIdx}:${colId}` }
function isSelectableColumn(colId: number): boolean { return colId === -1 || colId === 0 || colId > 0 }
function getSelectableColumnIds(): number[] { return [-1, 0, ...columns.value.map(c => c.id)] }
function getSelectionColumnOrder(colId: number): number { return getSelectableColumnIds().indexOf(colId) }
function getCellClipboardValue(row: SpreadsheetRow | undefined, colId: number): string {
  if (!row) return ''
  if (colId === -1) return row.student_name
  if (colId === 0) return row.student_number
  if (colId > 0) {
    const value = getCellMark(row, colId)
    return value !== null ? String(value) : ''
  }
  return ''
}

function getSelectionBounds(): { r1: number; r2: number; c1: number; c2: number } | null {
  if (selectionStartRow.value === null || selectionStartCol.value === null || selectedCol.value === null) return null
  const startOrder = getSelectionColumnOrder(selectionStartCol.value)
  const endOrder = getSelectionColumnOrder(selectedCol.value)
  if (startOrder < 0 || endOrder < 0) return null
  return {
    r1: Math.min(selectionStartRow.value, selectedRowIndex.value),
    r2: Math.max(selectionStartRow.value, selectedRowIndex.value),
    c1: Math.min(startOrder, endOrder),
    c2: Math.max(startOrder, endOrder),
  }
}

function getSelectionText(): string {
  const bounds = getSelectionBounds()
  const columnsInSelection = getSelectableColumnIds()
  if (!bounds) {
    const row = filteredRows.value[selectedRowIndex.value]
    return getCellClipboardValue(row, selectedCol.value ?? -999)
  }

  const selectedColumns = columnsInSelection.slice(bounds.c1, bounds.c2 + 1)
  const lines: string[] = []
  for (let r = bounds.r1; r <= bounds.r2; r++) {
    const row = filteredRows.value[r]
    lines.push(selectedColumns.map(colId => getCellClipboardValue(row, colId)).join('\t'))
  }
  return lines.join('\n')
}
function isEditing(rowIdx: number, colId: number): boolean { return editingRow.value === rowIdx && editingCol.value === colId }
// ─── Selection / Range Helpers ───────────────────────────────────────
function isInRange(rowIdx: number, colId: number): boolean {
  if (!isRangeSelecting.value || selectionStartRow.value === null || selectionStartCol.value === null || selectedCol.value === null) return false
  const r1 = Math.min(selectionStartRow.value, selectedRowIndex.value)
  const r2 = Math.max(selectionStartRow.value, selectedRowIndex.value)
  const c1 = getSelectionColumnOrder(selectionStartCol.value)
  const c2 = getSelectionColumnOrder(selectedCol.value)
  const target = getSelectionColumnOrder(colId)
  if (c1 < 0 || c2 < 0 || target < 0) return false
  return rowIdx >= r1 && rowIdx <= r2 && target >= Math.min(c1, c2) && target <= Math.max(c1, c2)
}

function isRowSelected(rowIdx: number): boolean {
  if (!isRangeSelecting.value) return rowIdx === selectedRowIndex.value
  const startRow = selectionStartRow.value ?? selectedRowIndex.value
  const endRow = selectedRowIndex.value
  const r1 = Math.min(startRow, endRow)
  const r2 = Math.max(startRow, endRow)
  return rowIdx >= r1 && rowIdx <= r2
}

function isRowHeaderHighlighted(): boolean {
  return isRangeSelecting.value || selectedRowIndex.value >= 0
}

function isCellSelected(rowIdx: number, colId: number): boolean {
  if (editingRow.value !== null && editingCol.value !== null) return false
  if (!isSelectableColumn(colId)) return false
  if (!isRangeSelecting.value) return rowIdx === selectedRowIndex.value && selectedCol.value === colId
  return isInRange(rowIdx, colId)
}

function expandAllRowsForSelection() {
  if (pageSize.value !== 'all') {
    pageSize.value = 'all'
  }
}

function showFillHandle(rowIdx: number, colId: number): boolean {
  if (editingRow.value !== null || editingCol.value !== null) return false
  if (!isSelectableColumn(colId)) return false
  if (isRangeSelecting.value) {
    // Show fill handle on the last row of the range selection
    const r2 = Math.max(selectionStartRow.value ?? 0, selectedRowIndex.value)
    return rowIdx === r2 && colId === (selectedCol.value ?? 0)
  }
  return rowIdx === selectedRowIndex.value && selectedCol.value === colId
}

function getStudentNameCellClass(rowIdx: number): Record<string, boolean> {
  return {
    'cell-editing': editingRow.value === rowIdx && editingCol.value === -1,
    'cell-selected': !isEditing(rowIdx, -1) && isCellSelected(rowIdx, -1),
    'cell-in-range': !isEditing(rowIdx, -1) && isInRange(rowIdx, -1) && !(selectedRowIndex.value === rowIdx && selectedCol.value === -1),
  }
}

function getStudentIdCellClass(rowIdx: number): Record<string, boolean> {
  return {
    'cell-editing': editingRow.value === rowIdx && editingCol.value === 0,
    'cell-selected': !isEditing(rowIdx, 0) && isCellSelected(rowIdx, 0),
    'cell-in-range': !isEditing(rowIdx, 0) && isInRange(rowIdx, 0) && !(selectedRowIndex.value === rowIdx && selectedCol.value === 0),
  }
}

function getScoreCellClass(rowIdx: number, col: SpreadsheetColumn): Record<string, boolean> {
  const row = filteredRows.value[rowIdx]
  const mark = row ? getCellMark(row, col.id) : null
  return {
    'cell-editing': editingRow.value === rowIdx && editingCol.value === col.id,
    'cell-selected': !isEditing(rowIdx, col.id) && isCellSelected(rowIdx, col.id),
    'cell-in-range': !isEditing(rowIdx, col.id) && isInRange(rowIdx, col.id) && !(selectedRowIndex.value === rowIdx && selectedCol.value === col.id),
    'cell-excellent': !isEditing(rowIdx, col.id) && mark !== null && mark >= 90,
    'cell-average': !isEditing(rowIdx, col.id) && mark !== null && mark >= 70 && mark < 90,
    'cell-low': !isEditing(rowIdx, col.id) && mark !== null && mark < 70,
    'cell-autofill-preview': fillPreviewSet.value.has(cellKey(rowIdx, col.id)),
  }
}

function getTotalCellClass(row: SpreadsheetRow): Record<string, boolean> {
  return {
    'cell-excellent': row.total !== null && row.total >= 90,
    'cell-average': row.total !== null && row.total >= 70 && row.total < 90,
    'cell-low': row.total !== null && row.total < 70,
  }
}

// ─── Cell Selection (single click = select, double click = edit) ────
function onCellMouseDown(event: MouseEvent, rowIdx: number, colId: number) {
  if (editingRow.value !== null) {
    saveEdit()
  }
  if (colId === -2) return // row number click

  // Shift+Click for range selection
  if (event.shiftKey) {
    expandAllRowsForSelection()
    if (selectionStartRow.value === null) {
      selectionStartRow.value = selectedRowIndex.value
      selectionStartCol.value = selectedCol.value ?? colId
    }
    selectedRowIndex.value = Math.max(0, Math.min(rowIdx, filteredRows.value.length - 1))
    selectedCol.value = colId
    isRangeSelecting.value = true
    scrollToCell(selectedRowIndex.value, colId)
    return
  }

  // Simple click: select cell; score cells still open the editor immediately.
  isRangeSelecting.value = false
  selectionStartRow.value = rowIdx
  selectionStartCol.value = colId
  selectedRowIndex.value = Math.max(0, Math.min(rowIdx, filteredRows.value.length - 1))
  selectedCol.value = colId
  // Score cells still edit on single click; name/ID now stay selected so range selection works naturally.
  if (colId > 0) {
    if (editingRow.value !== null) cancelEdit()
    startEditing(rowIdx, colId)
  }

  // Start drag selection on selectable cells
  if (isSelectableColumn(colId)) {
    const container = sheetContainer.value?.querySelector('.sheet-scroll') as HTMLElement | null
    const edgeThreshold = 48
    const scrollStep = 18
    let didExpandForSelection = false
    let lastPointer: { x: number; y: number } | null = null
    let autoScrollTimer: number | null = null

    const stopAutoScroll = () => {
      if (autoScrollTimer !== null) {
        window.clearInterval(autoScrollTimer)
        autoScrollTimer = null
      }
    }

    const updateSelectionAtPointer = (clientX: number, clientY: number) => {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
      if (!el) return
      const cell = el.closest('td.cell[data-row-idx][data-col-id]') as HTMLElement | null
      if (!cell) return
      const rStr = cell.getAttribute('data-row-idx')
      const cStr = cell.getAttribute('data-col-id')
      if (!rStr || !cStr) return
      const r = Number(rStr)
      const c = Number(cStr)
      if (isNaN(r) || isNaN(c) || !isSelectableColumn(c)) return
      if (r < 0 || r >= filteredRows.value.length) return
      if (!didExpandForSelection && (r !== rowIdx || c !== colId)) {
        expandAllRowsForSelection()
        didExpandForSelection = true
      }
      selectedRowIndex.value = r
      selectedCol.value = c
      isRangeSelecting.value = true
    }

    const tickAutoScroll = () => {
      if (!container || !lastPointer || !isRangeSelecting.value) {
        stopAutoScroll()
        return
      }

      const rect = container.getBoundingClientRect()
      let deltaY = 0

      if (lastPointer.y < rect.top + edgeThreshold) {
        deltaY = -scrollStep
      } else if (lastPointer.y > rect.bottom - edgeThreshold) {
        deltaY = scrollStep
      }

      if (deltaY === 0) {
        stopAutoScroll()
        return
      }

      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight)
      const nextScrollTop = Math.max(0, Math.min(maxScrollTop, container.scrollTop + deltaY))
      if (nextScrollTop === container.scrollTop) {
        stopAutoScroll()
        return
      }

      container.scrollTop = nextScrollTop
      updateSelectionAtPointer(lastPointer.x, lastPointer.y)
    }

    const startAutoScroll = () => {
      if (autoScrollTimer !== null) return
      autoScrollTimer = window.setInterval(tickAutoScroll, 16)
    }

    const onMouseMove = (e: MouseEvent) => {
      // If we were editing, cancel it since user is dragging
      if (editingRow.value !== null) cancelEdit()
      lastPointer = { x: e.clientX, y: e.clientY }
      updateSelectionAtPointer(e.clientX, e.clientY)
      if (container) {
        const rect = container.getBoundingClientRect()
        const nearEdge = e.clientY < rect.top + edgeThreshold || e.clientY > rect.bottom - edgeThreshold
        if (nearEdge) startAutoScroll()
        else stopAutoScroll()
      }
    }
    const onMouseUp = () => {
      stopAutoScroll()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
}



// ─── Inline Editing (double click = edit) ────────────────────────────
function startEditing(rowIdx: number, detailId: number) {
  if (!filteredRows.value.length) return
  if (detailId === -2) return

  const row = filteredRows.value[rowIdx]
  if (!row) return

  if (detailId > 0) {
    if (!columns.value.length) return
    const col = columns.value.find(c => c.id === detailId)
    if (!col) return
  }

  let oldValue: string | number | null
  if (detailId === -1) oldValue = row.student_name
  else if (detailId === 0) oldValue = row.student_number
  else oldValue = getCellMark(row, detailId)

  editingRow.value = rowIdx
  editingCol.value = detailId
  selectedRowIndex.value = rowIdx
  selectedCol.value = detailId
  editValue.value = oldValue !== null && oldValue !== undefined ? String(oldValue) : ''

  nextTick(() => {
    const editor = Array.isArray(cellEditor.value) ? cellEditor.value[0] : cellEditor.value
    if (editor) {
      editor.focus()
      editor.select()
    }
  })
}

function saveEdit() {
  if (editingRow.value === null || editingCol.value === null) return

  const filteredRow = filteredRows.value[editingRow.value]
  if (!filteredRow) { cancelEdit(); return }

  const detailId = editingCol.value

  if (detailId === -1) {
    const newName = editValue.value.trim()
    if (!newName || newName === filteredRow.student_name) { cancelEdit(); return }
    const oldName = filteredRow.student_name
    showSaveStatus('saving')
    updateStudentInfo(subjectId.value, termId.value, filteredRow.enrollment_id, { student_name: newName })
      .then(() => {
        showSaveStatus('saved')
        filteredRow.student_name = newName
        const actualRow = rows.value.find(r => r.enrollment_id === filteredRow.enrollment_id)
        if (actualRow) actualRow.student_name = newName
      })
      .catch((err) => {
        showSaveStatus('failed')
        filteredRow.student_name = oldName
        console.error('Failed to save student name:', err)
      })
    cancelEdit()
    return
  }

  if (detailId === 0) {
    const newNumber = editValue.value.trim()
    if (!newNumber || newNumber === filteredRow.student_number) { cancelEdit(); return }
    const oldNumber = filteredRow.student_number
    showSaveStatus('saving')
    updateStudentInfo(subjectId.value, termId.value, filteredRow.enrollment_id, { student_number: newNumber })
      .then(() => {
        showSaveStatus('saved')
        filteredRow.student_number = newNumber
        const actualRow = rows.value.find(r => r.enrollment_id === filteredRow.enrollment_id)
        if (actualRow) actualRow.student_number = newNumber
        syncStudentNumbersCache(oldNumber, newNumber)
      })
      .catch((err) => {
        showSaveStatus('failed')
        filteredRow.student_number = oldNumber
        console.error('Failed to save student number:', err)
      })
    cancelEdit()
    return
  }

  // Score mark
  const oldValue = getCellMark(filteredRow, detailId)
  const newValue = editValue.value === '' ? null : parseFloat(editValue.value)
  if (newValue !== null) {
    if (isNaN(newValue)) { cancelEdit(); return }
    if (newValue < 0 || newValue > 100) { cancelEdit(); return }
  }
  if (oldValue === newValue) { cancelEdit(); return }

  const actualRow = rows.value.find(r => r.enrollment_id === filteredRow.enrollment_id)
  if (!actualRow) { cancelEdit(); return }

  actualRow.details[detailId] = newValue
  triggerRef(data)
  undoStack.value.push({ enrollmentId: filteredRow.enrollment_id, detailId, oldValue })
  redoStack.value = []
  if (undoStack.value.length > maxUndo) undoStack.value.shift()
  cancelEdit()
  showSaveStatus('saving')

  const actualDetailId = getActualDetailId(actualRow, detailId)
  updateCellMark(subjectId.value, termId.value, actualDetailId, newValue)
    .then(() => {
      showSaveStatus('saved')
      recalculateRowTotal(actualRow)
    })
    .catch(() => {
      showSaveStatus('failed')
      actualRow.details[detailId] = oldValue
    })
}

function recalculateRowTotal(row: SpreadsheetRow) {
  const cols = columns.value
  if (!cols.length) return
  let total = 0
  const typeGroups: Record<string, number[]> = {}
  cols.forEach(col => {
    const mark = row.details[col.id]
    if (mark !== null && mark !== undefined) {
      if (!typeGroups[col.type]) typeGroups[col.type] = []
      typeGroups[col.type].push(mark)
    }
  })
  const assessmentMap = new Map(assessments.value.map(a => [a.code, a.weight_percent]))
  Object.entries(typeGroups).forEach(([type, marks]) => {
    const avg = marks.reduce((a, b) => a + b, 0) / marks.length
    const weight = (assessmentMap.get(type) || 0) / 100
    total += avg * weight
  })
  row.total = Math.round(total * 100) / 100
  row.grade = total >= 90 ? 'A' : total >= 80 ? 'B+' : total >= 75 ? 'B' : total >= 70 ? 'C+' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'F'
  triggerRef(data)
}

function cancelEdit() {
  editingRow.value = null
  editingCol.value = null
  editValue.value = ''
}

// ─── Fill Handle ─────────────────────────────────────────────────────
function computeAutoFillValues(sourceValues: (number | null)[], count: number, direction: 1 | -1 = 1): (number | null)[] {
  if (!sourceValues.length) return Array.from({ length: count }, () => null)
  // Single value: repeat it
  if (sourceValues.length === 1) return Array.from({ length: count }, () => sourceValues[0] ?? null)

  // Filter out nulls for numeric calculations
  const numeric = sourceValues.map(v => (v === null ? null : Number(v)))
  const cleanNums = numeric.filter((v): v is number => v !== null && !Number.isNaN(v))

  // Infer a numeric progression when there are at least 2 values.
  // One value repeats; 2+ values can continue as a sequence.
  if (cleanNums.length < 2) {
    const result: (number | null)[] = []
    for (let i = 0; i < count; i++) {
      const srcIdx = i % sourceValues.length
      result.push(sourceValues[srcIdx] ?? null)
    }
    return result
  }

  // Check if it's a consistent arithmetic progression
  const step = cleanNums[1] - cleanNums[0]
  let isArithmetic = true
  for (let i = 2; i < cleanNums.length; i++) {
    if (cleanNums[i] - cleanNums[i - 1] !== step) { isArithmetic = false; break }
  }

  if (!isArithmetic) {
    // Repeat the pattern
    const result: (number | null)[] = []
    for (let i = 0; i < count; i++) {
      const srcIdx = i % sourceValues.length
      result.push(sourceValues[srcIdx] ?? null)
    }
    return result
  }

  // Arithmetic progression: continue the sequence in the drag direction.
  const result: (number | null)[] = []
  const edgeValue = direction === 1 ? sourceValues[sourceValues.length - 1] : sourceValues[0]
  const edgeNum = edgeValue !== null ? Number(edgeValue) : null
  if (edgeNum === null || Number.isNaN(edgeNum)) {
    // Fallback: repeat pattern
    for (let i = 0; i < count; i++) {
      const srcIdx = i % sourceValues.length
      result.push(sourceValues[srcIdx] ?? null)
    }
    return result
  }

  for (let i = 0; i < count; i++) {
    const nextValue = direction === 1 ? edgeNum + step * (i + 1) : edgeNum - step * (i + 1)
    result.push(nextValue)
  }
  return result
}

function onFillHandleMouseDown(e: MouseEvent, rowIdx: number, colId: number) {
  if (editingRow.value !== null) return
  if (colId <= 0) return
  if (!columns.value.length || !filteredRows.value.length) return
  e.preventDefault()
  e.stopPropagation()

  // Use sourceRow as the first row of the range (or single cell)
  let sourceRow = rowIdx
  const sourcePattern: (number | null)[] = []

  if (isRangeSelecting.value && selectionStartRow.value !== null) {
    const r1 = Math.min(selectionStartRow.value, selectedRowIndex.value)
    const r2 = Math.max(selectionStartRow.value, selectedRowIndex.value)
    // Only use range if fill handle is on the last row
    if (rowIdx === r2) {
      sourceRow = r1
      for (let r = r1; r <= r2; r++) {
        const mark = getCellMark(filteredRows.value[r], colId)
        sourcePattern.push(mark !== undefined ? mark : null)
      }
    }
  }

  // Fallback: single source cell value
  if (sourcePattern.length === 0) {
    const mark = getCellMark(filteredRows.value[rowIdx], colId)
    sourcePattern.push(mark !== undefined ? mark : null)
  }

  selectedRowIndex.value = rowIdx
  selectedCol.value = colId
  fillPreviewSet.value = new Set([cellKey(rowIdx, colId)])
  fillDrag.value = {
    active: true, sourceRow: sourceRow, sourceColId: colId,
    startClientX: e.clientX, startClientY: e.clientY,
    destRow: rowIdx, destColId: colId,
    previewDestRow: rowIdx, previewDestColId: colId,
  }
  // Store source pattern on the fillDrag object
  ;(fillDrag.value as any).sourcePattern = sourcePattern
  updateFillPreviewFromPointer(e.clientX, e.clientY)
  window.addEventListener('mousemove', onFillHandleMouseMove)
  window.addEventListener('mouseup', onFillHandleMouseUp)
}

function updateFillPreviewFromPointer(clientX: number, clientY: number) {
  if (!fillDrag.value) return
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  if (!el) return
  const cell = el.closest('td.cell-score') as HTMLElement | null
  if (!cell) { fillPreviewSet.value = new Set([cellKey(fillDrag.value.sourceRow, fillDrag.value.sourceColId)]); return }
  const rowIdxStr = cell.getAttribute('data-row-idx')
  const colIdStr = cell.getAttribute('data-col-id')
  if (!rowIdxStr || !colIdStr) return
  const destRow = Number(rowIdxStr)
  const destColId = Number(colIdStr)
  if (Number.isNaN(destRow) || Number.isNaN(destColId)) return
  if (destRow < 0 || destRow > filteredRows.value.length - 1) return
  fillDrag.value.destRow = destRow
  fillDrag.value.destColId = destColId
  fillDrag.value.previewDestRow = destRow
  fillDrag.value.previewDestColId = destColId
  const srcRow = fillDrag.value.sourceRow
  const srcColId = fillDrag.value.sourceColId
  const dy = fillDrag.value.startClientY - clientY
  const dx = fillDrag.value.startClientX - clientX
  const vertical = Math.abs(dy) >= Math.abs(dx)
  const set = new Set<string>()
  if (vertical) {
    const rStart = Math.min(srcRow, destRow)
    const rEnd = Math.max(srcRow, destRow)
    for (let r = rStart; r <= rEnd; r++) set.add(cellKey(r, srcColId))
  } else {
    const cols = columns.value
    const sIdx = cols.findIndex(c => c.id === srcColId)
    const dIdx = cols.findIndex(c => c.id === destColId)
    if (sIdx < 0 || dIdx < 0) { fillPreviewSet.value = new Set([cellKey(srcRow, srcColId)]); return }
    const cStart = Math.min(sIdx, dIdx)
    const cEnd = Math.max(sIdx, dIdx)
    for (let ci = cStart; ci <= cEnd; ci++) set.add(cellKey(srcRow, cols[ci].id))
  }
  fillPreviewSet.value = set
}

function onFillHandleMouseMove(e: MouseEvent) {
  if (!fillDrag.value?.active) return
  updateFillPreviewFromPointer(e.clientX, e.clientY)
}

function onFillHandleMouseUp() {
  if (!fillDrag.value?.active) return
  window.removeEventListener('mousemove', onFillHandleMouseMove)
  window.removeEventListener('mouseup', onFillHandleMouseUp)
  commitFillApply()
}

function commitFillApply() {
  if (!fillDrag.value) return
  const { sourceRow, sourceColId } = fillDrag.value
  const srcRow = sourceRow
  const srcColId = sourceColId
  const destRow = fillDrag.value.previewDestRow
  const destColId = fillDrag.value.previewDestColId
  const vertical = destRow !== srcRow

  // Get source pattern (from range selection or single cell)
  let sourcePattern = (fillDrag.value as any).sourcePattern as (number | null)[]
  if (!sourcePattern || sourcePattern.length === 0) {
    const sourceRowObj = filteredRows.value[srcRow]
    sourcePattern = [sourceRowObj ? getCellMark(sourceRowObj, srcColId) : null]
  }

  const patternLen = sourcePattern.length

  if (vertical) {
    // Vertical fill: continue the pattern away from the source range.
    const sourceStartRow = srcRow
    const sourceEndRow = srcRow + patternLen - 1
    const targetRows: number[] = []
    const direction: 1 | -1 = destRow > sourceEndRow ? 1 : -1

    if (direction === 1) {
      for (let r = sourceEndRow + 1; r <= destRow; r++) targetRows.push(r)
    } else {
      for (let r = sourceStartRow - 1; r >= destRow; r--) targetRows.push(r)
    }

    if (!targetRows.length) {
      fillPreviewSet.value = new Set()
      isRangeSelecting.value = false
      fillDrag.value = null
      return
    }

    const values = computeAutoFillValues(sourcePattern, targetRows.length, direction)
    targetRows.forEach((r, i) => {
      const targetRow = rows.value.find(tr => tr.enrollment_id === filteredRows.value[r]?.enrollment_id)
      if (!targetRow) return
      const nextValue = values[i] ?? null
      targetRow.details[srcColId] = nextValue
      recalculateRowTotal(targetRow)
      const actualDetailId = getActualDetailId(targetRow, srcColId)
      updateCellMark(subjectId.value, termId.value, actualDetailId, nextValue).catch(() => {})
    })
  } else {
    // Horizontal fill: continue the pattern across columns.
    const cols = columns.value
    const sIdx = cols.findIndex(c => c.id === srcColId)
    const dIdx = cols.findIndex(c => c.id === destColId)
    if (sIdx < 0 || dIdx < 0) { fillDrag.value = null; fillPreviewSet.value = new Set(); return }
    const targetColIndices: number[] = []
    const direction: 1 | -1 = dIdx > sIdx ? 1 : -1

    if (direction === 1) {
      for (let ci = sIdx + 1; ci <= dIdx; ci++) targetColIndices.push(ci)
    } else {
      for (let ci = sIdx - 1; ci >= dIdx; ci--) targetColIndices.push(ci)
    }

    if (!targetColIndices.length) {
      fillPreviewSet.value = new Set()
      isRangeSelecting.value = false
      fillDrag.value = null
      return
    }

    const values = computeAutoFillValues(sourcePattern, targetColIndices.length, direction)
    const targetRow = rows.value.find(tr => tr.enrollment_id === filteredRows.value[srcRow]?.enrollment_id)
    if (!targetRow) {
      fillPreviewSet.value = new Set()
      isRangeSelecting.value = false
      fillDrag.value = null
      return
    }

    targetColIndices.forEach((ci, i) => {
      const nextValue = values[i] ?? null
      targetRow.details[cols[ci].id] = nextValue
      recalculateRowTotal(targetRow)
      const actualDetailId = getActualDetailId(targetRow, cols[ci].id)
      updateCellMark(subjectId.value, termId.value, actualDetailId, nextValue).catch(() => {})
    })
  }

  fillPreviewSet.value = new Set()
  isRangeSelecting.value = false
  fillDrag.value = null
}

// ─── Keyboard Navigation (Excel-like) ────────────────────────────────
function onGlobalKeydown(event: KeyboardEvent) {
  // If editing, delegate to edit handler
  if (editingRow.value !== null && editingCol.value !== null) {
    onEditKeydown(event)
    return
  }

  // Handle copy/paste/cut/undo/redo/save from here too (Ctrl+C/V/X/Z/Y/S)
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'a':
        event.preventDefault()
        expandAllRowsForSelection()
        if (selectedCol.value !== null && isSelectableColumn(selectedCol.value) && filteredRows.value.length > 0) {
          selectionStartRow.value = 0
          selectionStartCol.value = selectedCol.value
          selectedRowIndex.value = filteredRows.value.length - 1
          isRangeSelecting.value = true
          scrollToCell(selectedRowIndex.value, selectedCol.value)
        }
        return
      case 'c': event.preventDefault(); copySelection(); return
      case 'v': event.preventDefault(); return // handled by paste event
      case 'x': event.preventDefault(); cutSelection(); return
      case 'z': event.preventDefault(); event.shiftKey ? redo() : undo(); return
      case 'y': event.preventDefault(); redo(); return
      case 's': event.preventDefault(); showSaveStatus('saved'); return
      case 'r': event.preventDefault(); return
    }
  }

  // Delete/Backspace: clear selected cell(s) in range or single selection
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedCol.value !== null) {
    event.preventDefault()
    if (isRangeSelecting.value) {
      const bounds = getSelectionBounds()
      if (!bounds) return
      const columnsInSelection = getSelectableColumnIds()
      showSaveStatus('saving')
      const promises: Promise<void>[] = []
      const clearedRows: SpreadsheetRow[] = []
      for (let r = bounds.r1; r <= bounds.r2; r++) {
        for (let c = bounds.c1; c <= bounds.c2; c++) {
          const colId = columnsInSelection[c]
          if (colId === undefined || colId === -1 || colId === 0) continue
          const row = filteredRows.value[r]
          if (!row) continue
          const actualRow = rows.value.find(ar => ar.enrollment_id === row.enrollment_id)
          if (!actualRow) continue
          const oldValue = getCellMark(row, colId)
          if (oldValue === null) continue
          actualRow.details[colId] = null
          undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: colId, oldValue })
          redoStack.value = []
          if (!clearedRows.includes(actualRow)) clearedRows.push(actualRow)
          const actualDetailId = getActualDetailId(actualRow, colId)
          promises.push(updateCellMark(subjectId.value, termId.value, actualDetailId, null))
        }
      }
      if (promises.length) {
        Promise.all(promises)
          .then(() => {
            showSaveStatus('saved')
            clearedRows.forEach(r => recalculateRowTotal(r))
          })
          .catch(() => showSaveStatus('failed'))
      }
      isRangeSelecting.value = false
    } else {
      // Single cell delete
      const row = filteredRows.value[selectedRowIndex.value]
      if (!row) return
      const actualRow = rows.value.find(ar => ar.enrollment_id === row.enrollment_id)
      if (!actualRow) return
      const colId = selectedCol.value
      if (colId <= 0) return
      const oldValue = getCellMark(row, colId)
      if (oldValue === null) return
      actualRow.details[colId] = null
      undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: colId, oldValue })
      redoStack.value = []
      showSaveStatus('saving')
      const actualDetailId = getActualDetailId(actualRow, colId)
      updateCellMark(subjectId.value, termId.value, actualDetailId, null)
        .then(() => { showSaveStatus('saved'); recalculateRowTotal(actualRow) })
        .catch(() => { showSaveStatus('failed'); actualRow.details[colId] = oldValue })
    }
    return
  }

  // Printable character handling: type to start editing (Excel-like)
  if (selectedCol.value !== null && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    // Only for score cells, student name (-1), and student ID (0)
    if (selectedCol.value >= -1) {
      event.preventDefault()
      startEditing(selectedRowIndex.value, selectedCol.value)
      editValue.value = event.key
      return
    }
  }

  const cols = columns.value
  if (!cols.length || !filteredRows.value.length) return

  let currentRow = selectedRowIndex.value
  let currentColIdx = selectedCol.value !== null ? cols.findIndex(c => c.id === selectedCol.value) : 0
  if (currentColIdx < 0) currentColIdx = 0
  const shiftKey = event.shiftKey

  // Clear range selection when pressing ANY key WITHOUT Shift (Excel-like)
  if (!shiftKey) {
    isRangeSelecting.value = false
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+ArrowDown: jump to last row
        expandAllRowsForSelection()
        selectedRowIndex.value = filteredRows.value.length - 1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(selectedRowIndex.value, currentColIdx)
      } else if (currentRow < filteredRows.value.length - 1) {
        const next = currentRow + 1
        if (pageSize.value !== 'all' && next >= pageSize.value) pageSize.value = 'all'
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedRowIndex.value = next
        scrollToCell(next, currentColIdx)
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+ArrowUp: jump to first row
        expandAllRowsForSelection()
        selectedRowIndex.value = 0
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(selectedRowIndex.value, currentColIdx)
      } else if (currentRow > 0) {
        const prev = currentRow - 1
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedRowIndex.value = prev
        scrollToCell(prev, currentColIdx)
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+ArrowLeft: jump to first column (student name)
        selectedCol.value = -1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(currentRow, -1)
      } else if (selectedCol.value === 0) {
        // From student ID go to student name
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedCol.value = -1
        scrollToCell(currentRow, -1)
      } else if (currentColIdx > 0) {
        currentColIdx--
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedCol.value = cols[currentColIdx].id
        scrollToCell(currentRow, currentColIdx)
      } else if (currentColIdx === 0 && cols.length > 0 && selectedCol.value === cols[0].id) {
        // From first score column go to student ID
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedCol.value = 0
        scrollToCell(currentRow, 0)
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+ArrowRight: jump to last column
        selectedCol.value = cols.length > 0 ? cols[cols.length - 1].id : null
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(currentRow, cols.length - 1)
      } else if (selectedCol.value === -1) {
        // From student name go to student ID
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedCol.value = 0
        scrollToCell(currentRow, 0)
      } else if (selectedCol.value === 0) {
        // From student ID go to first score column
        if (cols.length > 0) {
          if (shiftKey && !isRangeSelecting.value) {
            expandAllRowsForSelection()
            selectionStartRow.value = currentRow
            selectionStartCol.value = selectedCol.value
            isRangeSelecting.value = true
          }
          selectedCol.value = cols[0].id
          scrollToCell(currentRow, 0)
        }
      } else if (currentColIdx < cols.length - 1) {
        currentColIdx++
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedCol.value = cols[currentColIdx].id
        scrollToCell(currentRow, currentColIdx)
      }
      break
    case 'Tab':
      event.preventDefault()
      if (event.shiftKey) {
        if (currentColIdx > 0) { currentColIdx--; selectedCol.value = cols[currentColIdx].id }
        else if (currentRow > 0) { currentRow--; selectedRowIndex.value = currentRow; currentColIdx = cols.length - 1; selectedCol.value = cols[currentColIdx].id }
      } else {
        if (currentColIdx < cols.length - 1) { currentColIdx++; selectedCol.value = cols[currentColIdx].id }
        else if (currentRow < filteredRows.value.length - 1) {
          const next = currentRow + 1; if (pageSize.value !== 'all' && next >= pageSize.value) pageSize.value = 'all'
          currentRow = next; selectedRowIndex.value = currentRow; currentColIdx = 0; selectedCol.value = cols[currentColIdx].id
        }
      }
      isRangeSelecting.value = false
      scrollToCell(currentRow, currentColIdx)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedCol.value !== null && selectedCol.value > 0) {
        // For score cells, Enter advances step by step like Tab.
        handleTabNavigation(event.shiftKey)
      } else if (event.shiftKey) {
        // Shift+Enter: move up in the frozen Name/ID area.
        if (selectedRowIndex.value > 0) selectedRowIndex.value--
        scrollToCell(selectedRowIndex.value, currentColIdx)
      } else if (selectedCol.value !== null) {
        // Keep name/ID cells editable with Enter.
        startEditing(selectedRowIndex.value, selectedCol.value)
      }
      break
    case 'F2':
      event.preventDefault()
      if (selectedCol.value !== null) startEditing(selectedRowIndex.value, selectedCol.value)
      break
    case 'Home':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+Home: go to first cell (top-left)
        expandAllRowsForSelection()
        if (shiftKey && !isRangeSelecting.value) {
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedRowIndex.value = 0
        selectedCol.value = cols.length > 0 ? cols[0].id : -1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(0, 0)
      } else {
        // Home: go to first row (same column)
        expandAllRowsForSelection()
        if (shiftKey && !isRangeSelecting.value) {
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedRowIndex.value = 0
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(0, currentColIdx)
      }
      break
    case 'End':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+End: go to last cell (bottom-right)
        expandAllRowsForSelection()
        if (shiftKey && !isRangeSelecting.value) {
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedRowIndex.value = filteredRows.value.length - 1
        selectedCol.value = cols.length > 0 ? cols[cols.length - 1].id : -1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(filteredRows.value.length - 1, cols.length - 1)
      } else {
        // End: go to last row (same column)
        expandAllRowsForSelection()
        if (shiftKey && !isRangeSelecting.value) {
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedRowIndex.value = filteredRows.value.length - 1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(filteredRows.value.length - 1, currentColIdx)
      }
      break
    case 'PageDown':
      event.preventDefault()
      selectedRowIndex.value = Math.min(selectedRowIndex.value + 10, filteredRows.value.length - 1)
      if (!shiftKey) isRangeSelecting.value = false
      scrollToCell(selectedRowIndex.value, currentColIdx)
      break
    case 'PageUp':
      event.preventDefault()
      selectedRowIndex.value = Math.max(selectedRowIndex.value - 10, 0)
      if (!shiftKey) isRangeSelecting.value = false
      scrollToCell(selectedRowIndex.value, currentColIdx)
      break

    case 'Delete':
    case 'Backspace':
      if (selectedCol.value !== null && selectedCol.value > 0 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        // If range selected, clear all cells in range
        if (isRangeSelecting.value) {
          clearRangeSelection()
        } else {
          clearSingleCell()
        }
      }
      break
  }
}

function clearSingleCell() {
  const row = filteredRows.value[selectedRowIndex.value]
  if (!row) return
  const colId = selectedCol.value!
  const oldValue = getCellMark(row, colId)
  if (oldValue === null) return
  const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
  if (actualRow) { actualRow.details[colId] = null; triggerRef(data) }
  undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: colId, oldValue })
  redoStack.value = []
  showSaveStatus('saving')
  const actualDetailId = actualRow ? getActualDetailId(actualRow, colId) : colId
  updateCellMark(subjectId.value, termId.value, actualDetailId, null)
    .then(() => { showSaveStatus('saved'); if (actualRow) recalculateRowTotal(actualRow) })
    .catch(() => { showSaveStatus('failed'); if (actualRow) actualRow.details[colId] = oldValue })
}

function clearRangeSelection() {
  if (selectionStartRow.value === null || selectionStartCol.value === null || selectedCol.value === null) return
  const bounds = getSelectionBounds()
  if (!bounds) return
  const columnsInSelection = getSelectableColumnIds()
  const promises: Promise<void>[] = []
  const clearedRows: SpreadsheetRow[] = []
  for (let r = bounds.r1; r <= bounds.r2; r++) {
    for (let c = bounds.c1; c <= bounds.c2; c++) {
      const colId = columnsInSelection[c]
      if (colId === undefined || colId <= 0) continue
      const row = filteredRows.value[r]
      if (!row) continue
      const actualRow = rows.value.find(ar => ar.enrollment_id === row.enrollment_id)
      if (!actualRow) continue
      const oldValue = getCellMark(row, colId)
      if (oldValue === null) continue
      actualRow.details[colId] = null
      undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: colId, oldValue })
      if (!clearedRows.includes(actualRow)) clearedRows.push(actualRow)
      const actualDetailId = getActualDetailId(actualRow, colId)
      promises.push(updateCellMark(subjectId.value, termId.value, actualDetailId, null))
    }
  }
  redoStack.value = []
  triggerRef(data)
  clearedRows.forEach(r => recalculateRowTotal(r))
  if (promises.length) {
    showSaveStatus('saving')
    Promise.all(promises)
      .then(() => showSaveStatus('saved'))
      .catch(() => showSaveStatus('failed'))
  }
  isRangeSelecting.value = false
}

function onEditKeydown(event: KeyboardEvent) {
  // Handle Ctrl+Z, Ctrl+Y, Ctrl+S during editing
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'z':
        event.preventDefault()
        saveEdit()
        if (event.shiftKey) redo()
        else undo()
        return
      case 'y':
        event.preventDefault()
        saveEdit()
        redo()
        return
      case 's':
        event.preventDefault()
        saveEdit()
        showSaveStatus('saved')
        return
    }
  }

  // Escape key: cancel editing without saving
  if (event.key === 'Escape') {
    event.preventDefault()
    cancelEdit()
    return
  }

  // Enter/Tab: save and move to next cell
  if (event.key === 'Enter') {
    event.preventDefault()
    saveEdit()
    return
  }

  // Let the native text field / datalist handle vertical navigation for
  // the frozen Student Name / Student ID editors so long suggestion lists
  // can scroll normally.
  if (editingCol.value !== null && editingCol.value <= 0) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      return
    }
  }

  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      saveEdit()
      if (selectedCol.value !== null && selectedCol.value > 0) {
        handleTabNavigation(event.shiftKey)
      } else if (event.shiftKey) {
        if (selectedRowIndex.value > 0) { selectedRowIndex.value-- }
        if (selectedCol.value !== null && selectedCol.value >= 0) {
          nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
        }
      } else {
        if (selectedRowIndex.value < filteredRows.value.length - 1) { selectedRowIndex.value++ }
        if (selectedCol.value !== null && selectedCol.value >= 0) {
          nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
        }
      }
      break
    case 'Tab':
      event.preventDefault()
      saveEdit()
      handleTabNavigation(event.shiftKey)
      break
    case 'Escape':
      event.preventDefault()
      cancelEdit()
      break
    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault()
      saveEdit()
      if (event.key === 'ArrowUp' && selectedRowIndex.value > 0) selectedRowIndex.value--
      if (event.key === 'ArrowDown' && selectedRowIndex.value < filteredRows.value.length - 1) selectedRowIndex.value++
      if (selectedCol.value !== null && selectedCol.value >= 0) {
        nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
      }
      break
  }
}

function handleTabNavigation(shiftKey: boolean) {
  const cols = columns.value
  const idx = selectedCol.value !== null ? cols.findIndex(c => c.id === selectedCol.value) : 0
  if (shiftKey) {
    if (idx > 0) { selectedCol.value = cols[idx - 1].id }
    else if (selectedRowIndex.value > 0) {
      selectedRowIndex.value--
      selectedCol.value = cols[cols.length - 1].id
    }
  } else {
    if (idx < cols.length - 1) { selectedCol.value = cols[idx + 1].id }
    else if (selectedRowIndex.value < filteredRows.value.length - 1) {
      selectedRowIndex.value++
      selectedCol.value = cols[0].id
    }
  }
  if (selectedCol.value !== null && selectedCol.value > 0) {
    nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
  }
}

function onEditInput() { /* live validation placeholder */ }

function scrollToCell(rowIdx: number, colIdx: number) {
  const container = sheetContainer.value?.querySelector('.sheet-scroll')
  if (!container) return
  // Scroll row into view (vertical)
  const rowCells = container.querySelectorAll('tbody tr')
  if (rowCells[rowIdx]) {
    rowCells[rowIdx].scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }
  // Scroll score column into view (horizontal) using actual column ID
  const targetColId = selectedCol.value
  if (targetColId !== null && targetColId > 0) {
    const targetTd = container.querySelector<HTMLElement>(`td[data-col-id="${targetColId}"]`)
    if (targetTd) {
      targetTd.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
    }
  }
}

function onScroll() {
  // Selection remains visible while scrolling due to sticky headers and frozen columns
}

// ─── Copy / Paste ────────────────────────────────────────────────────
function copySelection() {
  const text = getSelectionText()
  navigator.clipboard.writeText(text).catch(() => {})
}

function cutSelection() {
  if (!selectedCol.value || selectedCol.value <= 0) return
  copySelection()
  const row = filteredRows.value[selectedRowIndex.value]
  if (!row) return
  const colId = selectedCol.value
  const oldValue = getCellMark(row, colId)
  if (oldValue === null) return
  const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
  if (actualRow) { actualRow.details[colId] = null; triggerRef(data) }
  undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: colId, oldValue })
  redoStack.value = []
  showSaveStatus('saving')
  const actualDetailId = actualRow ? getActualDetailId(actualRow, colId) : colId
  updateCellMark(subjectId.value, termId.value, actualDetailId, null)
    .then(() => { showSaveStatus('saved'); if (actualRow) recalculateRowTotal(actualRow) })
    .catch(() => { showSaveStatus('failed'); if (actualRow) actualRow.details[colId] = oldValue })
}

async function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text')
  if (!text || selectedCol.value == null) return
  event.preventDefault()

  const lines = text.split('\n').filter(r => r.trim() !== '')
  const isMultiRow = lines.length > 1

  if (isMultiRow) {
    // Multi-cell paste: iterate over rows and columns
    expandAllRowsForSelection()
    const promises: Promise<void>[] = []
    lines.forEach((line, rowOffset) => {
      const cells = line.split('\t')
      const targetRowIdx = selectedRowIndex.value + rowOffset
      if (targetRowIdx >= filteredRows.value.length) return
      const row = filteredRows.value[targetRowIdx]
      if (!row) return

      cells.forEach((cellText, colOffset) => {
        const colIds = getSelectableColumnIds()
        const startOrder = getSelectionColumnOrder(selectedCol.value!)
        const targetOrder = startOrder + colOffset
        if (targetOrder < 0 || targetOrder >= colIds.length) return
        const targetColId = colIds[targetOrder]

        const p = pasteValueToCell(row, targetColId, cellText.trim())
        if (p) promises.push(p)
      })
    })

    if (promises.length) {
      showSaveStatus('saving')
      try {
        await Promise.all(promises)
        showSaveStatus('saved')
      } catch {
        showSaveStatus('failed')
      }
    }
    return
  }

  // Single cell paste
  const row = filteredRows.value[selectedRowIndex.value]
  if (!row) return
  const colId = selectedCol.value
  showSaveStatus('saving')
  try {
    await pasteValueToCell(row, colId, text.trim())
    showSaveStatus('saved')
  } catch {
    showSaveStatus('failed')
  }
}

function pasteValueToCell(row: SpreadsheetRow, colId: number, value: string): Promise<void> | void {
  if (!value) return

  if (colId === -1) {
    // Paste student name
    const newName = value
    if (!newName || newName === row.student_name) return
    const oldName = row.student_name
    row.student_name = newName
    const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
    if (actualRow) actualRow.student_name = newName
    return updateStudentInfo(subjectId.value, termId.value, row.enrollment_id, { student_name: newName })
      .then(() => {})
      .catch(() => {
        row.student_name = oldName
        if (actualRow) actualRow.student_name = oldName
        throw new Error('Failed to save student name')
      })
  }

  if (colId === 0) {
    // Paste student number
    const newNumber = value
    if (!newNumber || newNumber === row.student_number) return
    const oldNumber = row.student_number
    row.student_number = newNumber
    const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
    if (actualRow) actualRow.student_number = newNumber
    return updateStudentInfo(subjectId.value, termId.value, row.enrollment_id, { student_number: newNumber })
      .then(() => { syncStudentNumbersCache(oldNumber, newNumber) })
      .catch(() => {
        row.student_number = oldNumber
        if (actualRow) actualRow.student_number = oldNumber
        throw new Error('Failed to save student number')
      })
  }

  // Score cell paste
  if (colId > 0) {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return
    if (numValue < 0 || numValue > 100) return
    const detailId = colId
    const oldValue = getCellMark(row, detailId)
    const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
    if (!actualRow) return
    actualRow.details[detailId] = numValue
    undoStack.value.push({ enrollmentId: row.enrollment_id, detailId, oldValue })
    redoStack.value = []
    return updateCellMark(subjectId.value, termId.value, detailId, numValue)
      .then(() => { recalculateRowTotal(actualRow) })
      .catch(() => {
        actualRow.details[detailId] = oldValue
        throw new Error('Failed to save score')
      })
  }
}

function onCopy(event: ClipboardEvent) {
  if (selectedCol.value === null) return
  event.clipboardData?.setData('text/plain', getSelectionText())
  event.preventDefault()
}

function onCut(event: ClipboardEvent) {
  onCopy(event)
  cutSelection()
}

// ─── Undo / Redo ─────────────────────────────────────────────────────
function undo() {
  const action = undoStack.value.pop()
  if (!action) return
  const row = rows.value.find(r => r.enrollment_id === action.enrollmentId)
  if (!row) return
  const prevValue = getCellMark(row, action.detailId)  // save current for redo
  row.details[action.detailId] = action.oldValue
  triggerRef(data)
  recalculateRowTotal(row)
  redoStack.value.push({ ...action, oldValue: prevValue })  // redo restores current
  showSaveStatus('saving')
  const actualDetailId = getActualDetailId(row, action.detailId)
  updateCellMark(subjectId.value, termId.value, actualDetailId, action.oldValue)
    .then(() => showSaveStatus('saved'))
    .catch(() => { showSaveStatus('failed'); row.details[action.detailId] = prevValue; triggerRef(data) })
}

function redo() {
  const action = redoStack.value.pop()
  if (!action) return
  const row = rows.value.find(r => r.enrollment_id === action.enrollmentId)
  if (!row) return
  const prevValue = getCellMark(row, action.detailId)  // save current for undo
  row.details[action.detailId] = action.oldValue
  triggerRef(data)
  recalculateRowTotal(row)
  undoStack.value.push({ ...action, oldValue: prevValue })  // undo restores current
  showSaveStatus('saving')
  const actualDetailId = getActualDetailId(row, action.detailId)
  updateCellMark(subjectId.value, termId.value, actualDetailId, action.oldValue)
    .then(() => showSaveStatus('saved'))
    .catch(() => { showSaveStatus('failed'); row.details[action.detailId] = prevValue; triggerRef(data) })
}

// ─── Data Loading ────────────────────────────────────────────────────
function goBack() { router.push('/scores') }

async function refreshData() {
  if (!subjectId.value || !termId.value) return
  loading.value = true
  try {
    data.value = await getSpreadsheetBySubjectAndTerm(subjectId.value, termId.value)
    assessments.value = data.value.assessment_types
    assessments.value.forEach(at => { weightEdits[at.id] = at.weight_percent })
    // Initialize column types dropdown values
    columns.value.forEach(col => { columnTypes[col.id] = col.type })
    selectedRowIndex.value = 0
    selectedCol.value = columns.value.length > 0 ? columns.value[0].id : null
  } catch { showSaveStatus('failed') }
  finally { loading.value = false }
}

// ─── Column Management ───────────────────────────────────────────────
function startRenameColumn(col: SpreadsheetColumn) {
  renamingColumn.value = col
  renameValue.value = col.label
  nextTick(() => { (document.querySelector('.modal-overlay .form-input') as HTMLInputElement)?.focus() })
}

async function doRenameColumn() {
  if (!renamingColumn.value || !renameValue.value.trim()) return
  try {
    await renameColumn(subjectId.value, termId.value, renamingColumn.value.id, renameValue.value.trim())
    renamingColumn.value = null; showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

function confirmDeleteColumn(col: SpreadsheetColumn) { deleteConfirm.value = { col, label: col.label } }

async function doDeleteColumn() {
  if (!deleteConfirm.value) return
  try {
    await deleteColumn(subjectId.value, termId.value, deleteConfirm.value.col.id)
    deleteConfirm.value = null; showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

async function doAddColumn() {
  if (!newColumn.label.trim()) return
  try {
    await addColumn(subjectId.value, termId.value, { type: newColumn.type, label: newColumn.label.trim(), max_score: newColumn.max_score })
    showAddColumn.value = false; newColumn.label = ''; newColumn.max_score = null
    showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

async function doAddColumnInline() {
  if (!inlineColName.value.trim()) return
  try {
    await addColumn(subjectId.value, termId.value, { type: inlineColType.value, label: inlineColName.value.trim(), max_score: inlineColMax.value })
    inlineColName.value = ''; inlineColType.value = 'quiz'; inlineColMax.value = 100
    showInlineAddColumn.value = false; showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

// ─── Context Menu & Row Insert ───────────────────────────────────
function showContextMenu(event: MouseEvent, rowIdx: number) {
  // Position menu, preventing overflow
  const x = Math.min(event.clientX, window.innerWidth - 200)
  const y = Math.min(event.clientY, window.innerHeight - 160)
  contextMenu.value = { x, y, rowIdx }
  const closeMenu = () => {
    contextMenu.value = null
    window.removeEventListener('click', closeMenu)
  }
  setTimeout(() => window.addEventListener('click', closeMenu), 0)
}

async function insertRowAbove(rowIdx: number) {
  contextMenu.value = null
  try {
    const result = await addEnrollment(subjectId.value, termId.value, null, classId.value)
    const enrollmentId = result.id
    const targetRow = filteredRows.value[rowIdx]
    const actualIndex = targetRow && data.value
      ? data.value.rows.findIndex(r => r.enrollment_id === targetRow.enrollment_id)
      : -1
    pageSize.value = 'all'
    showSaveStatus('saving')
    // Refresh to get proper ScoreDetails from server
    await refreshData()
    // Re-insert the new row at the target position (it came back at the bottom)
    if (actualIndex >= 0 && data.value) {
      const freshRows = [...data.value.rows]
      const newRowIdx = freshRows.findIndex(r => r.enrollment_id === enrollmentId)
      if (newRowIdx >= 0) {
        const [moved] = freshRows.splice(newRowIdx, 1)
        freshRows.splice(actualIndex, 0, moved)
        data.value = { ...data.value, rows: freshRows }
      }
    }
    showSaveStatus('saved')
  } catch (err) {
    showSaveStatus('failed')
    console.error('Failed to insert row:', err)
  }
}

async function insertRowBelow(rowIdx: number) {
  contextMenu.value = null
  try {
    const result = await addEnrollment(subjectId.value, termId.value, null, classId.value)
    const enrollmentId = result.id
    const targetRow = filteredRows.value[rowIdx]
    const actualIndex = targetRow && data.value
      ? data.value.rows.findIndex(r => r.enrollment_id === targetRow.enrollment_id)
      : -1
    pageSize.value = 'all'
    showSaveStatus('saving')
    await refreshData()
    // Re-insert the new row after the target position
    if (actualIndex >= 0 && data.value) {
      const freshRows = [...data.value.rows]
      const newRowIdx = freshRows.findIndex(r => r.enrollment_id === enrollmentId)
      if (newRowIdx >= 0) {
        const [moved] = freshRows.splice(newRowIdx, 1)
        freshRows.splice(actualIndex + 1, 0, moved)
        data.value = { ...data.value, rows: freshRows }
      }
    }
    showSaveStatus('saved')
  } catch (err) {
    showSaveStatus('failed')
    console.error('Failed to insert row:', err)
  }
}

async function deleteRow(rowIdx: number) {
  contextMenu.value = null
  const row = filteredRows.value[rowIdx]
  if (!row) return
  if (!confirm(`Delete student "${row.student_name || 'Unnamed'}"?`)) return
  try {
    await deleteEnrollment(subjectId.value, termId.value, row.enrollment_id)
    showSaveStatus('saved')
    await refreshData()
  } catch (err) {
    showSaveStatus('failed')
    console.error('Failed to delete row:', err)
  }
}

async function doAddRow() {
  try {
    await addEnrollment(subjectId.value, termId.value, null, classId.value)
    showSaveStatus('saved')
    pageSize.value = 'all'
    await refreshData()
  } catch (err) {
    showSaveStatus('failed')
    console.error('Failed to add row:', err)
    alert('Error: ' + ((err as any)?.response?.data?.message || 'Failed to add new row'))
  }
}

async function doUpdateWeights() {
  if (totalWeight.value !== 100) return
  try {
    await updateWeights(assessments.value.map(at => ({ id: at.id, weight_percent: weightEdits[at.id] || 0 })))
    showWeights.value = false; showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

// ─── Google Sheets Sync ──────────────────────────────────────────────
async function syncToGoogle() {
  syncing.value = true
  try {
    const token = localStorage.getItem('google_access_token')
    if (token) {
      try {
        const result = await createGoogleSheet(subjectId.value, termId.value, token)
        window.open(result.url, '_blank'); showSaveStatus('saved'); return
      } catch (e) { console.warn('OAuth sync failed, falling back to CSV export', e) }
    }
    const result = await syncToGoogleSheets(subjectId.value, termId.value)
    const blob = new Blob([result.csv_content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    window.open('https://docs.google.com/spreadsheets', '_blank')
    const link = document.createElement('a')
    link.href = url; link.download = `${data.value?.subject?.name || 'scores'}-${data.value?.term?.name || 'term'}.csv`
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showSaveStatus('saved')
  } catch { showSaveStatus('failed') }
  finally { syncing.value = false }
}

// ─── File Import (CSV, Excel) ────────────────────────────────────────
function openFilePicker() {
  fileInputRef.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    pendingFile.value = file
    selectedFileName.value = file.name
    previewExcelFile(file)
  }
  input.value = ''
}

function onFileDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    pendingFile.value = file
    selectedFileName.value = file.name
    dragOver.value = false
    previewExcelFile(file)
  }
}

async function processImportFile() {
  const file = pendingFile.value
  if (!file) return

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  showSaveStatus('saving')
  showImport.value = false
  pendingFile.value = null
  selectedFileName.value = ''
  importProgress.value = 0
  importStatusText.value = ''

  try {
    if (ext === 'xlsx' || ext === 'xls') {
      await importExcelFile(file)
    } else {
      throw new Error('Unsupported file format. Please use Excel (.xlsx/.xls) files only.')
    }
    showSaveStatus('saved')
    pageSize.value = 'all'
    await animateImportProgress(70, 90, 500, 'Refreshing sheet...')
    await refreshData()
    await animateImportProgress(90, 100, 400, 'Import complete!')
    setTimeout(() => { importProgress.value = 0 }, 1200)
  } catch (err: any) {
    showSaveStatus('failed')
    importProgress.value = 0
    importStatusText.value = ''
    alert('Import failed: ' + (err.message || 'Unknown error'))
    console.error('Import error:', err)
  }
}

async function importExcelFile(file: File) {
  const { read, utils } = await import('xlsx')

  await animateImportProgress(0, 15, 400, 'Reading file...')
  const buffer = await file.arrayBuffer()
  const workbook = read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('Excel file has no sheets')
  const sheet = workbook.Sheets[sheetName]
  const jsonData: any[][] = utils.sheet_to_json(sheet, { header: 1 })
  if (jsonData.length < 2) throw new Error('Excel file must contain at least a header row and one data row')

  await animateImportProgress(15, 35, 500, 'Parsing student data...')
  const rows = parseTabularData(jsonData as (string | number)[][])

  // Start smooth progress animation while awaiting the API
  importStatusText.value = 'Importing scores to server...'
  const animPromise = animateImportProgress(35, 65, 3000, 'Importing scores to server...')
  await importFile(subjectId.value, termId.value, { rows }, classId.value)
  importProgress.value = 70
  // animPromise resolves in background if still running
}

function parseTabularData(jsonData: (string | number)[][]): Array<{
  student_name: string
  student_number?: string
  marks?: Record<string, number>
}> {
  if (jsonData.length < 2) throw new Error('Data must have at least a header and one row')

  const header = jsonData[0].map(c => String(c).trim())
  // Find column indices: Student Name and Student ID
  let nameIdx = header.findIndex(h => /name|student/i.test(h))
  let idIdx = header.findIndex(h => /id|number|code|no/i.test(h) && !/name/i.test(h))
  if (nameIdx < 0) nameIdx = 0  // Default: first column is name
  if (idIdx < 0 || idIdx === nameIdx) idIdx = -1  // No ID column

  // Parse score columns (everything after name/ID columns)
  const scoreColumns: { index: number; label: string }[] = []
  for (let i = 0; i < header.length; i++) {
    if (i === nameIdx || i === idIdx) continue
    const label = header[i].replace(/\(.*?\)/g, '').trim() // Remove type info like "(quiz)"
    const typeMatch = header[i].match(/\(([^)]+)\)/)
    const type = typeMatch ? typeMatch[1].toLowerCase().trim() : 'unknown'
    if (label && !/total|grade|remark/i.test(label)) {
      scoreColumns.push({ index: i, label: `${label}_${type}` })
    }
  }

  const rows: Array<{
    student_name: string
    student_number?: string
    marks?: Record<string, number>
  }> = []

  for (let r = 1; r < jsonData.length; r++) {
    const row = jsonData[r]
    if (!row || row.length === 0) continue
    const studentName = String(row[nameIdx] ?? '').trim()
    if (!studentName) continue

    const studentNumber = idIdx >= 0 ? String(row[idIdx] ?? '').trim() : ''
    const marks: Record<string, number> = {}

    for (const sc of scoreColumns) {
      if (sc.index < row.length) {
        const val = row[sc.index]
        if (val !== '' && val !== undefined && val !== null) {
          const num = Number(val)
          if (!isNaN(num)) {
            marks[sc.label] = num
          }
        }
      }
    }

    rows.push({
      student_name: studentName,
      student_number: studentNumber || undefined,
      marks: Object.keys(marks).length > 0 ? marks : undefined,
    })
  }

  return rows
}

// ─── Export ──────────────────────────────────────────────────────────
function exportCSV() {
  if (!data.value) return
  const cols = columns.value
  let csv = 'Student Name,Student ID'
  cols.forEach(c => { csv += `,${c.label} (${c.type})` })
  csv += ',Total,Grade\n'
  rows.value.forEach(r => {
    csv += `${r.student_name.replace(/,/g, ' ')},${r.student_number}`
    cols.forEach(c => { const m = getCellMark(r, c.id); csv += `,${m !== null ? m : ''}` })
    csv += `,${r.total !== null ? r.total : ''},${r.grade || ''}\n`
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `scores-${data.value.subject?.name || 'export'}.csv`
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
  showSaveStatus('saved')
}

async function exportExcel() {
  if (!data.value) return
  const { utils, writeFile } = await import('xlsx')
  const cols = columns.value
  
  // Build header row
  const header = ['Student Name', 'Student ID']
  cols.forEach(c => header.push(`${c.label} (${c.type})`))
  header.push('Total', 'Grade')
  
  // Build data rows
  const dataRows = rows.value.map(r => {
    const row: (string | number)[] = [r.student_name, r.student_number]
    cols.forEach(c => {
      const m = getCellMark(r, c.id)
      row.push(m !== null ? m : '')
    })
    row.push(r.total !== null ? r.total : '', r.grade || '')
    return row
  })
  
  const ws = utils.aoa_to_sheet([header, ...dataRows])
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Scores')
  
  writeFile(wb, `scores-${data.value.subject?.name || 'export'}.xlsx`)
  showExportMenu.value = false
  showSaveStatus('saved')
}

async function exportPDF() {
  if (!data.value) return
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')
  
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const cols = columns.value
  
  // Title
  doc.setFontSize(14)
  doc.text(`${data.value.subject?.name || 'Scores'} - ${data.value.term?.name || ''}`, 14, 15)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 21)
  
  // Build table
  const head = [['#', 'Student Name', 'Student ID', ...cols.map(c => c.label), 'Total', 'Grade']]
  const body = rows.value.map((r, i) => [
    String(i + 1),
    r.student_name,
    r.student_number,
    ...cols.map(c => {
      const m = getCellMark(r, c.id)
      return m !== null ? String(m) : ''
    }),
    r.total !== null ? r.total.toFixed(2) : '-',
    r.grade || '-',
  ])
  
  ;(doc as any).autoTable({
    head,
    body,
    startY: 26,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 28 },
    },
  })
  
  doc.save(`scores-${data.value.subject?.name || 'export'}.pdf`)
  showExportMenu.value = false
  showSaveStatus('saved')
}

function exportFormat(format: 'xlsx' | 'pdf') {
  showExportMenu.value = false
  if (format === 'xlsx') exportExcel()
  else if (format === 'pdf') exportPDF()
}

// ─── Status ──────────────────────────────────────────────────────────
function showSaveStatus(status: 'saving' | 'saved' | 'failed') {
  saveStatus.value = status
  if (status !== 'saving') setTimeout(() => { if (saveStatus.value === status) saveStatus.value = 'idle' }, 3000)
}

function animateImportProgress(from: number, to: number, duration: number, statusText: string): Promise<void> {
  return new Promise(resolve => {
    importStatusText.value = statusText
    const startTime = performance.now()
    function tick(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const newValue = from + (to - from) * t
      // Only go forward — prevents backwards jump if external code sets a higher value
      if (newValue > importProgress.value) {
        importProgress.value = newValue
      }
      if (t < 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}

// ─── Lifecycle ───────────────────────────────────────────────────────
function onColumnTypeChange(col: SpreadsheetColumn, event: Event) {
  const newType = (event.target as HTMLSelectElement).value
  if (newType === col.type) return
  const oldType = col.type
  showSaveStatus('saving')
  changeColumnType(subjectId.value, termId.value, col.label, oldType, newType)
    .then(() => {
      showSaveStatus('saved')
      refreshData()
    })
    .catch(() => {
      showSaveStatus('failed')
      columnTypes[col.id] = oldType // revert
    })
}

onMounted(() => {
  refreshData()
  getStudentNumbers().then(nums => { studentNumbers.value = nums }).catch(() => {})
  nextTick(() => {
    const container = document.querySelector('.sheet-wrapper') as HTMLElement
    if (container) container.focus()
  })
})

watch([subjectId, termId], () => { if (subjectId.value && termId.value) refreshData() })
</script>

<style scoped>
/* ─── Layout ────────────────────────────────────────────────────────── */
.score-sheet {
  position: relative;
  font-family: 'Inter', 'Segoe UI', 'Noto Sans Khmer', sans-serif;
  height: calc(100vh - 0px);
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: #1e293b;
  background: #fff;
}

.sheet-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.toolbar-spacer { flex: 0; }
.toolbar-actions { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; }
.offering-info { display: flex; flex-direction: column; white-space: nowrap; }
.offering-info strong { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
.offering-info .text-muted { font-size: 0.7rem; color: #64748b; }
.term-badge { display: inline-block; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-weight: 700; font-size: 0.75rem; margin-right: 4px; }
.class-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; background: #f0fdf4; color: #166534; border-radius: 4px; font-weight: 600; font-size: 0.75rem; margin-left: 4px; }

.tb-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 10px; border: 1px solid #e2e8f0; background: #fff;
  border-radius: 6px; cursor: pointer; font-size: 0.78rem;
  color: #475569; transition: all 0.15s; white-space: nowrap;
}
.tb-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
.tb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.kb-btn { font-size: 0.85rem; color: #64748b; }
.kb-btn:hover { color: #2563eb; background: #eff6ff; border-color: #93c5fd; }
.btn-group { display: flex; gap: 3px; flex-wrap: wrap; }

.search-box { display: flex; align-items: center; gap: 5px; padding: 5px 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; min-width: 120px; }
.search-box input { border: none; background: transparent; outline: none; font-size: 0.78rem; width: 100px; color: #1e293b; }
.search-box i { color: #94a3b8; font-size: 0.78rem; }

.save-status { font-size: 0.7rem; display: flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }
.status-saving { color: #f59e0b; background: #fef3c7; }
.status-saved { color: #16a34a; background: #dcfce7; }
.status-failed { color: #dc2626; background: #fee2e2; }
.status-idle { color: transparent; }

.stats-bar { display: flex; gap: 16px; padding: 6px 12px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; flex-wrap: wrap; }
.stat-item { display: flex; gap: 5px; font-size: 0.78rem; align-items: center; }
.stat-label { color: #64748b; font-weight: 500; }
.stat-value { font-weight: 700; color: #0f172a; }

/* ─── Sheet Wrapper ────────────────────────────────────────────────── */
.sheet-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  outline: none;
}
.sheet-wrapper:focus { outline: none; }
.sheet-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

/* ─── Table ────────────────────────────────────────────────────────── */
.sheet-table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  font-size: 0.8rem;
}

.sheet-table thead { position: sticky; top: 0; z-index: 10; }

.cell-header {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 5px 8px;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #475569;
  position: sticky;
  top: 0;
  z-index: 10;
  text-align: left;
  white-space: nowrap;
  min-width: 80px;
  user-select: none;
}

/* ─── Cell Highlights (Excel green) ─────────────────────────────────── */
.cell-frozen { position: sticky; z-index: 20; background: #f1f5f9; }

.row-num-header, .row-num { left: 0; width: 36px; min-width: 36px; max-width: 36px; text-align: center; z-index: 30; }
.student-name-header, .cell-student-name { left: 36px; min-width: 160px; z-index: 25; }
.student-id-header, .cell-student-id { left: 196px; min-width: 90px; z-index: 25; }

/* ─── Enhanced Header Highlight ─────────────────────────────────────── */
.header-highlighted {
  background: #d4edda !important; /* Light green */
  border-color: #6cc47c !important;
  color: #155724 !important;
}

.row-num-highlighted {
  background: #c3e6cb !important;
  border-color: #6cc47c !important;
  color: #155724 !important;
  font-weight: 700 !important;
}

/* ─── Header ────────────────────────────────────────────────────────── */
.header-content { display: flex; align-items: center; gap: 4px; }
.column-header-content { flex-direction: column; align-items: flex-start; gap: 1px; }
.column-label { overflow: hidden; text-overflow: ellipsis; cursor: pointer; font-size: 0.68rem; }

.column-actions { display: none; gap: 2px; margin-top: 2px; }
.cell-header:hover .column-actions { display: flex; }
.col-action-btn { background: none; border: none; padding: 1px 3px; cursor: pointer; font-size: 0.6rem; color: #64748b; border-radius: 2px; }
.col-action-btn:hover { background: #e2e8f0; }
.text-danger { color: #ef4444 !important; }
.max-score-label { font-size: 0.55rem; color: #94a3b8; font-weight: 400; margin-top: 1px; }

/* ─── Editable Column Type Select ─────────────────────────────────── */
.column-type-select {
  font-size: 0.6rem;
  padding: 1px 4px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  outline: none;
  max-width: 90px;
  font-weight: 400;
  appearance: auto;
  transition: all 0.15s;
}
.column-type-select:hover {
  border-color: #cbd5e1;
  background: rgba(255,255,255,0.6);
}
.column-type-select:focus {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
}
.col-type-quiz .column-type-select { background: #dbeafe; color: #2563eb; border-color: #bfdbfe; }
.col-type-assignment .column-type-select { background: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
.col-type-project .column-type-select { background: #fef3c7; color: #d97706; border-color: #fde68a; }
.col-type-midterm .column-type-select { background: #ede9fe; color: #7c3aed; border-color: #ddd6fe; }
.col-type-final .column-type-select { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
.cell-total, .cell-grade { background: #fafafa; }
.cell-total.cell-header, .cell-grade.cell-header { background: #e2e8f0; }

/* ─── Cells ────────────────────────────────────────────────────────── */
.cell {
  border: 1px solid #e2e8f0;
  padding: 3px 6px;
  font-size: 0.8rem;
  white-space: nowrap;
  cursor: pointer;
  height: 32px;
  vertical-align: middle;
  transition: background 0.05s;
}
.cell-score { min-width: 60px; text-align: center; position: relative; }
.cell-score .cell-editing {
  z-index: 5;
}
.cell:hover { background: #f8fafc; }

/* ─── Excel-style Selection: Green Border ───────────────────────────── */
.cell-selected {
  outline: 2px solid #16a34a !important; /* Excel green */
  outline-offset: -1px;
  background: #e8f5e9 !important;
  z-index: 5;
}
/* Keep sticky positioning for frozen selected cells */
.cell-frozen.cell-selected {
  position: sticky;
}
/* Keep relative positioning for score selected cells */
.cell-score.cell-selected {
  position: relative;
}

/* ─── Range Selection: Light green area with border ─────────────────── */
.cell-in-range {
  background: #e8f5e9 !important;
  border-top-color: #a5d6a7 !important;
  border-bottom-color: #a5d6a7 !important;
  border-left-color: #a5d6a7 !important;
  border-right-color: #a5d6a7 !important;
}

/* ─── Cell Editing State ────────────────────────────────────────────── */
.cell-editing {
  outline: 2px solid #16a34a !important;
  outline-offset: -1px;
  background: #e8f5e9 !important;
  z-index: 5;
  padding: 0 !important;
}
/* For sticky editing cells: keep sticky positioning */
.cell-frozen.cell-editing {
  position: sticky;
}
/* For score cell editing: keep relative positioning */
.cell-score.cell-editing {
  position: relative;
}

/* ─── Cell Colors ──────────────────────────────────────────────────── */
.cell-excellent { background: #dcfce7 !important; color: #16a34a; font-weight: 600; }
.cell-average { background: #fef9c3 !important; color: #b45309; }
.cell-low { background: #fee2e2 !important; color: #dc2626; }

/* ─── Cell Editor ──────────────────────────────────────────────────── */
.cell-editor-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.cell-editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 4px;
  font-size: 0.8rem;
  text-align: center;
  background: #fff;
  font-family: inherit;
  color: #0f172a;
  box-sizing: border-box;
  min-width: 0;
  line-height: 1;
}

/* ─── Name Cell & Editor - Professional Spreadsheet Style ──────────── */
.cell-student-name {
  min-width: 160px;
  max-width: 160px;
  width: 160px;
}
.cell-student-name .cell-editor-wrapper .cell-editor {
  text-align: left;
  font-weight: 500;
  font-size: 0.82rem;
  color: #0f172a;
  padding: 0 6px;
  background: #fff;
  height: 100%;
  letter-spacing: 0.01em;
}
.cell-student-name.cell-selected {
  z-index: 25;
  outline: 2px solid #2563eb !important;
  outline-offset: -1px;
  position: sticky;
}
.cell-student-name.cell-editing {
  z-index: 25;
  outline: 2px solid #2563eb !important;
  outline-offset: -1px;
  background: #fff !important;
  position: sticky;
}
.cell-student-name .cell-value {
  font-weight: 500;
  color: #0f172a;
  padding: 3px 14px 3px 6px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

/* ─── Student ID Cell & Editor - Professional Style ───────────────── */
.student-name-cell-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.cell-student-id {
  min-width: 90px;
  max-width: 90px;
  width: 90px;
}

.student-id-cell-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.id-editor-wrapper {
  padding: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  box-sizing: border-box;
}
.id-editor-input {
  flex: 1;
  min-width: 0;
  text-align: left !important;
  font-weight: 600;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.75rem;
  color: #0f172a;
  letter-spacing: 0.01em;
  padding: 0 18px 0 3px !important;
  background: #fff !important;
  border: none;
  outline: none;
  height: 100%;
  box-sizing: border-box;
}
.fill-handle.fill-handle-frozen {
  right: -1px;
  bottom: -1px;
  z-index: 35;
}
.cell-student-id.cell-selected {
  z-index: 25;
  outline: 2px solid #2563eb !important;
  outline-offset: -1px;
  position: sticky;
}
.cell-student-id.cell-editing {
  z-index: 25;
  outline: 2px solid #2563eb !important;
  outline-offset: -1px;
  background: #fff !important;
  position: sticky;
}
.cell-student-id .cell-value {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.78rem;
  color: #334155;
  padding: 3px 18px 3px 6px;
  letter-spacing: 0.02em;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

/* ─── Cell Value Base ───────────────────────────────────────────────── */
.cell-value {
  display: block;
  padding: 3px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}


/* ─── Row States ───────────────────────────────────────────────────── */
.row-even .cell { background-color: #fafafa; }
.row-selected .cell { background-color: #f0fff4; }
.row-selected .cell.frozen { background-color: #e8f5e9; }

/* ─── Fill Handle ──────────────────────────────────────────────────── */
.fill-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #16a34a;
  border: 1px solid #fff;
  border-radius: 2px;
  cursor: crosshair;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1;
  user-select: none;
}
.fill-handle:hover {
  background: #15803d;
  transform: scale(1.2);
}

.cell-autofill-preview {
  background: #e8f5e9 !important;
  border-bottom: 2px solid #16a34a !important;
}

/* ─── Grade Colors ─────────────────────────────────────────────────── */
.grade-a { color: #16a34a !important; font-weight: 700 !important; }
.grade-b-plus { color: #2563eb !important; font-weight: 700 !important; }
.grade-b { color: #2563eb !important; font-weight: 700 !important; }
.grade-c-plus { color: #b45309 !important; font-weight: 700 !important; }
.grade-c { color: #b45309 !important; font-weight: 700 !important; }
.grade-d { color: #9333ea !important; font-weight: 700 !important; }
.grade-f { color: #dc2626 !important; font-weight: 700 !important; }
.grade-none { color: #94a3b8 !important; }

/* ─── Loading ──────────────────────────────────────────────────────── */
.loading-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.85);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  z-index: 100; font-size: 0.85rem; color: #64748b;
}
.spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.7s linear infinite; }

/* ─── Import Progress Bar ─────────────────────────────────────────── */
.import-progress-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center; justify-content: center;
  z-index: 90;
}
.import-progress-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px 32px;
  min-width: 280px;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
.import-progress-status {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
}
.import-progress-bar-track {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.import-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.1s linear;
}
.import-progress-pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
}

/* ─── Modal ────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content { background: #fff; border-radius: 10px; width: 90%; max-width: 450px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-sm { max-width: 380px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #e2e8f0; }
.modal-header h5 { font-size: 0.95rem; font-weight: 700; margin: 0; }
.modal-close { background: none; border: none; font-size: 1.4rem; color: #64748b; cursor: pointer; padding: 0; line-height: 1; }
.modal-body { padding: 18px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 18px; border-top: 1px solid #e2e8f0; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 0.78rem; font-weight: 600; color: #374151; margin-bottom: 3px; }
.form-input { width: 100%; padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 5px; font-size: 0.85rem; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
select.form-input { appearance: auto; }
.btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
.btn-secondary { background: #f1f5f9; color: #475569; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.btn-block { width: 100%; justify-content: center; }

.weight-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.weight-table th { text-align: left; padding: 6px 10px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 0.72rem; text-transform: uppercase; }
.weight-table td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
.weight-name { font-weight: 600; display: block; }
.weight-code { font-size: 0.72rem; color: #94a3b8; }
.weight-input { width: 70px; text-align: center; }
.weight-total-bar { margin-top: 10px; padding: 6px 10px; border-radius: 5px; font-weight: 600; font-size: 0.78rem; text-align: center; }
.weight-ok { background: #dcfce7; color: #16a34a; }
.weight-warn { background: #fef3c7; color: #d97706; }
.import-steps { font-size: 0.78rem; color: #64748b; padding-left: 18px; margin-bottom: 14px; }
.import-steps li { margin-bottom: 4px; }

/* ─── Import Modal ─────────────────────────────────────────────────── */
.import-modal {
  background: #fff;
  border-radius: 14px;
  width: 90%;
  max-width: 440px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
}
.import-modal-header {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  padding: 18px 22px;
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
}
.import-modal-header .modal-close {
  position: absolute;
  top: 12px;
  right: 14px;
  color: rgba(255,255,255,0.7);
  font-size: 1.3rem;
}
.import-modal-header .modal-close:hover { color: #fff; }
.import-modal-header-icon {
  width: 42px;
  height: 42px;
  background: rgba(255,255,255,0.18);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #fff;
  flex-shrink: 0;
}
.import-modal-header-text h5 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 2px;
  color: #fff;
}
.import-modal-header-text p {
  font-size: 0.78rem;
  margin: 0;
  color: rgba(255,255,255,0.75);
}
.import-modal-body {
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.import-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 22px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* Format badges */
.import-format-badges {
  display: flex;
  gap: 8px;
}
.import-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}
.import-badge-excel {
  background: #ecfdf5;
  color: #059669;
}
.import-badge-pdf {
  background: #fef2f2;
  color: #dc2626;
}

/* Drop zone */
.import-drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8fafc;
}
.import-drop-zone:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}
.import-drop-active {
  border-color: #2563eb;
  background: #dbeafe;
  transform: scale(1.01);
}
.import-drop-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #2563eb;
}
.import-drop-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.import-drop-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
}
.import-drop-sub {
  font-size: 0.78rem;
  color: #94a3b8;
}

/* File card */
.import-file-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.import-file-card-main {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f8fafc;
}
.import-file-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #2563eb;
  flex-shrink: 0;
}
.import-file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.import-file-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.import-file-size {
  font-size: 0.72rem;
  color: #94a3b8;
}
.import-file-remove {
  width: 28px;
  height: 28px;
  border: none;
  background: #f1f5f9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.import-file-remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Preview */
.import-preview {
  padding: 0 16px 14px;
}
.import-preview-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0 -16px 10px;
}
.import-preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}
.import-preview-grid {
  display: flex;
  gap: 8px;
}
.import-preview-stat {
  flex: 1;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
}
.import-preview-stat-wide {
  flex: 2;
}
.import-preview-stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}
.import-preview-stat-label {
  font-size: 0.65rem;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.import-preview-col-names {
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Import buttons */
.import-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.import-btn-secondary {
  background: #f1f5f9;
  color: #475569;
}
.import-btn-secondary:hover {
  background: #e2e8f0;
}
.import-btn-primary {
  background: linear-gradient(135deg, #059669, #047857);
  color: #fff;
  box-shadow: 0 2px 8px rgba(5,150,105,0.25);
}
.import-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #065f46);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(5,150,105,0.35);
}
.import-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .sheet-toolbar { flex-direction: column; align-items: flex-start; }
  .toolbar-actions { width: 100%; }
  .btn-group { width: 100%; }
}

.table-footer { display: flex; align-items: center; justify-content: flex-end; padding: 10px 12px; border-top: 1px solid #e2e8f0; background: #f8fafc; gap: 8px; }
.page-size-selector { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: #64748b; }
.page-size-select { padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.78rem; background: #fff; color: #1e293b; outline: none; cursor: pointer; }
.page-size-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }

.add-col-header { width: 40px; min-width: 40px; max-width: 40px; text-align: center; padding: 5px !important; position: relative; }
.add-col-trigger { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; color: #64748b; transition: all 0.15s; margin: 0 auto; }
.add-col-trigger:hover { background: #dbeafe; color: #2563eb; }
.inline-add-col { position: absolute; top: 100%; right: 0; z-index: 50; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); padding: 10px; display: flex; flex-direction: column; gap: 6px; min-width: 200px; margin-top: 4px; }
.inline-input { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.78rem; outline: none; width: 100%; box-sizing: border-box; }
.inline-input:focus { border-color: #3b82f6; }
.inline-select { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.78rem; background: #fff; outline: none; width: 100%; box-sizing: border-box; }
.inline-btn { padding: 6px 10px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.inline-btn:hover { background: #1d4ed8; }
.inline-btn-cancel { position: absolute; top: 4px; right: 6px; background: none; border: none; font-size: 1.1rem; color: #94a3b8; cursor: pointer; line-height: 1; }
.inline-btn-cancel:hover { color: #ef4444; }

/* ─── Placeholder Rows (Excel-like) ─────────────────────────────── */
.placeholder-row { cursor: pointer; }
.placeholder-row:hover { background: #f8faff !important; }
.placeholder-row:hover .placeholder-cell { border-color: #bfdbfe !important; }
.placeholder-cell {
  color: #94a3b8 !important;
  font-size: 0.8rem;
  border: 1px dashed #e2e8f0 !important;
  padding: 8px 12px !important;
  text-align: center;
  transition: all 0.15s ease;
}
.placeholder-hint i { margin-right: 6px; color: #3b82f6; }
.placeholder-row:hover .placeholder-hint { color: #3b82f6; }

/* ─── Add Row Button ───────────────────────────────────────────── */
/* ─── Export Dropdown ──────────────────────────────────────────── */
.export-dropdown { position: relative; display: inline-block; }
.export-menu {
  position: absolute; top: 100%; right: 0; z-index: 100;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 180px;
  padding: 4px; margin-top: 4px;
}
.export-menu-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; cursor: pointer; border-radius: 6px;
  font-size: 0.78rem; color: #334155; transition: background 0.12s;
}
.export-menu-item:hover { background: #f1f5f9; }
.export-menu-item i { font-size: 1rem; width: 18px; text-align: center; color: #64748b; }
.export-menu-item:first-child i { color: #22c55e; }
.export-menu-item:nth-child(2) i { color: #22c55e; }
.export-menu-item:last-child i { color: #ef4444; }

.add-row-row { cursor: pointer; transition: background 0.15s; }
.add-row-row:hover { background: #f0f9ff !important; }
.add-row-cell { text-align: center; color: #3b82f6; font-weight: 600; font-size: 0.8rem; padding: 10px !important; border: 2px dashed #bfdbfe !important; border-radius: 0 0 8px 0; }
.add-row-cell i { margin-right: 6px; }

/* ─── Right-Click Context Menu ──────────────────────────────────── */
/* ─── Keyboard Shortcuts Modal ──────────────────────────────────── */
.shortcuts-modal {
  max-width: 560px !important;
  max-height: 80vh;
}

.shortcuts-body {
  padding: 4px 24px 20px;
  max-height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shortcut-group {
  padding: 12px 0;
}

.shortcut-group + .shortcut-group {
  border-top: 1px solid #f1f5f9;
}

.shortcut-group-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.shortcut-group-title i {
  font-size: 0.85rem;
  color: #3b82f6;
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  gap: 12px;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.shortcut-keys kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 24px;
  padding: 0 6px;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
  color: #1e293b;
  background: #f1f5f9;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  box-shadow: 0 1px 1px rgba(0,0,0,0.06);
  line-height: 1;
}

.shortcut-desc {
  font-size: 0.82rem;
  color: #475569;
  text-align: right;
  flex: 1;
}

/* Shared overlay/modal-card from other pages - defined here for scoped CSS */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow: hidden;
  animation: modal-in 0.25s ease-out;
}

@keyframes modal-in {
  0% { opacity: 0; transform: scale(0.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 24px 0;
  position: relative;
}

.modal-head h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 2px;
}

.modal-head p {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.modal-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.icon-add {
  background: #dbeafe;
  color: #2563eb;
}

.modal-x {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}

.modal-x:hover {
  color: #475569;
}

.context-menu {
  position: fixed;
  z-index: 10000;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  padding: 4px 0;
  min-width: 180px;
  animation: contextMenuFadeIn 0.12s ease;
}
@keyframes contextMenuFadeIn {
  from { opacity: 0; transform: scale(0.95) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #334155;
  transition: background 0.1s;
}
.context-menu-item:hover { background: #f1f5f9; }
.context-menu-item.text-danger { color: #ef4444; }
.context-menu-item.text-danger:hover { background: #fef2f2; }
.context-menu-separator {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 8px;
}
.context-menu-item i { font-size: 0.9rem; width: 16px; text-align: center; }

.cell { transition: background 0.1s ease, border-color 0.1s ease; }
.cell-score:hover { background: #f8fafc; }
.cell-selected { transition: outline 0.1s ease, background 0.1s ease; }
.row-selected .cell { transition: background 0.1s ease; }
</style>
