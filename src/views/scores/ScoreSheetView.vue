<template>
  <div class="score-sheet" @click="refocusSheet">
    <div class="sheet-toolbar">
      <button class="tb-btn" @click="goBack" title="Back">
        <i class="bi bi-arrow-left"></i>
      </button>
      <div class="offering-info">
        <span class="offering-item offering-item-main">{{ data?.subject?.name || 'Subject' }}</span>
        <span class="offering-item offering-item-badge offering-term">{{ data?.term?.name }}</span>
        <span v-if="className" class="offering-item offering-item-badge offering-class">
          {{ className }}
        </span>
        <template v-if="data?.offerings?.length">
          <span class="offering-item offering-item-teachers">{{ data.offerings.map(o => o.teacher_name).filter(Boolean).join(', ') }}</span>
        </template>
      </div>
      <div class="toolbar-spacer"></div>
      <div class="toolbar-actions">
        <div class="btn-group">
          <button class="tb-btn" @click="showAddColumn = true" title="Add Column"><i class="bi bi-plus-lg"></i> <span>Add</span></button>
          <button class="tb-btn" @click="showWeights = true" title="Weight Configuration"><i class="bi bi-sliders"></i> <span>Weights</span></button>
          <button class="tb-btn" @click="openGoogleSheetsDirect" title="Create and open Google Sheet with all scores" :disabled="gsLoading">
            <template v-if="gsLoading">
              <i class="bi bi-arrow-repeat spinning"></i>
            </template>
            <template v-else>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="gs-icon">
                <path d="M6 2h9l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#34A853"/>
                <path d="M15 2v4h4" fill="white"/>
                <path d="M15 2l4 4" stroke="#34A853" stroke-width="0.5"/>
                <path d="M7.5 9.5h9M7.5 12.5h9M7.5 15.5h9M7.5 18.5h7" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M12 9.5v9" stroke="white" stroke-width="1.2"/>
                <path d="M16.5 9.5v9" stroke="white" stroke-width="1.2"/>
              </svg>
            </template>
            <span>{{ gsLoading ? 'Creating...' : 'Google Sheets' }}</span>
          </button>
          <button class="tb-btn" @click="showImport = true" title="Import CSV, Excel, or PDF file"><i class="bi bi-cloud-upload"></i> <span>Import</span></button>
          <div class="export-dropdown" @click.stop>
            <button class="tb-btn" @click="showExportMenu = !showExportMenu" title="Export" ref="exportBtnRef"><i class="bi bi-download"></i> <span>Export</span> <i class="bi bi-chevron-down" style="font-size:0.6rem;margin-left:2px"></i></button>
            <div v-if="showExportMenu" class="export-menu">
              <div class="export-menu-item" @click="exportFormat('xlsx')"><i class="bi bi-file-earmark-excel"></i> Export as Excel (.xlsx)</div>
              <div class="export-menu-item" @click="exportFormat('pdf')"><i class="bi bi-filetype-pdf"></i> Export as PDF</div>
            </div>
          </div>
        </div>
        <div class="toolbar-meta">
          <span v-if="gsReconnectNeeded" class="gs-sync-status gs-reconnect-needed">
            <i class="bi bi-exclamation-triangle-fill" style="color:#f59e0b;font-size:11px"></i>
            <a class="gs-reconnect-link" @click="openGoogleSheetsDirect" title="Re-connect Google account">Reconnect Google</a>
          </span>

        </div>
        <div class="search-box">
          <i class="bi bi-search search-icon"></i>
          <input v-model="searchQuery" type="text" class="search-input" placeholder="Search student..." />
        </div>
        <button class="tb-btn kb-btn" @click="showKeyboardShortcuts = true" title="Keyboard shortcuts (?)">
          <i class="bi bi-keyboard"></i>
        </button>
        <div class="save-status" :class="saveStatusClass" :title="saveStatusText">
          <i :class="saveStatusIcon"></i>
          <span class="status-text">{{ saveStatusText }}</span>
        </div>
      </div>
    </div>

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

    <div class="sheet-wrapper" tabindex="0" @keydown="onGlobalKeydown" ref="sheetContainer" @paste="onPaste" @copy="onCopy" @cut="onCut">
      <div class="sheet-scroll" @scroll="onScroll">
        <table class="sheet-table">
          <thead>
            <tr>
              <th class="cell-header cell-frozen row-num-header" :class="{ 'header-highlighted': isRowHeaderHighlighted() }">#</th>
              <th class="cell-header cell-frozen student-name-header" :class="{ 'header-highlighted': selectedCol === -1 }">Student Name</th>
              <th class="cell-header cell-frozen student-id-header" :class="{ 'header-highlighted': selectedCol === 0 }">ID</th>
              <th v-for="col in columns" :key="col.id" class="cell-header" :class="[getColumnTypeClass(col.type), { 'header-highlighted': selectedCol === col.id }]" :style="{ width: '140px', minWidth: '140px', maxWidth: '140px' }">
                <div class="header-content column-header-content">
                  <div class="column-label-row">
                    <span class="column-label" :title="col.label" @dblclick.stop="startRenameColumn(col)">{{ col.label }}</span>
                    <div class="column-actions">
                      <button class="col-action-btn" @click="startRenameColumn(col)" title="Rename"><i class="bi bi-pencil"></i></button>
                      <button class="col-action-btn col-action-delete" @click="confirmDeleteColumn(col)" title="Delete"><i class="bi bi-trash3"></i></button>
                    </div>
                  </div>
                  <div class="col-type-badge" :class="`col-type-${columnTypes[col.id] || col.type}`" @click.stop="(e) => toggleColTypeDropdown(col.id, e)" @keydown.enter.stop="(e) => toggleColTypeDropdown(col.id, e)" tabindex="0" role="button" :title="'Type: ' + getTypeLabel(columnTypes[col.id] || col.type)">
                    <span class="col-type-label">{{ getTypeLabel(columnTypes[col.id] || col.type) }}</span>
                    <svg class="col-type-chevron" width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M1 2l3 3 3-3z"/></svg>
                    <div v-if="openColTypeDropdown === col.id" class="col-type-dropdown" @click.stop @mousedown.stop>
                      <div
                        v-for="opt in typeOptions"
                        :key="opt.value"
                        class="col-type-option"
                        :class="{ active: (columnTypes[col.id] || col.type) === opt.value }"
                        @click.stop="changeColType(col, opt.value)"
                      >
                        <span class="col-type-dot" :class="`col-type-${opt.value}`"></span>
                        {{ opt.label }}
                        <span v-if="(columnTypes[col.id] || col.type) === opt.value" class="col-type-check">✓</span>
                      </div>
                    </div>
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
                    <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
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
              :class="{ 'row-selected': (editingRow === null && isRowSelected(rowIndex)) || editingRow === rowIndex }"
              @contextmenu.prevent="showContextMenu($event, rowIndex)">
              <td class="cell cell-frozen row-num"
                :class="{ 'row-num-highlighted': (editingRow === null && isRowSelected(rowIndex)) || editingRow === rowIndex }"
                @click.stop>{{ rowIndex + 1 }}</td>

              <td class="cell cell-frozen cell-student-name"
                :class="getStudentNameCellClass(rowIndex)"
                :data-row-idx="rowIndex"
                :data-col-id="-1"
                @mousedown.prevent="onCellMouseDown($event, rowIndex, -1)"
                @dblclick.prevent.stop="startEditing(rowIndex, -1)"
              >
                <div class="student-name-cell-inner">
                  <span class="cell-value"
                    :class="{ 'cell-value-hidden': editingRow === rowIndex && editingCol === -1 }"
                    :title="row.student_name"
                  >{{ row.student_name }}</span>
                  <div v-if="editingRow === rowIndex && editingCol === -1" class="cell-editor-wrapper cell-editor-overlay-frozen">
                    <input ref="cellEditor" v-model="editValue" type="text" class="cell-editor"
                      @keydown="onEditKeydown" @blur="saveEdit()" @input="onEditInput" />
                  </div>
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
                  <span class="cell-value"
                    :class="{ 'cell-value-hidden': editingRow === rowIndex && editingCol === 0 }"
                    :title="row.student_number"
                  >{{ row.student_number }}</span>
                  <div v-if="editingRow === rowIndex && editingCol === 0" class="cell-editor-wrapper cell-editor-overlay-frozen id-editor-wrapper">
                    <input ref="cellEditor" v-model="editValue" type="text" class="cell-editor id-editor-input" list="student-numbers-list"
                      @keydown="onEditKeydown" @blur="saveEdit()" @input="onEditInput" placeholder="Select or type ID..." />
                  </div>
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
                <span class="cell-value"
                  :class="{ 'cell-value-hidden': editingRow === rowIndex && editingCol === col.id }"
                  :title="getCellTitle(col, row)"
                >{{ formatCellValue(getCellMark(row, col.id)) }}</span>

                <div v-if="editingRow === rowIndex && editingCol === col.id" class="cell-editor-wrapper cell-editor-overlay">
                  <input ref="cellEditor" v-model="editValue" type="text" inputmode="decimal" class="cell-editor"
                    @keydown="onEditKeydown" @blur="saveEdit()" @input="onEditInput" />
                </div>

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

    <div v-if="importProgress > 0" class="import-progress-overlay">
      <div class="import-progress-card">
        <div class="import-progress-status">{{ importStatusText }}</div>
        <div class="import-progress-bar-track">
          <div class="import-progress-bar-fill" :style="{ width: importProgress + '%' }"></div>
        </div>
        <div class="import-progress-pct">{{ Math.round(importProgress) }}%</div>
      </div>
    </div>

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

    <datalist id="student-numbers-list">
      <option v-for="num in studentNumbers" :key="num" :value="num"></option>
    </datalist>

    <div v-if="filteredRows.length > 0" class="pagination-bar">
      <div class="pagination-info">
        <span class="rows-label">Rows per page:</span>
        <div class="rows-selector">
          <button
            v-for="size in [10, 25, 50, 75, 100]"
            :key="size"
            class="rows-btn"
            :class="{ active: pageSize === size }"
            @click="pageSize = size; currentPage = 1"
          >{{ size }}</button>
          
        </div>
      </div>

      <div v-if="pageSize !== 'all'" class="pagination-pages">
        <button
          class="page-nav"
          :disabled="currentPage <= 1"
          @click="currentPage--"
          aria-label="Previous page"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <template v-for="(page, idx) in visiblePages" :key="'vp-' + idx">
          <button
            v-if="page !== '...'"
            class="page-btn"
            :class="{ active: currentPage === page }"
            @click="currentPage = page as number"
          >{{ page }}</button>
          <span v-else class="page-dots">…</span>
        </template>

        <button
          class="page-nav"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
          aria-label="Next page"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <div class="pagination-total" v-if="pageSize !== 'all'">
        {{ (currentPage - 1) * (pageSize as number) + 1 }}-{{ Math.min(currentPage * (pageSize as number), filteredRows.length) }} of {{ filteredRows.length }}
      </div>
      <div class="pagination-total" v-else>
        All {{ filteredRows.length }} rows
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="renamingColumn" class="modal-overlay" @click.self="renamingColumn = null">
          <div class="modal-content-panel modal-sm-panel">
            <div class="modal-header-custom">
              <button class="modal-close-btn" @click="renamingColumn = null" aria-label="Close">
                <i class="bi bi-x-lg"></i>
              </button>
              <div class="modal-icon icon-rename">
                <i class="bi bi-pencil-square"></i>
              </div>
              <div>
                <h5>Rename Column</h5>
                <p class="modal-subtitle">Give the column a new name</p>
              </div>
            </div>
            <div class="modal-body-custom">
              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-fonts me-1"></i>
                  New Label
                </label>
                <div class="input-wrapper">
                  <input v-model="renameValue" ref="renameInput" type="text" class="modern-input"
                    @keydown.enter="doRenameColumn" placeholder="Enter new column name" />
                </div>
              </div>
            </div>
            <div class="modal-footer-custom">
              <button class="btn-outline" @click="renamingColumn = null">Cancel</button>
              <button class="btn-primary-custom" @click="doRenameColumn">
                <i class="bi bi-check-lg me-1"></i>
                Rename
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddColumn" class="modal-overlay" @click.self="showAddColumn = false">
          <div class="modal-content-panel modal-sm-panel">
            <div class="modal-header-custom">
              <button class="modal-close-btn" @click="showAddColumn = false" aria-label="Close">
                <i class="bi bi-x-lg"></i>
              </button>
              <div class="modal-icon icon-add">
                <i class="bi bi-plus-circle"></i>
              </div>
              <div>
                <h5>Add New Column</h5>
                <p class="modal-subtitle">Add a new score column to the spreadsheet</p>
              </div>
            </div>
            <div class="modal-body-custom">
              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-tag me-1"></i>
                  Type
                </label>
                <div class="input-wrapper">
                  <select v-model="newColumn.type" class="modern-input">
                    <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    <option value="__custom__">Custom…</option>
                  </select>
                  <div v-if="newColumn.type === '__custom__'" class="form-group" style="margin-top: 8px">
                    <label class="form-label">
                      <i class="bi bi-pencil me-1"></i>
                      Custom Type Name
                    </label>
                    <div class="input-wrapper">
                      <input v-model="newColumn.customTypeName" type="text" class="modern-input" placeholder="e.g. Final Exam" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-fonts me-1"></i>
                  Label
                </label>
                <div class="input-wrapper">
                  <input v-model="newColumn.label" type="text" class="modern-input" placeholder="e.g. Quiz 1" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-arrow-up-circle me-1"></i>
                  Max Score
                </label>
                <div class="input-wrapper">
                  <input v-model.number="newColumn.max_score" type="number" min="1" class="modern-input" placeholder="100" />
                </div>
              </div>
            </div>
            <div class="modal-footer-custom">
              <button class="btn-outline" @click="showAddColumn = false">Cancel</button>
              <button class="btn-primary-custom" @click="doAddColumn">
                <i class="bi bi-check-lg me-1"></i>
                Add Column
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showWeights" class="modal-overlay" @click.self="showWeights = false">
          <div class="modal-content-panel modal-sm-panel">
            <div class="modal-header-custom">
              <button class="modal-close-btn" @click="showWeights = false" aria-label="Close">
                <i class="bi bi-x-lg"></i>
              </button>
              <div class="modal-icon icon-weights">
                <i class="bi bi-sliders"></i>
              </div>
              <div>
                <h5>Weight Configuration</h5>
                <p class="modal-subtitle">Set weight percentages for each assessment type</p>
              </div>
            </div>
            <div class="modal-body-custom">
              <div v-if="!assessments.length" class="no-assessments-text">
                No assessment types available.
              </div>
              <div v-for="at in assessments" :key="at.id" class="weight-row">
                <div class="weight-info">
                  <span class="weight-name">{{ at.name }}</span>
                  <span class="weight-code">{{ at.code }}</span>
                </div>
                <div class="weight-input-group">
                  <input v-model.number="weightEdits[at.id]" type="number" min="0" max="100" step="0.5" class="modern-input weight-input-field" />
                  <span class="weight-suffix">%</span>
                </div>
              </div>

              <div class="weight-divider"></div>
              <div class="new-type-section">
                <div class="new-type-header" @click="showNewTypeForm = !showNewTypeForm">
                  <i class="bi" :class="showNewTypeForm ? 'bi-dash-circle' : 'bi-plus-circle'"></i>
                  <span>New Assessment Type</span>
                </div>
                <div v-if="showNewTypeForm" class="new-type-form">
                  <div class="new-type-row">
                    <div class="new-type-field">
                      <label class="new-type-label">Code</label>
                      <input v-model="newTypeCode" type="text" class="modern-input" placeholder="e.g. final" />
                    </div>
                    <div class="new-type-field">
                      <label class="new-type-label">Name</label>
                      <input v-model="newTypeName" type="text" class="modern-input" placeholder="e.g. Final Exam" />
                    </div>
                    <div class="new-type-field new-type-field-sm">
                      <label class="new-type-label">Weight %</label>
                      <input v-model.number="newTypeWeight" type="number" min="0" max="100" step="0.5" class="modern-input" placeholder="20" />
                    </div>
                    <div class="new-type-action">
                      <button class="btn-primary-custom btn-sm" :disabled="!newTypeCode.trim() || !newTypeName.trim()" @click="doCreateType">
                        <i class="bi bi-check-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="weight-total-bar" :class="{ 'weight-ok': totalWeight === 100, 'weight-warn': totalWeight !== 100 }">
                <i :class="totalWeight === 100 ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'"></i>
                <span>Total: <strong>{{ totalWeight.toFixed(1) }}%</strong></span>
                <span v-if="totalWeight !== 100" class="weight-hint">(must equal 100%)</span>
              </div>
            </div>
            <div class="modal-footer-custom">
              <button class="btn-outline" @click="showWeights = false">Cancel</button>
              <button class="btn-primary-custom" :disabled="totalWeight !== 100" @click="doUpdateWeights">
                <i class="bi bi-check-lg me-1"></i>
                Save &amp; Recalculate
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteConfirm" class="modal-overlay" @click.self="deleteConfirm = null">
          <div class="modal-content-panel modal-sm-panel">
            <div class="modal-header-custom">
              <button class="modal-close-btn" @click="deleteConfirm = null" aria-label="Close">
                <i class="bi bi-x-lg"></i>
              </button>
              <div class="modal-icon icon-delete">
                <i class="bi bi-trash3"></i>
              </div>
              <div>
                <h5>Delete Column</h5>
                <p class="modal-subtitle">This action cannot be undone</p>
              </div>
            </div>
            <div class="modal-body-custom">
              <p class="delete-warning-text">
                Are you sure you want to delete <strong>"{{ deleteConfirm.label }}"</strong>?
                This removes the column and all its scores for every student.
              </p>
            </div>
            <div class="modal-footer-custom">
              <button class="btn-outline" @click="deleteConfirm = null">Cancel</button>
              <button class="btn-danger-custom" @click="doDeleteColumn">
                <i class="bi bi-trash3 me-1"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddRowPopup" class="modal-overlay" @click.self="showAddRowPopup = false">
          <div class="modal-content-panel modal-sm-panel">
            <div class="modal-header-custom">
              <button class="modal-close-btn" @click="showAddRowPopup = false" aria-label="Close">
                <i class="bi bi-x-lg"></i>
              </button>
              <div class="modal-icon icon-add">
                <i class="bi bi-person-plus"></i>
              </div>
              <div>
                <h5>Add Student Rows</h5>
                <p class="modal-subtitle">Add new student enrollment rows to the score sheet</p>
              </div>
            </div>
            <div class="modal-body-custom">
              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-123 me-1"></i>
                  Number of rows
                </label>
                <div class="input-wrapper">
                  <input v-model.number="addRowCount" type="number" min="1" max="50" class="modern-input" placeholder="1" />
                </div>
                <p class="field-hint">Each new row creates an empty enrollment for a new student (max 50).</p>
              </div>
            </div>
            <div class="modal-footer-custom">
              <button class="btn-outline" @click="showAddRowPopup = false">Cancel</button>
              <button class="btn-primary-custom" @click="doAddRows">
                <i class="bi bi-check-lg me-1"></i>
                Add {{ addRowCount }} Row{{ addRowCount > 1 ? 's' : '' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showImport" class="modal-overlay" @click.self="showImport = false">
          <div class="import-modal">
            <div class="import-modal-head">
              <div class="import-modal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div>
                <h3>Import Scores</h3>
                <p>Upload student scores from Excel or PDF</p>
              </div>
              <button class="import-modal-close" @click="showImport = false; selectedFileName = ''; filePreview = null" aria-label="Close">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <div class="import-modal-body">
              <div class="import-formats">
                <span class="import-format import-format-excel">
                  <i class="bi bi-file-earmark-excel"></i> Excel
                </span>
                <span class="import-format import-format-pdf">
                  <i class="bi bi-filetype-pdf"></i> PDF
                </span>
              </div>

              <div v-if="!selectedFileName" class="import-zone"
                @drop.prevent="onFileDrop" @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                :class="{ 'import-zone-over': dragOver }"
                @click="openFilePicker">
                <input ref="fileInputRef" type="file" accept=".xlsx,.xls,.pdf" hidden @change="onFileSelected" />
                <div class="import-zone-icon">
                  <i class="bi bi-cloud-upload"></i>
                </div>
                <div class="import-zone-text">
                  <span class="import-zone-title">Drop your file here</span>
                  <span class="import-zone-sub">or click to browse</span>
                </div>
              </div>

              <div v-else class="import-file">
                <div class="import-file-accent"></div>
                <div class="import-file-main">
                  <div class="import-file-type-icon">
                    <i class="bi bi-file-earmark-spreadsheet"></i>
                  </div>
                  <div class="import-file-info">
                    <span class="import-file-name">{{ selectedFileName }}</span>
                    <span class="import-file-size">{{ fileSizeFormatted }}</span>
                  </div>
                  <button class="import-file-remove" @click="clearFile" title="Remove file">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>

                <div v-if="filePreview" class="import-preview">
                  <div class="import-preview-stats">
                    <div class="import-preview-stat">
                      <div class="import-preview-stat-icon import-icon-students">
                        <i class="bi bi-people"></i>
                      </div>
                      <span class="import-preview-num">{{ filePreview.rowCount }}</span>
                      <span class="import-preview-label">Students</span>
                    </div>
                    <div class="import-preview-stat">
                      <div class="import-preview-stat-icon import-icon-columns">
                        <i class="bi bi-layout-three-columns"></i>
                      </div>
                      <span class="import-preview-num">{{ filePreview.colCount }}</span>
                      <span class="import-preview-label">Columns</span>
                    </div>
                    <div class="import-preview-stat import-preview-stat-wide">
                      <div class="import-preview-stat-icon import-icon-cols">
                        <i class="bi bi-tag"></i>
                      </div>
                      <span class="import-preview-num import-preview-cols" :title="filePreview.colNames.join(', ')">
                        {{ filePreview.colNames.slice(0, 3).join(' · ') }}<span v-if="filePreview.colNames.length > 3"> …</span>
                      </span>
                      <span class="import-preview-label">Detected columns</span>
                    </div>
                  </div>
                </div>

                <div v-if="studentEmailDomains.length > 1" class="import-domain-group">
                  <div class="import-domain" :class="{ 'import-domain-required': emailDomainSelectionRequired }">
                    <div class="import-domain-info">
                      <i class="bi bi-envelope-at"></i>
                      <span>New accounts sign in with</span>
                    </div>
                    <select v-model="selectedEmailDomain" class="import-domain-select" :class="{ 'select-warn': emailDomainSelectionRequired }">
                      <option :value="null" disabled>Select a domain…</option>
                      <option v-for="d in studentEmailDomains" :key="d.id" :value="d.domain">@{{ d.domain }}</option>
                    </select>
                  </div>
                  <div v-if="emailDomainSelectionRequired" class="import-domain-hint import-domain-hint-warn">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span>Choose a sign-in domain before importing.</span>
                  </div>
                </div>
                <div v-else-if="studentEmailDomains.length === 1" class="import-domain-info-bar">
                  <i class="bi bi-envelope-at"></i>
                  <span>New accounts will use <strong>@{{ studentEmailDomains[0].domain }}</strong></span>
                </div>
              </div>
            </div>

            <div class="import-modal-foot">
              <button class="import-btn-secondary" @click="showImport = false; selectedFileName = ''; filePreview = null">Cancel</button>
              <button class="import-btn-primary" :disabled="!pendingFile || emailDomainSelectionRequired" @click="processImportFile">
                <i class="bi bi-upload"></i>
                Import {{ filePreview?.rowCount ? filePreview.rowCount + ' student' + (filePreview.rowCount > 1 ? 's' : '') : 'File' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
              <div class="shortcut-group">
                <h4 class="shortcut-group-title"><i class="bi bi-arrows-move"></i> Navigation</h4>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span><span class="shortcut-desc">Move between cells</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Tab</kbd> <kbd>Shift</kbd>+<kbd>Tab</kbd></span><span class="shortcut-desc">Next or previous cell</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Home</kbd></span><span class="shortcut-desc">Jump to first row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>End</kbd></span><span class="shortcut-desc">Jump to last row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>Home</kbd></span><span class="shortcut-desc">Jump to first cell (top-left)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>End</kbd></span><span class="shortcut-desc">Jump to last cell (bottom-right)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>↑</kbd></span><span class="shortcut-desc">Jump to first row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>↓</kbd></span><span class="shortcut-desc">Jump to last row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>←</kbd></span><span class="shortcut-desc">Jump to student name</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>→</kbd></span><span class="shortcut-desc">Jump to last column</span></div>
              </div>
              <div class="shortcut-group">
                <h4 class="shortcut-group-title"><i class="bi bi-ui-checks"></i> Selection</h4>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Shift</kbd>+<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></span><span class="shortcut-desc">Select multiple cells</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Shift</kbd>+<kbd>Click</kbd></span><span class="shortcut-desc">Select range from here to clicked cell</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Shift</kbd>+<kbd>Home</kbd></span><span class="shortcut-desc">Select from here to first row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Shift</kbd>+<kbd>End</kbd></span><span class="shortcut-desc">Select from here to last row</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>A</kbd></span><span class="shortcut-desc">Select all in current column</span></div>
              </div>
              
              <div class="shortcut-group">
                <h4 class="shortcut-group-title"><i class="bi bi-pencil"></i> Editing</h4>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Enter</kbd> <kbd>F2</kbd></span><span class="shortcut-desc">Edit selected cell</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Enter</kbd></span><span class="shortcut-desc">Save &amp; move down</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Escape</kbd></span><span class="shortcut-desc">Cancel edit</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Delete</kbd> <kbd>Backspace</kbd></span><span class="shortcut-desc">Clear cell value</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>C</kbd></span><span class="shortcut-desc">Copy cell(s)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>V</kbd></span><span class="shortcut-desc">Paste into cell(s)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>X</kbd></span><span class="shortcut-desc">Cut cell(s)</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>Z</kbd></span><span class="shortcut-desc">Undo last change</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>Y</kbd> <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd></span><span class="shortcut-desc">Redo last change</span></div>
                <div class="shortcut-row"><span class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>S</kbd></span><span class="shortcut-desc">Save changes</span></div>
                <div class="shortcut-row"><span class="shortcut-keys">Type a digit</span><span class="shortcut-desc">Type a number to start editing</span></div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showGsLinkModal" class="modal-overlay" @click.self="showGsLinkModal = false">
          <div class="modal-content-panel modal-sm-panel">
            <div class="modal-header-custom">
              <button class="modal-close-btn" @click="showGsLinkModal = false" aria-label="Close">
                <i class="bi bi-x-lg"></i>
              </button>
              <div class="modal-icon icon-add">
                <i class="bi bi-file-earmark-spreadsheet"></i>
              </div>
              <div>
                <h5>Open Google Sheet</h5>
                <p class="modal-subtitle">Your browser blocked the popup. Click the button below to open your sheet in a new tab.</p>
              </div>
            </div>
            <div class="modal-body-custom">
              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-link-45deg me-1"></i>
                  Sheet Link
                </label>
                <div class="input-wrapper">
                  <input :value="gsLinkUrl" type="text" class="modern-input" readonly
                    @click="$event.target.select()" />
                </div>
              </div>
            </div>
            <div class="modal-footer-custom">
              <button class="btn-outline" @click="showGsLinkModal = false">Cancel</button>
              <button class="btn-primary-custom" @click="openGsLinkDirectly">
                <i class="bi bi-box-arrow-up-right me-1"></i>
                Open Sheet
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>


    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toastVisible" class="toast-notification" :class="toastType">
          <i :class="toastIcon"></i>
          <span class="toast-message">{{ toastMessage }}</span>
        </div>
      </Transition>
    </Teleport>

    <div v-if="loading" class="loading-overlay"><div class="spinner"></div><span>Loading scores...</span></div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch, nextTick, reactive, triggerRef, onBeforeUnmount, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import {
  getSpreadsheetBySubjectAndTerm, updateCellMark, addColumn, deleteColumn,
  renameColumn, updateWeights,
  addEnrollment, deleteEnrollment, updateStudentInfo,
  changeColumnType, getStudentNumbers, importFile,
  createGoogleSheet, getGoogleConfig, getGoogleStatus,
  importFromGoogleSheets, exchangeGoogleToken, refreshGoogleToken, ensureGoogleSheetShared, pushToGoogleSheet,
  type SpreadsheetColumn, type SpreadsheetRow, type AssessmentTypeWeight, type SpreadsheetResponse,
} from '@/services/scoreService'
import { getStudentEmailDomains, type StudentEmailDomain } from '@/services/emailDomainRuleService'
import { createAssessmentType } from '@/services/assessmentTypeService'

const router = useRouter()
const route = useRoute()
const subjectId = computed(() => Number(route.params.subjectId))
const termId = computed(() => Number(route.params.termId))
const classId = computed(() => route.query.class_id ? Number(route.query.class_id) : null)
const className = computed(() => (route.query.class_name as string) || '')

const data = shallowRef<SpreadsheetResponse | null>(null)
const loading = ref(false)
const searchQuery = ref('')
const saveStatus = ref<'saving' | 'saved' | 'failed' | 'idle'>('idle')
const sheetContainer = ref<HTMLElement | null>(null)
const pageSize = ref<number | 'all'>(10)
const currentPage = ref(1)
const importProgress = ref(0)
const importStatusText = ref('')

const studentEmailDomains = ref<StudentEmailDomain[]>([])
const selectedEmailDomain = ref<string | null>(null)

async function loadStudentEmailDomains() {
  try {
    studentEmailDomains.value = await getStudentEmailDomains()
    if (studentEmailDomains.value.length === 1) {
      selectedEmailDomain.value = studentEmailDomains.value[0].domain
    }
  } catch {
    studentEmailDomains.value = []
  }
}

const emailDomainSelectionRequired = computed(() =>
  studentEmailDomains.value.length > 1 && !selectedEmailDomain.value
)

const selectedRowIndex = ref(0)
const selectedCol = ref<number | null>(null)
const selectionStartRow = ref<number | null>(null)
const selectionStartCol = ref<number | null>(null)
const isRangeSelecting = ref(false)

const editingRow = ref<number | null>(null)
const editingCol = ref<number | null>(null)
const editValue = ref('')
const cellEditor = ref<HTMLInputElement | null>(null)

const fillPreviewSet = ref<Set<string>>(new Set())
const fillDrag = ref<{
  active: boolean; sourceRow: number; sourceColId: number;
  startClientX: number; startClientY: number;
  destRow: number; destColId: number;
  previewDestRow: number; previewDestColId: number;
} | null>(null)

const showAddColumn = ref(false)
const showInlineAddColumn = ref(false)
const inlineColName = ref('')
const inlineColType = ref('quiz')
const inlineColMax = ref<number | null>(100)
const showWeights = ref(false)
const showImport = ref(false)
const gsLoading = ref(false)
const gsSheetId = ref<string | null>(null)
const gsLastSynced = ref<string | null>(null)
const gsReconnectNeeded = ref(false)
let gsAutoSyncTimer: ReturnType<typeof setInterval> | null = null
let gsIsSyncing = false // Guard to prevent duplicate syncs
const renamingColumn = ref<SpreadsheetColumn | null>(null)
const renameValue = ref('')
const deleteConfirm = ref<{ col: SpreadsheetColumn; label: string } | null>(null)
const contextMenu = ref<{ x: number; y: number; rowIdx: number } | null>(null)

const showExportMenu = ref(false)
const exportBtnRef = ref<HTMLElement | null>(null)
const showKeyboardShortcuts = ref(false)
const openColTypeDropdown = ref<number | null>(null)

function toggleColTypeDropdown(colId: number, event: MouseEvent | KeyboardEvent) {
  if (openColTypeDropdown.value === colId) {
    openColTypeDropdown.value = null
  } else {
    openColTypeDropdown.value = colId
  }
}

function changeColType(col: SpreadsheetColumn, newType: string) {
  if (newType === (columnTypes[col.id] || col.type)) {
    openColTypeDropdown.value = null
    return
  }
  columnTypes[col.id] = newType
  openColTypeDropdown.value = null
  const oldType = col.type
  showSaveStatus('saving')
  changeColumnType(subjectId.value, termId.value, col.label, oldType, newType)
    .then(() => {
      showSaveStatus('saved')
      refreshData(true)
    })
    .catch(() => {
      showSaveStatus('failed')
      columnTypes[col.id] = oldType
    })
}

function getTypeLabel(typeCode: string): string {
  const found = assessments.value.find(at => at.code === typeCode)
  return found?.name || typeCode
}

function onDocumentClick(e: MouseEvent) {
  if (showExportMenu.value && exportBtnRef.value && !exportBtnRef.value.contains(e.target as Node)) {
    showExportMenu.value = false
  }
  if (openColTypeDropdown.value !== null) {
    openColTypeDropdown.value = null
  }
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  if (toastTimer) clearTimeout(toastTimer)
})

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

async function previewFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') {
    await previewPdfFile(file)
    return
  }
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
  }
}

