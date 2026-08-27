<template>
  <div class="max-w-5xl">
    <NuxtLink
      :to="queryJobId ? localePath(`/portal/jobs/${queryJobId}`) : localePath('/portal/jobs')"
      class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
    >
      ← {{ queryJobId ? $t('portal.tools.backToJob') : $t('portal.nav.jobs') }}
    </NuxtLink>
    <h1 class="mt-3 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.tools.po.title') }}</h1>
    <p class="mt-2 text-sm text-bone-400 max-w-2xl">{{ $t('portal.tools.po.intro') }}</p>

    <p v-if="error" class="mt-6 text-sm text-signal-500">{{ error }}</p>

    <!-- No access -->
    <p v-if="loaded && !jobs.length" class="mt-8 text-sm text-bone-500">{{ $t('portal.tools.po.noJobs') }}</p>

    <template v-if="currentJob">
      <!-- Job picker -->
      <div class="mt-8 flex flex-wrap items-end gap-4">
        <label class="block">
          <span class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.job') }}</span>
          <select v-model="selectedJobId" class="input-dark mt-1 min-w-56">
            <option v-for="j in jobs" :key="j.jobId" :value="j.jobId">{{ j.jobName }} · {{ j.companyName }}</option>
          </select>
        </label>
        <p class="pb-2 text-xs text-bone-500">{{ scopeText }}</p>
      </div>

      <!-- Focused views: switch between create / overview / approve -->
      <div class="mt-6 flex flex-wrap gap-1 border-b border-ink-800">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="localePath({ path: '/portal/tools/purchase-orders', query: { ...(selectedJobId ? { job: selectedJobId } : {}), focus: tab.key } })"
          class="-mb-px border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors"
          :class="view === tab.key ? 'border-gold-500 text-gold-400' : 'border-transparent text-bone-500 hover:text-bone-300'"
        >
          {{ $t(tab.label) }}
          <span
            v-if="tab.key === 'approve' && pendingCount"
            class="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold leading-none text-ink-950"
          >{{ pendingCount }}</span>
        </NuxtLink>
      </div>

      <!-- Dim the data regions while another job's orders load. -->
      <div class="transition-opacity" :class="loadingOrders ? 'pointer-events-none opacity-60' : ''">

      <template v-if="showOverview">
      <!-- Cost report export -->
      <div v-if="list?.orders.length" class="mt-6 flex flex-wrap items-center justify-end gap-4">
        <span class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.report.export') }}:</span>
        <button
          type="button"
          class="text-xs font-semibold uppercase tracking-widest text-gold-400 transition-colors hover:text-gold-300 disabled:opacity-50"
          :disabled="exporting"
          @click="exportReportPdf"
        >PDF</button>
        <button
          type="button"
          class="text-xs font-semibold uppercase tracking-widest text-gold-400 transition-colors hover:text-gold-300 disabled:opacity-50"
          :disabled="exporting"
          @click="exportReportCsv"
        >CSV</button>
      </div>

      <!-- Totals -->
      <div class="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="border border-ink-800 bg-ink-900/50 p-4">
          <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.status.pending') }}</p>
          <p class="mt-1 text-xl font-semibold text-gold-400">{{ formatIsk(totals.pending, locale) }}</p>
        </div>
        <div class="border border-ink-800 bg-ink-900/50 p-4">
          <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.unpaidShort') }}</p>
          <p class="mt-1 text-xl font-semibold text-emerald-400">{{ formatIsk(totals.unpaid, locale) }}</p>
        </div>
        <div class="border border-ink-800 bg-ink-900/50 p-4">
          <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.paid') }}</p>
          <p class="mt-1 text-xl font-semibold text-sky-400">{{ formatIsk(totals.paid, locale) }}</p>
        </div>
        <!-- The job's total frame is the admin's view; dept heads only see
             per-code usage inside their own scope (the by-code table). -->
        <div v-if="totalBudget && list?.viewAll" class="border border-ink-800 bg-ink-900/50 p-4">
          <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.totalBudget') }}</p>
          <p class="mt-1 text-xl font-semibold text-bone-100">{{ formatIsk(totalBudget, locale) }}</p>
          <div class="mt-2 flex items-center gap-2">
            <div class="h-2 flex-1 bg-ink-800">
              <div
                class="h-2"
                :class="budgetPct > 100 ? 'bg-signal-500' : budgetPct > 85 ? 'bg-gold-500' : 'bg-emerald-500/80'"
                :style="{ width: `${Math.min(100, budgetPct)}%` }"
              />
            </div>
            <span class="shrink-0 text-xs" :class="budgetPct > 100 ? 'font-semibold text-signal-500' : 'text-bone-400'">{{ budgetPct }}%</span>
          </div>
          <p class="mt-1 text-xs" :class="budgetPct > 100 ? 'font-semibold text-signal-500' : 'text-bone-500'">
            {{ $t('portal.tools.po.budgetUsed', { spent: formatIsk(budgetedSpend, locale), pct: budgetPct }) }}
          </p>
        </div>
        <div v-else class="border border-ink-800 bg-ink-900/50 p-4">
          <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.orderCount') }}</p>
          <p class="mt-1 text-xl font-semibold text-bone-100">{{ list?.orders.length ?? 0 }}</p>
        </div>
        <div v-if="vatTotal || rebateTotal" class="border border-ink-800 bg-ink-900/50 p-4">
          <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.vat.ofTotal') }}</p>
          <p class="mt-1 text-xl font-semibold text-bone-100">{{ formatIsk(vatTotal, locale) }}</p>
          <p class="mt-1 text-xs text-bone-500">{{ $t('portal.tools.po.rebate.total', { sum: formatIsk(rebateTotal, locale) }) }}</p>
        </div>
      </div>

      <!-- Where the money goes: departments → cost codes → orders -->
      <div v-if="deptTree.length" class="mt-6 border border-ink-800">
        <p class="kicker p-3 pb-0">{{ $t('portal.tools.po.codes.byCode') }}</p>
        <p class="px-3 pt-2 text-sm text-bone-400">{{ $t('portal.tools.po.codes.treeHint') }}</p>
        <div class="po-scroll mt-2 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-widest text-bone-500">
                <th class="p-3 font-normal">{{ $t('portal.tools.po.colDept') }} / {{ $t('portal.tools.po.codes.colCode') }}</th>
                <th class="p-3 font-normal text-right">{{ $t('portal.tools.po.colCount') }}</th>
                <th class="p-3 font-normal text-right">{{ $t('portal.tools.po.status.pending') }}</th>
                <th class="p-3 font-normal text-right">{{ $t('portal.tools.po.status.approved') }}</th>
                <th class="p-3 font-normal text-right">{{ $t('portal.tools.po.paid') }}</th>
                <th v-if="list?.viewAll" class="p-3 font-normal w-1/3">{{ $t('portal.tools.po.codes.budget') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-800">
              <template v-for="d in deptTree" :key="d.key">
                <!-- Department row -->
                <tr
                  class="cursor-pointer text-bone-200 transition-colors hover:bg-ink-900"
                  :class="expandedDeptKey === d.key ? 'bg-ink-900' : ''"
                  @click="toggleDeptRow(d.key)"
                >
                  <td class="p-3">
                    <span class="mr-2 inline-block w-3 text-bone-500">{{ expandedDeptKey === d.key ? '▾' : '▸' }}</span>
                    <span class="font-semibold" :class="expandedDeptKey === d.key ? 'text-gold-400' : 'text-bone-100'">{{ d.name }}</span>
                  </td>
                  <td class="p-3 text-right">{{ d.count }}</td>
                  <td class="p-3 text-right">{{ formatIsk(d.pending, locale) }}</td>
                  <td class="p-3 text-right text-emerald-400">{{ formatIsk(d.approved, locale) }}</td>
                  <td class="p-3 text-right text-sky-400">{{ formatIsk(d.paid, locale) }}</td>
                  <td v-if="list?.viewAll" class="p-3">
                    <template v-if="d.budget">
                      <div class="flex items-center gap-2">
                        <div class="h-2 flex-1 bg-ink-800">
                          <div
                            class="h-2"
                            :class="d.pct > 100 ? 'bg-signal-500' : 'bg-emerald-500/80'"
                            :style="{ width: `${Math.min(100, d.pct)}%` }"
                          />
                        </div>
                        <span class="w-12 shrink-0 text-right text-xs" :class="d.pct > 100 ? 'font-semibold text-signal-500' : 'text-bone-400'">{{ d.pct }}%</span>
                      </div>
                      <p class="mt-1 text-xs" :class="d.pct > 100 ? 'text-signal-500' : 'text-bone-500'">
                        {{ formatIsk(d.budgetSpend, locale) }} / {{ formatIsk(d.budget, locale) }}
                      </p>
                    </template>
                  </td>
                </tr>

                <!-- Cost codes inside the department -->
                <template v-if="expandedDeptKey === d.key">
                  <template v-for="c in d.codes" :key="`${d.key}:${c.key}`">
                    <tr
                      class="cursor-pointer bg-ink-900/40 text-bone-200 transition-colors hover:bg-ink-900"
                      @click="toggleCodeRow(d.key, c.key)"
                    >
                      <td class="p-3 pl-10">
                        <span class="mr-2 inline-block w-3 text-bone-500">{{ expandedCodeKey === `${d.key}:${c.key}` ? '▾' : '▸' }}</span>
                        <span class="font-semibold" :class="expandedCodeKey === `${d.key}:${c.key}` ? 'text-gold-400' : 'text-bone-100'">
                          {{ c.code || $t('portal.tools.po.codes.noCode') }}
                        </span>
                        <span v-if="c.name" class="ml-2 text-bone-400">{{ c.name }}</span>
                      </td>
                      <td class="p-3 text-right">{{ c.count }}</td>
                      <td class="p-3 text-right">{{ formatIsk(c.pending, locale) }}</td>
                      <td class="p-3 text-right text-emerald-400">{{ formatIsk(c.approved, locale) }}</td>
                      <td class="p-3 text-right text-sky-400">{{ formatIsk(c.paid, locale) }}</td>
                      <td v-if="list?.viewAll" class="p-3">
                        <template v-if="c.budget">
                          <div class="flex items-center gap-2">
                            <div class="h-2 flex-1 bg-ink-800">
                              <div
                                class="h-2"
                                :class="c.pct > 100 ? 'bg-signal-500' : 'bg-gold-500/80'"
                                :style="{ width: `${Math.min(100, c.pct)}%` }"
                              />
                            </div>
                            <span class="w-12 shrink-0 text-right text-xs" :class="c.pct > 100 ? 'font-semibold text-signal-500' : 'text-bone-400'">{{ c.pct }}%</span>
                          </div>
                          <p class="mt-1 text-xs" :class="c.pct > 100 ? 'text-signal-500' : 'text-bone-500'">
                            {{ formatIsk(c.globalSpend, locale) }} / {{ formatIsk(c.budget, locale) }}
                          </p>
                        </template>
                        <span v-else class="text-xs text-bone-600">{{ $t('portal.tools.po.codes.noBudget') }}</span>
                      </td>
                    </tr>

                    <!-- Orders on the code -->
                    <template v-if="expandedCodeKey === `${d.key}:${c.key}`">
                      <tr v-for="o in c.orders" :key="o.id" class="bg-ink-950/70 text-xs text-bone-300">
                        <td class="p-2 pl-16">
                          <span class="font-semibold text-bone-200">PO-{{ String(o.poNumber).padStart(3, '0') }}</span>
                          <span class="ml-2 text-bone-500">{{ formatDate(o.createdAt) }}</span>
                          <span class="ml-2">{{ o.vendor }}</span>
                        </td>
                        <td class="p-2" />
                        <td class="p-2 text-right">{{ o.status === 'pending' ? formatIsk(effectiveAmount(o), locale) : '' }}</td>
                        <td class="p-2 text-right text-emerald-400">{{ o.status === 'approved' ? formatIsk(effectiveAmount(o), locale) : '' }}</td>
                        <td class="p-2 text-right text-sky-400">{{ o.paidAt ? formatIsk(effectiveAmount(o), locale) : '' }}</td>
                        <td v-if="list?.viewAll" class="p-2" />
                      </tr>
                      <tr v-if="!c.orders.length" class="bg-ink-950/70 text-xs text-bone-500">
                        <td class="p-2 pl-16" :colspan="list?.viewAll ? 6 : 5">{{ $t('portal.tools.po.empty') }}</td>
                      </tr>
                    </template>
                  </template>
                </template>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      </template>

      <template v-if="showCreate">
      <!-- Cost-code register (admin) -->
      <div v-if="list?.isJobAdmin" class="mt-6 border border-ink-800 bg-ink-900/30 p-5">
        <button
          type="button"
          class="flex w-full items-center justify-between text-left"
          @click="manageCodes = !manageCodes"
        >
          <span class="kicker">
            {{ $t('portal.tools.po.codes.manage') }} ({{ list.costCodes.length }})
          </span>
          <span class="text-bone-500">{{ manageCodes ? '−' : '+' }}</span>
        </button>

        <div v-if="manageCodes" class="mt-4">
          <div v-if="list.costCodes.length" class="divide-y divide-ink-800 border border-ink-800">
            <template v-for="g in registerGroups" :key="g.key">
              <button
                type="button"
                class="flex w-full items-center gap-2 p-3 text-left transition-colors hover:bg-ink-900"
                @click="toggleRegisterGroup(g.key)"
              >
                <span class="inline-block w-3 text-bone-500">{{ openRegisterGroups.has(g.key) ? '▾' : '▸' }}</span>
                <span class="text-xs font-semibold uppercase tracking-widest" :class="openRegisterGroups.has(g.key) ? 'text-gold-400' : 'text-bone-200'">{{ g.name }}</span>
                <span class="text-xs text-bone-500">({{ g.codes.length }})</span>
              </button>
              <template v-if="openRegisterGroups.has(g.key)">
              <div v-for="c in g.codes" :key="c.id" class="flex flex-wrap items-center gap-3 bg-ink-900/40 p-3 pl-9">
              <template v-if="editingCodeId === c.id">
                <input v-model="editCode.code" type="text" class="input-dark w-28" maxlength="20">
                <input v-model="editCode.name" type="text" class="input-dark flex-1 min-w-40" maxlength="80">
                <select v-model="editCode.departmentId" class="input-dark">
                  <option value="">{{ $t('portal.tools.po.codes.allDepts') }}</option>
                  <option v-for="d in list.departments" :key="d.id" :value="d.id">{{ d.name }}</option>
                </select>
                <input
                  v-model="editCode.budget"
                  type="number"
                  class="input-dark w-40"
                  :placeholder="$t('portal.tools.po.codes.budgetPlaceholder')"
                  min="1"
                  step="1"
                >
                <button type="button" class="text-xs uppercase tracking-widest text-gold-400 hover:text-gold-300" @click="saveCode(c)">
                  {{ $t('portal.tools.po.codes.save') }}
                </button>
                <button type="button" class="text-xs uppercase tracking-widest text-bone-500 hover:text-bone-300" @click="editingCodeId = ''">
                  {{ $t('portal.tools.po.codes.cancel') }}
                </button>
              </template>
              <template v-else>
                <span class="w-28 font-semibold text-bone-100">{{ c.code }}</span>
                <span class="flex-1 min-w-40 text-bone-300">{{ c.name }}</span>
                <span class="text-xs text-bone-400">
                  {{ c.budget ? formatIsk(c.budget, locale) : $t('portal.tools.po.codes.noBudget') }}
                </span>
                <button
                  type="button"
                  class="text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
                  @click="startEditCode(c)"
                >{{ $t('portal.tools.po.codes.edit') }}</button>
                <button
                  type="button"
                  class="text-bone-600 hover:text-signal-500 transition-colors"
                  :title="$t('portal.tools.remove')"
                  @click="removeCode(c)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
              </template>
              </div>
              </template>
            </template>
          </div>
          <p v-else class="text-sm text-bone-500">{{ $t('portal.tools.po.codes.empty') }}</p>

          <!-- One box below the register: opens the create-code dialog. -->
          <button
            type="button"
            class="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-ink-700 p-3 text-xs font-semibold uppercase tracking-widest text-bone-400 transition-colors hover:border-gold-500/60 hover:text-gold-400"
            @click="openCodeDialog"
          >+ {{ $t('portal.tools.po.codes.addOpen') }}</button>
        </div>
      </div>

      <!-- Create-code dialog -->
      <div
        v-if="codeDialogOpen && list"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-16 backdrop-blur-sm"
        @click.self="codeDialogOpen = false"
      >
        <div class="w-full max-w-xl border border-ink-700 bg-ink-950 p-6 shadow-2xl">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.tools.po.codes.addOpen') }}</h2>
              <p class="mt-1 text-sm text-bone-400">{{ $t('portal.tools.po.codes.manageHint') }}</p>
            </div>
            <button type="button" class="text-bone-500 transition-colors hover:text-bone-200" @click="codeDialogOpen = false">✕</button>
          </div>

          <form class="mt-5 grid gap-3 sm:grid-cols-2" @submit.prevent="addCode">
            <input
              v-model="codeForm.code"
              type="text"
              class="input-dark"
              :placeholder="$t('portal.tools.po.codes.codePlaceholder')"
              maxlength="20"
              required
            >
            <input
              v-model="codeForm.name"
              type="text"
              class="input-dark"
              :placeholder="$t('portal.tools.po.codes.namePlaceholder')"
              maxlength="80"
              required
            >
            <select v-model="codeForm.departmentId" class="input-dark">
              <option value="">{{ $t('portal.tools.po.codes.allDepts') }}</option>
              <option v-for="d in list.departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <input
              v-model="codeForm.budget"
              type="number"
              class="input-dark"
              :placeholder="$t('portal.tools.po.codes.budgetPlaceholder')"
              min="1"
              step="1"
            >
            <div class="mt-2 flex items-center justify-end gap-5 sm:col-span-2">
              <button
                type="button"
                class="text-xs uppercase tracking-widest text-bone-500 transition-colors hover:text-bone-300"
                @click="codeDialogOpen = false"
              >{{ $t('portal.tools.po.codes.cancel') }}</button>
              <button
                type="submit"
                class="btn-gold disabled:opacity-50"
                :disabled="savingCode || !codeForm.code.trim() || !codeForm.name.trim()"
              >{{ $t('portal.tools.po.codes.add') }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- New order -->
      <form class="mt-8 border border-ink-800 bg-ink-900/50 p-5" @submit.prevent="submit">
        <p class="kicker">{{ $t('portal.tools.po.addTitle') }}</p>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            v-model="form.vendor"
            type="text"
            class="input-dark"
            :placeholder="$t('portal.tools.po.vendorPlaceholder')"
            maxlength="120"
            required
          >
          <div class="flex gap-3">
            <input
              v-model="form.amount"
              type="number"
              class="input-dark min-w-0 flex-1"
              :placeholder="$t('portal.tools.po.amountPlaceholder')"
              min="1"
              step="1"
              required
            >
            <select v-model="form.vatRate" class="input-dark w-28 shrink-0" :title="$t('portal.tools.po.vat.label')">
              <option value="24">{{ $t('portal.tools.po.vat.rate', { rate: 24 }) }}</option>
              <option value="11">{{ $t('portal.tools.po.vat.rate', { rate: 11 }) }}</option>
              <option value="0">{{ $t('portal.tools.po.vat.rate', { rate: 0 }) }}</option>
            </select>
          </div>
          <!-- Textarea: Enter adds a line instead of submitting, and the corner
               handle lets the field grow for longer descriptions. -->
          <textarea
            v-model="form.description"
            class="input-dark resize-y sm:col-span-2"
            rows="2"
            :placeholder="$t('portal.tools.po.descriptionPlaceholder')"
            maxlength="1000"
          />
          <select
            v-if="list && list.departments.length && (list.isJobAdmin || list.departments.length > 1)"
            v-model="form.departmentId"
            class="input-dark"
          >
            <option value="">{{ list.isJobAdmin ? $t('portal.tools.po.noDept') : $t('portal.tools.po.access.myDept') }}</option>
            <option v-for="d in list.departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <select v-if="formCodes.length" v-model="form.costCodeId" class="input-dark">
            <option value="">{{ $t('portal.tools.po.codes.noCode') }}</option>
            <option v-for="c in formCodes" :key="c.id" :value="c.id">{{ c.code }} · {{ c.name }}</option>
          </select>
          <p v-else class="self-center text-xs text-bone-500">{{ $t('portal.tools.po.codes.noneYet') }}</p>
          <label class="flex items-center gap-3 text-sm text-bone-400">
            <span class="shrink-0 text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.attachment') }}</span>
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              class="text-xs text-bone-400 file:mr-3 file:cursor-pointer file:border file:border-gold-600/70 file:bg-ink-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-widest file:text-gold-400 hover:file:border-gold-500 hover:file:text-gold-300 file:transition-colors"
            >
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-bone-300">
            <input v-model="form.rebateEligible" type="checkbox" class="h-4 w-4 accent-gold-500">
            {{ $t('portal.tools.po.rebate.label') }}
          </label>
        </div>
        <button type="submit" class="btn-gold mt-4 disabled:opacity-50" :disabled="saving || !form.vendor.trim() || !form.amount">
          {{ saving ? $t('portal.tools.working') : $t('portal.tools.po.submit') }}
        </button>
      </form>
      </template>

      <template v-if="showOrders">
      <!-- Filters: drill into one cost code and/or one status -->
      <p v-if="list?.orders.length" class="kicker mt-8">{{ $t('portal.tools.po.report.ordersTitle') }}</p>

      <!-- The approve view is a two-queue switch: unapproved and unpaid. -->
      <div v-if="list?.orders.length && view === 'approve'" class="mt-3 flex gap-1 border-b border-ink-800">
        <button
          type="button"
          class="-mb-px border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors"
          :class="statusFilter === 'pending' ? 'border-gold-500 text-gold-400' : 'border-transparent text-bone-500 hover:text-bone-300'"
          @click="statusFilter = 'pending'"
        >
          {{ $t('portal.tools.po.approveTabs.pending') }}
          <span
            v-if="pendingCount"
            class="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold leading-none text-ink-950"
          >{{ pendingCount }}</span>
        </button>
        <button
          type="button"
          class="-mb-px border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors"
          :class="statusFilter === 'unpaid' ? 'border-gold-500 text-gold-400' : 'border-transparent text-bone-500 hover:text-bone-300'"
          @click="statusFilter = 'unpaid'"
        >
          {{ $t('portal.tools.po.approveTabs.unpaid') }}
          <span
            v-if="unpaidCount"
            class="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-bold leading-none text-bone-100"
          >{{ unpaidCount }}</span>
        </button>
      </div>

      <div v-if="list?.orders.length && view !== 'approve'" class="mt-3 flex flex-wrap items-center gap-3">
        <!-- Hierarchy: department first, then only that department's codes. -->
        <select v-if="list.isJobAdmin && list.departments.length" v-model="deptFilter" class="input-dark text-sm">
          <option value="">{{ $t('portal.tools.po.codes.allDepts') }}</option>
          <option v-for="d in list.departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          <option value="none">{{ $t('portal.tools.po.noDept') }}</option>
        </select>
        <select v-model="codeFilter" class="input-dark text-sm">
          <option value="">{{ $t('portal.tools.po.filters.allCodes') }}</option>
          <option v-for="c in filterCodes" :key="c.id" :value="c.id">{{ c.code }} · {{ c.name }}</option>
          <option value="none">{{ $t('portal.tools.po.codes.noCode') }}</option>
        </select>
        <select v-model="statusFilter" class="input-dark text-sm">
          <option value="">{{ $t('portal.tools.po.filters.allStatuses') }}</option>
          <option value="pending">{{ $t('portal.tools.po.status.pending') }}</option>
          <option value="approved">{{ $t('portal.tools.po.status.approved') }}</option>
          <option value="paid">{{ $t('portal.tools.po.paid') }}</option>
          <option value="unpaid">{{ $t('portal.tools.po.unpaid') }}</option>
          <option value="rejected">{{ $t('portal.tools.po.status.rejected') }}</option>
        </select>
        <input
          v-model="searchQuery"
          type="search"
          class="input-dark min-w-48 flex-1 text-sm sm:flex-none"
          :placeholder="$t('portal.tools.po.filters.searchPlaceholder')"
        >
        <button
          v-if="codeFilter || statusFilter || searchQuery || deptFilter"
          type="button"
          class="text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
          @click="codeFilter = ''; statusFilter = ''; searchQuery = ''; deptFilter = ''"
        >{{ $t('portal.tools.po.filters.clear') }}</button>
        <p class="ml-auto text-xs text-bone-500">
          {{ $t('portal.tools.po.filters.showing', { shown: filteredOrders.length, total: list.orders.length }) }}
          · {{ formatIsk(filteredTotal, locale) }}
        </p>
      </div>

      <!-- Row-action errors surface here too, next to where they happen. -->
      <p v-if="error && list?.orders.length" class="mt-3 text-sm text-signal-500">{{ error }}</p>

      <!-- Orders: compact rows, click a row for details and actions -->
      <div v-if="filteredOrders.length" class="mt-4 border border-ink-800">
        <table class="w-full table-fixed text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-widest text-bone-500">
              <th class="w-20 p-3 font-normal">{{ $t('portal.tools.po.colNo') }}</th>
              <th class="hidden w-24 p-3 font-normal sm:table-cell">{{ $t('portal.tools.po.colDate') }}</th>
              <th class="p-3 font-normal">{{ $t('portal.tools.po.colVendor') }}</th>
              <th class="hidden w-20 p-3 font-normal md:table-cell">{{ $t('portal.tools.po.codes.colCode') }}</th>
              <th class="w-28 p-3 text-right font-normal">{{ $t('portal.tools.po.colAmount') }}</th>
              <th class="w-20 p-3 font-normal">{{ $t('portal.tools.po.colStatus') }}</th>
              <th class="w-8 p-3 font-normal" />
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-800">
            <template v-for="o in filteredOrders" :key="o.id">
              <tr
                class="cursor-pointer text-bone-200 transition-colors hover:bg-ink-900"
                :class="expandedId === o.id ? 'bg-ink-900' : ''"
                @click="expandedId = expandedId === o.id ? '' : o.id"
              >
                <td class="truncate p-3 font-semibold text-bone-100">PO-{{ String(o.poNumber).padStart(3, '0') }}</td>
                <td class="hidden truncate p-3 text-bone-400 sm:table-cell">{{ formatDate(o.createdAt) }}</td>
                <td class="p-3">
                  <span class="flex min-w-0 items-center gap-1.5" :title="o.vendor">
                    <span class="truncate">{{ o.vendor }}</span>
                    <a
                      v-if="o.attachmentName"
                      :href="`/api/portal/jobs/${selectedJobId}/purchase-orders/${o.id}/attachment`"
                      target="_blank"
                      class="shrink-0 text-gold-500 transition-colors hover:text-gold-300"
                      :title="o.attachmentName"
                      @click.stop
                    >
                      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </a>
                  </span>
                </td>
                <td class="hidden truncate p-3 text-bone-400 md:table-cell" :title="o.costCodeName">{{ o.costCode || '–' }}</td>
                <td class="p-3 text-right font-semibold">
                  <template v-if="o.paidAt && o.actualAmount && o.actualAmount !== o.amount">
                    <span class="block text-[11px] font-normal text-signal-500 line-through decoration-signal-500/80">{{ formatIsk(o.amount, locale) }}</span>
                    <span class="block">{{ formatIsk(o.actualAmount, locale) }}</span>
                  </template>
                  <template v-else>{{ formatIsk(o.amount, locale) }}</template>
                </td>
                <td class="p-3">
                  <span class="flex items-center gap-1.5">
                    <!-- Approval box: gold empty = pending, green check = approved, red cross = rejected -->
                    <button
                      type="button"
                      class="flex h-5 w-5 shrink-0 items-center justify-center border text-xs font-bold disabled:opacity-40"
                      :disabled="busyOrderId === o.id"
                      :class="[
                        o.status === 'approved' ? 'border-emerald-600/70 text-emerald-400' : '',
                        o.status === 'rejected' ? 'border-signal-500/70 text-signal-500' : '',
                        o.status === 'pending' ? 'border-gold-600/70 text-gold-400' : '',
                        list.isJobAdmin && o.status === 'pending' ? 'hover:bg-emerald-500/10' : 'cursor-default',
                      ]"
                      :title="$t(`portal.tools.po.status.${o.status}`)"
                      @click.stop="list.isJobAdmin && o.status === 'pending' ? decide(o, 'approve') : (expandedId = expandedId === o.id ? '' : o.id)"
                    >
                      <template v-if="o.status === 'approved'">✓</template>
                      <template v-else-if="o.status === 'rejected'">✕</template>
                    </button>
                    <!-- Paid box: blue check when paid -->
                    <button
                      type="button"
                      class="flex h-5 w-5 shrink-0 items-center justify-center border text-xs font-bold disabled:opacity-40"
                      :disabled="busyOrderId === o.id"
                      :class="[
                        o.paidAt ? 'border-sky-600/70 text-sky-400' : 'border-ink-700 text-bone-600',
                        list.isJobAdmin && o.status === 'approved' ? 'hover:bg-sky-500/10' : 'cursor-default',
                      ]"
                      :title="o.paidAt ? `${$t('portal.tools.po.paid')} · ${o.paidByName}` : $t('portal.tools.po.unpaid')"
                      @click.stop="list.isJobAdmin && o.status === 'approved' ? togglePaid(o) : (expandedId = expandedId === o.id ? '' : o.id)"
                    >
                      <template v-if="o.paidAt">✓</template>
                    </button>
                  </span>
                </td>
                <td class="p-3 text-bone-500">{{ expandedId === o.id ? '▾' : '▸' }}</td>
              </tr>

              <!-- Detail row -->
              <tr v-if="expandedId === o.id" class="bg-ink-900/40">
                <td colspan="7" class="p-4">
                  <div class="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div class="sm:col-span-2 lg:col-span-3">
                      <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.detail.description') }}</p>
                      <p class="mt-0.5 whitespace-pre-line text-bone-200">{{ o.description || '–' }}</p>
                    </div>
                    <div>
                      <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.colDept') }}</p>
                      <select
                        v-if="list.isJobAdmin && list.departments.length"
                        class="input-dark mt-0.5 !px-2 !py-1 text-xs"
                        :value="o.departmentId || ''"
                        @change="patchOrder(o, { departmentId: ($event.target as HTMLSelectElement).value || null })"
                      >
                        <option value="">{{ $t('portal.tools.po.noDept') }}</option>
                        <option v-for="d in list.departments" :key="d.id" :value="d.id">{{ d.name }}</option>
                      </select>
                      <p v-else class="mt-0.5 text-bone-200">{{ o.departmentName || $t('portal.tools.po.noDept') }}</p>
                    </div>
                    <div>
                      <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.colBy') }}</p>
                      <p class="mt-0.5 text-bone-200">{{ o.createdByName }} · {{ formatDate(o.createdAt) }}</p>
                    </div>
                    <div>
                      <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.codes.colCode') }}</p>
                      <select
                        v-if="list.isJobAdmin && list.costCodes.length"
                        class="input-dark mt-0.5 !px-2 !py-1 text-xs"
                        :value="o.costCodeId || ''"
                        @click.stop
                        @change="changeCode(o, ($event.target as HTMLSelectElement).value)"
                      >
                        <option value="">{{ $t('portal.tools.po.codes.noCode') }}</option>
                        <option v-for="c in codesFor(o)" :key="c.id" :value="c.id">{{ c.code }} · {{ c.name }}</option>
                      </select>
                      <p v-else class="mt-0.5 text-bone-200">
                        {{ o.costCode ? `${o.costCode} · ${o.costCodeName || ''}` : $t('portal.tools.po.codes.noCode') }}
                      </p>
                    </div>
                    <div>
                      <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.attachment') }}</p>
                      <p class="mt-0.5 flex flex-wrap items-center gap-2">
                        <a
                          v-if="o.attachmentName"
                          :href="`/api/portal/jobs/${selectedJobId}/purchase-orders/${o.id}/attachment`"
                          target="_blank"
                          class="text-gold-400 underline underline-offset-2 hover:text-gold-300"
                        >{{ o.attachmentName }}</a>
                        <span v-else class="text-bone-500">–</span>
                        <button
                          v-if="mayAttach(o)"
                          type="button"
                          class="text-xs text-bone-500 underline underline-offset-2 transition-colors hover:text-gold-400"
                          @click="pickInvoice(o)"
                        >{{ o.attachmentName ? $t('portal.tools.po.replaceInvoice') : $t('portal.tools.po.addInvoice') }}</button>
                      </p>
                    </div>
                    <div>
                      <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.vat.label') }}</p>
                      <template v-if="list.isJobAdmin">
                        <select
                          class="input-dark mt-0.5 !px-2 !py-1 text-xs"
                          :value="o.vatRate === undefined ? '' : String(o.vatRate)"
                          @change="changeVat(o, ($event.target as HTMLSelectElement).value)"
                        >
                          <option value="">{{ $t('portal.tools.po.vat.none') }}</option>
                          <option value="24">{{ $t('portal.tools.po.vat.rate', { rate: 24 }) }}</option>
                          <option value="11">{{ $t('portal.tools.po.vat.rate', { rate: 11 }) }}</option>
                          <option value="0">{{ $t('portal.tools.po.vat.rate', { rate: 0 }) }}</option>
                        </select>
                      </template>
                      <p v-else class="mt-0.5 text-bone-200">{{ o.vatRate === undefined ? '–' : `${o.vatRate}%` }}</p>
                      <p v-if="o.vatRate !== undefined && o.vatRate > 0" class="mt-0.5 text-xs text-bone-500">
                        {{ $t('portal.tools.po.vat.breakdown', {
                          net: formatIsk(effectiveAmount(o) - vatPortion(effectiveAmount(o), o.vatRate), locale),
                          vat: formatIsk(vatPortion(effectiveAmount(o), o.vatRate), locale),
                        }) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.rebate.short') }}</p>
                      <button
                        v-if="list.isJobAdmin"
                        type="button"
                        class="mt-0.5 text-xs uppercase tracking-widest transition-colors"
                        :class="o.rebateEligible ? 'text-emerald-400 hover:text-emerald-300' : 'text-bone-500 hover:text-bone-300'"
                        @click="toggleRebate(o)"
                      >{{ o.rebateEligible ? $t('common.yes') : $t('portal.tools.po.rebate.no') }}</button>
                      <p v-else class="mt-0.5 text-bone-200">{{ o.rebateEligible ? $t('common.yes') : $t('portal.tools.po.rebate.no') }}</p>
                    </div>
                    <div v-if="o.decidedAt">
                      <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.detail.decidedBy') }}</p>
                      <p class="mt-0.5 text-bone-200">{{ o.decidedByName }} · {{ formatDate(o.decidedAt) }}</p>
                      <p v-if="o.decisionNote" class="mt-0.5 text-xs text-signal-500/80">{{ o.decisionNote }}</p>
                    </div>
                    <div v-if="o.paidAt">
                      <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.detail.paidBy') }}</p>
                      <p class="mt-0.5 text-bone-200">{{ o.paidByName }} · {{ formatDate(o.paidAt) }}</p>
                      <p v-if="o.actualAmount && o.actualAmount !== o.amount" class="mt-0.5 text-xs">
                        <span class="text-bone-500">{{ $t('portal.tools.po.actual.planned') }}: {{ formatIsk(o.amount, locale) }}</span>
                        <span class="ml-2 font-semibold" :class="o.actualAmount > o.amount ? 'text-signal-500' : 'text-emerald-400'">
                          {{ $t('portal.tools.po.actual.actual') }}: {{ formatIsk(o.actualAmount, locale) }}
                        </span>
                      </p>
                      <button
                        v-if="list.isJobAdmin"
                        type="button"
                        class="mt-0.5 text-xs text-bone-500 underline underline-offset-2 transition-colors hover:text-gold-400"
                        @click="editActual(o)"
                      >{{ $t('portal.tools.po.actual.edit') }}</button>
                    </div>
                  </div>

                  <div class="mt-4 flex flex-wrap items-center gap-4 border-t border-ink-800 pt-3">
                    <template v-if="list.isJobAdmin">
                      <button
                        v-if="o.status !== 'approved'"
                        type="button"
                        class="text-xs uppercase tracking-widest text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-40"
                        :disabled="busyOrderId === o.id"
                        @click="decide(o, 'approve')"
                      >{{ $t('portal.tools.po.approve') }}</button>
                      <button
                        v-if="o.status !== 'rejected'"
                        type="button"
                        class="text-xs uppercase tracking-widest text-signal-500 transition-colors hover:text-signal-400 disabled:opacity-40"
                        :disabled="busyOrderId === o.id"
                        @click="decide(o, 'reject')"
                      >{{ $t('portal.tools.po.reject') }}</button>
                      <button
                        v-if="o.status === 'approved'"
                        type="button"
                        class="text-xs uppercase tracking-widest text-sky-400 transition-colors hover:text-sky-300 disabled:opacity-40"
                        :disabled="busyOrderId === o.id"
                        @click="togglePaid(o)"
                      >{{ o.paidAt ? $t('portal.tools.po.unmarkPaid') : $t('portal.tools.po.markPaid') }}</button>
                    </template>
                    <button
                      v-if="o.status !== 'rejected'"
                      type="button"
                      class="text-xs uppercase tracking-widest text-gold-400 transition-colors hover:text-gold-300 disabled:opacity-40"
                      :disabled="exporting"
                      @click="exportVendorPo(o)"
                    >{{ $t('portal.tools.po.vendorPdf.button') }}</button>
                    <button
                      v-if="mayDelete(o)"
                      type="button"
                      class="ml-auto flex items-center gap-1.5 text-xs uppercase tracking-widest text-bone-600 transition-colors hover:text-signal-500 disabled:opacity-40"
                      :disabled="busyOrderId === o.id"
                      @click="remove(o)"
                    >
                      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                      </svg>
                      {{ $t('portal.tools.remove') }}
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <p v-else-if="list" class="mt-8 text-sm text-bone-500">
        {{ list.orders.length ? $t('portal.tools.po.filters.noMatches') : $t('portal.tools.po.empty') }}
      </p>

      <!-- Hidden picker for attaching an invoice to an existing order -->
      <input
        ref="invoiceInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        class="hidden"
        @change="onInvoicePicked"
      >
      </template>

      <!-- Access management: PO role + department scopes per member (company admin only) -->
      <template v-if="showAccess">
      <div class="mt-6 border border-ink-800 bg-ink-900/30">
        <div class="p-5">
          <p class="kicker">{{ $t('portal.tools.po.access.title') }}</p>
          <p class="mt-2 max-w-3xl text-sm text-bone-400">{{ $t('portal.tools.po.access.hint') }}</p>
          <button
            v-if="addableMembers.length"
            type="button"
            class="btn-gold mt-4"
            @click="openAddPanel"
          >{{ $t('portal.tools.po.access.addOpen') }}</button>
        </div>
        <div v-if="visibleAccessMembers.length" class="po-scroll overflow-x-auto border-t border-ink-800">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-widest text-bone-500">
                <th class="p-3 font-normal">{{ $t('portal.tools.po.access.colName') }}</th>
                <th class="p-3 font-normal">{{ $t('portal.tools.po.access.colRole') }}</th>
                <th v-for="d in accessDepartments" :key="d.id" class="p-3 text-center font-normal">{{ d.name }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-800">
              <tr v-for="m in visibleAccessMembers" :key="m.userId" class="text-bone-200">
                <td class="max-w-56 p-3">
                  <p class="truncate font-semibold text-bone-100">{{ m.name || m.email }}</p>
                  <p class="truncate text-xs text-bone-500">
                    {{ m.departmentName || $t('portal.tools.po.noDept') }}{{ m.role ? ` · ${m.role}` : '' }}{{ m.isDeptAdmin ? ` · ${$t('portal.tools.po.access.deptAdmin')}` : '' }}
                  </p>
                </td>
                <td class="p-3">
                  <select
                    class="input-dark w-52 min-w-52 !py-1.5 text-xs"
                    :value="m.poRole || ''"
                    :disabled="savingRoleId === m.userId"
                    @change="setPoRole(m, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">
                      {{ $t('portal.tools.po.access.default') }}
                      ({{ m.isDeptAdmin && m.departmentId ? $t('portal.tools.po.access.roleLog') : $t('portal.tools.po.access.roleNone') }})
                    </option>
                    <option value="none">{{ $t('portal.tools.po.access.roleNone') }}</option>
                    <option value="log">{{ $t('portal.tools.po.access.roleLog') }}</option>
                    <option value="log_all">{{ $t('portal.tools.po.access.roleLogAll') }}</option>
                    <option value="view">{{ $t('portal.tools.po.access.roleView') }}</option>
                    <option value="approve">{{ $t('portal.tools.po.access.roleApprove') }}</option>
                  </select>
                </td>
                <td v-for="d in accessDepartments" :key="d.id" class="p-3 text-center">
                  <input
                    type="checkbox"
                    class="h-4 w-4 accent-gold-500 disabled:opacity-30"
                    :checked="memberDeptChecked(m, d.id)"
                    :disabled="!canScopeDepts(m) || savingRoleId === m.userId"
                    :title="d.name"
                    @change="toggleDept(m, d.id)"
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else-if="accessLoaded" class="border-t border-ink-800 p-5 text-sm text-bone-500">{{ $t('portal.tools.po.access.empty') }}</p>
      </div>

      <!-- Add-access dialog: search the crew, pick role and departments, confirm -->
      <div
        v-if="addPanelOpen"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-16 backdrop-blur-sm"
        @click.self="addPanelOpen = false"
      >
        <div class="w-full max-w-2xl border border-ink-700 bg-ink-950 p-6 shadow-2xl">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.tools.po.access.addOpen') }}</h2>
              <p class="mt-1 text-sm text-bone-400">{{ $t('portal.tools.po.access.addHint') }}</p>
            </div>
            <button type="button" class="text-bone-500 transition-colors hover:text-bone-200" @click="addPanelOpen = false">✕</button>
          </div>

          <div class="mt-4 flex flex-wrap gap-3">
            <input
              v-model="addSearch"
              type="search"
              class="input-dark min-w-48 flex-1 text-sm"
              :placeholder="$t('portal.tools.po.access.searchPlaceholder')"
            >
            <select v-model="addDeptFilter" class="input-dark text-sm">
              <option value="">{{ $t('portal.tools.po.codes.allDepts') }}</option>
              <option v-for="d in accessDepartments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>

          <div class="po-scroll mt-4 max-h-64 divide-y divide-ink-800 overflow-y-auto border border-ink-800">
            <button
              v-for="m in addCandidates"
              :key="m.userId"
              type="button"
              class="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-ink-900"
              :class="addSelectedId === m.userId ? 'bg-ink-900' : ''"
              @click="selectAddMember(m)"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold" :class="addSelectedId === m.userId ? 'text-gold-400' : 'text-bone-100'">
                  {{ m.name || m.email }}
                </p>
                <p class="truncate text-xs text-bone-500">
                  {{ m.departmentName || $t('portal.tools.po.noDept') }}{{ m.role ? ` · ${m.role}` : '' }} · {{ m.email }}
                </p>
              </div>
              <span v-if="addSelectedId === m.userId" class="shrink-0 text-gold-400">✓</span>
            </button>
            <p v-if="!addCandidates.length" class="p-3 text-sm text-bone-500">{{ $t('portal.tools.po.access.noMatches') }}</p>
          </div>

          <template v-if="addSelectedId">
            <div class="mt-5">
              <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.access.colRole') }}</p>
              <select v-model="addRole" class="input-dark mt-1.5 text-sm">
                <option value="log">{{ $t('portal.tools.po.access.roleLog') }}</option>
                <option value="log_all">{{ $t('portal.tools.po.access.roleLogAll') }}</option>
                <option value="view">{{ $t('portal.tools.po.access.roleView') }}</option>
                <option value="approve">{{ $t('portal.tools.po.access.roleApprove') }}</option>
              </select>
            </div>
            <div v-if="addRole === 'log' && accessDepartments.length" class="mt-4">
              <p class="text-[11px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.po.access.deptsLabel') }}</p>
              <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                <label
                  v-for="d in accessDepartments"
                  :key="d.id"
                  class="flex cursor-pointer items-center gap-2 text-sm text-bone-300"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 accent-gold-500"
                    :checked="addDepts.has(d.id)"
                    @change="toggleAddDept(d.id)"
                  >
                  {{ d.name }}
                </label>
              </div>
            </div>
          </template>

          <div class="mt-6 flex items-center justify-end gap-5">
            <button
              type="button"
              class="text-xs uppercase tracking-widest text-bone-500 transition-colors hover:text-bone-300"
              @click="addPanelOpen = false"
            >{{ $t('portal.tools.po.codes.cancel') }}</button>
            <button
              type="button"
              class="btn-gold disabled:opacity-50"
              :disabled="!addSelectedId || savingRoleId !== ''"
              @click="confirmAddMember"
            >{{ $t('portal.tools.po.access.add') }}</button>
          </div>
        </div>
      </div>
      </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { JobMember, PurchaseOrder, PurchaseOrderCostCode, PurchaseOrderJob, PurchaseOrderList } from '~/types'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('purchase-orders')

const { t, locale } = useI18n()
const { confirmDialog, promptDialog } = useAppDialog()
const localePath = useLocalePath()
const { user } = usePortalAuth()
const route = useRoute()

// Opened from a job page ("Hjálpargögn"): preselect that job in the picker.
const queryJobId = computed(() => (typeof route.query.job === 'string' ? route.query.job : ''))

// The job page's PO cards deep-link with ?focus=create|list|approve so each card
// opens one focused view instead of the whole tool on a single page:
//   create  → job picker + new-order form (and the cost-code register)
//   list    → totals, breakdowns and the full order table
//   approve → the orders table, defaulted to the pending queue
// Opened straight from the tools grid (no focus), 'all' shows everything.
const view = computed(() => {
  const f = typeof route.query.focus === 'string' ? route.query.focus : ''
  return f === 'create' || f === 'list' || f === 'approve' || f === 'access' ? f : 'all'
})
const showCreate = computed(() => (view.value === 'all' || view.value === 'create') && (list.value?.canLog ?? true))
const showOverview = computed(() => view.value === 'all' || view.value === 'list')
const showOrders = computed(() => view.value === 'all' || view.value === 'list' || view.value === 'approve')
const showAccess = computed(() => view.value === 'access' && currentJob.value?.poRole === 'admin')

// In-tool tabs so you can switch between the focused views without going back.
// Read-only members lose the create tab; only real company admins get access management.
const tabs = computed(() => [
  ...(list.value?.canLog === false ? [] : [{ key: 'create', label: 'portal.jobPo.create.title' }]),
  { key: 'list', label: 'portal.jobPo.overview.title' },
  { key: 'approve', label: 'portal.jobPo.approve.title' },
  ...(currentJob.value?.poRole === 'admin' ? [{ key: 'access', label: 'portal.tools.po.access.tab' }] : []),
])

const jobs = ref<PurchaseOrderJob[]>([])
const loaded = ref(false)
const selectedJobId = ref('')
const list = ref<PurchaseOrderList | null>(null)
const error = ref('')
const saving = ref(false)
const fileInput = ref<HTMLInputElement>()

const form = reactive({ vendor: '', amount: '', description: '', departmentId: '', costCodeId: '', vatRate: '24', rebateEligible: false })

// Cost-code register management (admin only).
const manageCodes = ref(false)
const savingCode = ref(false)
const codeForm = reactive({ code: '', name: '', departmentId: '', budget: '' })
const codeDialogOpen = ref(false)
const openCodeDialog = () => {
  codeForm.code = ''
  codeForm.name = ''
  codeForm.departmentId = ''
  codeForm.budget = ''
  codeDialogOpen.value = true
}
const editingCodeId = ref('')
const editCode = reactive({ code: '', name: '', departmentId: '', budget: '' })

// Codes offered in the logging form: shared codes plus the ones of the
// department being logged against. Members with a single granted department
// already get a server-filtered list.
const formCodes = computed(() => {
  const l = list.value
  const codes = l?.costCodes ?? []
  if (!l) return codes
  if (l.isJobAdmin) return codes.filter(c => !c.departmentId || c.departmentId === form.departmentId)
  if (l.departments.length > 1) {
    const chosen = form.departmentId || currentJob.value?.departmentId || ''
    return codes.filter(c => !c.departmentId || c.departmentId === chosen)
  }
  return codes
})
watch(formCodes, (codes) => {
  if (form.costCodeId && !codes.some(c => c.id === form.costCodeId)) form.costCodeId = ''
})

// Codes an order can be re-booked onto: shared + its department's, plus its
// current code so the select always shows the actual booking.
const codesFor = (o: PurchaseOrder) =>
  (list.value?.costCodes ?? []).filter(c =>
    !c.departmentId || c.departmentId === o.departmentId || c.id === o.costCodeId)

const currentJob = computed(() => jobs.value.find(j => j.jobId === selectedJobId.value) ?? null)

const scopeText = computed(() => {
  const j = currentJob.value
  if (!j) return ''
  if (j.isJobAdmin) return t('portal.tools.po.scopeAdmin')
  if (j.poRole === 'log_all') return t('portal.tools.po.scopeLogAll')
  if (j.poRole === 'view') return t('portal.tools.po.scopeView')
  return t('portal.tools.po.scopeDept', { dept: j.departmentName || t('portal.tools.po.noDept') })
})

// The order whose detail panel is open (row click toggles).
const expandedId = ref('')

// The order with a mutation in flight — its quick actions are disabled so a
// double-click can't approve or pay twice.
const busyOrderId = ref('')

/** Server-provided error message when there is one, generic fallback otherwise. */
const apiError = (e: unknown): string => {
  const err = e as { data?: { statusMessage?: string, data?: { errors?: string[] } } }
  return err.data?.data?.errors?.[0] || err.data?.statusMessage || t('portal.tools.po.saveFailed')
}

// The actual invoiced amount (recorded by the admin at payment) supersedes the
// logged estimate everywhere: recording it counts as an auto-approved cost
// change, so approved, paid, budgets and reports all stay consistent.
const effectiveAmount = (o: PurchaseOrder) => o.actualAmount ?? o.amount

const totals = computed(() => {
  const sum = { pending: 0, approved: 0, paid: 0, unpaid: 0 }
  for (const o of list.value?.orders ?? []) {
    if (o.status === 'pending') sum.pending += effectiveAmount(o)
    if (o.status === 'approved') {
      sum.approved += effectiveAmount(o)
      if (o.paidAt) sum.paid += effectiveAmount(o)
      else sum.unpaid += effectiveAmount(o)
    }
  }
  return sum
})

// VAT portion and rebate-eligible total across the visible (non-rejected) orders.
const vatTotal = computed(() => (list.value?.orders ?? []).reduce((s, o) =>
  o.status !== 'rejected' && o.vatRate !== undefined ? s + vatPortion(effectiveAmount(o), o.vatRate) : s, 0))
const rebateTotal = computed(() => (list.value?.orders ?? []).reduce((s, o) =>
  o.status !== 'rejected' && o.rebateEligible ? s + effectiveAmount(o) : s, 0))

// The job's total frame: the sum of every visible cost-code budget. Usage only
// counts spend booked ON budgeted codes — apples to apples with the frame, so
// uncoded or unbudgeted spend can't push the bar past 100% on its own.
const totalBudget = computed(() =>
  (list.value?.costCodes ?? []).reduce((s, c) => s + (c.budget ?? 0), 0))
const budgetedSpend = computed(() => {
  const budgeted = new Set((list.value?.costCodes ?? []).filter(c => c.budget).map(c => c.id))
  return (list.value?.orders ?? []).reduce((s, o) =>
    o.status !== 'rejected' && o.costCodeId && budgeted.has(o.costCodeId) ? s + effectiveAmount(o) : s, 0)
})
const budgetPct = computed(() =>
  totalBudget.value ? Math.round((budgetedSpend.value / totalBudget.value) * 100) : 0)

// Drill-down filters for the order list ('' = everything, 'none' = code-less).
const codeFilter = ref('')
const statusFilter = ref('')
const deptFilter = ref('')
const searchQuery = ref('')
watch(selectedJobId, () => {
  codeFilter.value = ''
  statusFilter.value = ''
  deptFilter.value = ''
  searchQuery.value = ''
  expandedId.value = ''
  expandedDeptKey.value = ''
  expandedCodeKey.value = ''
  openRegisterGroups.value = new Set()
})

// The code filter cascades from the department filter: a chosen department
// shows its own codes plus the shared (department-less) ones; "no department"
// orders can only carry shared codes.
const filterCodes = computed(() => {
  const codes = list.value?.costCodes ?? []
  if (!deptFilter.value) return codes
  if (deptFilter.value === 'none') return codes.filter(c => !c.departmentId)
  return codes.filter(c => !c.departmentId || c.departmentId === deptFilter.value)
})
watch(filterCodes, (codes) => {
  if (codeFilter.value && codeFilter.value !== 'none' && !codes.some(c => c.id === codeFilter.value)) {
    codeFilter.value = ''
  }
})
// The approve view opens straight on the pending queue; leaving it clears the
// preset again so the other views don't silently stay filtered to pending.
watch(view, v => { statusFilter.value = v === 'approve' ? 'pending' : '' }, { immediate: true })

const filteredOrders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return (list.value?.orders ?? []).filter((o) => {
    if (codeFilter.value === 'none' && o.costCodeId) return false
    if (codeFilter.value && codeFilter.value !== 'none' && o.costCodeId !== codeFilter.value) return false
    if (deptFilter.value === 'none' && o.departmentId) return false
    if (deptFilter.value && deptFilter.value !== 'none' && o.departmentId !== deptFilter.value) return false
    if (q) {
      const po = `po-${String(o.poNumber).padStart(3, '0')}`
      const haystack = `${o.vendor} ${o.description ?? ''} ${po} ${o.poNumber}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    switch (statusFilter.value) {
      case 'paid': return Boolean(o.paidAt)
      case 'unpaid': return o.status === 'approved' && !o.paidAt
      case '': return true
      default: return o.status === statusFilter.value
    }
  })
})

const filteredTotal = computed(() =>
  filteredOrders.value.reduce((s, o) => s + (o.status === 'rejected' ? 0 : effectiveAmount(o)), 0))

// Queue sizes for the approve tab and its badge.
const pendingCount = computed(() => (list.value?.orders ?? []).filter(o => o.status === 'pending').length)
const unpaidCount = computed(() => (list.value?.orders ?? []).filter(o => o.status === 'approved' && !o.paidAt).length)

// Close the detail panel when a filter hides the expanded row.
watch(filteredOrders, (orders) => {
  if (expandedId.value && !orders.some(o => o.id === expandedId.value)) expandedId.value = ''
})


// Where the money goes as a drill-down tree: departments → cost codes →
// orders. Rejected orders carry no money and are left out entirely; budgeted
// codes always appear under their department even before anything is booked.
interface TreeCode {
  key: string
  code: string
  name: string
  count: number
  pending: number
  approved: number
  paid: number
  budget: number
  /** The code's total spend across every department — what the bar measures. */
  globalSpend: number
  pct: number
  orders: PurchaseOrder[]
}
interface TreeDept {
  key: string
  name: string
  count: number
  pending: number
  approved: number
  paid: number
  /** Sum of the department's code budgets, with spend and usage against it. */
  budget: number
  budgetSpend: number
  pct: number
  codes: TreeCode[]
}

const deptTree = computed<TreeDept[]>(() => {
  const l = list.value
  if (!l) return []
  type DeptBuild = TreeDept & { codeMap: Map<string, TreeCode> }
  const depts = new Map<string, DeptBuild>()
  const deptNode = (key: string, name: string): DeptBuild => {
    const node = depts.get(key)
      ?? { key, name, count: 0, pending: 0, approved: 0, paid: 0, codes: [], codeMap: new Map<string, TreeCode>() }
    depts.set(key, node)
    return node
  }
  const codeNode = (dept: DeptBuild, key: string, code: string, name: string, budget: number): TreeCode => {
    const node = dept.codeMap.get(key)
      ?? { key, code, name, count: 0, pending: 0, approved: 0, paid: 0, budget, globalSpend: 0, pct: 0, orders: [] }
    dept.codeMap.set(key, node)
    return node
  }

  // Every registered code shows under its department, booked on or not, so
  // opening a department always lists its full set of codes.
  for (const cc of l.costCodes) {
    const dept = deptNode(cc.departmentId ?? 'none', cc.departmentName || t('portal.tools.po.noDept'))
    codeNode(dept, cc.id, cc.code, cc.name, cc.budget ?? 0)
  }

  const globalSpend = new Map<string, number>()
  for (const o of l.orders) {
    if (o.status === 'rejected') continue
    const amount = effectiveAmount(o)
    if (o.costCodeId) globalSpend.set(o.costCodeId, (globalSpend.get(o.costCodeId) ?? 0) + amount)

    const dept = deptNode(o.departmentId ?? 'none', o.departmentName || t('portal.tools.po.noDept'))
    const budget = l.costCodes.find(c => c.id === o.costCodeId)?.budget ?? 0
    const code = codeNode(dept, o.costCodeId ?? 'none', o.costCode ?? '', o.costCodeName ?? '', budget)
    dept.count++
    code.count++
    code.orders.push(o)
    if (o.status === 'pending') {
      dept.pending += amount
      code.pending += amount
    }
    else {
      dept.approved += amount
      code.approved += amount
      if (o.paidAt) {
        dept.paid += amount
        code.paid += amount
      }
    }
  }

  return [...depts.values()].map((d) => {
    const codes = [...d.codeMap.values()].map(c => ({
      ...c,
      globalSpend: globalSpend.get(c.key) ?? 0,
      pct: c.budget ? Math.round(((globalSpend.get(c.key) ?? 0) / c.budget) * 100) : 0,
    })).sort((a, b) => (b.approved + b.pending) - (a.approved + a.pending))
    // The department's frame: its budgeted codes summed, spend on those codes only.
    const budget = codes.reduce((s, c) => s + c.budget, 0)
    const budgetSpend = codes.reduce((s, c) => s + (c.budget ? c.globalSpend : 0), 0)
    return {
      key: d.key,
      name: d.name,
      count: d.count,
      pending: d.pending,
      approved: d.approved,
      paid: d.paid,
      budget,
      budgetSpend,
      pct: budget ? Math.round((budgetSpend / budget) * 100) : 0,
      codes,
    }
  }).sort((a, b) => (b.approved + b.pending) - (a.approved + a.pending))
})

// The code register grouped by department: shared codes first, then each
// department alphabetically, codes in numeric order within each group.
const sortedRegisterCodes = computed(() =>
  [...(list.value?.costCodes ?? [])].sort((a, b) =>
    (a.departmentName ?? '').localeCompare(b.departmentName ?? '', 'is')
    || a.code.localeCompare(b.code, undefined, { numeric: true })))

const registerGroups = computed(() => {
  const groups = new Map<string, { key: string, name: string, codes: PurchaseOrderCostCode[] }>()
  for (const c of sortedRegisterCodes.value) {
    const key = c.departmentId ?? 'shared'
    const group = groups.get(key) ?? { key, name: c.departmentName || t('portal.tools.po.codes.allDepts'), codes: [] }
    group.codes.push(c)
    groups.set(key, group)
  }
  return [...groups.values()]
})

const openRegisterGroups = ref<Set<string>>(new Set())
const toggleRegisterGroup = (key: string) => {
  const next = new Set(openRegisterGroups.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  openRegisterGroups.value = next
}

// Drill-down state: one open department, one open code inside it.
const expandedDeptKey = ref('')
const expandedCodeKey = ref('')
const toggleDeptRow = (key: string) => {
  expandedDeptKey.value = expandedDeptKey.value === key ? '' : key
  expandedCodeKey.value = ''
}
const toggleCodeRow = (deptKey: string, codeKey: string) => {
  const full = `${deptKey}:${codeKey}`
  expandedCodeKey.value = expandedCodeKey.value === full ? '' : full
}

const loadJobs = async () => {
  try {
    jobs.value = await $fetch<PurchaseOrderJob[]>('/api/portal/tools/purchase-orders/jobs')
    if (!selectedJobId.value) {
      const fromQuery = jobs.value.find(j => j.jobId === queryJobId.value)
      if (fromQuery) selectedJobId.value = fromQuery.jobId
      else if (jobs.value.length) selectedJobId.value = jobs.value[0]!.jobId
    }
  }
  catch {
    error.value = t('portal.tools.po.loadFailed')
  }
  finally {
    loaded.value = true
  }
}

const loadingOrders = ref(false)

const loadOrders = async () => {
  if (!selectedJobId.value) return
  error.value = ''
  loadingOrders.value = true
  try {
    list.value = await $fetch<PurchaseOrderList>(`/api/portal/jobs/${selectedJobId.value}/purchase-orders`)
    // Nothing to book on yet? Unfold the register so the admin sees where codes are made.
    if (list.value.isJobAdmin && !list.value.costCodes.length) manageCodes.value = true
    // First load of a job: open every department group in the register.
    if (!openRegisterGroups.value.size) {
      openRegisterGroups.value = new Set(list.value.costCodes.map(c => c.departmentId ?? 'shared'))
    }
  }
  catch {
    list.value = null
    error.value = t('portal.tools.po.loadFailed')
  }
  finally {
    loadingOrders.value = false
  }
}

onMounted(loadJobs)
watch(selectedJobId, loadOrders)

const submit = async () => {
  if (saving.value || !selectedJobId.value) return
  saving.value = true
  error.value = ''
  try {
    const body = new FormData()
    body.set('vendor', form.vendor.trim())
    body.set('amount', form.amount)
    if (form.description.trim()) body.set('description', form.description.trim())
    if (form.departmentId) body.set('departmentId', form.departmentId)
    if (form.costCodeId) body.set('costCodeId', form.costCodeId)
    body.set('vatRate', form.vatRate)
    if (form.rebateEligible) body.set('rebateEligible', '1')
    const file = fileInput.value?.files?.[0]
    if (file) body.set('file', file)
    await $fetch(`/api/portal/jobs/${selectedJobId.value}/purchase-orders`, { method: 'POST', body })
    form.vendor = ''
    form.amount = ''
    form.description = ''
    form.vatRate = '24'
    form.rebateEligible = false
    if (fileInput.value) fileInput.value.value = ''
    await loadOrders()
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    saving.value = false
  }
}

const decide = async (o: PurchaseOrder, action: 'approve' | 'reject') => {
  if (busyOrderId.value) return
  let note: string | null = null
  if (action === 'reject') {
    note = await promptDialog(t('portal.tools.po.rejectNotePrompt'))
    if (note === null) return
  }
  await patchOrder(o, { action, note: note || undefined })
}

// Admin re-books an order onto another cost code straight from the table.
const changeCode = (o: PurchaseOrder, costCodeId: string) =>
  patchOrder(o, { costCodeId: costCodeId || null })

const addCode = async () => {
  if (savingCode.value || !selectedJobId.value) return
  savingCode.value = true
  error.value = ''
  try {
    const created = await $fetch<PurchaseOrderCostCode>(
      `/api/portal/jobs/${selectedJobId.value}/purchase-orders/cost-codes`,
      { method: 'POST', body: { code: codeForm.code.trim(), name: codeForm.name.trim(), departmentId: codeForm.departmentId || undefined, budget: codeForm.budget || undefined } },
    )
    if (list.value) {
      list.value.costCodes = [...list.value.costCodes, created]
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    }
    codeForm.code = ''
    codeForm.name = ''
    codeForm.budget = ''
    codeDialogOpen.value = false
    // Make sure the new code's department group is open so it's visible.
    openRegisterGroups.value = new Set([...openRegisterGroups.value, created.departmentId ?? 'shared'])
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    savingCode.value = false
  }
}

const startEditCode = (c: PurchaseOrderCostCode) => {
  editingCodeId.value = c.id
  editCode.code = c.code
  editCode.name = c.name
  editCode.departmentId = c.departmentId || ''
  editCode.budget = c.budget ? String(c.budget) : ''
}

const saveCode = async (c: PurchaseOrderCostCode) => {
  try {
    await $fetch(
      `/api/portal/jobs/${selectedJobId.value}/purchase-orders/cost-codes/${c.id}`,
      { method: 'PATCH', body: { code: editCode.code.trim(), name: editCode.name.trim(), departmentId: editCode.departmentId || undefined, budget: editCode.budget || undefined } },
    )
    editingCodeId.value = ''
    // Code labels appear on orders too — reload so everything reflects the rename.
    await loadOrders()
  }
  catch (e) {
    error.value = apiError(e)
  }
}

const removeCode = async (c: PurchaseOrderCostCode) => {
  if (!await confirmDialog(t('portal.tools.po.codes.confirmDelete', { code: c.code }))) return
  try {
    await $fetch(`/api/portal/jobs/${selectedJobId.value}/purchase-orders/cost-codes/${c.id}`, { method: 'DELETE' })
    await loadOrders()
  }
  catch (e) {
    error.value = apiError(e)
  }
}

const mayDelete = (o: PurchaseOrder) =>
  list.value?.isJobAdmin || (o.createdById === user.value?.id && o.status === 'pending')

// Admin marks approved orders paid/unpaid. Marking paid asks for the actual
// invoiced amount (default = the logged amount; unchanged means no override).
const togglePaid = async (o: PurchaseOrder) => {
  if (busyOrderId.value) return
  // Un-marking rewrites payment history — ask before it happens.
  if (o.paidAt && !await confirmDialog(t('portal.tools.po.confirmUnpaid', { no: `PO-${String(o.poNumber).padStart(3, '0')}` }))) return
  let actualAmount: number | undefined
  if (!o.paidAt) {
    const raw = await promptDialog(t('portal.tools.po.actual.prompt'), String(o.amount))
    if (raw === null) return
    const trimmed = raw.trim().replace(/[,.\s]/g, '')
    if (trimmed && trimmed !== String(o.amount)) {
      const n = Number(trimmed)
      if (!Number.isInteger(n) || n <= 0) {
        error.value = t('portal.tools.po.actual.invalid')
        return
      }
      actualAmount = n
    }
  }
  await patchOrder(o, { action: o.paidAt ? 'unpaid' : 'paid', ...(actualAmount ? { actualAmount } : {}) })
}

/** Shared PATCH helper for all row actions: busy guard + server error message. */
const patchOrder = async (o: PurchaseOrder, body: Record<string, unknown>) => {
  if (busyOrderId.value) return
  busyOrderId.value = o.id
  error.value = ''
  try {
    const updated = await $fetch<PurchaseOrder>(
      `/api/portal/jobs/${selectedJobId.value}/purchase-orders/${o.id}`,
      { method: 'PATCH', body },
    )
    if (list.value) {
      list.value.orders = list.value.orders.map(x => x.id === updated.id ? updated : x)
    }
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    busyOrderId.value = ''
  }
}

const changeVat = (o: PurchaseOrder, raw: string) =>
  patchOrder(o, { vatRate: raw === '' ? null : Number(raw) })

const toggleRebate = (o: PurchaseOrder) =>
  patchOrder(o, { rebateEligible: !o.rebateEligible })

// Correct the actual invoiced amount on an already-paid order.
const editActual = async (o: PurchaseOrder) => {
  const raw = await promptDialog(t('portal.tools.po.actual.prompt'), String(o.actualAmount ?? o.amount))
  if (raw === null) return
  const trimmed = raw.trim().replace(/[,.\s]/g, '')
  if (!trimmed || trimmed === String(o.amount)) return patchOrder(o, { actualAmount: null })
  const n = Number(trimmed)
  if (!Number.isInteger(n) || n <= 0) {
    error.value = t('portal.tools.po.actual.invalid')
    return
  }
  return patchOrder(o, { actualAmount: n })
}

// Attach an invoice to an existing order: admin any order, creators their own.
const invoiceInput = ref<HTMLInputElement>()
const invoiceTarget = ref<PurchaseOrder | null>(null)

const mayAttach = (o: PurchaseOrder) =>
  list.value?.isJobAdmin || (o.createdById === user.value?.id && (list.value?.canLog ?? false))

const pickInvoice = (o: PurchaseOrder) => {
  invoiceTarget.value = o
  invoiceInput.value?.click()
}

const onInvoicePicked = async () => {
  const file = invoiceInput.value?.files?.[0]
  const target = invoiceTarget.value
  if (invoiceInput.value) invoiceInput.value.value = ''
  if (!file || !target) return
  error.value = ''
  try {
    const body = new FormData()
    body.set('file', file)
    const updated = await $fetch<PurchaseOrder>(
      `/api/portal/jobs/${selectedJobId.value}/purchase-orders/${target.id}/attachment`,
      { method: 'POST', body },
    )
    if (list.value) {
      list.value.orders = list.value.orders.map(x => x.id === updated.id ? updated : x)
    }
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    invoiceTarget.value = null
  }
}

const remove = async (o: PurchaseOrder) => {
  if (busyOrderId.value) return
  if (!await confirmDialog(t('portal.tools.po.confirmDelete', { no: `PO-${String(o.poNumber).padStart(3, '0')}` }))) return
  busyOrderId.value = o.id
  try {
    await $fetch(`/api/portal/jobs/${selectedJobId.value}/purchase-orders/${o.id}`, { method: 'DELETE' })
    if (list.value) list.value.orders = list.value.orders.filter(x => x.id !== o.id)
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    busyOrderId.value = ''
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// ── PO access management (company admin) ─────────────────────────────────────

const accessMembers = ref<JobMember[]>([])
const accessDepartments = ref<{ id: string, name: string }[]>([])
const accessLoaded = ref(false)
const savingRoleId = ref('')

const loadAccessMembers = async () => {
  if (!selectedJobId.value || currentJob.value?.poRole !== 'admin') return
  try {
    const res = await $fetch<{ members: JobMember[], departments: { id: string, name: string }[] }>(
      `/api/portal/jobs/${selectedJobId.value}/members`,
    )
    accessMembers.value = res.members.filter(m => m.memberStatus === 'active')
    accessDepartments.value = res.departments.map(d => ({ id: d.id, name: d.name }))
  }
  catch {
    error.value = t('portal.tools.po.loadFailed')
  }
  finally {
    accessLoaded.value = true
  }
}

// Only members who matter show in the table: department heads (default access)
// and anyone given an explicit role or department grant. The rest of the crew
// is added on demand via the picker, which starts them on the 'log' role.
const visibleAccessMembers = computed(() =>
  accessMembers.value.filter(m => m.isDeptAdmin || m.poRole || m.poDepartments))
const addableMembers = computed(() =>
  accessMembers.value.filter(m => !m.isDeptAdmin && !m.poRole && !m.poDepartments))

// The add-access dialog: search the crew, pick a member, choose role + depts.
const addPanelOpen = ref(false)
const addSearch = ref('')
const addDeptFilter = ref('')
const addSelectedId = ref('')
const addRole = ref<'log' | 'log_all' | 'view' | 'approve'>('log')
const addDepts = ref<Set<string>>(new Set())

const openAddPanel = () => {
  addPanelOpen.value = true
  addSearch.value = ''
  addDeptFilter.value = ''
  addSelectedId.value = ''
  addRole.value = 'log'
  addDepts.value = new Set()
}

const addCandidates = computed(() => addableMembers.value.filter((m) => {
  if (addDeptFilter.value && m.departmentId !== addDeptFilter.value) return false
  const q = addSearch.value.trim().toLowerCase()
  if (!q) return true
  return `${m.name ?? ''} ${m.email} ${m.role ?? ''} ${m.departmentName ?? ''}`.toLowerCase().includes(q)
}))

const selectAddMember = (m: JobMember) => {
  addSelectedId.value = m.userId
  addDepts.value = new Set(m.departmentId ? [m.departmentId] : [])
}

const toggleAddDept = (deptId: string) => {
  const next = new Set(addDepts.value)
  if (next.has(deptId)) next.delete(deptId)
  else next.add(deptId)
  addDepts.value = next
}

const confirmAddMember = async () => {
  const member = accessMembers.value.find(m => m.userId === addSelectedId.value)
  if (!member) return
  savingRoleId.value = member.userId
  error.value = ''
  try {
    await $fetch(`/api/portal/jobs/${selectedJobId.value}/members/${member.userId}`, {
      method: 'PATCH',
      body: {
        poRole: addRole.value,
        ...(addRole.value === 'log' ? { poDepartments: [...addDepts.value] } : {}),
      },
    })
    member.poRole = addRole.value
    if (addRole.value === 'log') member.poDepartments = [...addDepts.value]
    addPanelOpen.value = false
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    savingRoleId.value = ''
  }
}

/** The member's effective PO role (explicit or the derived default). */
const effectiveRole = (m: JobMember) => m.poRole ?? (m.isDeptAdmin && m.departmentId ? 'log' : 'none')
/** Department checkboxes only matter for members who log costs. */
const canScopeDepts = (m: JobMember) => effectiveRole(m) === 'log'
/** Departments the member may work in: granted list, or just their own. */
const memberDepts = (m: JobMember): string[] => m.poDepartments ?? (m.departmentId ? [m.departmentId] : [])
const memberDeptChecked = (m: JobMember, deptId: string) => memberDepts(m).includes(deptId)

const toggleDept = async (m: JobMember, deptId: string) => {
  const next = new Set(memberDepts(m))
  if (next.has(deptId)) next.delete(deptId)
  else next.add(deptId)
  savingRoleId.value = m.userId
  error.value = ''
  try {
    await $fetch(`/api/portal/jobs/${selectedJobId.value}/members/${m.userId}`, {
      method: 'PATCH',
      body: { poDepartments: [...next] },
    })
    m.poDepartments = [...next]
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    savingRoleId.value = ''
  }
}
watch([view, selectedJobId, currentJob], () => {
  if (view.value === 'access') loadAccessMembers()
}, { immediate: true })

const setPoRole = async (m: JobMember, value: string) => {
  savingRoleId.value = m.userId
  error.value = ''
  try {
    await $fetch(`/api/portal/jobs/${selectedJobId.value}/members/${m.userId}`, {
      method: 'PATCH',
      body: { poRole: value || null },
    })
    m.poRole = (value || undefined) as JobMember['poRole']
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    savingRoleId.value = ''
  }
}

// ── Cost report + vendor PO exports ──────────────────────────────────────────

const exporting = ref(false)

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'po'

const reportMeta = () => ({
  jobName: currentJob.value?.jobName ?? '',
  companyName: currentJob.value?.companyName ?? '',
  dateText: formatDate(new Date().toISOString()),
  scopeText: currentJob.value && !currentJob.value.isJobAdmin && currentJob.value.departmentName
    ? t('portal.tools.po.report.scopeDept', { dept: currentJob.value.departmentName })
    : '',
})

const reportFileBase = () =>
  `kostnadarskyrsla-${slugify(currentJob.value?.jobName ?? '')}-${new Date().toISOString().slice(0, 10)}`

const exportReportPdf = async () => {
  if (!list.value || exporting.value) return
  exporting.value = true
  try {
    const { exportPoReportPdf } = await import('~/utils/poReportPdf')
    const bytes = await exportPoReportPdf(buildPoReport(list.value.orders, list.value.costCodes), reportMeta(), {
      title: t('portal.tools.po.report.title'),
      summary: t('portal.tools.po.codes.byCode'),
      colCode: t('portal.tools.po.codes.colCode'),
      colCount: t('portal.tools.po.colCount'),
      colCommitted: t('portal.tools.po.report.colCommitted'),
      colPaid: t('portal.tools.po.paid'),
      colBudget: t('portal.tools.po.codes.budget'),
      byDept: t('portal.tools.po.report.byDept'),
      grandTotal: t('portal.tools.po.report.grandTotal'),
      vatLine: t('portal.tools.po.vat.ofTotal'),
      rebateLine: t('portal.tools.po.rebate.short'),
      noCode: t('portal.tools.po.codes.noCode'),
      noDept: t('portal.tools.po.noDept'),
      noBudget: t('portal.tools.po.codes.noBudget'),
      ordersTitle: t('portal.tools.po.report.ordersTitle'),
      colNo: t('portal.tools.po.colNo'),
      colDate: t('portal.tools.po.colDate'),
      colVendor: t('portal.tools.po.colVendor'),
      colAmount: t('portal.tools.po.colAmount'),
      colStatus: t('portal.tools.po.colStatus'),
      statusText: {
        pending: t('portal.tools.po.status.pending'),
        approved: t('portal.tools.po.status.approved'),
        rejected: t('portal.tools.po.status.rejected'),
      },
      paidText: t('portal.tools.po.paid'),
      continued: t('portal.tools.po.report.continued'),
    })
    downloadBlob(bytes, `${reportFileBase()}.pdf`, 'application/pdf')
  }
  catch {
    error.value = t('portal.tools.po.report.failed')
  }
  finally {
    exporting.value = false
  }
}

const exportReportCsv = () => {
  if (!list.value || exporting.value) return
  const meta = reportMeta()
  const csv = buildPoReportCsv(buildPoReport(list.value.orders, list.value.costCodes), {
    title: t('portal.tools.po.report.title'),
    job: meta.jobName,
    company: meta.companyName,
    scope: meta.scopeText,
    generated: t('portal.tools.po.report.generated', { date: meta.dateText }),
    colCode: t('portal.tools.po.codes.colCode'),
    colName: t('portal.tools.po.report.colName'),
    colDept: t('portal.tools.po.colDept'),
    colBudget: t('portal.tools.po.codes.budget'),
    colCommitted: t('portal.tools.po.report.colCommitted'),
    colPaid: t('portal.tools.po.paid'),
    colVat: t('portal.tools.po.report.colVatAmount'),
    colRebate: t('portal.tools.po.rebate.short'),
    colRemaining: t('portal.tools.po.report.colRemaining'),
    colPct: t('portal.tools.po.report.colPct'),
    colCount: t('portal.tools.po.colCount'),
    grandTotal: t('portal.tools.po.report.grandTotal'),
    noCode: t('portal.tools.po.codes.noCode'),
    ordersTitle: t('portal.tools.po.report.ordersTitle'),
    colNo: t('portal.tools.po.colNo'),
    colDate: t('portal.tools.po.colDate'),
    colVendor: t('portal.tools.po.colVendor'),
    colDescription: t('portal.tools.po.report.colDescription'),
    colAmount: t('portal.tools.po.colAmount'),
    colVatRate: t('portal.tools.po.report.colVatRate'),
    colStatus: t('portal.tools.po.colStatus'),
    colPaidFlag: t('portal.tools.po.paid'),
    colActual: t('portal.tools.po.actual.actual'),
    statusText: {
      pending: t('portal.tools.po.status.pending'),
      approved: t('portal.tools.po.status.approved'),
      rejected: t('portal.tools.po.status.rejected'),
    },
    yes: t('common.yes'),
    no: t('portal.tools.po.rebate.no'),
  })
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${reportFileBase()}.csv`)
}

const exportVendorPo = async (o: PurchaseOrder) => {
  if (exporting.value) return
  exporting.value = true
  try {
    const { exportVendorPoPdf } = await import('~/utils/poVendorPdf')
    const bytes = await exportVendorPoPdf(o, {
      companyName: currentJob.value?.companyName ?? '',
      jobName: currentJob.value?.jobName ?? '',
      dateText: formatDate(o.createdAt),
      decidedDateText: o.decidedAt ? formatDate(o.decidedAt) : '',
    }, {
      title: t('portal.tools.po.vendorPdf.title'),
      date: t('portal.tools.po.colDate'),
      job: t('portal.tools.po.job'),
      vendor: t('portal.tools.po.colVendor'),
      description: t('portal.tools.po.detail.description'),
      dept: t('portal.tools.po.colDept'),
      code: t('portal.tools.po.codes.colCode'),
      createdBy: t('portal.tools.po.colBy'),
      net: t('portal.tools.po.vendorPdf.net'),
      vat: t('portal.tools.po.vat.label'),
      total: t('portal.tools.po.vendorPdf.total'),
      approvedBy: t('portal.tools.po.vendorPdf.approvedBy'),
      statusPending: t('portal.tools.po.vendorPdf.statusPending'),
      statusRejected: t('portal.tools.po.status.rejected'),
    })
    downloadBlob(bytes, `PO-${String(o.poNumber).padStart(3, '0')}-${slugify(o.vendor)}.pdf`, 'application/pdf')
  }
  catch {
    error.value = t('portal.tools.po.report.failed')
  }
  finally {
    exporting.value = false
  }
}

useHead({ title: 'Innkaupabeiðnir · Hjálpartól · Portal' })
</script>

<style scoped>
/* Slim, theme-matched scrollbars on the wide tables instead of the OS default. */
.po-scroll {
  scrollbar-width: thin;
  scrollbar-color: #3d3d46 transparent;
}
.po-scroll::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.po-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.po-scroll::-webkit-scrollbar-thumb {
  background: #3d3d46;
  border-radius: 9999px;
  border: 2px solid #101014;
}
.po-scroll::-webkit-scrollbar-thumb:hover {
  background: #a87a1f;
}
</style>
