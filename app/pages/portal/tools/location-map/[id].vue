<template>
  <div>
    <NuxtLink
      :to="backTo"
      class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
    >
      ← {{ $t('portal.tools.locationMap.backToList') }}
    </NuxtLink>

    <p v-if="notFound" class="mt-6 text-sm text-signal-500">{{ $t('portal.tools.locationMap.notFound') }}</p>

    <template v-else-if="doc">
      <!-- Header: name, save state, export -->
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <input
          v-model="doc.name"
          type="text"
          maxlength="120"
          class="input-dark text-lg font-semibold flex-1 min-w-56"
          @input="markDirty"
        >
        <span class="text-xs text-bone-500 w-20">
          <template v-if="saveState === 'saving'">{{ $t('portal.tools.locationMap.saving') }}</template>
          <template v-else-if="saveState === 'saved'">{{ $t('portal.tools.locationMap.saved') }}</template>
          <template v-else-if="saveState === 'error'"><span class="text-signal-500">{{ $t('portal.tools.locationMap.saveFailed') }}</span></template>
        </span>
        <button type="button" class="btn-gold disabled:opacity-50" :disabled="exporting" @click="doExport">
          {{ exporting ? $t('portal.tools.locationMap.exporting') : $t('portal.tools.locationMap.export') }}
        </button>
      </div>
      <p v-if="exportError" class="mt-2 text-sm text-signal-500">{{ exportError }}</p>

      <!-- Page tabs -->
      <div class="mt-4 flex flex-wrap items-center gap-1.5">
        <button
          v-for="(p, i) in doc.pages"
          :key="p.id"
          type="button"
          draggable="true"
          class="px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors cursor-grab active:cursor-grabbing"
          :class="[
            i === pageIdx
              ? 'border-gold-500/60 text-gold-400 bg-ink-900'
              : 'border-ink-800 text-bone-500 hover:text-bone-300',
            dragPage === i ? 'opacity-40' : '',
            dragOverPage === i && dragPage !== null && dragPage !== i ? '!border-gold-400' : '',
          ]"
          :title="$t('portal.tools.locationMap.dragPages')"
          @click="switchPage(i)"
          @dragstart="onPageDragStart(i, $event)"
          @dragend="dragPage = null; dragOverPage = null"
          @dragover.prevent="dragOverPage = i"
          @dragleave="dragOverPage === i && (dragOverPage = null)"
          @drop.prevent="onPageDrop(i)"
        >
          {{ p.title || `${i + 1}` }}
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs uppercase tracking-widest border border-dashed border-ink-700 text-bone-500 hover:text-gold-400 transition-colors"
          @click="addPage('map')"
        >
          + {{ $t('portal.tools.locationMap.pageTypeMap') }}
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs uppercase tracking-widest border border-dashed border-ink-700 text-bone-500 hover:text-gold-400 transition-colors"
          @click="addPage('image')"
        >
          + {{ $t('portal.tools.locationMap.pageTypeImage') }}
        </button>
      </div>

      <!-- Page settings: base layer, page title, delete page -->
      <div v-if="page" class="mt-2 flex flex-wrap items-center gap-3">
        <div v-if="page.base !== 'image'" class="flex gap-1.5">
          <button
            v-for="b in (['streets', 'satellite'] as const)"
            :key="b"
            type="button"
            class="px-2.5 py-1 text-xs border transition-colors"
            :class="page.base === b ? 'border-gold-500/60 text-gold-400' : 'border-ink-800 text-bone-500 hover:text-bone-300'"
            @click="setBase(b)"
          >
            {{ $t(b === 'streets' ? 'portal.tools.locationMap.baseStreets' : 'portal.tools.locationMap.baseSatellite') }}
          </button>
        </div>
        <button
          v-else
          type="button"
          class="px-2.5 py-1 text-xs border border-ink-800 text-bone-500 hover:text-bone-300 transition-colors"
          @click="pickImage(true)"
        >
          {{ $t('portal.tools.locationMap.replaceImage') }}
        </button>

        <input
          v-model="page.title"
          type="text"
          maxlength="120"
          class="input-dark !py-1 text-xs w-48"
          :placeholder="$t('portal.tools.locationMap.pageTitle')"
          @input="markDirty"
        >
        <button
          type="button"
          class="text-bone-600 hover:text-signal-500 transition-colors"
          :title="$t('portal.tools.locationMap.confirmDeletePage')"
          @click="deletePage"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>

      <!-- Toolbar -->
      <div v-if="page" class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 border border-ink-800 bg-ink-900/50 p-3">
        <!-- Tool modes -->
        <div class="flex gap-1.5">
          <button
            v-for="mode in availableModes"
            :key="mode.id"
            type="button"
            class="px-3 py-1.5 text-xs border transition-colors"
            :class="tool === mode.id ? 'border-gold-500/60 text-gold-400 bg-ink-900' : 'border-ink-800 text-bone-400 hover:text-bone-200'"
            :title="$t(mode.labelKey)"
            @click="setTool(mode.id)"
          >
            {{ $t(mode.labelKey) }}
          </button>
        </div>

        <!-- Marker kind picker -->
        <div v-if="tool === 'marker'" class="flex items-center gap-1.5">
          <button
            v-for="k in MARKER_KINDS"
            :key="k.kind"
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white border-2 transition-transform"
            :class="markerKind === k.kind ? 'border-gold-400 scale-110' : 'border-transparent opacity-70 hover:opacity-100'"
            :style="{ background: k.color }"
            :title="$t(k.labelKey)"
            @click="markerKind = k.kind"
          >
            {{ k.glyph }}
          </button>
          <span class="ml-1 text-xs text-bone-500">{{ $t(markerKindDef(markerKind).labelKey) }}</span>
        </div>

        <!-- Shape style -->
        <div v-if="tool === 'shape'" class="flex items-center gap-2">
          <button
            v-for="k in (['rect', 'circle', 'poly', 'arrow', 'reserved'] as const)"
            :key="k"
            type="button"
            class="px-2.5 py-1 text-xs border transition-colors"
            :class="shapeKind === k ? 'border-gold-500/60 text-gold-400 bg-ink-900' : 'border-ink-800 text-bone-400 hover:text-bone-200'"
            @click="setShapeKind(k)"
          >
            {{ $t(`portal.tools.locationMap.shape_${k}`) }}
          </button>
          <button
            v-for="c in ROAD_COLORS"
            :key="c"
            type="button"
            class="h-6 w-6 rounded-full border-2"
            :class="shapeStyle.color === c ? 'border-gold-400' : 'border-ink-700'"
            :style="{ background: c }"
            @click="shapeStyle.color = c"
          />
          <label v-if="shapeKind !== 'arrow'" class="flex items-center gap-1.5 text-xs text-bone-400">
            <input v-model="shapeStyle.fill" type="checkbox" class="accent-gold-500">
            {{ $t('portal.tools.locationMap.fill') }}
          </label>
          <input
            v-if="shapeStyle.fill && shapeKind !== 'arrow'"
            v-model.number="shapeStyle.fillOpacity"
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            class="w-20 accent-gold-500"
            :title="$t('portal.tools.locationMap.opacity')"
          >
          <template v-if="shapeKind === 'poly' && polyPts.length">
            <button type="button" class="text-xs text-bone-400 hover:text-bone-200 underline" @click="undoPolyPoint">
              {{ $t('portal.tools.locationMap.undoPoint') }}
            </button>
            <button type="button" class="text-xs text-gold-400 hover:text-gold-300 underline" @click="finishPoly">
              {{ $t('portal.tools.locationMap.finish') }}
            </button>
          </template>
        </div>

        <!-- Measure: line style + undo/finish while drawing -->
        <div v-if="tool === 'measure'" class="flex items-center gap-2">
          <button
            v-for="c in MEASURE_COLORS"
            :key="c"
            type="button"
            class="h-6 w-6 rounded-full border-2"
            :class="measureStyle.color === c ? 'border-gold-400' : 'border-ink-700'"
            :style="{ background: c }"
            @click="measureStyle.color = c"
          />
          <input v-model.number="measureStyle.width" type="range" min="1" max="12" class="w-20 accent-gold-500" :title="$t('portal.tools.locationMap.roadWidth')">
          <label class="flex items-center gap-1.5 text-xs text-bone-400">
            <input v-model="measureStyle.dashed" type="checkbox" class="accent-gold-500">
            {{ $t('portal.tools.locationMap.roadDashed') }}
          </label>
          <template v-if="measurePts.length">
            <button type="button" class="text-xs text-bone-400 hover:text-bone-200 underline" @click="undoMeasurePoint">
              {{ $t('portal.tools.locationMap.undoPoint') }}
            </button>
            <button type="button" class="text-xs text-gold-400 hover:text-gold-300 underline" @click="finishMeasure">
              {{ $t('portal.tools.locationMap.finish') }}
            </button>
          </template>
        </div>

        <!-- Road style -->
        <div v-if="tool === 'road'" class="flex items-center gap-2">
          <button
            v-for="c in ROAD_COLORS"
            :key="c"
            type="button"
            class="h-6 w-6 rounded-full border-2"
            :class="roadStyle.color === c ? 'border-gold-400' : 'border-ink-700'"
            :style="{ background: c }"
            @click="roadStyle.color = c"
          />
          <input v-model.number="roadStyle.width" type="range" min="2" max="12" class="w-20 accent-gold-500">
          <label class="flex items-center gap-1.5 text-xs text-bone-400">
            <input v-model="roadStyle.dashed" type="checkbox" class="accent-gold-500">
            {{ $t('portal.tools.locationMap.roadDashed') }}
          </label>
          <template v-if="drawing.length">
            <button type="button" class="text-xs text-bone-400 hover:text-bone-200 underline" @click="undoRoadPoint">
              {{ $t('portal.tools.locationMap.undoPoint') }}
            </button>
            <button type="button" class="text-xs text-gold-400 hover:text-gold-300 underline" @click="finishRoad">
              {{ $t('portal.tools.locationMap.finishRoad') }}
            </button>
          </template>
        </div>

      </div>

      <!-- Vehicle picker: true-scale previews, body color to the right -->
      <div v-if="tool === 'vehicle' && page" class="mt-2 border border-ink-800 bg-ink-900/50 p-3">
        <div class="flex flex-wrap items-center gap-3">
          <button
            v-for="v in VEHICLE_KINDS"
            :key="v.kind"
            type="button"
            class="flex flex-col items-center justify-end gap-1.5 border px-3 py-2 transition-colors"
            :class="vehicleKind === v.kind ? 'border-gold-500/60 bg-ink-900' : 'border-ink-800 hover:border-ink-600'"
            @click="vehicleKind = v.kind"
          >
            <span :style="{ width: `${Math.round(v.lengthM * 9)}px`, height: `${Math.round(v.widthM * 9)}px` }" v-html="vehicleSvg(v.kind, v.lengthM, v.widthM, vehicleColor)" />
            <span class="text-xs" :class="vehicleKind === v.kind ? 'text-gold-400' : 'text-bone-400'">
              {{ $t(v.labelKey) }} · {{ v.lengthM }}×{{ v.widthM }} m
            </span>
          </button>
          <div class="ml-auto flex items-center gap-1.5">
            <span class="mr-1 text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.tools.locationMap.roadColor') }}</span>
            <button
              v-for="c in VEHICLE_COLORS"
              :key="c"
              type="button"
              class="h-6 w-6 rounded-full border-2"
              :class="vehicleColor === c ? 'border-gold-400' : 'border-ink-700'"
              :style="{ background: c }"
              @click="vehicleColor = c"
            />
          </div>
        </div>
      </div>

      <!-- Road-sign picker -->
      <div v-if="tool === 'sign' && page" class="mt-2 border border-ink-800 bg-ink-900/50 p-3">
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="g in ROAD_SIGN_GROUPS"
            :key="g"
            type="button"
            class="px-2 py-1 text-xs border transition-colors"
            :class="signGroup === g && !signSearch ? 'border-gold-500/60 text-gold-400 bg-ink-900' : 'border-ink-800 text-bone-500 hover:text-bone-300'"
            @click="signGroup = g; signSearch = ''"
          >
            {{ g }}
          </button>
          <input
            v-model="signSearch"
            type="text"
            class="input-dark !py-1 text-xs w-36 ml-auto"
            :placeholder="$t('portal.tools.locationMap.searchSigns')"
          >
          <label class="flex items-center gap-2 text-xs text-bone-400">
            {{ $t('portal.tools.locationMap.signSize') }}
            <input v-model.number="signSize" type="range" min="20" max="96" class="w-24 accent-gold-500">
          </label>
          <button
            type="button"
            class="px-2.5 py-1 text-xs border border-dashed border-ink-700 text-bone-500 hover:text-gold-400 transition-colors"
            @click="signFileInput?.click()"
          >
            + {{ $t('portal.tools.locationMap.customSign') }}
          </button>
        </div>
        <div class="mt-2 flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
          <button
            v-if="customSign"
            type="button"
            class="flex h-12 w-12 shrink-0 items-center justify-center border bg-ink-950/70 p-1 transition-colors"
            :class="useCustomSign ? 'border-gold-400' : 'border-ink-800 hover:border-ink-600'"
            :title="$t('portal.tools.locationMap.customSign')"
            @click="useCustomSign = true"
          >
            <img :src="customSign.url" class="max-h-full max-w-full" draggable="false">
          </button>
          <button
            v-for="s in filteredSigns"
            :key="s.id"
            type="button"
            class="flex h-12 w-12 shrink-0 items-center justify-center border bg-ink-950/70 p-1 transition-colors"
            :class="activeSign === s.id && !useCustomSign ? 'border-gold-400' : 'border-ink-800 hover:border-ink-600'"
            :title="s.id"
            @click="activeSign = s.id; useCustomSign = false"
          >
            <img :src="`/signs/is/${s.id}.svg`" class="max-h-full max-w-full" loading="lazy" draggable="false">
          </button>
          <p v-if="!filteredSigns.length" class="text-xs text-bone-500 p-2">{{ $t('portal.tools.locationMap.noSigns') }}</p>
        </div>
      </div>

      <!-- Hint line -->
      <p v-if="hint" class="mt-2 text-xs text-bone-500">{{ hint }}</p>

      <!-- Map + edit panel -->
      <div class="mt-3 flex gap-3">
        <!-- The reactive class lives on this wrapper, NOT on the Leaflet element:
             Vue rewrites the whole class attribute when a binding changes, which
             would wipe the classes Leaflet added to its own container. -->
        <!-- Locked to the PDF page shape (A4 landscape, 842:595): what you see
             here is exactly the window the export prints. Fills the full
             toolbar width; the height follows from the aspect ratio. -->
        <div class="relative flex-1 min-w-0" :class="{ 'lm-crosshair': tool !== 'pan' }">
          <div ref="mapEl" class="w-full aspect-[842/595] border border-ink-800 bg-ink-950" />
          <!-- Production-map style title card (also drawn on the PDF). -->
          <div v-if="doc.name" class="lm-map-title">
            <div class="lm-map-title-main">{{ doc.name }}</div>
            <div v-if="page?.title" class="lm-map-title-sub">{{ page.title }}</div>
          </div>
        </div>

        <!-- Selection panel -->
        <div v-if="selectedItem" class="w-64 shrink-0 border border-ink-800 bg-ink-900/50 p-4 space-y-4 self-start">
          <template v-if="selected!.type === 'marker'">
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.toolMarker') }}</label>
              <select v-model="(selectedItem as LocationMapMarker).kind" class="input-dark w-full" @change="onMarkerKindChange">
                <option v-for="k in MARKER_KINDS" :key="k.kind" :value="k.kind">{{ $t(k.labelKey) }}</option>
              </select>
            </div>
            <div v-if="(selectedItem as LocationMapMarker).kind === 'set'">
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.number') }}</label>
              <input
                v-model.number="(selectedItem as LocationMapMarker).num"
                type="number"
                min="1"
                max="999"
                class="input-dark w-full"
                @input="touch"
              >
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.label') }}</label>
              <input
                v-model="(selectedItem as LocationMapMarker).label"
                type="text"
                maxlength="120"
                class="input-dark w-full"
                @input="touch"
              >
            </div>
            <a
              v-if="page && page.base !== 'image'"
              :href="`https://www.google.com/maps?q=${(selectedItem as LocationMapMarker).lat.toFixed(6)},${(selectedItem as LocationMapMarker).lng.toFixed(6)}`"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 underline underline-offset-2"
            >
              {{ $t('portal.tools.locationMap.openMaps') }} ↗
            </a>
          </template>

          <template v-else-if="selected!.type === 'text'">
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.textContent') }}</label>
              <textarea
                ref="textInput"
                v-model="(selectedItem as LocationMapText).text"
                rows="4"
                maxlength="500"
                class="input-dark w-full"
                @input="touch"
              />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.fontSize') }}</label>
              <input
                v-model.number="(selectedItem as LocationMapText).size"
                type="range"
                min="10"
                max="32"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadColor') }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in TEXT_COLORS"
                  :key="c"
                  type="button"
                  class="h-6 w-6 rounded-full border-2"
                  :class="((selectedItem as LocationMapText).color || DEFAULT_TEXT_COLOR) === c ? 'border-gold-400' : 'border-ink-700'"
                  :style="{ background: c }"
                  @click="(selectedItem as LocationMapText).color = c; touch()"
                />
              </div>
            </div>
          </template>

          <template v-else-if="selected!.type === 'vehicle'">
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.toolVehicle') }}</label>
              <select v-model="(selectedItem as LocationMapVehicle).kind" class="input-dark w-full" @change="onVehicleKindChange">
                <option v-for="v in VEHICLE_KINDS" :key="v.kind" :value="v.kind">{{ $t(v.labelKey) }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.lengthM') }}</label>
                <input
                  v-model.number="(selectedItem as LocationMapVehicle).lengthM"
                  type="number"
                  min="1"
                  max="30"
                  step="0.1"
                  class="input-dark w-full"
                  @input="touch"
                >
              </div>
              <div>
                <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.widthM') }}</label>
                <input
                  v-model.number="(selectedItem as LocationMapVehicle).widthM"
                  type="number"
                  min="1"
                  max="6"
                  step="0.05"
                  class="input-dark w-full"
                  @input="touch"
                >
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ $t('portal.tools.locationMap.rotation') }} · {{ (selectedItem as LocationMapVehicle).rotation }}°
              </label>
              <input
                v-model.number="(selectedItem as LocationMapVehicle).rotation"
                type="range"
                min="0"
                max="359"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadColor') }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in VEHICLE_COLORS"
                  :key="c"
                  type="button"
                  class="h-6 w-6 rounded-full border-2"
                  :class="(selectedItem as LocationMapVehicle).color === c ? 'border-gold-400' : 'border-ink-700'"
                  :style="{ background: c }"
                  @click="(selectedItem as LocationMapVehicle).color = c; touch()"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.label') }}</label>
              <input
                v-model="(selectedItem as LocationMapVehicle).label"
                type="text"
                maxlength="120"
                class="input-dark w-full"
                @input="touch"
              >
            </div>
            <button type="button" class="w-full border border-gold-500/40 py-1.5 text-xs uppercase tracking-widest text-gold-400 hover:bg-gold-500/10 transition-colors" @click="duplicateVehicle">
              {{ $t('portal.tools.locationMap.duplicate') }}
            </button>
          </template>

          <template v-else-if="selected!.type === 'sign'">
            <div class="flex justify-center bg-ink-950/70 p-3">
              <img :src="(selectedItem as LocationMapSign).custom ?? `/signs/is/${(selectedItem as LocationMapSign).sign}.svg`" class="h-16" draggable="false">
            </div>
            <p class="text-center text-xs text-bone-500">
              {{ (selectedItem as LocationMapSign).custom ? $t('portal.tools.locationMap.customSign') : (selectedItem as LocationMapSign).sign }}
            </p>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ $t('portal.tools.locationMap.signSize') }} · {{ (selectedItem as LocationMapSign).size }}px
              </label>
              <input
                v-model.number="(selectedItem as LocationMapSign).size"
                type="range"
                min="16"
                max="160"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ $t('portal.tools.locationMap.rotation') }} · {{ (selectedItem as LocationMapSign).rotation ?? 0 }}°
              </label>
              <input
                :value="(selectedItem as LocationMapSign).rotation ?? 0"
                type="range"
                min="0"
                max="359"
                class="w-full accent-gold-500"
                @input="(selectedItem as LocationMapSign).rotation = Number(($event.target as HTMLInputElement).value); touch()"
              >
            </div>
          </template>

          <template v-else-if="selected!.type === 'shape'">
            <div v-if="(selectedItem as LocationMapShape).shape === 'reserved'">
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.label') }}</label>
              <input
                v-model="(selectedItem as LocationMapShape).label"
                type="text"
                maxlength="60"
                class="input-dark w-full"
                @input="touch"
              >
            </div>
            <div v-if="['rect', 'reserved'].includes((selectedItem as LocationMapShape).shape)">
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ $t('portal.tools.locationMap.rotation') }} · {{ (selectedItem as LocationMapShape).rotation ?? 0 }}°
              </label>
              <input
                :value="(selectedItem as LocationMapShape).rotation ?? 0"
                type="range"
                min="0"
                max="359"
                class="w-full accent-gold-500"
                @input="(selectedItem as LocationMapShape).rotation = Number(($event.target as HTMLInputElement).value); touch()"
              >
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadColor') }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in ROAD_COLORS"
                  :key="c"
                  type="button"
                  class="h-6 w-6 rounded-full border-2"
                  :class="(selectedItem as LocationMapShape).color === c ? 'border-gold-400' : 'border-ink-700'"
                  :style="{ background: c }"
                  @click="(selectedItem as LocationMapShape).color = c; touch()"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadWidth') }}</label>
              <input
                v-model.number="(selectedItem as LocationMapShape).width"
                type="range"
                min="1"
                max="12"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
            <label v-if="(selectedItem as LocationMapShape).shape !== 'arrow'" class="flex items-center gap-2 text-sm text-bone-300">
              <input v-model="(selectedItem as LocationMapShape).fill" type="checkbox" class="accent-gold-500" @change="touch">
              {{ $t('portal.tools.locationMap.fill') }}
            </label>
            <div v-if="(selectedItem as LocationMapShape).fill && (selectedItem as LocationMapShape).shape !== 'arrow'">
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ $t('portal.tools.locationMap.opacity') }} · {{ Math.round((selectedItem as LocationMapShape).fillOpacity * 100) }}%
              </label>
              <input
                v-model.number="(selectedItem as LocationMapShape).fillOpacity"
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
          </template>

          <template v-else-if="selected!.type === 'measure'">
            <div class="text-center">
              <p class="text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.tools.locationMap.distance') }}</p>
              <p class="mt-1 text-2xl font-semibold text-gold-400">{{ fmtDist(measureTotal((selectedItem as LocationMapMeasure).points)) }}</p>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadColor') }}</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="c in MEASURE_COLORS"
                  :key="c"
                  type="button"
                  class="h-6 w-6 rounded-full border-2"
                  :class="((selectedItem as LocationMapMeasure).color ?? '#ffd75e') === c ? 'border-gold-400' : 'border-ink-700'"
                  :style="{ background: c }"
                  @click="(selectedItem as LocationMapMeasure).color = c; touch()"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadWidth') }}</label>
              <input
                :value="(selectedItem as LocationMapMeasure).width ?? 3"
                type="range"
                min="1"
                max="12"
                class="w-full accent-gold-500"
                @input="(selectedItem as LocationMapMeasure).width = Number(($event.target as HTMLInputElement).value); touch()"
              >
            </div>
            <label class="flex items-center gap-2 text-sm text-bone-300">
              <input
                :checked="(selectedItem as LocationMapMeasure).dashed ?? true"
                type="checkbox"
                class="accent-gold-500"
                @change="(selectedItem as LocationMapMeasure).dashed = ($event.target as HTMLInputElement).checked; touch()"
              >
              {{ $t('portal.tools.locationMap.roadDashed') }}
            </label>
          </template>

          <template v-else-if="selected!.type === 'road'">
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadColor') }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in ROAD_COLORS"
                  :key="c"
                  type="button"
                  class="h-6 w-6 rounded-full border-2"
                  :class="(selectedItem as LocationMapRoad).color === c ? 'border-gold-400' : 'border-ink-700'"
                  :style="{ background: c }"
                  @click="(selectedItem as LocationMapRoad).color = c; touch()"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadWidth') }}</label>
              <input
                v-model.number="(selectedItem as LocationMapRoad).width"
                type="range"
                min="2"
                max="12"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
            <label class="flex items-center gap-2 text-sm text-bone-300">
              <input v-model="(selectedItem as LocationMapRoad).dashed" type="checkbox" class="accent-gold-500" @change="touch">
              {{ $t('portal.tools.locationMap.roadDashed') }}
            </label>
          </template>

          <button type="button" class="w-full border border-signal-500/40 py-1.5 text-xs uppercase tracking-widest text-signal-500 hover:bg-signal-500/10 transition-colors" @click="deleteSelected">
            {{ $t('portal.tools.locationMap.remove') }}
          </button>
        </div>
      </div>
    </template>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onImagePicked">
    <input ref="signFileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onSignImagePicked">
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type * as Leaflet from 'leaflet'
import type { LatLng, LocationMapDoc, LocationMapMarker, LocationMapMeasure, LocationMapPage, LocationMapRoad, LocationMapShape, LocationMapSign, LocationMapText, LocationMapVehicle, LocationMarkerKind, VehicleMarkerKind } from '~/types'
import { DEFAULT_TEXT_COLOR, MARKER_KINDS, markerKindDef, metersPerPixel, newLocalId, newMapPage, pinSvg, ROAD_COLORS, TEXT_COLORS, TILE_SOURCES, VEHICLE_COLORS, VEHICLE_KINDS, vehicleKindDef, vehicleSvg } from '~/utils/locationMap'
import { ROAD_SIGN_GROUPS, ROAD_SIGNS, roadSignDef } from '~/data/roadSigns'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('location-map')