async function previewPdfFile(file: File) {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      fullText += content.items.map((item: any) => item.str).join(' ') + '\n'
    }
    const lines = fullText.split('\n').filter(l => l.trim())
    const dataLines = lines.filter(l => /\d/.test(l) && l.split(/\s+/).length >= 3)
    filePreview.value = {
      rowCount: dataLines.length || lines.length,
      colCount: 0,
      colNames: ['(PDF) Text data — will auto-detect columns on import'],
    }
  } catch {
  }
}
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success', duration = 2500) {
  if (toastTimer) clearTimeout(toastTimer)
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = true
  toastTimer = setTimeout(() => {
    toastVisible.value = false
    toastTimer = null
  }, duration)
}

const toastIcon = computed(() => ({
  success: 'bi bi-check-circle-fill',
  error: 'bi bi-exclamation-circle-fill',
}[toastType.value]))

const newColumn = reactive({ type: 'quiz', label: '', max_score: null as number | null, customTypeName: '' })
const weightEdits = reactive<Record<number, number>>({})
const assessments = ref<AssessmentTypeWeight[]>([])
const studentNumbers = ref<string[]>([])
const columnTypes = reactive<Record<number, string>>({})

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

const maxUndo = 50
const undoStack = ref<Array<{ enrollmentId: number; detailId: number; oldValue: number | null }>>([])
const redoStack = ref<Array<{ enrollmentId: number; detailId: number; oldValue: number | null }>>([])