const { t } = useI18n()
const { confirmDialog } = useAppDialog()
const localePath = useLocalePath()
const route = useRoute()
const mapId = route.params.id as string

const TOOL_MODES = [
  { id: 'pan', labelKey: 'portal.tools.locationMap.toolPan' },
  { id: 'marker', labelKey: 'portal.tools.locationMap.toolMarker' },
  { id: 'text', labelKey: 'portal.tools.locationMap.toolText' },
  { id: 'road', labelKey: 'portal.tools.locationMap.toolRoad' },
  { id: 'measure', labelKey: 'portal.tools.locationMap.toolMeasure' },
  { id: 'shape', labelKey: 'portal.tools.locationMap.toolShape' },
  { id: 'sign', labelKey: 'portal.tools.locationMap.toolSign' },
  { id: 'vehicle', labelKey: 'portal.tools.locationMap.toolVehicle' },
] as const
type ToolMode = typeof TOOL_MODES[number]['id']

const doc = ref<LocationMapDoc | null>(null)

// Back to the list, job-scoped when opened from a job (?job=) or when the map
// itself is linked to one ("Hjálpargögn" on the job page).
const backJob = computed(() =>
  (typeof route.query.job === 'string' && route.query.job) || doc.value?.jobId || '')
const backTo = computed(() =>
  localePath({ path: '/portal/tools/location-map', query: backJob.value ? { job: backJob.value } : {} }))