const columns = computed(() => data.value?.columns || [])
const rows = computed(() => data.value?.rows || [])

const filteredRows = computed(() => {
  let result = rows.value

  if (className.value) {
    result = result.filter(r => r.class_name === className.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r => r.student_name.toLowerCase().includes(q) || r.student_number.toLowerCase().includes(q))
  }

  return result
})

const totalPages = computed(() => {
  if (pageSize.value === 'all') return 1
  return Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value))
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }
  pages.push(1)
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const visibleRows = computed(() => {
  if (pageSize.value === 'all') return filteredRows.value
  const start = (currentPage.value - 1) * (pageSize.value as number)
  const end = start + (pageSize.value as number)
  return filteredRows.value.slice(start, end)
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

const typeOptions = computed(() =>
  assessments.value.map(at => ({ value: at.code, label: at.name }))
)

const totalWeight = computed(() => Object.values(weightEdits).reduce((s, v) => s + Number(v || 0), 0))

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

const showNewTypeForm = ref(false)
const newTypeCode = ref('')
const newTypeName = ref('')
const newTypeWeight = ref(10)

async function doCreateType() {
  const code = newTypeCode.value.trim()
  const name = newTypeName.value.trim()
  if (!code || !name) return
  try {
    await createAssessmentType({ code, name, weight_percent: newTypeWeight.value })
    newTypeCode.value = ''
    newTypeName.value = ''
    newTypeWeight.value = 10
    showNewTypeForm.value = false
    showToast('Assessment type created', 'success')
    await refreshData(true)
  } catch {
    showToast('Failed to create assessment type', 'error')
  }
}

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
    await refreshData(true)
  } catch (err) {
    showSaveStatus('failed')
    console.error('Failed to add rows:', err)
    alert('Error adding students. Check console for details.')
  }
  addRowCount.value = 1
}


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

function onCellMouseDown(event: MouseEvent, rowIdx: number, colId: number) {

  sheetContainer.value?.focus()
  if (editingRow.value !== null) {
    saveEdit()
  }
  if (colId === -2) return // row number click

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

  isRangeSelecting.value = false
  selectionStartRow.value = rowIdx
  selectionStartCol.value = colId
  selectedRowIndex.value = Math.max(0, Math.min(rowIdx, filteredRows.value.length - 1))
  selectedCol.value = colId
  if (colId > 0) {
    if (editingRow.value !== null) cancelEdit()
    startEditing(rowIdx, colId)
  }

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
    updateStudentInfo(subjectId.value, termId.value, filteredRow.enrollment_id, { student_name: newName, email_domain: selectedEmailDomain.value })
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

  const oldValue = getCellMark(filteredRow, detailId)
  const newValue = editValue.value === '' ? null : parseFloat(editValue.value)
  if (newValue !== null) {
    if (isNaN(newValue)) { cancelEdit(); return }
    if (newValue < 0 || newValue > 100) { cancelEdit(); return }
  }

  if (isRangeSelecting.value && newValue !== null) {
    const bounds = getSelectionBounds()
    if (
      bounds &&
      (bounds.r1 !== bounds.r2 || bounds.c1 !== bounds.c2) &&
      editingRow.value >= bounds.r1 && editingRow.value <= bounds.r2
    ) {
      const columnsInSelection = getSelectableColumnIds()
      const colOrder = columnsInSelection.indexOf(detailId)
      if (colOrder >= bounds.c1 && colOrder <= bounds.c2) {
        const value = editValue.value.trim()
        cancelEdit()
        showSaveStatus('saving')
        const promises: Promise<void>[] = []
        for (let r = bounds.r1; r <= bounds.r2; r++) {
          const targetRow = filteredRows.value[r]
          if (!targetRow) continue
          for (let c = bounds.c1; c <= bounds.c2; c++) {
            const targetColId = columnsInSelection[c]
            if (targetColId === undefined) continue
            const p = pasteValueToCell(targetRow, targetColId, value)
            if (p) promises.push(p)
          }
        }
        Promise.all(promises)
          .then(() => showSaveStatus('saved'))
          .catch(() => showSaveStatus('failed'))
        return
      }
    }
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
  nextTick(() => sheetContainer.value?.focus())
}

function computeAutoFillValues(sourceValues: (number | null)[], count: number, direction: 1 | -1 = 1): (number | null)[] {
  if (!sourceValues.length) return Array.from({ length: count }, () => null)
  if (sourceValues.length === 1) return Array.from({ length: count }, () => sourceValues[0] ?? null)

  const numeric = sourceValues.map(v => (v === null ? null : Number(v)))
  const cleanNums = numeric.filter((v): v is number => v !== null && !Number.isNaN(v))

  if (cleanNums.length < 2) {
    const result: (number | null)[] = []
    for (let i = 0; i < count; i++) {
      const srcIdx = i % sourceValues.length
      result.push(sourceValues[srcIdx] ?? null)
    }
    return result
  }

  const step = cleanNums[1] - cleanNums[0]
  let isArithmetic = true
  for (let i = 2; i < cleanNums.length; i++) {
    if (cleanNums[i] - cleanNums[i - 1] !== step) { isArithmetic = false; break }
  }

  if (!isArithmetic) {
    const result: (number | null)[] = []
    for (let i = 0; i < count; i++) {
      const srcIdx = i % sourceValues.length
      result.push(sourceValues[srcIdx] ?? null)
    }
    return result
  }

  const result: (number | null)[] = []
  const edgeValue = direction === 1 ? sourceValues[sourceValues.length - 1] : sourceValues[0]
  const edgeNum = edgeValue !== null ? Number(edgeValue) : null
  if (edgeNum === null || Number.isNaN(edgeNum)) {
    for (let i = 0; i < count; i++) {
      const srcIdx = i % sourceValues.length
      result.push(sourceValues[srcIdx] ?? null)
    }
    return result
  }

  for (let i = 0; i < count; i++) {
    const nextValue = direction === 1 ? edgeNum + step * (i + 1) : edgeNum - step * (i + 1)
    result.push(Math.min(100, Math.max(0, nextValue)))
  }
  return result
}

function onFillHandleMouseDown(e: MouseEvent, rowIdx: number, colId: number) {
  if (editingRow.value !== null) return
  if (colId <= 0) return
  if (!columns.value.length || !filteredRows.value.length) return
  e.preventDefault()
  e.stopPropagation()

  let sourceRow = rowIdx
  const sourcePattern: (number | null)[] = []

  if (isRangeSelecting.value && selectionStartRow.value !== null) {
    const r1 = Math.min(selectionStartRow.value, selectedRowIndex.value)
    const r2 = Math.max(selectionStartRow.value, selectedRowIndex.value)
    if (rowIdx === r2) {
      sourceRow = r1
      for (let r = r1; r <= r2; r++) {
        const mark = getCellMark(filteredRows.value[r], colId)
        sourcePattern.push(mark !== undefined ? mark : null)
      }
    }
  }

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

  let sourcePattern = (fillDrag.value as any).sourcePattern as (number | null)[]
  if (!sourcePattern || sourcePattern.length === 0) {
    const sourceRowObj = filteredRows.value[srcRow]
    sourcePattern = [sourceRowObj ? getCellMark(sourceRowObj, srcColId) : null]
  }

  const patternLen = sourcePattern.length

  if (vertical) {
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
    const fillPromises: Promise<void>[] = []
    targetRows.forEach((r, i) => {
      const targetRow = rows.value.find(tr => tr.enrollment_id === filteredRows.value[r]?.enrollment_id)
      if (!targetRow) return
      const oldValue = targetRow.details[srcColId] ?? null
      const nextValue = values[i] ?? null
      targetRow.details[srcColId] = nextValue
      recalculateRowTotal(targetRow)
      triggerRef(data)
      const actualDetailId = getActualDetailId(targetRow, srcColId)
      fillPromises.push(updateCellMark(subjectId.value, termId.value, actualDetailId, nextValue).catch(() => {
        targetRow.details[srcColId] = oldValue
        recalculateRowTotal(targetRow)
        triggerRef(data)
        showSaveStatus('failed')
        throw new Error('Failed to save fill value')
      }))
    })
    showSaveStatus('saving')
    Promise.all(fillPromises).then(() => showSaveStatus('saved')).catch(() => {})
  } else {
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

    const fillPromises: Promise<void>[] = []
    targetColIndices.forEach((ci, i) => {
      const oldValue = targetRow.details[cols[ci].id] ?? null
      const nextValue = values[i] ?? null
      targetRow.details[cols[ci].id] = nextValue
      recalculateRowTotal(targetRow)
      triggerRef(data)
      const actualDetailId = getActualDetailId(targetRow, cols[ci].id)
      fillPromises.push(updateCellMark(subjectId.value, termId.value, actualDetailId, nextValue).catch(() => {
        targetRow.details[cols[ci].id] = oldValue
        recalculateRowTotal(targetRow)
        triggerRef(data)
        showSaveStatus('failed')
        throw new Error('Failed to save fill value')
      }))
    })
    showSaveStatus('saving')
    Promise.all(fillPromises).then(() => showSaveStatus('saved')).catch(() => {})
  }

  fillPreviewSet.value = new Set()
  isRangeSelecting.value = false
  fillDrag.value = null
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (editingRow.value !== null && editingCol.value !== null) {
    onEditKeydown(event)
    return
  }

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
      case 's':
        event.preventDefault()
        if (editingRow.value !== null) saveEdit()
        showSaveStatus('saved')
        return
      case 'r': event.preventDefault(); return
    }
  }

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
      triggerRef(data)
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
      const row = filteredRows.value[selectedRowIndex.value]
      if (!row) return
      const actualRow = rows.value.find(ar => ar.enrollment_id === row.enrollment_id)
      if (!actualRow) return
      const colId = selectedCol.value
      if (colId <= 0) return
      const oldValue = getCellMark(row, colId)
      if (oldValue === null) return
      actualRow.details[colId] = null
      triggerRef(data) // Immediate feedback — see note on the range branch above.
      undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: colId, oldValue })
      redoStack.value = []
      showSaveStatus('saving')
      const actualDetailId = getActualDetailId(actualRow, colId)
      updateCellMark(subjectId.value, termId.value, actualDetailId, null)
        .then(() => { showSaveStatus('saved'); recalculateRowTotal(actualRow) })
        .catch(() => { showSaveStatus('failed'); actualRow.details[colId] = oldValue; triggerRef(data) })
    }
    return
  }

  if (selectedCol.value !== null && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
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

  if (!shiftKey) {
    isRangeSelecting.value = false
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        expandAllRowsForSelection()
        selectedRowIndex.value = filteredRows.value.length - 1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(selectedRowIndex.value, currentColIdx)
      } else if (currentRow < filteredRows.value.length - 1) {
        const next = currentRow + 1
        if (pageSize.value !== 'all' && next >= ((pageSize.value as number) * currentPage.value)) {
          if (currentPage.value < totalPages.value) {
            currentPage.value++
          }
        }
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
        selectedCol.value = -1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(currentRow, -1)
      } else if (selectedCol.value === 0) {
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
        selectedCol.value = cols.length > 0 ? cols[cols.length - 1].id : null
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(currentRow, cols.length - 1)
      } else if (selectedCol.value === -1) {
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedCol.value = 0
        scrollToCell(currentRow, 0)
      } else if (selectedCol.value === 0) {
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
      {
        const allColIds = getSelectableColumnIds()
        const currentPos = selectedCol.value !== null ? allColIds.indexOf(selectedCol.value) : -1
        if (currentPos < 0) break
        if (event.shiftKey) {
          if (currentPos > 0) {
            selectedCol.value = allColIds[currentPos - 1]
          } else if (currentRow > 0) {
            selectedRowIndex.value = --currentRow
            selectedCol.value = allColIds[allColIds.length - 1]
          }
        } else {
          if (currentPos < allColIds.length - 1) {
            selectedCol.value = allColIds[currentPos + 1]
      } else if (currentRow < filteredRows.value.length - 1) {
        const next = currentRow + 1
        if (pageSize.value !== 'all' && next >= ((pageSize.value as number) * currentPage.value)) {
          if (currentPage.value < totalPages.value) {
            currentPage.value++
          }
        }
        selectedRowIndex.value = next
        selectedCol.value = allColIds[0]
        currentRow = next
          }
        }
        isRangeSelecting.value = false
      }
      scrollToCell(selectedRowIndex.value, selectedCol.value ?? 0)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedCol.value !== null) {
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
        expandAllRowsForSelection()
        if (shiftKey && !isRangeSelecting.value) {
          selectionStartRow.value = currentRow
          selectionStartCol.value = selectedCol.value
          isRangeSelecting.value = true
        }
        selectedRowIndex.value = 0
        selectedCol.value = -1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(0, 0)
      } else {
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
  }
}

function onEditKeydown(event: KeyboardEvent) {
  event.stopPropagation()

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


  if (editingCol.value !== null && editingCol.value <= 0) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      return
    }
  }

  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      saveEdit()
      handleEnterNavigation(event.shiftKey)
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
      if (selectedCol.value !== null) {
        nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
      }
      break
  }
}