const notFound = ref(false)
const pageIdx = ref(0)
const page = computed(() => doc.value?.pages[pageIdx.value])

const tool = ref<ToolMode>('pan')
const markerKind = ref<LocationMarkerKind>('set')
const vehicleKind = ref<VehicleMarkerKind>('truck')
const vehicleColor = ref(VEHICLE_COLORS[1]!)

// True-scale vehicles and distance measuring need real-world coordinates —
// image pages have none.
const availableModes = computed(() =>
  page.value?.base === 'image' ? TOOL_MODES.filter(m => m.id !== 'vehicle' && m.id !== 'measure') : TOOL_MODES)
const roadStyle = reactive({ color: ROAD_COLORS[0]!, width: 4, dashed: false })
const drawing = ref<LatLng[]>([])
const shapeKind = ref<'rect' | 'circle' | 'poly' | 'reserved' | 'arrow'>('rect')
const shapeStyle = reactive({ color: ROAD_COLORS[0]!, width: 3, fill: true, fillOpacity: 0.25 })
/** First corner/center of an in-progress 2-click shape. */
const shapeStart = ref<LatLng | null>(null)
/** Points of an in-progress polygon outline. */
const polyPts = ref<LatLng[]>([])
/** Points of an in-progress measurement. */
const measurePts = ref<LatLng[]>([])
/** Live running total (m) while measuring, cursor included. */
const measureLive = ref<number | null>(null)
const MEASURE_COLORS = [DEFAULT_TEXT_COLOR, ...ROAD_COLORS]
const measureStyle = reactive({ color: DEFAULT_TEXT_COLOR, width: 3, dashed: true })

/** Chip text follows the line color, except near-black lines get cream. */
function chipTextColor(color: string): string {
  const m = /^#([0-9a-f]{6})/i.exec(color)
  if (!m) return color
  const n = Number.parseInt(m[1]!, 16)
  const lum = 0.299 * ((n >> 16) & 0xFF) + 0.587 * ((n >> 8) & 0xFF) + 0.114 * (n & 0xFF)
  return lum < 80 ? '#f5f2e9' : color
}