function handleTabNavigation(shiftKey: boolean) {
  const allColIds = getSelectableColumnIds()
  const currentPos = selectedCol.value !== null ? allColIds.indexOf(selectedCol.value) : -1
  if (currentPos < 0) return
  if (shiftKey) {
    if (currentPos > 0) {
      selectedCol.value = allColIds[currentPos - 1]
    } else if (selectedRowIndex.value > 0) {
      selectedRowIndex.value--
      selectedCol.value = allColIds[allColIds.length - 1]
    }
  } else {
    if (currentPos < allColIds.length - 1) {
      selectedCol.value = allColIds[currentPos + 1]
    } else if (selectedRowIndex.value < filteredRows.value.length - 1) {
      selectedRowIndex.value++
      selectedCol.value = allColIds[0]
    }
  }
  if (selectedCol.value !== null) {
    nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
  }
}


function handleEnterNavigation(shiftKey: boolean) {
  if (selectedCol.value === null) return
  if (shiftKey) {
    if (selectedRowIndex.value > 0) {
      selectedRowIndex.value--
    }
  } else {
    if (selectedRowIndex.value < filteredRows.value.length - 1) {
      selectedRowIndex.value++
    }
  }
  scrollToCell(selectedRowIndex.value, 0)
  nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
}

function onEditInput() {  }

function scrollToCell(rowIdx: number, colIdx: number) {
  const container = sheetContainer.value?.querySelector('.sheet-scroll')
  if (!container) return
  const rowCells = container.querySelectorAll('tbody tr')
  if (rowCells[rowIdx]) {
    rowCells[rowIdx].scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }
  const targetColId = selectedCol.value
  if (targetColId !== null && targetColId > 0) {
    const targetTd = container.querySelector<HTMLElement>(`td[data-col-id="${targetColId}"]`)
    if (targetTd) {
      targetTd.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
    }
  }
}

function onScroll() {
}

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

  if (isRangeSelecting.value) {
    const bounds = getSelectionBounds()
    if (bounds && (bounds.r1 !== bounds.r2 || bounds.c1 !== bounds.c2)) {
      const columnsInSelection = getSelectableColumnIds()
      const value = text.trim()
      const promises: Promise<void>[] = []
      showSaveStatus('saving')
      for (let r = bounds.r1; r <= bounds.r2; r++) {
        const targetRow = filteredRows.value[r]
        if (!targetRow) continue
        for (let c = bounds.c1; c <= bounds.c2; c++) {
          const targetColId = columnsInSelection[c]
          if (targetColId === undefined) continue
          const p = pasteValueToCell(targetRow, targetColId, value)
          if (p) promises.push(p)
        }
      }
      try {
        await Promise.all(promises)
        showSaveStatus('saved')
      } catch {
        showSaveStatus('failed')
      }
      return
    }
  }

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
    const newName = value
    if (!newName || newName === row.student_name) return
    const oldName = row.student_name
    row.student_name = newName
    const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
    if (actualRow) actualRow.student_name = newName
    return updateStudentInfo(subjectId.value, termId.value, row.enrollment_id, { student_name: newName, email_domain: selectedEmailDomain.value })
      .then(() => {})
      .catch(() => {
        row.student_name = oldName
        if (actualRow) actualRow.student_name = oldName
        throw new Error('Failed to save student name')
      })
  }

  if (colId === 0) {
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

function goBack() { router.push('/scores') }

async function refreshData(silent = false) {
  if (!subjectId.value || !termId.value) return
  if (!silent) loading.value = true
  const prevRow = selectedRowIndex.value
  const prevCol = selectedCol.value
  try {
    data.value = await getSpreadsheetBySubjectAndTerm(subjectId.value, termId.value, true)
    assessments.value = data.value.assessment_types
    assessments.value.forEach(at => { weightEdits[at.id] = Number(at.weight_percent) })
    columns.value.forEach(col => { columnTypes[col.id] = col.type })
    const rowCount = filteredRows.value.length
    selectedRowIndex.value = prevRow < rowCount ? prevRow : Math.max(0, rowCount - 1)
    if (prevCol !== null && columns.value.some(c => c.id === prevCol)) {
      selectedCol.value = prevCol
    } else if (columns.value.length > 0) {
      selectedCol.value = columns.value[0].id
    }
  } catch { showSaveStatus('failed') }
  finally { if (!silent) loading.value = false }
}

function startRenameColumn(col: SpreadsheetColumn) {
  renamingColumn.value = col
  renameValue.value = col.label
  nextTick(() => { (document.querySelector('.modern-input') as HTMLInputElement)?.focus() })
}

async function doRenameColumn() {
  if (!renamingColumn.value || !renameValue.value.trim()) return
  const { id } = renamingColumn.value
  const label = renameValue.value.trim()
  renamingColumn.value = null
  showSaveStatus('saving')
  try {
    await renameColumn(subjectId.value, termId.value, id, label)
    showToast(`Column renamed to "${label}"`, 'success')
    showSaveStatus('saved')
    refreshData(true)
  } catch {
    showSaveStatus('failed')
    showToast('Failed to rename column', 'error')
  }
}

function confirmDeleteColumn(col: SpreadsheetColumn) { deleteConfirm.value = { col, label: col.label } }

async function doDeleteColumn() {
  if (!deleteConfirm.value) return
  const { col, label } = deleteConfirm.value
  deleteConfirm.value = null
  showSaveStatus('saving')
  try {
    await deleteColumn(subjectId.value, termId.value, col.id)
    showToast(`Column "${label}" deleted`, 'success')
    showSaveStatus('saved')
    refreshData(true)
  } catch {
    showSaveStatus('failed')
    showToast('Failed to delete column', 'error')
  }
}

async function doAddColumn() {
  if (!newColumn.label.trim()) return
  showAddColumn.value = false
  const label = newColumn.label.trim()
  const maxScore = newColumn.max_score
  let typeCode = newColumn.type

  // If custom type, create the assessment type first
  if (typeCode === '__custom__') {
    const customName = newColumn.customTypeName.trim()
    if (!customName) {
      showToast('Please enter a custom type name', 'error')
      return
    }
    const customCode = customName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    try {
      await createAssessmentType({ code: customCode, name: customName, weight_percent: 0 })
      typeCode = customCode
      await refreshData(true)
    } catch {
      showAddColumn.value = true
      showToast('Failed to create custom type', 'error')
      return
    }
  }

  const cols = columns.value
  const sameTypeCols = cols.filter(c => c.type === typeCode)
  const orderNumber: number = sameTypeCols.length > 0
    ? Math.max(...sameTypeCols.map(c => c.order_number ?? 0)) + 1
    : cols.length > 0 ? Math.max(...cols.map(c => c.order_number ?? 0)) + 1 : 1

  newColumn.label = ''; newColumn.max_score = null; newColumn.customTypeName = ''; newColumn.type = 'quiz'
  showSaveStatus('saving')
  try {
    await addColumn(subjectId.value, termId.value, { type: typeCode, label, max_score: maxScore, order_number: orderNumber })
    showToast(`Column "${label}" created successfully`, 'success')
    showSaveStatus('saved')
    refreshData(true)
  } catch {
    showSaveStatus('failed')
    showToast('Failed to create column', 'error')
  }
}

async function doAddColumnInline() {
  if (!inlineColName.value.trim()) return
  try {
    await addColumn(subjectId.value, termId.value, { type: inlineColType.value, label: inlineColName.value.trim(), max_score: inlineColMax.value })
    inlineColName.value = ''; inlineColType.value = 'quiz'; inlineColMax.value = 100
    showInlineAddColumn.value = false; showSaveStatus('saved'); refreshData(true)
  } catch { showSaveStatus('failed') }
}

function showContextMenu(event: MouseEvent, rowIdx: number) {
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
    await refreshData(true)
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
    await refreshData(true)
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
    await refreshData(true)
  } catch (err) {
    showSaveStatus('failed')
    console.error('Failed to add row:', err)
    alert('Error: ' + ((err as any)?.response?.data?.message || 'Failed to add new row'))
  }
}

async function doUpdateWeights() {
  if (totalWeight.value !== 100) return
  const weights = assessments.value.map(at => ({ id: at.id, weight_percent: Number(weightEdits[at.id] || 0) }))
  showWeights.value = false
  showSaveStatus('saving')
  try {
    await updateWeights(weights)
    showToast('Weights updated successfully', 'success')
    showSaveStatus('saved')
    refreshData(true)
  } catch {
    showSaveStatus('failed')
    showToast('Failed to update weights', 'error')
  }
}

function openGoogleSheetsDirect() {
  gsLoading.value = true
  gsReconnectNeeded.value = false
  if (gsSheetId.value) {
    openExistingSheet(gsSheetId.value, openLoadingPopup())
    return
  }
  const storedToken = localStorage.getItem("google_access_token")
  if (storedToken) { createAndOpenSheet(storedToken, openLoadingPopup()); return }
  startGoogleAuth()
}

function openLoadingPopup(): Window | null {
  const popup = window.open('', '_blank')
  try {
    popup?.document.write('<title>Google Sheets</title><body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#64748b">Preparing your Google Sheet…</body>')
  } catch {
  }
  return popup
}

function navigatePopupOrOpen(popup: Window | null, url: string) {
  if (popup && !popup.closed) {
    popup.location.href = url
  } else {
    showGoogleSheetLink(url)
  }
}

const gsLinkUrl = ref('')
const showGsLinkModal = ref(false)

function showGoogleSheetLink(url: string) {
  gsLinkUrl.value = url
  showGsLinkModal.value = true
  navigator.clipboard.writeText(url).catch(() => {})
  showToast('Link copied to clipboard! Click Open to view your sheet.', 'success', 4000)
}

function openGsLinkDirectly() {
  window.open(gsLinkUrl.value, '_blank')
  showGsLinkModal.value = false
}

async function openExistingSheet(sheetId: string, popup: Window | null) {
  try {
    navigatePopupOrOpen(popup, `https://docs.google.com/spreadsheets/d/${sheetId}/edit`)
    gsLoading.value = false

    let token = localStorage.getItem("google_access_token")
    if (!token) {
      try {
        const refreshed = await refreshGoogleToken()
        localStorage.setItem("google_access_token", refreshed.access_token)
        token = refreshed.access_token
      } catch {
        gsReconnectNeeded.value = true
        return
      }
    }
    if (token) {
      ;(async () => {
        await pushToGoogleSheet(subjectId.value, termId.value, sheetId, token).catch((err) => {
          console.warn("Could not push latest data to Google Sheet:", err?.response?.data?.message || err?.message)
        })
        await ensureGoogleSheetShared(sheetId, token).catch(() => {})
      })()
    }
  } catch {
  }
}

async function createAndOpenSheet(token: string, popup: Window | null) {
  try {
    const result = await createGoogleSheet(subjectId.value, termId.value, token)
    const storageKey = `gs_sheet_${subjectId.value}_${termId.value}`
    const storageData = { sheet_id: result.spreadsheet_id, created_at: new Date().toISOString() }
    localStorage.setItem(storageKey, JSON.stringify(storageData))
    gsSheetId.value = result.spreadsheet_id
    navigatePopupOrOpen(popup, result.url)
    showSaveStatus("saved", { skipSheetPush: true })
    gsLastSynced.value = new Date().toLocaleTimeString()
    startAutoSync() // Begin polling immediately instead of waiting for the next page load.
    gsLoading.value = false
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 400 || status === 401 || status === 403) {
      console.warn("Google token expired or missing, re-authenticating...")
      localStorage.removeItem("google_access_token")
      popup?.close() // GIS will open its own popup for re-auth; don't leave our blank one hanging.
      startGoogleAuth()
      return
    }
    console.error("Google Sheets error:", err?.response?.data?.message || err?.message || "Failed")
    showSaveStatus("failed")
    popup?.close()
    gsLoading.value = false
  }
}