// Road-sign picker: group tabs, id search (across all groups) and the sign
// that the next map click will place.
const signGroup = ref<string>(ROAD_SIGN_GROUPS[0])
const signSearch = ref('')
const activeSign = ref<string>(ROAD_SIGNS[0]?.id ?? '')
const SIGN_DEFAULT_SIZE = 36
const signSize = ref(SIGN_DEFAULT_SIZE)
/** Last uploaded custom sign; used for placement while useCustomSign is on. */
const customSign = ref<{ url: string, w: number, h: number } | null>(null)
const useCustomSign = ref(false)
const signFileInput = ref<HTMLInputElement | null>(null)
const filteredSigns = computed(() => {
  const q = signSearch.value.trim().toLowerCase()
  if (q) return ROAD_SIGNS.filter(s => s.id.toLowerCase().includes(q)).slice(0, 200)
  return ROAD_SIGNS.filter(s => s.group === signGroup.value)
})

const selected = ref<{ type: 'marker' | 'text' | 'road' | 'vehicle' | 'shape' | 'sign' | 'measure', id: string } | null>(null)
const saveState = ref<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle')
const exporting = ref(false)
const exportError = ref('')

const mapEl = ref<HTMLElement | null>(null)
const textInput = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
/** True while the file dialog should replace the current page's image. */
let replacingImage = false

const hint = computed(() => {
  if (tool.value === 'marker') return t('portal.tools.locationMap.markerHint')
  if (tool.value === 'text') return t('portal.tools.locationMap.textHint')
  if (tool.value === 'road') return t('portal.tools.locationMap.roadHint')
  if (tool.value === 'measure') {
    const base = t('portal.tools.locationMap.measureHint')
    return measureLive.value != null ? `${base} · ${fmtDist(measureLive.value)}` : base
  }
  if (tool.value === 'shape') {
    return t(shapeKind.value === 'poly' ? 'portal.tools.locationMap.polyHint' : 'portal.tools.locationMap.shapeHint')
  }
  if (tool.value === 'sign') return t('portal.tools.locationMap.signHint')
  if (tool.value === 'vehicle') return t('portal.tools.locationMap.vehicleHint')
  return ''
})

/** "834 m" / "1,24 km". */
const fmtDist = (m: number): string =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2).replace('.', ',')} km`

const measureTotal = (points: LatLng[]): number => {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += map?.distance([points[i - 1]!.lat, points[i - 1]!.lng], [points[i]!.lat, points[i]!.lng]) ?? 0
  }
  return total
}

/**
 * Point halfway ALONG the measured path plus the screen angle of that segment,
 * so the distance chip can sit parallel to the line. The angle is flipped when
 * needed so the text is never upside down.
 */
function midpointAlong(points: LatLng[]): { point: LatLng, angle: number } {
  const segAngle = (a: LatLng, b: LatLng): number => {
    const Z = 12 // Mercator is conformal: screen angle is zoom-independent
    const pa = map!.project([a.lat, a.lng], Z)
    const pb = map!.project([b.lat, b.lng], Z)
    let deg = (Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180) / Math.PI
    if (deg > 90) deg -= 180
    else if (deg < -90) deg += 180
    return deg
  }
  const half = measureTotal(points) / 2
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    const seg = map?.distance([a.lat, a.lng], [b.lat, b.lng]) ?? 0
    if (seg > 0 && acc + seg >= half) {
      const f = (half - acc) / seg
      return {
        point: { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f },
        angle: segAngle(a, b),
      }
    }
    acc += seg
  }
  return { point: points[points.length - 1]!, angle: 0 }
}

/**
 * Drop consecutive points that sit on (almost) the same screen pixel — the
 * second click of a finishing double-click leaves such a duplicate behind.
 */
function dropDuplicatePoints(points: LatLng[]): LatLng[] {
  if (!map) return points
  const Z = map.getZoom()
  const out: LatLng[] = []
  for (const p of points) {
    const last = out[out.length - 1]
    if (last) {
      const pa = map.project([last.lat, last.lng], Z)
      const pb = map.project([p.lat, p.lng], Z)
      if (Math.hypot(pb.x - pa.x, pb.y - pa.y) < 8) continue
    }
    out.push(p)
  }
  return out
}

const selectedItem = computed<LocationMapMarker | LocationMapText | LocationMapRoad | LocationMapVehicle | LocationMapShape | LocationMapSign | null>(() => {
  const p = page.value
  const sel = selected.value
  if (!p || !sel) return null
  if (sel.type === 'marker') return p.markers.find(m => m.id === sel.id) ?? null
  if (sel.type === 'text') return p.texts.find(x => x.id === sel.id) ?? null
  if (sel.type === 'vehicle') return p.vehicles.find(v => v.id === sel.id) ?? null
  if (sel.type === 'shape') return (p.shapes ?? []).find(x => x.id === sel.id) ?? null
  if (sel.type === 'sign') return (p.signs ?? []).find(x => x.id === sel.id) ?? null
  if (sel.type === 'measure') return (p.measures ?? []).find(x => x.id === sel.id) ?? null
  return p.roads.find(r => r.id === sel.id) ?? null
})

// ── Leaflet (client-only; the /portal route tree is ssr: false) ─────────────

let L: typeof Leaflet | null = null
let map: Leaflet.Map | null = null
let overlayLayers: Leaflet.Layer[] = []
let previewLine: Leaflet.Polyline | null = null
let shapePreview: Leaflet.Layer | null = null
let resizeObserver: ResizeObserver | null = null
/** Suppress moveend persistence while programmatically setting the view. */
let restoring = false

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]!))

/** Persist the editor viewport size on the page; true when it changed. */
function storeViewSize(pg: LocationMapPage): boolean {
  const el = mapEl.value
  if (!el || !el.clientWidth || !el.clientHeight) return false
  const w = Math.round(el.clientWidth)
  const h = Math.round(el.clientHeight)
  if (pg.viewW === w && pg.viewH === h) return false
  pg.viewW = w
  pg.viewH = h
  return true
}

function buildMap() {
  const p = page.value
  if (!L || !p || !mapEl.value) return
  map?.remove()
  map = null
  overlayLayers = []
  previewLine = null
  shapePreview = null
  measurePreview = null

  restoring = true
  if (p.base === 'image') {
    const w = p.imageW || 1000
    const h = p.imageH || 1000
    map = L.map(mapEl.value, { crs: L.CRS.Simple, minZoom: -5, zoomControl: false, doubleClickZoom: false, attributionControl: false })
    L.imageOverlay(p.image!, [[0, 0], [h, w]]).addTo(map)
    // Fresh image pages carry the placeholder view set at creation — fit the
    // whole picture instead; the first moveend persists the real view.
    if (p.zoom === 0 && p.center.lat === h / 2 && p.center.lng === w / 2) {
      map.fitBounds([[0, 0], [h, w]])
    }
    else {
      map.setView([p.center.lat, p.center.lng], p.zoom)
    }
  }
  else {
    const src = TILE_SOURCES[p.base]
    map = L.map(mapEl.value, { zoomControl: false, doubleClickZoom: false })
    L.tileLayer(src.url, { maxZoom: src.maxZoom, attribution: src.attribution, crossOrigin: true }).addTo(map)
    map.setView([p.center.lat, p.center.lng], p.zoom)
  }
  restoring = false
  if (storeViewSize(p)) markDirty()

  // Zoom control on the right — the title card owns the top-left corner.
  L.control.zoom({ position: 'topright' }).addTo(map)

  map.on('moveend zoomend', () => {
    const pg = page.value
    if (restoring || !map || !pg) return
    const c = map.getCenter()
    pg.center = { lat: c.lat, lng: c.lng }
    pg.zoom = map.getZoom()
    storeViewSize(pg)
    markDirty()
  })
  // Viewport size drives the WYSIWYG PDF crop — persist it when it changes
  // (window resize, side panel toggling).
  map.on('resize', () => {
    const pg = page.value
    if (!restoring && pg && storeViewSize(pg)) markDirty()
  })
  map.on('click', (e: Leaflet.LeafletMouseEvent) => onMapClick(e.latlng))
  // Live previews while a shape/polygon/measurement is being drawn.
  map.on('mousemove', (e: Leaflet.LeafletMouseEvent) => {
    const cursor = { lat: e.latlng.lat, lng: e.latlng.lng }
    if (tool.value === 'shape' && (shapeStart.value || polyPts.value.length)) updateShapePreview(cursor)
    else if (tool.value === 'measure' && measurePts.value.length) updateMeasurePreview(cursor)
  })
  // Vehicle footprints (px-per-meter) and arrowheads (fixed screen px) are
  // zoom-dependent — recompute after zooming.
  map.on('zoomend', () => {
    const pg = page.value
    if (restoring || !pg) return
    const zoomDependent = (pg.base !== 'image' && pg.vehicles.length > 0)
      || (pg.shapes ?? []).some(s => s.shape === 'arrow')
    if (zoomDependent) renderOverlays()
  })
  map.on('dblclick', () => {
    // In every case the double-click also fired a plain click — pop it.
    if (tool.value === 'road' && drawing.value.length) {
      drawing.value.pop()
      finishRoad()
    }
    else if (tool.value === 'shape' && shapeKind.value === 'poly' && polyPts.value.length) {
      polyPts.value.pop()
      finishPoly()
    }
    else if (tool.value === 'measure' && measurePts.value.length) {
      // No pop here: finishMeasure de-duplicates the double-click's extra
      // point itself, which is far more reliable across click-event timing.
      finishMeasure()
    }
  })

  renderOverlays()
}

/**
 * Corners of a rectangle rotated around its center. Rotation happens in
 * projected space at a fixed zoom (Mercator is conformal, so screen angles
 * match; works for CRS.Simple too), then back to lat/lng.
 */
function rotatedRectLatLngs(a: LatLng, b: LatLng, rotation: number): [number, number][] {
  const Z = 12
  const pa = map!.project([a.lat, a.lng], Z)
  const pb = map!.project([b.lat, b.lng], Z)
  const cx = (pa.x + pb.x) / 2
  const cy = (pa.y + pb.y) / 2
  const rad = (rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return ([[pa.x, pa.y], [pb.x, pa.y], [pb.x, pb.y], [pa.x, pb.y]] as const).map(([x, y]) => {
    const dx = x - cx
    const dy = y - cy
    const ll = map!.unproject(L!.point(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos), Z)
    return [ll.lat, ll.lng] as [number, number]
  })
}

/**
 * Diagonal-hatch fill for reserved-parking stamps (SVG pattern injected into
 * Leaflet's overlay-pane svg, one per color); returns a fill-url or the color.
 */
function hatchFill(color: string, rotation = 0): string {
  const svg = mapEl.value?.querySelector('.leaflet-overlay-pane svg')
  if (!svg) return color
  // Stripes stay diagonal RELATIVE TO THE STAMP, so the pattern turns with it.
  const angle = (45 + rotation) % 360
  const id = `lm-hatch-${color.replace(/[^0-9a-z]/gi, '')}-${angle}`
  if (!svg.querySelector(`#${id}`)) {
    const ns = 'http://www.w3.org/2000/svg'
    let defs = svg.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS(ns, 'defs')
      svg.insertBefore(defs, svg.firstChild)
    }
    const pattern = document.createElementNS(ns, 'pattern')
    pattern.setAttribute('id', id)
    pattern.setAttribute('patternUnits', 'userSpaceOnUse')
    pattern.setAttribute('width', '10')
    pattern.setAttribute('height', '10')
    pattern.setAttribute('patternTransform', `rotate(${angle})`)
    const bg = document.createElementNS(ns, 'rect')
    bg.setAttribute('width', '10')
    bg.setAttribute('height', '10')
    bg.setAttribute('fill', color)
    bg.setAttribute('fill-opacity', '0.12')
    const stripe = document.createElementNS(ns, 'rect')
    stripe.setAttribute('width', '3')
    stripe.setAttribute('height', '10')
    stripe.setAttribute('fill', color)
    stripe.setAttribute('fill-opacity', '0.85')
    pattern.append(bg, stripe)
    defs.append(pattern)
  }
  return `url(#${id})`
}