async function syncFromGoogleSheets() {
  if (gsIsSyncing) return // Prevent concurrent syncs (e.g. visibility + focus firing together)
  gsIsSyncing = true
  try {
    if (sheetPushTimer) {
      clearTimeout(sheetPushTimer)
      sheetPushTimer = null
      await pushCurrentDataToSheet()
    }
    let token = localStorage.getItem("google_access_token")
    
    if (!token) {
      try {
        const refreshed = await refreshGoogleToken()
        localStorage.setItem("google_access_token", refreshed.access_token)
        token = refreshed.access_token
      } catch {
        gsReconnectNeeded.value = true
        stopAutoSync()
        showSaveStatus("failed")
        return
      }
    }

    try {
      const result = await importFromGoogleSheets(
        subjectId.value,
        termId.value,
        gsSheetId.value!,
        token,
        selectedEmailDomain.value
      )
      if (!result.synced) return // Nothing to sync yet (no matching tab / no data rows) — stay quiet.
      await refreshData(true)
      gsLastSynced.value = new Date().toLocaleTimeString()
      gsReconnectNeeded.value = false
      showSaveStatus("saved", { skipSheetPush: true })
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || status === 403) {
        localStorage.removeItem("google_access_token")
        try {
          const refreshed = await refreshGoogleToken()
          localStorage.setItem("google_access_token", refreshed.access_token)
          const retryResult = await importFromGoogleSheets(
            subjectId.value,
            termId.value,
            gsSheetId.value!,
            refreshed.access_token,
            selectedEmailDomain.value
          )
          if (!retryResult.synced) return
          await refreshData(true)
          gsLastSynced.value = new Date().toLocaleTimeString()
          gsReconnectNeeded.value = false
          showSaveStatus("saved", { skipSheetPush: true }) // Pull result — see note above.
          return
        } catch (retryErr: any) {
          gsReconnectNeeded.value = true
          stopAutoSync()
          if (retryErr?.response?.status === 403) {
            forgetStoredSheetId()
            console.warn("This Google account doesn't have access to the linked spreadsheet. Click 'Google Sheets' to create a new one, or reconnect with the account that owns it.")
          } else {
            console.warn("Google token expired. Click 'Reconnect Google' to re-authorize.")
          }
          showSaveStatus("failed")
        }
      } else {
        console.error("Sync from Google Sheets failed:", err?.response?.data?.message || err?.message || "Failed")
        showSaveStatus("failed")
      }
    }
  } finally {
    gsIsSyncing = false
  }
}

function startAutoSync() {
  stopAutoSync()
  document.addEventListener("visibilitychange", onVisibilityChange)
  window.addEventListener("focus", onWindowFocus)
  if (gsSheetId.value && editingRow.value === null) syncFromGoogleSheets()
  gsAutoSyncTimer = setInterval(() => {
    if (!gsSheetId.value || editingRow.value !== null) return // Don't sync while user is editing
    syncFromGoogleSheets()
  }, 8000)
}


function stopAutoSync() {
  document.removeEventListener("visibilitychange", onVisibilityChange)
  window.removeEventListener("focus", onWindowFocus)
  if (gsAutoSyncTimer !== null) {
    clearInterval(gsAutoSyncTimer)
    gsAutoSyncTimer = null
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible" && gsSheetId.value && editingRow.value === null) {
    syncFromGoogleSheets()
  }
}

function onWindowFocus() {
  if (gsSheetId.value && editingRow.value === null) {
    syncFromGoogleSheets()
  }
}

async function loadStoredSheetId() {
  const storageKey = `gs_sheet_${subjectId.value}_${termId.value}`
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const data = JSON.parse(stored)
      gsSheetId.value = data.sheet_id || null
      if (gsSheetId.value) {
        try {
          const status = await getGoogleStatus()
          if (status.connected) {
            startAutoSync()
          } else {
            gsReconnectNeeded.value = true
          }
        } catch {
        }
      }
    }
  } catch {
  }
}

function forgetStoredSheetId() {
  const storageKey = `gs_sheet_${subjectId.value}_${termId.value}`
  localStorage.removeItem(storageKey)
  gsSheetId.value = null
  stopAutoSync()
}

async function startGoogleAuth() {
  try {
    const config = await getGoogleConfig()
    if (!config.client_id) { showSaveStatus("failed"); gsLoading.value = false; return }
    await loadGoogleScript()
    const codeClient = (window as any).google.accounts.oauth2.initCodeClient({
      client_id: config.client_id,
      scope: config.scopes.join(" "),
      ux_mode: "popup",
      callback: async (response: any) => {
        if (response.error || !response.code) { showSaveStatus("failed"); gsLoading.value = false; return }
        try {
          const tokenResult = await exchangeGoogleToken(response.code)
          localStorage.setItem("google_access_token", tokenResult.access_token)
          await createAndOpenSheet(tokenResult.access_token, null)
        } catch (err: any) {
          console.error("Google token exchange failed:", err?.response?.data?.message || err?.message)
          showSaveStatus("failed")
          gsLoading.value = false
        }
      },
      error_callback: () => { showSaveStatus("failed"); gsLoading.value = false },
    })
    codeClient.requestCode()
  } catch (err: any) {
    console.error("Google auth failed:", err)
    showSaveStatus("failed")
    gsLoading.value = false
  }
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) { resolve(); return }
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      setTimeout(() => {
        if ((window as any).google?.accounts?.oauth2) resolve()
        else reject(new Error("Google Identity Services failed to load"))
      }, 200)
    }
    script.onerror = () => reject(new Error("Failed to load Google script"))
    document.head.appendChild(script)
  })
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    pendingFile.value = file
    selectedFileName.value = file.name
    previewFile(file)
  }
  input.value = ''
}

function onFileDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    pendingFile.value = file
    selectedFileName.value = file.name
    dragOver.value = false
    previewFile(file)
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
    } else if (ext === 'pdf') {
      await importPdfFile(file)
    } else {
      throw new Error('Unsupported file format. Please use Excel (.xlsx/.xls) or PDF (.pdf) files only.')
    }
    showSaveStatus('saved')
    pageSize.value = 'all'
    await animateImportProgress(70, 90, 500, 'Refreshing sheet...')
    await refreshData(true)
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

  importStatusText.value = 'Importing scores to server...'
  const animPromise = animateImportProgress(35, 65, 3000, 'Importing scores to server...')
  await importFile(subjectId.value, termId.value, { rows, email_domain: selectedEmailDomain.value }, classId.value)
  importProgress.value = 70
}

function parseTabularData(jsonData: (string | number)[][]): Array<{
  student_name: string
  student_number?: string
  marks?: Record<string, number>
}> {
  if (jsonData.length < 2) throw new Error('Data must have at least a header and one row')

  const header = jsonData[0].map(c => String(c).trim())
  let nameIdx = header.findIndex(h => /name|student/i.test(h))
  let idIdx = header.findIndex(h => /id|number|code|no/i.test(h) && !/name/i.test(h))
  if (nameIdx < 0) nameIdx = 0  // Default: first column is name
  if (idIdx < 0 || idIdx === nameIdx) idIdx = -1  // No ID column

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
  
  const header = ['Student Name', 'Student ID']
  cols.forEach(c => header.push(`${c.label} (${c.type})`))
  header.push('Total', 'Grade')
  
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
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ])
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  if (typeof (doc as any).autoTable !== 'function' && autoTableModule && typeof autoTableModule.default === 'function') {
    const autoTablePlugin = autoTableModule.default
    ;(doc as any).autoTable = (opts: any) => autoTablePlugin(doc, opts)
  }
  const cols = columns.value
  
  doc.setFontSize(14)
  doc.text(`${data.value.subject?.name || 'Scores'} - ${data.value.term?.name || ''}`, 14, 15)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 21)
  
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

function showSaveStatus(status: 'saving' | 'saved' | 'failed', opts: { skipSheetPush?: boolean } = {}) {
  saveStatus.value = status
  if (status !== 'saving') setTimeout(() => { if (saveStatus.value === status) saveStatus.value = 'idle' }, 3000)
  if (status === 'saved' && !opts.skipSheetPush) scheduleSheetPush()
}

let sheetPushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSheetPush() {
  if (!gsSheetId.value) return // No linked sheet for this subject/term — nothing to push to.
  if (sheetPushTimer) clearTimeout(sheetPushTimer)
  sheetPushTimer = setTimeout(() => { pushCurrentDataToSheet() }, 2500)
}

function cancelScheduledSheetPush() {
  if (sheetPushTimer) {
    clearTimeout(sheetPushTimer)
    sheetPushTimer = null
  }
}

async function pushCurrentDataToSheet() {
  sheetPushTimer = null
  if (!gsSheetId.value) return

  let token = localStorage.getItem("google_access_token")
  if (!token) {
    try {
      const refreshed = await refreshGoogleToken()
      localStorage.setItem("google_access_token", refreshed.access_token)
      token = refreshed.access_token
    } catch {
      return
    }
  }

  try {
    await pushToGoogleSheet(subjectId.value, termId.value, gsSheetId.value, token)
  } catch (err: any) {
    console.warn("Could not push edit to Google Sheet:", err?.response?.data?.message || err?.message)
  }
}

function animateImportProgress(from: number, to: number, duration: number, statusText: string): Promise<void> {
  return new Promise(resolve => {
    importStatusText.value = statusText
    const startTime = performance.now()
    function tick(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const newValue = from + (to - from) * t
      if (newValue > importProgress.value) {
        importProgress.value = newValue
      }
      if (t < 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}

function onColumnTypeChange(col: SpreadsheetColumn, event: Event) {
  const newType = (event.target as HTMLSelectElement).value
  if (newType === col.type) return
  const oldType = col.type
  showSaveStatus('saving')
  changeColumnType(subjectId.value, termId.value, col.label, oldType, newType)
    .then(() => {
      showSaveStatus('saved')
      refreshData(true)
    })
    .catch(() => {
      showSaveStatus('failed')
      columnTypes[col.id] = oldType // revert
    })
}

function refocusSheet() {
  if (showKeyboardShortcuts.value || showAddColumn.value || showWeights.value || showImport.value || showAddRowPopup.value) return
  if (editingRow.value !== null) return
  const container = sheetContainer.value
  if (container && document.activeElement !== container) {
    container.focus()
  }
}

onMounted(() => {
  refreshData()
  loadStoredSheetId()
  loadStudentEmailDomains()
  getStudentNumbers().then(nums => { studentNumbers.value = nums }).catch(() => {})
})

watch([data, columns], () => {
  if (data.value && columns.value.length > 0 && filteredRows.value.length > 0 && selectedCol.value === null) {
    selectedCol.value = columns.value[0].id
    selectedRowIndex.value = 0
    nextTick(() => {
      const container = sheetContainer.value
      if (container) container.focus()
    })
  }
})

onUnmounted(() => {
  stopAutoSync()
  cancelScheduledSheetPush()
  gsSheetId.value = null
})

watch(searchQuery, () => {
  currentPage.value = 1
})

watch([subjectId, termId], () => {
  if (!subjectId.value || !termId.value) return
  refreshData()
  stopAutoSync()
  cancelScheduledSheetPush()
  gsSheetId.value = null
  gsReconnectNeeded.value = false
  loadStoredSheetId()
})
</script>

<style scoped>

.score-sheet {
  position: relative;
  font-family: 'Inter', 'Segoe UI', 'Noto Sans Khmer', sans-serif;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 96px);
  min-height: 0;
  color: #1e293b;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.sheet-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
  flex-wrap: wrap;
  border-radius: 16px 16px 0 0;
}
.toolbar-spacer { flex: 0; }
.toolbar-actions { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; }
.offering-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  font-size: 0.78rem;
  color: #334155;
  white-space: nowrap;
  min-height: 32px;
}
.offering-item {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  color: #475569;
}
.offering-item-main {
  font-weight: 700;
  color: #0f172a;
}
.offering-item-badge {
  padding: 2px 8px;
  border-radius: 5px;
  font-weight: 600;
  font-size: 0.72rem;
}
.offering-item-badge.offering-term {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.offering-item-badge.offering-class {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}
.offering-item-teachers {
  color: #64748b;
  font-size: 0.72rem;
}

.tb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border: 1px solid #e2e8f0; background: #fff;
  border-radius: 8px; cursor: pointer; font-size: 0.78rem;
  color: #475569; transition: all 0.2s; white-space: nowrap;
  font-family: inherit; font-weight: 500;
}
.tb-btn:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
.tb-btn:active { transform: translateY(0); box-shadow: none; }
.tb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.tb-btn span { display: inline; }
.kb-btn { font-size: 0.85rem; color: #64748b; padding: 6px 10px; }
.kb-btn:hover { color: #2563eb; background: #eff6ff; border-color: #93c5fd; }

.gs-icon {
  flex-shrink: 0;
}
.btn-group { display: flex; gap: 6px; flex-wrap: wrap; }

.toolbar-meta { display: flex; align-items: center; gap: 8px; font-size: 0.7rem; white-space: nowrap; padding-right: 4px; }
.gs-sync-status { display: flex; align-items: center; gap: 4px; color: #16a34a; padding: 2px 8px; background: #f0fdf4; border-radius: 4px; }
.gs-sync-pending { color: #f59e0b; background: #fefce8; }
.gs-reconnect-needed { color: #ea580c; background: #fff7ed; cursor: pointer; transition: background 0.15s; }
.gs-reconnect-needed:hover { background: #ffedd5; }
.gs-reconnect-link { color: #ea580c; text-decoration: underline; cursor: pointer; }
.gs-reconnect-link:hover { color: #c2410c; }
.save-status { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 500; white-space: nowrap; padding: 3px 8px; border-radius: 6px; }
.status-saving { color: #f59e0b; }
.status-saved { color: #10b981; }
.status-failed { color: #ef4444; }
.status-idle { color: #94a3b8; }

.stats-bar { display: flex; gap: 20px; padding: 10px 16px; background: #f8fafc; border-bottom: 1px solid #e9ecef; flex-shrink: 0; flex-wrap: wrap; }
.stat-item { display: flex; gap: 6px; font-size: 0.78rem; align-items: center; }
.stat-label { color: #64748b; font-weight: 500; }
.stat-value { font-weight: 700; color: #0f172a; }


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

.sheet-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
.sheet-scroll::-webkit-scrollbar-track { background: transparent; }
.sheet-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.sheet-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }


.sheet-table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  font-size: 0.8rem;
}

.sheet-table thead { position: sticky; top: 0; z-index: 50; }

.cell-header {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 4px 3px;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #475569;
  position: sticky;
  top: 0;
  z-index: 50;
  text-align: left;
  white-space: nowrap;
  min-width: 80px;
  user-select: none;
}


.cell-frozen { position: sticky; z-index: 20; background: #fff; }

.row-num-header, .row-num { left: 0; width: 36px; min-width: 36px; max-width: 36px; text-align: center; z-index: 30; }
.student-name-header, .cell-student-name { left: 36px; min-width: 160px; z-index: 25; }
.student-id-header, .cell-student-id { left: 196px; min-width: 120px; z-index: 25; }


.row-num-header { z-index: 50; }
.student-name-header { z-index: 50; }
.student-id-header { z-index: 50; }


.header-highlighted {
  background: #d4edda !important; 
  border-color: #6cc47c !important;
  color: #155724 !important;
}

.row-num-highlighted {
  background: #c3e6cb !important;
  border-color: #6cc47c !important;
  color: #155724 !important;
  font-weight: 700 !important;
}


.header-content { display: flex; align-items: center; gap: 4px; }
.column-header-content { flex-direction: column; align-items: stretch; gap: 1px; }

.column-label-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
}

.column-label { overflow: hidden; text-overflow: ellipsis; cursor: pointer; font-size: 0.68rem; flex: 1; min-width: 0; text-align: left; }

.column-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
  flex-shrink: 0;
}
.cell-header:hover .column-actions {
  opacity: 1;
  pointer-events: auto;
}

.col-action-btn {
  background: none; border: none; padding: 3px 5px; cursor: pointer; font-size: 0.65rem;
  color: #64748b; border-radius: 4px; display: inline-flex; align-items: center;
  justify-content: center; opacity: 0.7; transition: all 0.15s ease; line-height: 1;
}
.col-action-btn:hover { background: #e2e8f0; opacity: 1; }
.col-action-delete:hover { color: #ef4444 !important; background: #fef2f2; }

.max-score-label { font-size: 0.5rem; color: #94a3b8; font-weight: 400; line-height: 1; }


.col-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.55rem;
  font-weight: 500;
  padding: 2px 6px 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  user-select: none;
  transition: all 0.15s ease;
  line-height: 1.4;
  align-self: flex-start;
  width: fit-content;
  max-width: 100%;
}
.col-type-badge:hover {
  opacity: 0.85;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.col-type-badge:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
.col-type-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 65px;
}
.col-type-chevron {
  flex-shrink: 0;
  opacity: 0.6;
  transition: transform 0.15s;
}
.col-type-badge:hover .col-type-chevron {
  opacity: 1;
}

.col-type-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  min-width: 130px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 4px;
  margin-top: 4px;
}
.col-type-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  color: #334155;
  transition: background 0.1s;
}
.col-type-option:hover {
  background: #f1f5f9;
}
.col-type-option.active {
  font-weight: 600;
  color: #0f172a;
}
.col-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.col-type-check {
  margin-left: auto;
  font-size: 0.6rem;
  color: #22c55e;
}

/* Type badge colors */
.col-type-quiz.col-type-badge,
.col-type-quiz .col-type-dot { background: #dbeafe; color: #2563eb; }
.col-type-quiz .col-type-dropdown .col-type-dot { background: #2563eb; }
.col-type-assignment.col-type-badge,
.col-type-assignment .col-type-dot { background: #dcfce7; color: #16a34a; }
.col-type-assignment .col-type-dropdown .col-type-dot { background: #16a34a; }
.col-type-project.col-type-badge,
.col-type-project .col-type-dot { background: #fef3c7; color: #d97706; }
.col-type-project .col-type-dropdown .col-type-dot { background: #d97706; }
.col-type-midterm.col-type-badge,
.col-type-midterm .col-type-dot { background: #ede9fe; color: #7c3aed; }
.col-type-midterm .col-type-dropdown .col-type-dot { background: #7c3aed; }
.col-type-final.col-type-badge,
.col-type-final .col-type-dot { background: #fee2e2; color: #dc2626; }
.col-type-final .col-type-dropdown .col-type-dot { background: #dc2626; }
.col-type-participation.col-type-badge,
.col-type-participation .col-type-dot { background: #ffe4e6; color: #e11d48; }
.col-type-participation .col-type-dropdown .col-type-dot { background: #e11d48; }
.cell-total, .cell-grade { background: #fafafa; }
.cell-total.cell-header, .cell-grade.cell-header { background: #e2e8f0; }


.cell {
  border: 1px solid #e2e8f0;
  padding: 3px 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  cursor: pointer;
  height: 32px;
  vertical-align: middle;
  transition: background 0.05s;
  overflow: hidden;
}.cell-score {
  min-width: 140px;
  max-width: 140px;
  width: 140px;
  text-align: center;
  position: relative;
}
.cell-score .cell-editing {
  z-index: 5;
}
.cell:hover { background: #f8fafc; }


.cell-selected {
  outline: 2px solid #16a34a !important; 
  outline-offset: -1px;
  background: #e8f5e9 !important;
  z-index: 5;
}

.cell-frozen.cell-selected {
  position: sticky;
}

.cell-score.cell-selected {
  position: relative;
}


.cell-in-range {
  background: #e8f5e9 !important;
  border-top-color: #a5d6a7 !important;
  border-bottom-color: #a5d6a7 !important;
  border-left-color: #a5d6a7 !important;
  border-right-color: #a5d6a7 !important;
}


.cell-editing {
  outline: 2px solid #16a34a !important;
  outline-offset: -1px;
  background: #e8f5e9 !important;
  z-index: 5;
  padding: 0 !important;
}

.cell-frozen.cell-editing {
  position: sticky;
}

.cell-score.cell-editing {
  position: relative;
}


.cell-excellent { background: #dcfce7 !important; color: #16a34a; font-weight: 600; }
.cell-average { background: #fef9c3 !important; color: #b45309; }
.cell-low { background: #fee2e2 !important; color: #dc2626; }


.cell-editor-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
  max-width: 100%;
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
  max-width: 100%;
  line-height: 1;
}


.cell-student-name {
  min-width: 160px;
  max-width: 160px;
  width: 160px;
}

.cell-student-name .cell-value {
  padding: 3px 14px 3px 6px;
}
.cell-student-name .cell-editor-wrapper .cell-editor {
  text-align: left;
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
  padding: 3px 14px 3px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
}


.student-name-cell-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.cell-student-id {
  min-width: 120px;
  max-width: 120px;
  width: 120px;
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
  padding: 3px 18px 3px 6px;
  letter-spacing: 0.02em;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  box-sizing: border-box;
}


.cell-value {
  display: block;
  padding: 3px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}


.cell-value-hidden { visibility: hidden; }


.cell-editor-overlay {
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
}
.cell-editor-overlay-frozen {
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
}


.row-even .cell { background-color: #fafafa; }
.row-selected .cell { background-color: #f0fff4; }
.row-selected .cell.frozen { background-color: #e8f5e9; }


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


.grade-a { color: #16a34a !important; font-weight: 700 !important; }
.grade-b-plus { color: #2563eb !important; font-weight: 700 !important; }
.grade-b { color: #2563eb !important; font-weight: 700 !important; }
.grade-c-plus { color: #b45309 !important; font-weight: 700 !important; }
.grade-c { color: #b45309 !important; font-weight: 700 !important; }
.grade-d { color: #9333ea !important; font-weight: 700 !important; }
.grade-f { color: #dc2626 !important; font-weight: 700 !important; }
.grade-none { color: #94a3b8 !important; }


.loading-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%);
  background-size: 200% 100%;
  animation: loading-bar 1.2s ease-in-out infinite;
  z-index: 200;
  border-radius: 0 0 2px 2px;
}
@keyframes loading-bar {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.spinning { animation: spin 0.7s linear infinite; }

.loading-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(2px);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 14px;
  z-index: 500;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}


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


.modal-md-panel {
  width: 520px;
}

.modal-content-panel::-webkit-scrollbar { width: 4px; }
.modal-content-panel::-webkit-scrollbar-track { background: transparent; }
.modal-content-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }


.weight-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  margin-bottom: 8px;
  transition: border-color 0.15s ease;
}

.weight-row:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.weight-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.weight-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: #0f172a;
}

.weight-code {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.weight-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.weight-input-group .weight-input-field {
  width: 80px;
  text-align: center;
  padding: 0.5rem 0.5rem;
  font-weight: 600;
}

.weight-suffix {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  min-width: 16px;
}

.no-assessments-text {
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  padding: 20px 0;
}

.weight-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 14px 0;
}

.new-type-section {
  margin-bottom: 6px;
}

.new-type-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s;
}

.new-type-header:hover {
  color: #1d4ed8;
}

.new-type-form {
  margin-top: 8px;
}

.new-type-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.new-type-field {
  flex: 1;
  min-width: 0;
}

.new-type-field-sm {
  flex: 0 0 80px;
}

.new-type-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 3px;
}

.new-type-action {
  flex-shrink: 0;
}

.new-type-action .btn-primary-custom.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
  min-width: auto;
}

.weight-total-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-top: 4px;
}

.weight-total-bar i {
  font-size: 1rem;
  flex-shrink: 0;
}

.weight-total-bar.weight-ok {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.weight-total-bar.weight-warn {
  background: #fefce8;
  color: #a16207;
  border: 1px solid #fde68a;
}

.weight-hint {
  font-size: 0.75rem;
  color: #a16207;
}

.delete-warning-text {
  text-align: center;
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
  margin: 8px 0;
}

.delete-warning-text strong {
  color: #0f172a;
  font-weight: 700;
}


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




/* === Import Scores Modal === */
.import-modal {
  background: #fff;
  border-radius: 16px;
  width: 520px;
  max-width: 94vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,.25);
}
.import-modal-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 24px 24px 0;
}
.import-modal-head h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}
.import-modal-head p {
  margin: 3px 0 0;
  font-size: 0.8rem;
  color: #64748b;
}
.import-modal-close {
  width: 32px;
  height: 32px;
  margin-left: auto;
  margin-top: -2px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.import-modal-close:hover {
  background: #e2e8f0;
  color: #1e293b;
}
.import-modal-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  flex-shrink: 0;
}
.import-modal-body {
  padding: 20px 24px;
}
.import-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 4px 24px 20px;
}

/* Format badges */
.import-formats {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}
.import-format {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}
.import-format-excel {
  background: #ecfdf5;
  color: #059669;
}
.import-format-pdf {
  background: #fef2f2;
  color: #dc2626;
}

/* Drop zone */
.import-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 36px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafbfc;
}
.import-zone:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}
.import-zone-over {
  border-color: #2563eb;
  background: #dbeafe;
  transform: scale(1.015);
}
.import-zone-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #2563eb;
  box-shadow: 0 4px 12px rgba(37,99,235,0.1);
}
.import-zone-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.import-zone-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
}
.import-zone-sub {
  font-size: 0.78rem;
  color: #94a3b8;
}

/* Uploaded file card */
.import-file {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.import-file-accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #059669, #10b981);
  border-radius: 12px 0 0 12px;
}
.import-file-main {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 14px 20px;
  background: #f8fafc;
}
.import-file-type-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #2563eb;
  flex-shrink: 0;
}
.import-file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.import-file-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.import-file-size {
  font-size: 0.72rem;
  color: #94a3b8;
}
.import-file-remove {
  width: 30px;
  height: 30px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
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

/* Preview section */
.import-preview {
  padding: 0 16px 14px;
  border-top: 1px solid #e2e8f0;
}
.import-preview-stats {
  display: flex;
  gap: 8px;
  padding-top: 14px;
}
.import-preview-stat {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
}
.import-preview-stat:hover {
  border-color: #dbeafe;
  background: #fafdff;
}
.import-preview-stat-wide {
  flex: 2;
}
.import-preview-stat-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  margin-bottom: 2px;
}
.import-icon-students {
  background: #ecfdf5;
  color: #059669;
}
.import-icon-columns {
  background: #eff6ff;
  color: #3b82f6;
}
.import-icon-cols {
  background: #fef3c7;
  color: #d97706;
}
.import-preview-num {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}
.import-preview-label {
  font-size: 0.65rem;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.import-preview-cols {
  font-size: 0.7rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
  display: inline-block;
}

/* Domain picker group */
.import-domain-group {
  margin-top: 16px;
  padding: 0 16px 16px;
}
.import-domain {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background: #f0f5ff;
  border: 1px solid #dbeafe;
  border-radius: 10px;
}
.import-domain-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e40af;
}
.import-domain-info i {
  font-size: 0.9rem;
}
.import-domain-select {
  border: 1px solid #bfdbfe;
  background: #fff;
  border-radius: 8px;
  padding: 5px 28px 5px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e3a8a;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='%2364748b'%3E%3Cpath d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  min-width: 130px;
}
.import-domain-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}
.select-warn {
  border-color: #f59e0b;
}
.import-domain-required {
  border-color: #f59e0b;
  background: #fffbeb;
}
.import-domain-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 0.75rem;
  padding: 0 4px;
}
.import-domain-hint-warn {
  color: #b45309;
}
.import-domain-hint-warn i {
  font-size: 0.8rem;
}

/* Single domain info bar */
.import-domain-info-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin: 14px 16px 16px;
  background: #f0f5ff;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #1e40af;
}
.import-domain-info-bar i {
  font-size: 0.9rem;
}
.import-domain-info-bar strong {
  font-weight: 700;
}

/* Action buttons */
.import-btn-secondary {
  padding: 9px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  background: #f1f5f9;
  color: #475569;
}
.import-btn-secondary:hover {
  background: #e2e8f0;
}
.import-btn-primary {
  padding: 9px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #059669;
  color: #fff;
  box-shadow: 0 2px 8px rgba(5,150,105,0.25);
}
.import-btn-primary:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(5,150,105,0.35);
}
.import-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ────── Mobile Responsive ────────────────────────────────── */

@media (max-width: 991.98px) {
  .offering-item-teachers { display: none; }
  .save-status .status-text { display: none; }
}

@media (max-width: 768px) {
  .score-sheet {
    height: calc(100vh - 80px);
  }

  .sheet-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px 12px;
  }

  .offering-info {
    flex-wrap: wrap;
    min-width: 0;
    padding: 4px 8px;
    font-size: 0.72rem;
    gap: 4px;
    min-height: 28px;
  }

  .offering-item-main {
    font-size: 0.78rem;
  }

  .offering-item-badge {
    font-size: 0.68rem;
  }

  .toolbar-actions {
    width: 100%;
    flex-direction: column;
    gap: 6px;
  }

  .toolbar-actions .search-box {
    width: 100% !important;
    max-width: 100% !important;
  }

  .search-box input {
    font-size: 0.9rem;
    height: 40px;
  }

  .btn-group {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
  }

  .btn-group .tb-btn {
    justify-content: center;
    padding: 8px 6px;
    height: 40px;
    font-size: 0.72rem;
    gap: 4px;
    width: 100%;
  }

  .btn-group .tb-btn span {
    display: inline;
    font-size: 0.68rem;
  }

  .export-dropdown {
    grid-column: span 1;
  }

  .export-dropdown .tb-btn {
    width: 100%;
  }

  .export-menu {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: 16px 16px 0 0;
    width: 100%;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
    z-index: 9999;
    padding: 12px;
    padding-bottom: env(safe-area-inset-bottom, 12px);
  }

  .export-menu .export-menu-item {
    padding: 12px 14px;
    font-size: 0.9rem;
    justify-content: center;
  }

  .stats-bar {
    gap: 8px;
    padding: 6px 12px;
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
  }

  .stat-item {
    font-size: 0.72rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .stat-item .stat-value {
    font-size: 0.78rem;
  }

  .modal-content-panel {
    max-width: calc(100% - 16px) !important;
    margin: 0 8px;
    border-radius: 14px;
  }

  .modal-sm-panel {
    width: 100%;
    max-width: calc(100% - 16px) !important;
  }

  .modal-md-panel {
    width: 100%;
    max-width: calc(100% - 16px) !important;
  }

  .import-modal {
    max-width: calc(100% - 16px);
    border-radius: 14px;
  }

  .import-zone {
    padding: 20px 12px;
  }

  .import-modal-head {
    padding: 16px 14px 0;
    gap: 10px;
  }

  .import-modal-body {
    padding: 12px 14px 10px;
  }

  .import-modal-foot {
    padding: 10px 14px 16px;
    flex-direction: column;
    gap: 8px;
  }

  .import-modal-foot button {
    width: 100%;
    justify-content: center;
  }

  .pagination-bar {
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
  }

  .pagination-info {
    width: 100%;
    justify-content: center;
  }

  .shortcuts-modal {
    max-width: calc(100% - 16px);
    margin: 0 8px;
  }
}

@media (max-width: 480px) {
  .score-sheet {
    height: calc(100vh - 64px);
    border-radius: 12px;
  }

  .sheet-toolbar {
    padding: 6px 8px;
    gap: 5px;
    font-size: 0.72rem;
  }

  .offering-info {
    padding: 3px 6px;
    font-size: 0.65rem;
    gap: 3px;
    min-height: 22px;
  }

  .offering-item-main {
    font-size: 0.72rem;
  }

  .offering-item-badge {
    font-size: 0.62rem;
    padding: 1px 4px;
  }

  .btn-group {
    grid-template-columns: 1fr 1fr;
    gap: 3px;
  }

  .btn-group .tb-btn {
    padding: 5px 4px;
    height: 36px;
    font-size: 0.68rem;
    gap: 2px;
    border-radius: 6px;
  }

  .btn-group .tb-btn span {
    font-size: 0.62rem;
  }

  .tb-btn svg,
  .tb-btn i {
    font-size: 0.8rem;
  }

  .stats-bar {
    gap: 4px;
    padding: 4px 8px;
  }

  .stat-item {
    font-size: 0.65rem;
  }

  .stat-item:nth-child(n+5) {
    display: none;
  }

  .toolbar-spacer {
    display: none;
  }

  .gs-sync-status {
    width: 100%;
    justify-content: center;
  }

  .pagination-bar {
    padding: 4px 8px;
    gap: 5px;
  }

  .pagination-pages {
    gap: 1px;
  }

  .page-btn {
    min-width: 24px;
    height: 24px;
    font-size: 0.68rem;
  }

  .page-nav {
    width: 24px;
    height: 24px;
  }

  .modal-content-panel,
  .modal-sm-panel,
  .modal-md-panel {
    max-width: calc(100% - 8px) !important;
  }

  .modal-content-panel {
    margin: 0 4px;
    border-radius: 12px;
  }

  .modal-header-custom {
    padding: 12px 10px 0;
    gap: 8px;
  }

  .modal-header-custom h5 {
    font-size: 0.9rem;
  }

  .modal-body-custom {
    padding: 8px 10px;
  }

  .modal-footer-custom {
    padding: 6px 10px 12px;
    gap: 6px;
  }

  .modal-footer-custom button {
    flex: 1;
    justify-content: center;
    font-size: 0.8rem;
    padding: 8px 12px;
  }

  .import-modal {
    max-width: calc(100% - 8px);
    margin: 0 4px;
  }

  .import-modal-head {
    padding: 12px 10px 0;
  }

  .import-modal-head h3 {
    font-size: 0.9rem;
  }

  .import-modal-head p {
    font-size: 0.75rem;
  }

  .import-modal-body {
    padding: 10px 10px;
  }

  .import-modal-foot {
    padding: 8px 10px 12px;
  }
}

.pagination-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 20px; border-top: 1px solid #e5e7eb;
  background: #f8fafc; font-family: 'Inter','Noto Sans Khmer',sans-serif;
  font-size: 0.8125rem; gap: 12px; flex-wrap: wrap;
  flex-shrink: 0;
  margin-top: auto;
}
.pagination-info { display: flex; align-items: center; gap: 8px; color: #64748b; }
.rows-label { font-weight: 500; white-space: nowrap; }
.rows-selector { display: flex; gap: 2px; background: #f1f5f9; border-radius: 8px; padding: 2px; }
.rows-btn {
  padding: 4px 10px; border: none; background: transparent;
  color: #64748b; border-radius: 6px; cursor: pointer;
  font-size: 0.75rem; font-weight: 600; font-family: inherit;
  transition: all 0.15s ease;
}
.rows-btn:hover { color: #334155; }
.rows-btn.active { background: #fff; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.pagination-pages { display: flex; align-items: center; gap: 2px; }
.page-nav {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b;
  border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
}
.page-nav:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #f0f5ff; }
.page-nav:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn {
  min-width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: #475569;
  border-radius: 6px; cursor: pointer; font-size: 0.78rem;
  font-weight: 500; font-family: inherit; transition: all 0.15s ease;
}
.page-btn:hover:not(.active) { background: #f1f5f9; color: #2563eb; }
.page-btn.active { background: #2563eb; color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }
.page-dots { width: 24px; text-align: center; color: #94a3b8; font-size: 0.875rem; letter-spacing: 1px; }
.pagination-total { color: #64748b; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }

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


.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 99999;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  pointer-events: none;
  animation: toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-notification i {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.toast-notification.success {
  background: #ecfdf5;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.toast-notification.success i {
  color: #22c55e;
}

.toast-notification.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.toast-notification.error i {
  color: #ef4444;
}

@keyframes toastSlideIn {
  0% {
    transform: translateX(40px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>