/** Build a Leaflet layer for a shape (also used for the drawing preview). */
function shapeLayer(sh: Omit<LocationMapShape, 'id'>, preview = false): Leaflet.Layer {
  const opts: Leaflet.InteractiveLayerOptions & Leaflet.PathOptions & { draggable?: boolean } = {
    color: sh.color,
    weight: sh.width,
    fill: sh.fill,
    fillColor: sh.color,
    fillOpacity: sh.fill ? sh.fillOpacity : 0,
    dashArray: preview ? '6 6' : undefined,
    opacity: preview ? 0.8 : 1,
    // Previews must never swallow the clicks that are drawing them.
    interactive: !preview,
    // leaflet-path-drag: shapes can be moved around by dragging.
    draggable: !preview,
  }
  if (sh.shape === 'arrow') {
    // Shaft polyline + filled head triangle, head sized in SCREEN px at the
    // current zoom (re-rendered on zoomend so it never scales with the map).
    const Z = map!.getZoom()
    const pa = map!.project([sh.a!.lat, sh.a!.lng], Z)
    const pb = map!.project([sh.b!.lat, sh.b!.lng], Z)
    const len = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1
    const ux = (pb.x - pa.x) / len
    const uy = (pb.y - pa.y) / len
    const headLen = Math.min(10 + sh.width * 3, len * 0.5)
    const headW = headLen * 0.55
    const base = { x: pb.x - ux * headLen, y: pb.y - uy * headLen }
    const up = (pt: { x: number, y: number }) => map!.unproject(L!.point(pt.x, pt.y), Z)
    const baseLL = up(base)
    const leftLL = up({ x: base.x - uy * headW, y: base.y + ux * headW })
    const rightLL = up({ x: base.x + uy * headW, y: base.y - ux * headW })
    const partOpts: Leaflet.PathOptions & { draggable?: boolean } = {
      color: sh.color,
      opacity: preview ? 0.8 : 1,
      interactive: !preview,
      draggable: !preview,
    }
    const shaft = L!.polyline([[sh.a!.lat, sh.a!.lng], [baseLL.lat, baseLL.lng]], {
      ...partOpts,
      weight: sh.width,
      lineCap: 'round',
      dashArray: preview ? '6 6' : undefined,
    })
    const head = L!.polygon([[sh.b!.lat, sh.b!.lng], [leftLL.lat, leftLL.lng], [rightLL.lat, rightLL.lng]], {
      ...partOpts,
      weight: 1,
      fillColor: sh.color,
      fillOpacity: preview ? 0.8 : 1,
    })
    return L!.featureGroup([shaft, head])
  }
  if (sh.shape === 'poly') {
    return L!.polygon((sh.points ?? []).map(pt => [pt.lat, pt.lng] as [number, number]), opts)
  }
  if (sh.shape === 'rect' || sh.shape === 'reserved') {
    return sh.rotation
      ? L!.polygon(rotatedRectLatLngs(sh.a!, sh.b!, sh.rotation), opts)
      : L!.rectangle([[sh.a!.lat, sh.a!.lng], [sh.b!.lat, sh.b!.lng]], opts)
  }
  // Circle: center a, edge at b. map.distance works for both CRS (meters on
  // real maps, pixel units on CRS.Simple image pages) — matching L.circle.
  return L!.circle([sh.a!.lat, sh.a!.lng], {
    ...opts,
    radius: map!.distance([sh.a!.lat, sh.a!.lng], [sh.b!.lat, sh.b!.lng]),
  })
}

/** Rebuild the in-progress shape preview (2-click shapes and polygons). */
function updateShapePreview(cursor?: LatLng) {
  shapePreview?.remove()
  shapePreview = null
  if (!L || !map) return
  if (shapeKind.value === 'poly') {
    const pts = cursor ? [...polyPts.value, cursor] : polyPts.value
    if (pts.length >= 2) shapePreview = shapeLayer({ shape: 'poly', points: pts, ...shapeStyle }, true).addTo(map)
  }
  else if (shapeStart.value && cursor) {
    shapePreview = shapeLayer({ shape: shapeKind.value, a: shapeStart.value, b: cursor, ...shapeStyle }, true).addTo(map)
    if (shapeKind.value === 'reserved') {
      ;(shapePreview as Leaflet.Path).setStyle({ fillColor: hatchFill(shapeStyle.color), fillOpacity: 1 })
    }
  }
}

let measurePreview: Leaflet.Polyline | null = null

/** Rebuild the in-progress measurement preview + live total. */
function updateMeasurePreview(cursor?: LatLng) {
  measurePreview?.remove()
  measurePreview = null
  if (!L || !map || !measurePts.value.length) {
    measureLive.value = null
    return
  }
  const pts = cursor ? [...measurePts.value, cursor] : measurePts.value
  measureLive.value = measureTotal(pts)
  if (pts.length >= 2) {
    measurePreview = L.polyline(pts.map(pt => [pt.lat, pt.lng] as [number, number]), {
      color: measureStyle.color,
      weight: measureStyle.width,
      dashArray: measureStyle.dashed ? '4 8' : undefined,
      opacity: 0.9,
      // Previews must never swallow the clicks that are drawing them.
      interactive: false,
    }).addTo(map)
  }
}

/**
 * Reference latlng of a path/circle layer, used to measure drag deltas.
 * Returns a plain COPY: leaflet-path-drag mutates the layer's LatLng objects
 * in place, so holding a reference would watch the value change under us.
 */
function layerRefLatLng(target: Leaflet.Layer): LatLng | null {
  let ll: Leaflet.LatLng | undefined
  if (target instanceof L!.Circle) {
    ll = target.getLatLng()
  }
  else if (target instanceof L!.Polyline) {
    const flat = (target.getLatLngs() as (Leaflet.LatLng | Leaflet.LatLng[] | Leaflet.LatLng[][])[]).flat(2) as Leaflet.LatLng[]
    ll = flat[0]
  }
  return ll ? { lat: ll.lat, lng: ll.lng } : null
}

function renderOverlays() {
  const p = page.value
  if (!L || !map || !p) return
  for (const layer of overlayLayers) layer.remove()
  overlayLayers = []

  // Shapes go in first so roads, vehicles and pins draw on top of them.
  for (const sh of p.shapes ?? []) {
    const layer = shapeLayer(sh).addTo(map)
    layer.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      if (tool.value === 'pan') selected.value = { type: 'shape', id: sh.id }
    })
    // Drag-to-move: shift the stored coordinates by the drag delta. The drag
    // plugin fires its events WITHOUT propagation, so for an arrow (feature
    // group) the handlers must sit on each part, not on the group.
    let dragFrom: LatLng | null = null
    const dragParts = layer instanceof L.FeatureGroup ? layer.getLayers() : [layer]
    for (const part of dragParts) {
      part.on('dragstart', () => {
        dragFrom = layerRefLatLng(part)
      })
      part.on('dragend', () => {
        const from = dragFrom
        dragFrom = null
        if (!from) return
        // Read the moved position on the NEXT tick: the drag plugin bakes the
        // new latlngs into the layer after firing dragend, not before.
        setTimeout(() => {
          const to = layerRefLatLng(part)
          if (!to) return
          const dLat = to.lat - from.lat
          const dLng = to.lng - from.lng
          if (!dLat && !dLng) return
          if (sh.a) sh.a = { lat: sh.a.lat + dLat, lng: sh.a.lng + dLng }
          if (sh.b) sh.b = { lat: sh.b.lat + dLat, lng: sh.b.lng + dLng }
          if (sh.points) sh.points = sh.points.map(pt => ({ lat: pt.lat + dLat, lng: pt.lng + dLng }))
          selected.value = { type: 'shape', id: sh.id }
          markDirty()
          renderOverlays()
        }, 0)
      })
    }
    overlayLayers.push(layer)
    if (sh.shape === 'reserved') {
      // Reference style: pale fill with diagonal hatching, solid outline.
      ;(layer as Leaflet.Path).setStyle({ fillColor: hatchFill(sh.color, sh.rotation ?? 0), fillOpacity: 1 })
      // Center label only when the user typed one.
      if (sh.label && sh.a && sh.b) {
        const icon = L.divIcon({
          className: 'lm-icon',
          html: `<div class="lm-reserved" style="color:${sh.color}">${esc(sh.label)}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
        const lm = L.marker([(sh.a.lat + sh.b.lat) / 2, (sh.a.lng + sh.b.lng) / 2], { icon, interactive: false }).addTo(map)
        overlayLayers.push(lm)
      }
    }
  }

  // Measurements (map pages only): dashed gold line + distance chip at the end.
  if (p.base !== 'image') {
    for (const ms of p.measures ?? []) {
      const latlngs = ms.points.map(pt => [pt.lat, pt.lng] as [number, number])
      const line = L.polyline(latlngs, {
        color: ms.color ?? '#ffd75e',
        weight: ms.width ?? 3,
        dashArray: (ms.dashed ?? true) ? '4 8' : undefined,
        // leaflet-path-drag: measurements can be moved around like shapes.
        draggable: true,
      } as Leaflet.PolylineOptions & { draggable?: boolean }).addTo(map)
      line.on('click', (e: Leaflet.LeafletMouseEvent) => {
        L!.DomEvent.stopPropagation(e)
        if (tool.value === 'pan') selected.value = { type: 'measure', id: ms.id }
      })
      let dragFrom: LatLng | null = null
      line.on('dragstart', () => {
        dragFrom = layerRefLatLng(line)
      })
      line.on('dragend', () => {
        const from = dragFrom
        dragFrom = null
        if (!from) return
        setTimeout(() => {
          const to = layerRefLatLng(line)
          if (!to) return
          const dLat = to.lat - from.lat
          const dLng = to.lng - from.lng
          if (!dLat && !dLng) return
          ms.points = ms.points.map(pt => ({ lat: pt.lat + dLat, lng: pt.lng + dLng }))
          selected.value = { type: 'measure', id: ms.id }
          markDirty()
          renderOverlays()
        }, 0)
      })
      overlayLayers.push(line)
      const { point: mid, angle } = midpointAlong(ms.points)
      const icon = L.divIcon({
        className: 'lm-icon',
        // Parallel to the line, floated just off it (translateY in the
        // rotated frame is perpendicular to the segment).
        html: `<div class="lm-measure-chip" style="color:${chipTextColor(ms.color ?? '#ffd75e')};transform:translate(-50%,-50%) rotate(${angle}deg) translateY(-14px)">${esc(fmtDist(measureTotal(ms.points)))}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })
      const chip = L.marker([mid.lat, mid.lng], { icon }).addTo(map)
      chip.on('click', (e: Leaflet.LeafletMouseEvent) => {
        L!.DomEvent.stopPropagation(e)
        selected.value = { type: 'measure', id: ms.id }
      })
      overlayLayers.push(chip)
    }
  }

  for (const road of p.roads) {
    const line = L.polyline(road.points.map(pt => [pt.lat, pt.lng] as [number, number]), {
      color: road.color,
      weight: road.width,
      dashArray: road.dashed ? '8 6' : undefined,
      // leaflet-path-drag: roads can be moved around like shapes.
      draggable: true,
    } as Leaflet.PolylineOptions & { draggable?: boolean }).addTo(map)
    line.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      if (tool.value === 'pan') selected.value = { type: 'road', id: road.id }
    })
    let dragFrom: LatLng | null = null
    line.on('dragstart', () => {
      dragFrom = layerRefLatLng(line)
    })
    line.on('dragend', () => {
      const from = dragFrom
      dragFrom = null
      if (!from) return
      // Read the moved position on the NEXT tick: the drag plugin bakes the
      // new latlngs into the layer after firing dragend, not before.
      setTimeout(() => {
        const to = layerRefLatLng(line)
        if (!to) return
        const dLat = to.lat - from.lat
        const dLng = to.lng - from.lng
        if (!dLat && !dLng) return
        road.points = road.points.map(pt => ({ lat: pt.lat + dLat, lng: pt.lng + dLng }))
        selected.value = { type: 'road', id: road.id }
        markDirty()
        renderOverlays()
      }, 0)
    })
    overlayLayers.push(line)
  }

  for (const tx of p.texts) {
    const icon = L.divIcon({
      className: 'lm-icon',
      html: `<div class="lm-textbox" style="font-size:${tx.size}px;color:${tx.color || DEFAULT_TEXT_COLOR}">${esc(tx.text || '…').replace(/\n/g, '<br>')}</div>`,
      iconSize: undefined as unknown as Leaflet.PointExpression,
      iconAnchor: [0, 0],
    })
    const m = L.marker([tx.lat, tx.lng], { icon, draggable: true }).addTo(map)
    m.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      selected.value = { type: 'text', id: tx.id }
    })
    m.on('dragend', () => {
      const ll = m.getLatLng()
      tx.lat = ll.lat
      tx.lng = ll.lng
      markDirty()
    })
    overlayLayers.push(m)
  }

  // True-scale vehicles (map pages only): meters -> pixels at the current zoom,
  // so the footprint always matches the map. Re-rendered on zoomend.
  if (p.base !== 'image' && map) {
    const zoom = map.getZoom()
    for (const v of p.vehicles) {
      const mpp = metersPerPixel(v.lat, zoom)
      const lPx = Math.max(v.lengthM / mpp, 4)
      const wPx = Math.max(v.widthM / mpp, 2)
      // Vertical extent of the rotated footprint — puts the label clear of it.
      const rad = (v.rotation * Math.PI) / 180
      const vExt = Math.abs(lPx * Math.sin(rad)) + Math.abs(wPx * Math.cos(rad))
      const icon = L.divIcon({
        className: 'lm-icon',
        html: `<div class="lm-veh" style="transform:rotate(${v.rotation}deg)">${vehicleSvg(v.kind, v.lengthM, v.widthM, v.color)}</div>`
          + (v.label ? `<div class="lm-pin-label" style="top:${Math.round(wPx / 2 + vExt / 2 + 3)}px">${esc(v.label)}</div>` : ''),
        iconSize: [lPx, wPx],
        iconAnchor: [lPx / 2, wPx / 2],
      })
      const m = L.marker([v.lat, v.lng], { icon, draggable: true }).addTo(map)
      m.on('click', (e: Leaflet.LeafletMouseEvent) => {
        L!.DomEvent.stopPropagation(e)
        selected.value = { type: 'vehicle', id: v.id }
      })
      m.on('dragend', () => {
        const ll = m.getLatLng()
        v.lat = ll.lat
        v.lng = ll.lng
        markDirty()
      })
      overlayLayers.push(m)
    }
  }

  // Road signs: fixed screen-px size, dragged like pins.
  for (const sg of p.signs ?? []) {
    const def = roadSignDef(sg.sign)
    const ratio = sg.custom
      ? (sg.customH || 1) / (sg.customW || 1)
      : (def ? def.h / def.w : 1)
    const w = sg.size
    const h = Math.round(sg.size * ratio)
    const src = sg.custom ?? `/signs/is/${sg.sign}.svg`
    const icon = L.divIcon({
      className: 'lm-icon',
      html: `<img class="lm-signimg" src="${src}" style="width:${w}px;height:${h}px${sg.rotation ? `;transform:rotate(${sg.rotation}deg)` : ''}" draggable="false">`,
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    })
    const m = L.marker([sg.lat, sg.lng], { icon, draggable: true }).addTo(map)
    m.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      selected.value = { type: 'sign', id: sg.id }
    })
    m.on('dragend', () => {
      const ll = m.getLatLng()
      sg.lat = ll.lat
      sg.lng = ll.lng
      markDirty()
    })
    overlayLayers.push(m)
  }

  for (const mk of p.markers) {
    const def = markerKindDef(mk.kind)
    // Set pins carry a location number: shown inside the pin, and as the
    // chip/index name ("Location N") when no custom label is given.
    const glyph = mk.kind === 'set' && mk.num ? String(mk.num) : def.glyph
    const chip = mk.label || (mk.kind === 'set' && mk.num ? t('portal.tools.locationMap.locationN', { n: mk.num }) : '')
    const icon = L.divIcon({
      className: 'lm-icon',
      html: `<div class="lm-pin2">${pinSvg(def.color, glyph)}</div>`
        + (chip ? `<div class="lm-pin-chip" style="color:${def.color}">${esc(chip)}</div>` : ''),
      iconSize: [30, 40],
      iconAnchor: [15, 39], // pin tip = the spot
    })
    const m = L.marker([mk.lat, mk.lng], { icon, draggable: true }).addTo(map)
    m.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      selected.value = { type: 'marker', id: mk.id }
    })
    m.on('dragend', () => {
      const ll = m.getLatLng()
      mk.lat = ll.lat
      mk.lng = ll.lng
      markDirty()
    })
    overlayLayers.push(m)
  }

  updatePreview()
}

function updatePreview() {
  if (!L || !map) return
  previewLine?.remove()
  previewLine = null
  if (drawing.value.length) {
    previewLine = L.polyline(drawing.value.map(pt => [pt.lat, pt.lng] as [number, number]), {
      color: roadStyle.color,
      weight: roadStyle.width,
      dashArray: roadStyle.dashed ? '8 6' : '2 8',
      opacity: 0.8,
      // Previews must never swallow the clicks that are drawing them.
      interactive: false,
    }).addTo(map)
  }
}

/** Re-render overlays after editing the selected item's properties. */
function touch() {
  renderOverlays()
  markDirty()
}

// The side panel mounting/unmounting resizes the map container mid-layout;
// Leaflet only watches window resizes, so nudge it or clicks land offset.
watch(() => !!selectedItem.value, () => nextTick(() => map?.invalidateSize()))

// A text box left empty is a ghost — drop it as soon as it's deselected.
watch(selected, (_now, old) => {
  const p = page.value
  if (old?.type !== 'text' || !p) return
  const ghost = p.texts.find(x => x.id === old.id && !x.text.trim())
  if (ghost) {
    p.texts = p.texts.filter(x => x.id !== ghost.id)
    touch()
  }
})

// ── Editing actions ──────────────────────────────────────────────────────────

function onMapClick(ll: Leaflet.LatLng) {
  const p = page.value
  if (!p) return
  if (tool.value === 'marker') {
    const mk: LocationMapMarker = { id: newLocalId('m'), kind: markerKind.value, lat: ll.lat, lng: ll.lng }
    if (mk.kind === 'set') mk.num = nextLocationNum(p)
    p.markers.push(mk)
    selected.value = { type: 'marker', id: mk.id }
    touch()
  }
  else if (tool.value === 'text') {
    const tx: LocationMapText = { id: newLocalId('t'), lat: ll.lat, lng: ll.lng, text: '', size: 14 }
    p.texts.push(tx)
    selected.value = { type: 'text', id: tx.id }
    touch()
    nextTick(() => textInput.value?.focus())
  }
  else if (tool.value === 'road') {
    drawing.value.push({ lat: ll.lat, lng: ll.lng })
    updatePreview()
  }
  else if (tool.value === 'shape') {
    if (shapeKind.value === 'poly') {
      polyPts.value.push({ lat: ll.lat, lng: ll.lng })
      updateShapePreview()
    }
    else if (!shapeStart.value) {
      shapeStart.value = { lat: ll.lat, lng: ll.lng }
    }
    else {
      const reserved = shapeKind.value === 'reserved'
      const sh: LocationMapShape = {
        id: newLocalId('s'),
        shape: shapeKind.value,
        a: shapeStart.value,
        b: { lat: ll.lat, lng: ll.lng },
        ...(shapeKind.value === 'rect' || reserved ? { rotation: 0 } : {}),
        color: shapeStyle.color,
        width: shapeStyle.width,
        // A reserved stamp without fill is invisible over asphalt — force it.
        fill: reserved ? true : shapeStyle.fill,
        fillOpacity: shapeStyle.fillOpacity,
      }
      ;(p.shapes ??= []).push(sh)
      cancelShape()
      selected.value = { type: 'shape', id: sh.id }
      touch()
    }
  }
  else if (tool.value === 'measure') {
    if (p.base === 'image') return
    measurePts.value.push({ lat: ll.lat, lng: ll.lng })
    updateMeasurePreview()
  }
  else if (tool.value === 'sign') {
    const custom = useCustomSign.value ? customSign.value : null
    if (!custom && !activeSign.value) return
    // Text plates (hjáleið) place larger by default so they stay readable;
    // an adjusted size slider always wins.
    const preferred = custom ? undefined : roadSignDef(activeSign.value)?.placeSize
    const sg: LocationMapSign = {
      id: newLocalId('g'),
      sign: custom ? '' : activeSign.value,
      ...(custom ? { custom: custom.url, customW: custom.w, customH: custom.h } : {}),
      lat: ll.lat,
      lng: ll.lng,
      size: signSize.value === SIGN_DEFAULT_SIZE ? (preferred ?? signSize.value) : signSize.value,
    }
    ;(p.signs ??= []).push(sg)
    selected.value = { type: 'sign', id: sg.id }
    touch()
  }
  else if (tool.value === 'vehicle') {
    if (p.base === 'image') return
    const def = vehicleKindDef(vehicleKind.value)
    const v: LocationMapVehicle = {
      id: newLocalId('v'),
      kind: def.kind,
      lat: ll.lat,
      lng: ll.lng,
      lengthM: def.lengthM,
      widthM: def.widthM,
      rotation: 0,
      color: vehicleColor.value,
    }
    p.vehicles.push(v)
    selected.value = { type: 'vehicle', id: v.id }
    touch()
  }
  else {
    selected.value = null
  }
}

/** Next free location number on the page (set pins). */
const nextLocationNum = (p: LocationMapPage): number =>
  Math.max(0, ...p.markers.filter(m => m.kind === 'set' && m.num).map(m => m.num!)) + 1

/** Kind switched in the panel: set pins gain a number, others lose it. */
function onMarkerKindChange() {
  const m = selectedItem.value as LocationMapMarker
  if (m.kind === 'set' && !m.num && page.value) m.num = nextLocationNum(page.value)
  else if (m.kind !== 'set') delete m.num
  touch()
}

/** Duplicate the selected vehicle one stall over — same size, rotation,
 *  color and label — so parking rows line up without re-rotating. */
function duplicateVehicle() {
  const p = page.value
  const src = selectedItem.value as LocationMapVehicle | null
  if (!p || !src || selected.value?.type !== 'vehicle') return
  // Offset perpendicular to the vehicle's heading (rotation is CSS-clockwise,
  // screen y points down = south on a Mercator map).
  const a = ((src.rotation + 90) * Math.PI) / 180
  const d = src.widthM + 0.5 // meters
  const dLat = -(d * Math.sin(a)) / 111320
  const dLng = (d * Math.cos(a)) / (111320 * Math.cos((src.lat * Math.PI) / 180))
  const copy: LocationMapVehicle = { ...src, id: newLocalId('v'), lat: src.lat + dLat, lng: src.lng + dLng }
  p.vehicles.push(copy)
  selected.value = { type: 'vehicle', id: copy.id }
  touch()
}

/** Changing the type in the panel resets the footprint to that type's preset. */
function onVehicleKindChange() {
  const v = selectedItem.value as LocationMapVehicle
  const def = vehicleKindDef(v.kind)
  v.lengthM = def.lengthM
  v.widthM = def.widthM
  touch()
}

function setTool(mode: ToolMode) {
  if (tool.value === 'road' && mode !== 'road') cancelRoad()
  if (tool.value === 'shape' && mode !== 'shape') cancelShape()
  if (tool.value === 'measure' && mode !== 'measure') cancelMeasure()
  tool.value = mode
  if (mode !== 'pan') selected.value = null
}

/** Switching shape kind mid-draw discards the half-drawn shape. */
function setShapeKind(kind: typeof shapeKind.value) {
  if (shapeKind.value !== kind) cancelShape()
  shapeKind.value = kind
  // Reserved stamps are red on real plans; nudge the default color once.
  if (kind === 'reserved' && shapeStyle.color === ROAD_COLORS[0]) shapeStyle.color = '#dc2626'
}

function cancelShape() {
  shapeStart.value = null
  polyPts.value = []
  shapePreview?.remove()
  shapePreview = null
}

function undoPolyPoint() {
  polyPts.value.pop()
  updateShapePreview()
}

function finishPoly() {
  const p = page.value
  if (!p) return
  if (polyPts.value.length >= 3) {
    const sh: LocationMapShape = {
      id: newLocalId('s'),
      shape: 'poly',
      points: [...polyPts.value],
      color: shapeStyle.color,
      width: shapeStyle.width,
      fill: shapeStyle.fill,
      fillOpacity: shapeStyle.fillOpacity,
    }
    ;(p.shapes ??= []).push(sh)
    selected.value = { type: 'shape', id: sh.id }
    markDirty()
  }
  cancelShape()
  renderOverlays()
}

function cancelMeasure() {
  measurePts.value = []
  measureLive.value = null
  measurePreview?.remove()
  measurePreview = null
}

function undoMeasurePoint() {
  measurePts.value.pop()
  updateMeasurePreview()
}

function finishMeasure() {
  const p = page.value
  if (!p) return
  // A finishing double-click leaves a duplicate point on the same pixel.
  const points = dropDuplicatePoints(measurePts.value)
  if (points.length >= 2) {
    const ms: LocationMapMeasure = {
      id: newLocalId('d'),
      points,
      color: measureStyle.color,
      width: measureStyle.width,
      dashed: measureStyle.dashed,
    }
    ;(p.measures ??= []).push(ms)
    selected.value = { type: 'measure', id: ms.id }
    markDirty()
  }
  cancelMeasure()
  renderOverlays()
}

function finishRoad() {
  const p = page.value
  if (!p) return
  if (drawing.value.length >= 2) {
    const road: LocationMapRoad = {
      id: newLocalId('r'),
      points: [...drawing.value],
      color: roadStyle.color,
      width: roadStyle.width,
      dashed: roadStyle.dashed,
    }
    p.roads.push(road)
    // Select the finished road right away (same as shapes and measures), so
    // the side panel opens and edits apply to it immediately.
    selected.value = { type: 'road', id: road.id }
    markDirty()
  }
  drawing.value = []
  renderOverlays()
}

function undoRoadPoint() {
  drawing.value.pop()
  updatePreview()
}

function cancelRoad() {
  drawing.value = []
  updatePreview()
}

function deleteSelected() {
  const p = page.value
  const sel = selected.value
  if (!p || !sel) return
  if (sel.type === 'marker') p.markers = p.markers.filter(m => m.id !== sel.id)
  else if (sel.type === 'text') p.texts = p.texts.filter(x => x.id !== sel.id)
  else if (sel.type === 'vehicle') p.vehicles = p.vehicles.filter(v => v.id !== sel.id)
  else if (sel.type === 'shape') p.shapes = (p.shapes ?? []).filter(x => x.id !== sel.id)
  else if (sel.type === 'sign') p.signs = (p.signs ?? []).filter(x => x.id !== sel.id)
  else if (sel.type === 'measure') p.measures = (p.measures ?? []).filter(x => x.id !== sel.id)
  else p.roads = p.roads.filter(r => r.id !== sel.id)
  selected.value = null
  touch()
}

// ── Pages ────────────────────────────────────────────────────────────────────

// ── Drag & drop reordering of the page tabs (drives the PDF page order) ─────

const dragPage = ref<number | null>(null)
const dragOverPage = ref<number | null>(null)

function onPageDragStart(i: number, e: DragEvent) {
  dragPage.value = i
  // Firefox needs data set for the drag to start; hide the ghost offset jitter.
  e.dataTransfer?.setData('text/plain', String(i))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onPageDrop(target: number) {
  const from = dragPage.value
  dragPage.value = null
  dragOverPage.value = null
  if (from === null || !doc.value || from === target) return
  const pages = doc.value.pages
  const activeId = page.value?.id
  const [moved] = pages.splice(from, 1)
  pages.splice(target, 0, moved!)
  // Keep the same page active at its new position — no map rebuild needed.
  pageIdx.value = Math.max(0, pages.findIndex(p => p.id === activeId))
  markDirty()
}

function switchPage(i: number) {
  if (!doc.value || i === pageIdx.value) return
  selected.value = null
  cancelRoad()
  cancelShape()
  cancelMeasure()
  pageIdx.value = i
  // The vehicle tool doesn't exist on image pages.
  if (tool.value === 'vehicle' && page.value?.base === 'image') tool.value = 'pan'
  nextTick(buildMap)
}

function addPage(kind: 'map' | 'image') {
  if (!doc.value) return
  if (kind === 'image') {
    pickImage(false)
    return
  }
  // Reuse the current viewport so the new page starts where the user is.
  const fresh = newMapPage('', page.value?.base === 'satellite' ? 'satellite' : 'streets')
  if (page.value && page.value.base !== 'image') {
    fresh.center = { ...page.value.center }
    fresh.zoom = page.value.zoom
  }
  doc.value.pages.push(fresh)
  markDirty()
  switchPage(doc.value.pages.length - 1)
}

async function deletePage() {
  if (!doc.value || !await confirmDialog(t('portal.tools.locationMap.confirmDeletePage'))) return
  doc.value.pages.splice(pageIdx.value, 1)
  if (!doc.value.pages.length) doc.value.pages.push(newMapPage(''))
  selected.value = null
  cancelRoad()
  cancelShape()
  cancelMeasure()
  pageIdx.value = Math.min(pageIdx.value, doc.value.pages.length - 1)
  markDirty()
  nextTick(buildMap)
}

function setBase(base: 'streets' | 'satellite') {
  const p = page.value
  if (!p || p.base === base) return
  p.base = base
  markDirty()
  buildMap()
}

function pickImage(replace: boolean) {
  replacingImage = replace
  if (fileInput.value) fileInput.value.value = ''
  fileInput.value?.click()
}

async function onImagePicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !doc.value) return
  exportError.value = ''
  try {
    const { dataUrl, w, h } = await fileToResizedDataUrl(file)
    if (replacingImage && page.value?.base === 'image') {
      Object.assign(page.value, { image: dataUrl, imageW: w, imageH: h, center: { lat: h / 2, lng: w / 2 }, zoom: 0 })
    }
    else {
      doc.value.pages.push({
        id: newLocalId('p'),
        title: '',
        base: 'image',
        image: dataUrl,
        imageW: w,
        imageH: h,
        center: { lat: h / 2, lng: w / 2 },
        zoom: 0,
        markers: [],
        roads: [],
        texts: [],
        vehicles: [],
      })
      pageIdx.value = doc.value.pages.length - 1
    }
    markDirty()
    nextTick(buildMap)
  }
  catch {
    exportError.value = t('portal.tools.locationMap.imageTooLarge')
  }
}

/** Custom sign upload: downscale to ≤256px PNG (keeps transparency). */
async function onSignImagePicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const bmp = await createImageBitmap(file)
    try {
      const s = Math.min(1, 256 / Math.max(bmp.width, bmp.height))
      const w = Math.max(1, Math.round(bmp.width * s))
      const h = Math.max(1, Math.round(bmp.height * s))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
      customSign.value = { url: canvas.toDataURL('image/png'), w, h }
      useCustomSign.value = true
    }
    finally {
      bmp.close()
    }
  }
  catch {
    exportError.value = t('portal.tools.locationMap.imageTooLarge')
  }
}

/** Downscale to ≤2400px and re-encode as JPEG so saved documents stay small. */
async function fileToResizedDataUrl(file: File, maxDim = 2400): Promise<{ dataUrl: string, w: number, h: number }> {
  const bmp = await createImageBitmap(file)
  try {
    const s = Math.min(1, maxDim / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * s))
    const h = Math.max(1, Math.round(bmp.height * s))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.drawImage(bmp, 0, 0, w, h)
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), w, h }
  }
  finally {
    bmp.close()
  }
}

// ── Persistence ──────────────────────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | undefined

function markDirty() {
  saveState.value = 'dirty'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 1500)
}

/** Pages as sent to the API: text boxes still being typed (empty) are dropped. */
const cleanPages = () =>
  doc.value!.pages.map(p => ({ ...p, texts: p.texts.filter(x => x.text.trim()) }))

async function save() {
  if (!doc.value) return
  clearTimeout(saveTimer)
  saveState.value = 'saving'
  try {
    await $fetch(`/api/portal/tools/location-maps/${mapId}`, {
      method: 'PATCH',
      body: { name: doc.value.name.trim() || doc.value.name, pages: cleanPages() },
    })
    saveState.value = 'saved'
  }
  catch {
    saveState.value = 'error'
  }
}

async function doExport() {
  if (!doc.value) return
  exporting.value = true
  exportError.value = ''
  try {
    if (saveState.value === 'dirty' || saveState.value === 'error') await save()
    const { exportLocationMapPdf } = await import('~/utils/locationMapPdf')
    const bytes = await exportLocationMapPdf(
      { ...doc.value, pages: cleanPages() },
      {
        locationsTitle: t('portal.tools.locationMap.locations'),
        locationName: n => t('portal.tools.locationMap.locationN', { n }),
        kindName: k => t(markerKindDef(k).labelKey),
      },
    )
    const safeName = doc.value.name.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'kort'
    downloadBlob(bytes, `${safeName}.pdf`, 'application/pdf')
  }
  catch {
    exportError.value = t('portal.tools.locationMap.exportFailed')
  }
  finally {
    exporting.value = false
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if ((e.target as HTMLElement | null)?.closest('input, textarea, select')) return
  if (e.key === 'Enter' && tool.value === 'road' && drawing.value.length) {
    e.preventDefault()
    finishRoad()
  }
  else if (e.key === 'Enter' && tool.value === 'shape' && polyPts.value.length) {
    e.preventDefault()
    finishPoly()
  }
  else if (e.key === 'Enter' && tool.value === 'measure' && measurePts.value.length) {
    e.preventDefault()
    finishMeasure()
  }
  else if (e.key === 'Escape') {
    if (drawing.value.length) cancelRoad()
    else if (shapeStart.value || polyPts.value.length) cancelShape()
    else if (measurePts.value.length) cancelMeasure()
    else selected.value = null
  }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && selected.value) {
    e.preventDefault()
    deleteSelected()
  }
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (saveState.value === 'dirty' || saveState.value === 'saving') e.preventDefault()
}

onMounted(async () => {
  try {
    doc.value = await $fetch<LocationMapDoc>(`/api/portal/tools/location-maps/${mapId}`)
    // Docs saved before vehicles/shapes/signs/measures existed lack those arrays.
    for (const p of doc.value.pages) {
      p.vehicles ??= []
      p.shapes ??= []
      p.signs ??= []
      p.measures ??= []
    }
  }
  catch {
    notFound.value = true
    return
  }
  try {
    // Vite serves leaflet's UMD build as an ESM default export.
    const mod = await import('leaflet') as typeof Leaflet & { default?: typeof Leaflet }
    L = mod.default ?? mod
    // Patches L.Path with a drag handler (option draggable: true) so shapes
    // can be moved around in select mode.
    await import('leaflet-path-drag')
  }
  catch {
    // Typically a stale dev-server module cache or being offline.
    exportError.value = t('portal.tools.locationMap.loadFailed')
    return
  }
  // Leaflet only watches WINDOW resizes; container reflows (scrollbars, the
  // aspect-ratio height following a width change) need an explicit nudge or
  // the map renders a stale, too-small tile area.
  if (mapEl.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => map?.invalidateSize())
    resizeObserver.observe(mapEl.value)
  }
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
  nextTick(buildMap)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
  if (saveState.value === 'dirty') save()
  clearTimeout(saveTimer)
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
})

useHead({ title: 'Tökustaðakort · Hjálpartól · Portal' })
</script>

<style>
/* Leaflet divIcons for the location-map editor (global: rendered by Leaflet
   outside Vue's scoped-style reach). */
.lm-icon {
  background: none;
  border: none;
}
.lm-crosshair .leaflet-container {
  cursor: crosshair;
}
.lm-pin2 {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55));
}
/* Production-map label chip: uppercase colored text on a dark badge. */
.lm-pin-chip {
  position: absolute;
  top: 42px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(22, 22, 22, 0.78);
  padding: 3px 9px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
.lm-map-title {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  pointer-events: none;
  background: rgba(22, 22, 22, 0.72);
  padding: 10px 18px 12px;
  border-radius: 4px;
}
.lm-map-title-main {
  font-family: Oswald, Inter, sans-serif;
  font-size: 28px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #f2e18c;
  line-height: 1.1;
}
.lm-map-title-sub {
  font-family: Oswald, Inter, sans-serif;
  font-size: 15px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #f5f2e9;
  margin-top: 2px;
}
.lm-pin-label {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: #111;
  text-shadow:
    0 0 3px #fff,
    0 0 3px #fff,
    0 0 3px #fff;
}
.lm-signimg {
  display: block;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
.lm-veh {
  position: absolute;
  inset: 0;
  transform-origin: center;
}
.lm-veh svg {
  overflow: visible;
}
.lm-textbox {
  display: inline-block;
  /* Grow to the content but wrap long lines INSIDE the chip instead of
     overflowing past its background. */
  width: max-content;
  max-width: 380px;
  padding: 5px 10px;
  background: rgba(22, 22, 22, 0.78);
  border-radius: 3px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.4;
  white-space: normal;
  overflow-wrap: anywhere;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
/* Reserved-parking stamp label, centered on the shape. */
.lm-reserved {
  position: absolute;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-shadow:
    0 0 3px #fff,
    0 0 3px #fff,
    0 0 4px #fff;
  pointer-events: none;
}
.lm-measure-chip {
  position: absolute;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  background: rgba(22, 22, 22, 0.85);
  color: #ffd75e;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
</style>
