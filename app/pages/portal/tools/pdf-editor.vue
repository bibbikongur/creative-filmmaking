<template>
  <PortalToolsShell :title="$t('portal.tools.pdfEdit.title')" :desc="loaded ? undefined : $t('portal.tools.pdfEdit.long')" wide>
    <PortalToolsDropzone
      v-if="!loaded"
      v-model="files"
      accept="application/pdf,.pdf"
      :multiple="false"
      :hint="$t('portal.tools.pdfEdit.hint')"
    />

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>
    <p v-else-if="loading" class="mt-4 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <div
      v-if="loaded"
      class="pdfw flex flex-col bg-ink-950 text-bone-100"
      :class="[`m-${mode}`, fullscreen ? 'fixed inset-0 z-[70]' : 'h-[calc(100vh-10rem)] min-h-[560px] border border-ink-800']"
    >
      <!-- ── Toolbar: tools ── -->
      <div class="flex flex-wrap items-center gap-1 border-b border-ink-800 bg-ink-900 px-2 py-1.5">
        <button type="button" class="tb" :class="{ on: sidebar }" :title="$t('portal.tools.pdfEdit.thumbnails')" @click="sidebar = !sidebar">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16M4 12h16M4 19h16" /></svg>
        </button>
        <span class="mx-1 hidden max-w-[11rem] truncate text-xs text-bone-400 xl:block" :title="origName">{{ origName }}</span>
        <span class="sep" />

        <button
          v-for="m in MODES"
          :key="m"
          type="button"
          class="tb"
          :class="{ on: mode === m }"
          :title="`${$t(`portal.tools.pdfEdit.modes.${m}`)} (${KEYS[m].toUpperCase()})`"
          @click="setMode(m)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="ICONS[m]" /></svg>
          <span class="hidden 2xl:inline">{{ $t(`portal.tools.pdfEdit.modes.${m}`) }}</span>
        </button>

        <span class="sep" />

        <!-- Context options -->
        <template v-if="showTextOpts">
          <select v-model.number="textSize" class="tbsel" :title="$t('portal.tools.pdfEdit.size')">
            <option v-for="s in TEXT_SIZES" :key="s" :value="s">{{ s }} pt</option>
          </select>
          <button type="button" class="tb font-bold" :class="{ on: bold }" :title="$t('portal.tools.pdfEdit.bold')" @click="bold = !bold">B</button>
        </template>
        <select v-if="showStrokeOpts" v-model.number="strokeWidth" class="tbsel" :title="$t('portal.tools.pdfEdit.strokeWidth')">
          <option v-for="s in STROKE_WIDTHS" :key="s" :value="s">{{ s }} pt</option>
        </select>
        <div v-if="showColorOpts" class="flex items-center gap-1.5 px-1" :title="$t('portal.tools.pdfEdit.color')">
          <button
            v-for="c in palette"
            :key="c"
            type="button"
            class="h-4 w-4 rounded-full border transition-transform"
            :class="activeColor === c ? 'border-bone-100 scale-125' : 'border-ink-500'"
            :style="{ backgroundColor: c }"
            :aria-label="c"
            @click="setColor(c)"
          />
        </div>

        <div class="ml-auto flex items-center gap-1">
          <button type="button" class="tb" :disabled="!canUndo" :title="`${$t('portal.tools.pdfEdit.undo')} (Ctrl+Z)`" @click="undo">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
          </button>
          <button type="button" class="tb" :disabled="!canRedo" :title="`${$t('portal.tools.pdfEdit.redo')} (Ctrl+Y)`" @click="redo">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" /></svg>
          </button>
          <span class="sep" />
          <button type="button" class="tb" :class="{ on: findOpen }" :title="`${$t('portal.tools.pdfEdit.find')} (Ctrl+F)`" @click="toggleFind">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          </button>
          <button type="button" class="tb" :class="{ on: fullscreen }" :title="fullscreen ? $t('portal.tools.pdfEdit.exitFullscreen') : $t('portal.tools.pdfEdit.fullscreen')" @click="fullscreen = !fullscreen">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg>
          </button>
          <button type="button" class="tb" :title="$t('portal.tools.pdfEdit.close')" @click="closeDoc">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <button
            type="button"
            class="ml-1 bg-gold-500 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-950 transition-colors hover:bg-gold-400 disabled:opacity-50"
            :disabled="busy || liveCount === 0"
            @click="exportPdf"
          >
            {{ busy ? $t('portal.tools.working') : $t('portal.tools.pdfEdit.action') }}
          </button>
        </div>
      </div>

      <!-- ── Toolbar: navigation ── -->
      <div class="flex flex-wrap items-center gap-1 border-b border-ink-800 bg-ink-900/60 px-2 py-1">
        <button type="button" class="tb" :disabled="currentIndex <= 0" :title="$t('portal.tools.pdfEdit.prevPage')" @click="goTo(currentIndex - 1)">‹</button>
        <input
          v-model="pageInput"
          type="text"
          inputmode="numeric"
          class="tbinput w-10 text-center"
          :aria-label="$t('portal.tools.pdfEdit.page', { n: '' })"
          @keydown.enter.prevent="jumpTo"
          @blur="jumpTo"
        >
        <span class="text-xs text-bone-500">/ {{ ordered.length }}</span>
        <button type="button" class="tb" :disabled="currentIndex >= ordered.length - 1" :title="$t('portal.tools.pdfEdit.nextPage')" @click="goTo(currentIndex + 1)">›</button>

        <span class="sep" />

        <button type="button" class="tb" :title="`${$t('portal.tools.pdfEdit.zoomOut')} (Ctrl −)`" @click="zoomBy(-1)">−</button>
        <select :value="zoomSel" class="tbsel w-[7.5rem]" @change="onZoomSel">
          <option value="fit-width">{{ $t('portal.tools.pdfEdit.fitWidth') }}</option>
          <option value="fit-page">{{ $t('portal.tools.pdfEdit.fitPage') }}</option>
          <option v-for="z in ZOOM_STEPS" :key="z" :value="String(z)">{{ Math.round(z * 100) }}%</option>
          <option v-if="fitMode" :value="zoomSel">{{ Math.round(zoom * 100) }}%</option>
        </select>
        <button type="button" class="tb" :title="`${$t('portal.tools.pdfEdit.zoomIn')} (Ctrl +)`" @click="zoomBy(1)">+</button>

        <span class="sep" />

        <button type="button" class="tb" :title="$t('portal.tools.pdfEdit.rotateLeft')" @click="rotatePage(currentNum, -90)">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4v6h6M3.5 10A8 8 0 1 1 6 18.3" /></svg>
        </button>
        <button type="button" class="tb" :title="$t('portal.tools.pdfEdit.rotateRight')" @click="rotatePage(currentNum, 90)">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4v6h-6M20.5 10A8 8 0 1 0 18 18.3" /></svg>
        </button>
        <button
          type="button"
          class="tb"
          :class="deleted.has(currentNum) ? 'text-gold-400' : ''"
          :title="deleted.has(currentNum) ? $t('portal.tools.pdfEdit.restorePage') : $t('portal.tools.pdfEdit.deletePage')"
          @click="togglePage(currentNum)"
        >
          <svg v-if="!deleted.has(currentNum)" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
          <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" /></svg>
        </button>
        <span v-if="deleted.size" class="text-[11px] text-signal-500">{{ $t('portal.tools.pdfEdit.deletedCount', { n: deleted.size }) }}</span>

        <span class="ml-auto hidden min-w-0 max-w-[45%] truncate text-[11px] text-bone-500 xl:block" :title="$t(`portal.tools.pdfEdit.hints.${mode}`)">{{ $t(`portal.tools.pdfEdit.hints.${mode}`) }}</span>
      </div>

      <!-- ── Find bar ── -->
      <div v-if="findOpen" class="flex flex-wrap items-center gap-2 border-b border-ink-800 bg-ink-900/60 px-2 py-1">
        <input
          ref="findInput"
          v-model="findQuery"
          type="search"
          class="tbinput w-64"
          :placeholder="$t('portal.tools.pdfEdit.findPlaceholder')"
          @keydown.enter.prevent="findStep($event.shiftKey ? -1 : 1)"
          @keydown.escape.prevent="toggleFind"
        >
        <span class="text-xs text-bone-500">{{ findStatus }}</span>
        <button type="button" class="tb" :disabled="!hits.length" @click="findStep(-1)">‹</button>
        <button type="button" class="tb" :disabled="!hits.length" @click="findStep(1)">›</button>
      </div>

      <!-- ── Body ── -->
      <div class="flex min-h-0 flex-1">
        <!-- Thumbnails -->
        <div v-show="sidebar" ref="sidebarEl" class="w-44 shrink-0 space-y-3 overflow-y-auto border-r border-ink-800 bg-ink-900/40 p-3">
          <div v-for="(p, i) in ordered" :key="p.num" class="group">
            <button
              type="button"
              class="block w-full border bg-white transition-colors"
              :class="[
                i === currentIndex ? 'border-gold-500 ring-1 ring-gold-500' : 'border-ink-700 hover:border-bone-400',
                deleted.has(p.num) ? 'opacity-30' : '',
              ]"
              :style="{ aspectRatio: `${p.vw} / ${p.vh}` }"
              :data-thumb="p.num"
              @click="goTo(i)"
            >
              <canvas :ref="el => setThumb(p.num, el as HTMLCanvasElement | null)" class="block h-full w-full" />
            </button>
            <div class="mt-1 flex h-4 items-center justify-between text-[10px] text-bone-500">
              <span>
                {{ i + 1 }}
                <span v-if="deleted.has(p.num)" class="ml-1 text-signal-500">{{ $t('portal.tools.pdfEdit.deleted') }}</span>
              </span>
              <span class="hidden items-center gap-1.5 group-hover:flex">
                <button type="button" class="hover:text-gold-400 disabled:opacity-30" :disabled="i === 0" :title="$t('portal.tools.moveUp')" @click="movePage(i, -1)">↑</button>
                <button type="button" class="hover:text-gold-400 disabled:opacity-30" :disabled="i === ordered.length - 1" :title="$t('portal.tools.moveDown')" @click="movePage(i, 1)">↓</button>
                <button type="button" class="hover:text-gold-400" :title="$t('portal.tools.pdfEdit.rotateRight')" @click="rotatePage(p.num, 90)">⟳</button>
                <button
                  type="button"
                  :class="deleted.has(p.num) ? 'text-gold-400' : 'hover:text-signal-500'"
                  :title="deleted.has(p.num) ? $t('portal.tools.pdfEdit.restorePage') : $t('portal.tools.pdfEdit.deletePage')"
                  @click="togglePage(p.num)"
                >{{ deleted.has(p.num) ? '↺' : '✕' }}</button>
              </span>
            </div>
          </div>
        </div>

        <!-- Viewer -->
        <div
          ref="viewerEl"
          class="relative min-w-0 flex-1 overflow-auto bg-ink-900 p-4 outline-none"
          tabindex="0"
          @scroll.passive="onScroll"
          @wheel="onWheel"
          @pointerup="onViewerUp"
        >
          <div
            v-for="p in ordered"
            :key="p.num"
            :data-page="p.num"
            class="pdfw-page relative mx-auto mb-4 bg-white shadow-lg shadow-black/40"
            :class="deleted.has(p.num) ? 'opacity-30' : ''"
            :style="pageStyle(p)"
            @pointerdown="onPageDown(p, $event)"
          >
            <canvas
              :ref="el => setCanvas(p.num, el as HTMLCanvasElement | null)"
              class="absolute left-0 top-0"
              :style="{ width: `${cssW(p)}px`, height: `${cssH(p)}px` }"
            />
            <div :ref="el => setTextEl(p.num, el as HTMLDivElement | null)" class="textLayer" :data-main-rotation="p.rot" />

            <!-- Annotation layers: one per rotation the items were created in -->
            <div
              v-for="L in layersOf(p)"
              :key="L.rot"
              class="absolute left-0 top-0 origin-top-left"
              style="pointer-events: none"
              :style="layerStyle(p, L)"
            >
              <svg
                class="absolute left-0 top-0 overflow-visible"
                :width="L.w * scale"
                :height="L.h * scale"
                :viewBox="`0 0 ${L.w} ${L.h}`"
                style="pointer-events: none"
              >
                <template v-for="it in L.items" :key="it.id">
                  <g
                    v-if="it.kind === 'highlight'"
                    class="it"
                    :fill="it.color"
                    style="mix-blend-mode: multiply"
                    @pointerdown.stop="startMove(it, p, $event)"
                  >
                    <rect v-for="(r, ri) in it.rects" :key="ri" :x="r.x" :y="r.y" :width="r.w" :height="r.h" />
                  </g>
                  <rect
                    v-else-if="it.kind === 'rect'"
                    class="it"
                    :x="it.x" :y="it.y" :width="it.w" :height="it.h"
                    fill="#ffffff"
                    stroke="rgba(0,0,0,0.12)"
                    :stroke-width="1 / scale"
                    @pointerdown.stop="startMove(it, p, $event)"
                  />
                  <image
                    v-else-if="it.kind === 'image'"
                    class="it"
                    :href="imageStore.get(it.srcId)?.dataUrl"
                    :x="it.x" :y="it.y" :width="it.w" :height="it.h"
                    preserveAspectRatio="none"
                    @pointerdown.stop="startMove(it, p, $event)"
                  />
                  <g v-else-if="it.kind === 'box'" class="it">
                    <rect :x="it.x" :y="it.y" :width="it.w" :height="it.h" fill="none" stroke="transparent" :stroke-width="hitWidth(it.width)" class="hit" @pointerdown.stop="startMove(it, p, $event)" />
                    <rect :x="it.x" :y="it.y" :width="it.w" :height="it.h" fill="none" :stroke="it.color" :stroke-width="it.width" stroke-linejoin="round" style="pointer-events: none" />
                  </g>
                  <g v-else-if="it.kind === 'arrow'" class="it">
                    <line :x1="it.x1" :y1="it.y1" :x2="it.x2" :y2="it.y2" stroke="transparent" :stroke-width="hitWidth(it.width)" class="hit" @pointerdown.stop="startMove(it, p, $event)" />
                    <line :x1="it.x1" :y1="it.y1" :x2="it.x2" :y2="it.y2" :stroke="it.color" :stroke-width="it.width" stroke-linecap="round" style="pointer-events: none" />
                    <polygon :points="arrowHead(it).map(q => `${q.x},${q.y}`).join(' ')" :fill="it.color" style="pointer-events: none" />
                  </g>
                  <g v-else-if="it.kind === 'draw'" class="it">
                    <path :d="strokePath(it)" fill="none" stroke="transparent" :stroke-width="hitWidth(it.width)" class="hit" @pointerdown.stop="startMove(it, p, $event)" />
                    <path :d="strokePath(it)" fill="none" :stroke="it.color" :stroke-width="it.width" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none" />
                  </g>
                </template>
              </svg>

              <!-- Text items -->
              <div
                v-for="it in L.texts"
                :key="it.id"
                class="tx absolute"
                :style="{ left: `${it.x * scale}px`, top: `${it.y * scale}px` }"
              >
                <button
                  type="button"
                  class="absolute -left-4 top-0 cursor-move text-xs leading-none text-bone-500 hover:text-gold-400"
                  :class="selectedId === it.id ? 'block' : 'hidden'"
                  :title="$t('portal.tools.pdfEdit.move')"
                  @pointerdown.stop="startMove(it, p, $event)"
                >⠿</button>
                <textarea
                  v-model="it.text"
                  :data-text-id="it.id"
                  rows="1"
                  spellcheck="false"
                  class="block resize-none overflow-hidden border border-dashed bg-transparent p-0 outline-none"
                  :class="selectedId === it.id ? 'border-gold-500/70' : 'border-transparent hover:border-gold-500/40'"
                  :style="textStyle(it)"
                  @pointerdown.stop="selectItem(it.id)"
                  @focus="onTextFocus(it)"
                  @blur="onTextBlur(it)"
                  @keydown.escape.prevent="($event.target as HTMLTextAreaElement).blur()"
                />
              </div>

              <!-- Selection chrome -->
              <div
                v-if="selected && selected.page === p.num && selected.rot === L.rot && selected.kind !== 'text'"
                class="chrome absolute outline outline-1 outline-dashed outline-gold-500"
                style="pointer-events: none; outline-offset: 2px"
                :style="boxStyle(bboxOf(selected))"
              >
                <button
                  type="button"
                  class="absolute -right-3 -top-3 h-5 w-5 border border-ink-700 bg-ink-950 text-[11px] leading-none text-signal-500 hover:border-signal-500"
                  style="pointer-events: auto"
                  :title="$t('portal.tools.pdfEdit.delete')"
                  @pointerdown.stop
                  @click.stop="removeItem(selected)"
                >✕</button>
                <span
                  v-if="selected.kind === 'rect' || selected.kind === 'image' || selected.kind === 'box'"
                  class="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize border border-ink-950 bg-gold-500"
                  style="pointer-events: auto"
                  @pointerdown.stop="startResize(selected, p, $event)"
                />
              </div>
            </div>

            <!-- Search hits (always in the page's current rotation) -->
            <svg
              v-if="hitsByPage.get(p.num)?.length"
              class="absolute left-0 top-0"
              style="pointer-events: none; mix-blend-mode: multiply"
              :width="cssW(p)"
              :height="cssH(p)"
              :viewBox="`0 0 ${p.vw} ${p.vh}`"
            >
              <rect
                v-for="h in hitsByPage.get(p.num)"
                :key="h.idx"
                :x="h.x" :y="h.y" :width="h.w" :height="h.h"
                :fill="h.idx === hitIndex ? '#ff9a1f' : '#ffe14d'"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden picker for the image tool -->
    <input
      ref="imgInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      class="hidden"
      @change="onImagePicked"
    >
  </PortalToolsShell>
</template>

<script setup lang="ts">
import {
  PDFDocument, StandardFonts, rgb, degrees, LineCapStyle, BlendMode,
  pushGraphicsState, popGraphicsState, concatTransformationMatrix,
} from 'pdf-lib'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'

// Fully client-side PDF viewer + editor. pdf.js renders the pages lazily (only
// the ones near the viewport, re-rendered on zoom), a pdf.js text layer gives
// real text selection / search / highlighting, annotations live as SVG + HTML
// overlays, and pdf-lib stamps everything into a new file on export.
//
// Coordinates: every annotation is stored in PDF points from the top-left of
// the page *as it was displayed when the annotation was made* (`rot`). Rotating
// a page afterwards rotates its annotations with it; on export a CTM per
// rotation maps those coordinates back into the page's own space.

definePageMeta({ layout: 'portal' })
usePortalToolGuard('pdf-editor')

const { t } = useI18n()

type Pdfjs = typeof import('pdfjs-dist')
type TextLayerT = InstanceType<Pdfjs['TextLayer']>
type TextContent = Awaited<ReturnType<PDFPageProxy['getTextContent']>>

type Mode = 'select' | 'text' | 'highlight' | 'draw' | 'rect' | 'box' | 'arrow' | 'image'
const MODES: Mode[] = ['select', 'text', 'highlight', 'draw', 'rect', 'box', 'arrow', 'image']
const KEYS: Record<Mode, string> = { select: 'v', text: 't', highlight: 'h', draw: 'd', rect: 'w', box: 'b', arrow: 'a', image: 'i' }
const ICONS: Record<Mode, string> = {
  select: 'M4 4l7 16 2.5-6.5L20 11z',
  text: 'M5 7V4h14v3M12 4v16M9 20h6',
  highlight: 'M9 11l-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4',
  draw: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.6 7.6',
  rect: 'M20 20H7L3 16a2 2 0 0 1 0-2.8L13.2 3a2 2 0 0 1 2.8 0L21 8a2 2 0 0 1 0 2.8L11 21M6 11l7 7',
  box: 'M4 4h16v16H4z',
  arrow: 'M5 19L19 5M9 5h10v10',
  image: 'M4 5h16v14H4zM8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM20 15l-5-5-9 9',
}
const COLORS = ['#111111', '#dc2626', '#2563eb', '#15803d', '#ffffff']
const HL_COLORS = ['#ffe100', '#7cf27c', '#ff8ad8', '#7fd0ff']
const TEXT_SIZES = [8, 10, 12, 14, 18, 24, 32, 48]
const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8]
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]
/** 100 % zoom = 96 dpi, the same convention as Acrobat / pdf.js. */
const CSS_UNITS = 96 / 72
const LINE_HEIGHT = 1.2
/** Distance from the top of a text line to its baseline (Helvetica in a 1.2 line box). */
const BASELINE = 0.94

interface Pt { x: number, y: number }
interface Box { x: number, y: number, w: number, h: number }

interface PageInfo {
  num: number
  /** Rotation baked into the PDF. */
  baseRot: number
  /** Extra rotation applied by the user (0/90/180/270). */
  userRot: number
  /** Effective rotation = baseRot + userRot. */
  rot: number
  /** Page size in points at rotation 0. */
  rawW: number
  rawH: number
  /** Page size in points as displayed (swapped for 90/270). */
  vw: number
  vh: number
}

interface PlacedImage { bytes: Uint8Array, format: 'jpg' | 'png', dataUrl: string, natW: number, natH: number }

interface ItemBase { id: string, page: number, rot: number }
interface TextItem extends ItemBase { kind: 'text', x: number, y: number, size: number, color: string, bold: boolean, text: string }
interface HighlightItem extends ItemBase { kind: 'highlight', color: string, rects: Box[] }
interface RectItem extends ItemBase { kind: 'rect', x: number, y: number, w: number, h: number }
interface BoxItem extends ItemBase { kind: 'box', x: number, y: number, w: number, h: number, color: string, width: number }
interface ArrowItem extends ItemBase { kind: 'arrow', x1: number, y1: number, x2: number, y2: number, color: string, width: number }
interface ImageItem extends ItemBase { kind: 'image', x: number, y: number, w: number, h: number, srcId: string }
interface DrawItem extends ItemBase { kind: 'draw', color: string, width: number, points: Pt[] }
type EditorItem = TextItem | HighlightItem | RectItem | BoxItem | ArrowItem | ImageItem | DrawItem
type Sized = RectItem | BoxItem | ImageItem

interface Layer { rot: number, w: number, h: number, items: Exclude<EditorItem, TextItem>[], texts: TextItem[] }
interface Hit { idx: number, page: number, x: number, y: number, w: number, h: number }
interface Snapshot { items: EditorItem[], order: number[], deleted: number[], userRot: Record<number, number> }

// ── State ──

const files = ref<File[]>([])
const pages = ref<PageInfo[]>([])
const order = ref<number[]>([])
const deleted = ref<Set<number>>(new Set())
const items = ref<EditorItem[]>([])
const imageStore = reactive(new Map<string, PlacedImage>())
const selectedId = ref<string | null>(null)

const mode = ref<Mode>('select')
const textSize = ref(14)
const bold = ref(false)
const strokeWidth = ref(2)
const color = ref(COLORS[0]!)
const hlColor = ref(HL_COLORS[0]!)
const pendingImage = ref<string | null>(null)

const zoom = ref(1)
const fitMode = ref<'width' | 'page' | null>('width')
const sidebar = ref(true)
const fullscreen = ref(false)
const currentIndex = ref(0)
const pageInput = ref('1')

const findOpen = ref(false)
const findQuery = ref('')
const hits = ref<Hit[]>([])
const hitIndex = ref(-1)

const loading = ref(false)
const busy = ref(false)
const error = ref('')

const viewerEl = ref<HTMLElement | null>(null)
const sidebarEl = ref<HTMLElement | null>(null)
const imgInput = ref<HTMLInputElement | null>(null)
const findInput = ref<HTMLInputElement | null>(null)

let pdfjs: Pdfjs | null = null
let pdfDoc: PDFDocumentProxy | null = null
let loadingTask: PDFDocumentLoadingTask | null = null
let origBytes: Uint8Array | null = null
let origName = ''

const pageProxies = new Map<number, Promise<PDFPageProxy>>()
const textContents = new Map<number, Promise<TextContent>>()
const canvases = new Map<number, HTMLCanvasElement>()
const textEls = new Map<number, HTMLDivElement>()
const thumbs = new Map<number, HTMLCanvasElement>()
const renderTasks = new Map<number, RenderTask>()
const renderedKey = new Map<number, string>()
const textLayers = new Map<number, TextLayerT>()
const textKey = new Map<number, number>()
const thumbTasks = new Map<number, RenderTask>()
const thumbKey = new Map<number, string>()
const visiblePages = new Set<number>()
const visibleThumbs = new Set<number>()
let pageObserver: IntersectionObserver | null = null
let thumbObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null

const setCanvas = (num: number, el: HTMLCanvasElement | null) => { if (el) canvases.set(num, el) }
const setTextEl = (num: number, el: HTMLDivElement | null) => { if (el) textEls.set(num, el) }
const setThumb = (num: number, el: HTMLCanvasElement | null) => { if (el) thumbs.set(num, el) }

const pageMap = computed(() => new Map(pages.value.map(p => [p.num, p])))
const ordered = computed(() => order.value.map(n => pageMap.value.get(n)!).filter(Boolean))
const loaded = computed(() => pages.value.length > 0)
const liveCount = computed(() => order.value.length - deleted.value.size)
const scale = computed(() => zoom.value * CSS_UNITS)
const currentNum = computed(() => ordered.value[currentIndex.value]?.num ?? order.value[0] ?? 1)
const selected = computed(() => items.value.find(i => i.id === selectedId.value) ?? null)
const zoomSel = computed(() => fitMode.value ? `fit-${fitMode.value}` : String(zoom.value))

const showTextOpts = computed(() => mode.value === 'text' || selected.value?.kind === 'text')
const showStrokeOpts = computed(() => ['draw', 'box', 'arrow'].includes(mode.value)
  || ['draw', 'box', 'arrow'].includes(selected.value?.kind ?? ''))
const showColorOpts = computed(() => !['select', 'rect', 'image'].includes(mode.value)
  || (selected.value !== null && 'color' in selected.value))
const isHl = computed(() => mode.value === 'highlight' || selected.value?.kind === 'highlight')
const palette = computed(() => isHl.value ? HL_COLORS : COLORS)
const activeColor = computed(() => isHl.value ? hlColor.value : color.value)

const uid = () => `e-${Math.random().toString(36).slice(2, 10)}`
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max))
const cssW = (p: PageInfo) => Math.floor(p.vw * scale.value)
const cssH = (p: PageInfo) => Math.floor(p.vh * scale.value)
const pageStyle = (p: PageInfo) => ({ 'width': `${cssW(p)}px`, 'height': `${cssH(p)}px`, '--scale-factor': String(scale.value) })
const boxStyle = (b: Box) => ({
  left: `${b.x * scale.value}px`,
  top: `${b.y * scale.value}px`,
  width: `${b.w * scale.value}px`,
  height: `${b.h * scale.value}px`,
})
const hitWidth = (w: number) => Math.max(w, 10 / scale.value)

// ── Loading ──

watch(files, async (list) => {
  if (!list.length) { reset(); return }
  await loadPdf(list[0]!)
})

const reset = () => {
  for (const task of renderTasks.values()) task.cancel()
  for (const task of thumbTasks.values()) task.cancel()
  for (const tl of textLayers.values()) tl.cancel()
  pageObserver?.disconnect()
  thumbObserver?.disconnect()
  resizeObserver?.disconnect()
  pageObserver = thumbObserver = resizeObserver = null
  void loadingTask?.destroy()
  loadingTask = null
  pdfDoc = null
  pages.value = []
  order.value = []
  deleted.value = new Set()
  items.value = []
  imageStore.clear()
  selectedId.value = null
  mode.value = 'select'
  pendingImage.value = null
  fullscreen.value = false
  findOpen.value = false
  findQuery.value = ''
  hits.value = []
  hitIndex.value = -1
  history.value = []
  histIndex.value = -1
  error.value = ''
  origBytes = null
  for (const m of [pageProxies, textContents, canvases, textEls, thumbs, renderTasks, renderedKey, textLayers, textKey, thumbTasks, thumbKey]) m.clear()
  visiblePages.clear()
  visibleThumbs.clear()
}

const closeDoc = () => { files.value = [] }

const loadPdf = async (file: File) => {
  reset()
  loading.value = true
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    origBytes = bytes
    origName = file.name

    pdfjs ??= await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc
      = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

    // pdf.js detaches the buffer it gets, so hand it a copy.
    loadingTask = pdfjs.getDocument({ data: bytes.slice() })
    const doc = await loadingTask.promise
    pdfDoc = doc

    const infos: PageInfo[] = []
    for (let num = 1; num <= doc.numPages; num++) {
      const page = await getPage(num)
      const base = page.getViewport({ scale: 1, rotation: 0 })
      const baseRot = ((page.rotate % 360) + 360) % 360
      const swap = baseRot % 180 !== 0
      infos.push({
        num,
        baseRot,
        userRot: 0,
        rot: baseRot,
        rawW: base.width,
        rawH: base.height,
        vw: swap ? base.height : base.width,
        vh: swap ? base.width : base.height,
      })
    }
    pages.value = infos
    order.value = infos.map(p => p.num)
    currentIndex.value = 0
    pageInput.value = '1'
    commit()
    loading.value = false

    await nextTick()
    fitMode.value = 'width'
    applyFit()
    setupObservers()
  }
  catch (e) {
    console.error('[pdf-editor]', e)
    error.value = t('portal.tools.pdfEdit.loadFailed')
    loading.value = false
  }
}

const getPage = (num: number) => {
  let p = pageProxies.get(num)
  if (!p) {
    p = pdfDoc!.getPage(num)
    pageProxies.set(num, p)
  }
  return p
}

const getText = (num: number) => {
  let p = textContents.get(num)
  if (!p) {
    p = getPage(num).then(page => page.getTextContent())
    textContents.set(num, p)
  }
  return p
}

// ── Rendering ──

const setupObservers = () => {
  const viewer = viewerEl.value
  if (!viewer) return
  pageObserver = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const num = Number((en.target as HTMLElement).dataset.page)
      if (en.isIntersecting) visiblePages.add(num)
      else visiblePages.delete(num)
    }
    scheduleRender()
  }, { root: viewer, rootMargin: '600px 0px' })
  viewer.querySelectorAll<HTMLElement>('[data-page]').forEach(el => pageObserver!.observe(el))

  if (sidebarEl.value) {
    thumbObserver = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const num = Number((en.target as HTMLElement).dataset.thumb)
        if (en.isIntersecting) visibleThumbs.add(num)
        else visibleThumbs.delete(num)
      }
      scheduleRender()
    }, { root: sidebarEl.value, rootMargin: '300px 0px' })
    sidebarEl.value.querySelectorAll<HTMLElement>('[data-thumb]').forEach(el => thumbObserver!.observe(el))
  }

  resizeObserver = new ResizeObserver(() => { if (fitMode.value) applyFit() })
  resizeObserver.observe(viewer)
}

let renderTimer: ReturnType<typeof setTimeout> | null = null
const scheduleRender = (delay = 0) => {
  if (renderTimer) clearTimeout(renderTimer)
  renderTimer = setTimeout(() => { renderTimer = null; renderVisible() }, delay)
}

const renderVisible = () => {
  if (!pdfDoc) return
  const s = scale.value
  for (const p of pages.value) {
    const key = `${s.toFixed(4)}:${p.rot}`
    if (visiblePages.has(p.num)) {
      if (renderedKey.get(p.num) !== key) void renderPage(p, key)
    }
    else if (pages.value.length > 24 && renderedKey.has(p.num)) {
      // Free far-away pages on big documents so memory stays sane.
      renderTasks.get(p.num)?.cancel()
      const canvas = canvases.get(p.num)
      if (canvas) { canvas.width = 0; canvas.height = 0 }
      renderedKey.delete(p.num)
    }
    if (sidebar.value && visibleThumbs.has(p.num)) {
      const tkey = `t:${p.rot}`
      if (thumbKey.get(p.num) !== tkey) void renderThumb(p, tkey)
    }
  }
}

const isCancel = (e: unknown) => (e as { name?: string } | null)?.name === 'RenderingCancelledException'

const renderPage = async (p: PageInfo, key: string) => {
  const canvas = canvases.get(p.num)
  if (!canvas || !pdfjs) return
  renderTasks.get(p.num)?.cancel()
  renderedKey.set(p.num, key) // claim; cleared again on failure
  const s = scale.value
  const rot = p.rot
  const dpr = window.devicePixelRatio || 1
  try {
    const page = await getPage(p.num)
    const viewport = page.getViewport({ scale: s * dpr, rotation: rot })
    // Render offscreen and swap, so re-rendering at a new zoom never flashes blank.
    const off = document.createElement('canvas')
    off.width = Math.floor(viewport.width)
    off.height = Math.floor(viewport.height)
    const task = page.render({ canvas: off, viewport })
    renderTasks.set(p.num, task)
    await task.promise
    if (renderTasks.get(p.num) === task) renderTasks.delete(p.num)
    if (renderedKey.get(p.num) !== key) return // superseded
    canvas.width = off.width
    canvas.height = off.height
    canvas.getContext('2d')?.drawImage(off, 0, 0)
    if (textKey.get(p.num) !== rot) await renderTextLayer(p, page, rot)
  }
  catch (e) {
    if (renderedKey.get(p.num) === key) renderedKey.delete(p.num)
    if (!isCancel(e)) console.error('[pdf-editor] render', e)
  }
}

const renderTextLayer = async (p: PageInfo, page: PDFPageProxy, rot: number) => {
  const el = textEls.get(p.num)
  if (!el || !pdfjs) return
  textLayers.get(p.num)?.cancel()
  el.replaceChildren()
  textKey.set(p.num, rot)
  try {
    const tl = new pdfjs.TextLayer({
      textContentSource: await getText(p.num),
      container: el,
      viewport: page.getViewport({ scale: scale.value, rotation: rot }),
    })
    textLayers.set(p.num, tl)
    await tl.render()
    const end = document.createElement('div')
    end.className = 'endOfContent'
    el.append(end)
  }
  catch (e) {
    textKey.delete(p.num)
    if (!isCancel(e)) console.error('[pdf-editor] text layer', e)
  }
}

const renderThumb = async (p: PageInfo, key: string) => {
  const canvas = thumbs.get(p.num)
  if (!canvas) return
  thumbTasks.get(p.num)?.cancel()
  thumbKey.set(p.num, key)
  try {
    const page = await getPage(p.num)
    const dpr = window.devicePixelRatio || 1
    const viewport = page.getViewport({ scale: (150 / p.vw) * dpr, rotation: p.rot })
    const off = document.createElement('canvas')
    off.width = Math.floor(viewport.width)
    off.height = Math.floor(viewport.height)
    const task = page.render({ canvas: off, viewport })
    thumbTasks.set(p.num, task)
    await task.promise
    if (thumbKey.get(p.num) !== key) return
    canvas.width = off.width
    canvas.height = off.height
    canvas.getContext('2d')?.drawImage(off, 0, 0)
  }
  catch (e) {
    if (thumbKey.get(p.num) === key) thumbKey.delete(p.num)
    if (!isCancel(e)) console.error('[pdf-editor] thumb', e)
  }
}

watch(sidebar, v => v && nextTick(() => {
  if (!thumbObserver && sidebarEl.value && viewerEl.value) {
    // Sidebar mounted after load: attach the observer now.
    setupObservers()
  }
  scheduleRender()
}))

// ── Zoom & navigation ──

const setZoom = (z: number, fit: 'width' | 'page' | null = null, anchorClientY?: number) => {
  const viewer = viewerEl.value
  const next = clamp(z, 0.25, 6)
  const prevScale = scale.value
  fitMode.value = fit
  if (Math.abs(next - zoom.value) < 1e-4) return
  const rect = viewer?.getBoundingClientRect()
  const anchorY = viewer && rect ? (anchorClientY ?? rect.top + viewer.clientHeight / 2) - rect.top : 0
  const docY = viewer ? viewer.scrollTop + anchorY : 0
  zoom.value = next
  nextTick(() => {
    if (viewer) viewer.scrollTop = docY * (scale.value / prevScale) - anchorY
    scheduleRender(120)
  })
}

const applyFit = () => {
  const viewer = viewerEl.value
  if (!viewer || !pages.value.length || !fitMode.value) return
  const maxW = Math.max(...pages.value.map(p => p.vw))
  const maxH = Math.max(...pages.value.map(p => p.vh))
  const availW = viewer.clientWidth - 32
  const availH = viewer.clientHeight - 32
  let z = availW / (maxW * CSS_UNITS)
  if (fitMode.value === 'page') z = Math.min(z, availH / (maxH * CSS_UNITS))
  setZoom(z, fitMode.value)
  scheduleRender()
}

const zoomBy = (dir: 1 | -1, anchorClientY?: number) => {
  const z = zoom.value
  const next = dir > 0
    ? ZOOM_STEPS.find(s => s > z + 1e-3) ?? Math.min(6, z * 1.25)
    : [...ZOOM_STEPS].reverse().find(s => s < z - 1e-3) ?? Math.max(0.25, z / 1.25)
  setZoom(next, null, anchorClientY)
}

const onZoomSel = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  if (v === 'fit-width' || v === 'fit-page') {
    fitMode.value = v === 'fit-width' ? 'width' : 'page'
    applyFit()
  }
  else setZoom(Number(v))
}

const onWheel = (e: WheelEvent) => {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  zoomBy(e.deltaY < 0 ? 1 : -1, e.clientY)
}

const pageEl = (num: number) => viewerEl.value?.querySelector<HTMLElement>(`[data-page="${num}"]`) ?? null

const goTo = (index: number) => {
  const p = ordered.value[clamp(index, 0, ordered.value.length - 1)]
  const viewer = viewerEl.value
  const el = p && pageEl(p.num)
  if (!viewer || !el) return
  viewer.scrollTop = el.offsetTop - 16
  currentIndex.value = clamp(index, 0, ordered.value.length - 1)
}

const jumpTo = () => {
  const n = parseInt(pageInput.value, 10)
  if (Number.isFinite(n) && n >= 1 && n <= ordered.value.length) goTo(n - 1)
  else pageInput.value = String(currentIndex.value + 1)
}

watch(currentIndex, i => { pageInput.value = String(i + 1) })

let scrollRaf = 0
const onScroll = () => {
  if (scrollRaf) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0
    const viewer = viewerEl.value
    if (!viewer) return
    const top = viewer.scrollTop
    const bottom = top + viewer.clientHeight
    let best = -1
    let bestOverlap = -1
    ordered.value.forEach((p, i) => {
      const el = pageEl(p.num)
      if (!el) return
      const a = el.offsetTop
      const b = a + el.offsetHeight
      const overlap = Math.min(b, bottom) - Math.max(a, top)
      if (overlap > bestOverlap) { bestOverlap = overlap; best = i }
    })
    if (best >= 0) currentIndex.value = best
  })
}

// ── Page operations ──

const applyRot = (p: PageInfo, userRot: number) => {
  p.userRot = ((userRot % 360) + 360) % 360
  p.rot = (p.baseRot + p.userRot) % 360
  const swap = p.rot % 180 !== 0
  p.vw = swap ? p.rawH : p.rawW
  p.vh = swap ? p.rawW : p.rawH
}

const rotatePage = (num: number, delta: number) => {
  const p = pageMap.value.get(num)
  if (!p) return
  applyRot(p, p.userRot + delta)
  commit()
  afterRotation()
}

const afterRotation = () => {
  scheduleRender()
  if (findQuery.value.trim()) void runFind()
}

const togglePage = (n: number) => {
  const next = new Set(deleted.value)
  if (next.has(n)) next.delete(n)
  else next.add(n)
  deleted.value = next
  commit()
}

const movePage = (i: number, dir: -1 | 1) => {
  const j = i + dir
  if (j < 0 || j >= order.value.length) return
  const next = [...order.value]
  ;[next[i], next[j]] = [next[j]!, next[i]!]
  order.value = next
  commit()
  nextTick(() => { goTo(j); scheduleRender() })
}

// ── History ──

const history = ref<string[]>([])
const histIndex = ref(-1)
const canUndo = computed(() => histIndex.value > 0)
const canRedo = computed(() => histIndex.value < history.value.length - 1)

const snapshot = (): string => JSON.stringify({
  items: items.value,
  order: order.value,
  deleted: [...deleted.value],
  userRot: Object.fromEntries(pages.value.map(p => [p.num, p.userRot])),
} satisfies Snapshot)

const commit = () => {
  const snap = snapshot()
  if (history.value[histIndex.value] === snap) return
  history.value = [...history.value.slice(0, histIndex.value + 1), snap].slice(-100)
  histIndex.value = history.value.length - 1
}

const restore = (snap: string) => {
  const s = JSON.parse(snap) as Snapshot
  items.value = s.items
  order.value = s.order
  deleted.value = new Set(s.deleted)
  let rotated = false
  for (const p of pages.value) {
    const r = s.userRot[p.num] ?? 0
    if (r !== p.userRot) { applyRot(p, r); rotated = true }
  }
  if (selectedId.value && !items.value.some(i => i.id === selectedId.value)) selectedId.value = null
  if (rotated) afterRotation()
  else scheduleRender()
}

const undo = () => { if (canUndo.value) { histIndex.value--; restore(history.value[histIndex.value]!) } }
const redo = () => { if (canRedo.value) { histIndex.value++; restore(history.value[histIndex.value]!) } }

// ── Toolbar ──

const setMode = (m: Mode) => {
  if (m === 'image') { imgInput.value?.click(); return }
  mode.value = m
  if (m !== 'select') selectedId.value = null
  window.getSelection()?.removeAllRanges()
}

const setColor = (c: string) => {
  if (isHl.value) hlColor.value = c
  else color.value = c
}

const onImagePicked = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (imgInput.value) imgInput.value.value = ''
  if (!file) return
  try {
    const isJpg = /jpe?g$/i.test(file.type) || /\.jpe?g$/i.test(file.name)
    const isPng = /png$/i.test(file.type) || /\.png$/i.test(file.name)
    const bytes = isJpg || isPng
      ? new Uint8Array(await file.arrayBuffer())
      : await imageToPngBytes(file)
    const bitmap = await createImageBitmap(file)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(new Blob([bytes as BlobPart], { type: isJpg ? 'image/jpeg' : 'image/png' }))
    })
    const id = uid()
    imageStore.set(id, { bytes, format: isJpg ? 'jpg' : 'png', dataUrl, natW: bitmap.width, natH: bitmap.height })
    bitmap.close()
    pendingImage.value = id
    mode.value = 'image'
    selectedId.value = null
  }
  catch {
    error.value = t('portal.tools.pdfEdit.loadFailed')
  }
}

// Changing a toolbar option while an item is selected restyles that item.
watch([textSize, bold, color, hlColor, strokeWidth], () => {
  const it = selected.value
  if (!it) return
  let changed = false
  const set = <K extends string>(obj: Record<K, unknown>, key: K, v: unknown) => {
    if (obj[key] !== v) { obj[key] = v; changed = true }
  }
  if (it.kind === 'text') { set(it, 'size', textSize.value); set(it, 'bold', bold.value); set(it, 'color', color.value) }
  else if (it.kind === 'highlight') set(it, 'color', hlColor.value)
  else if (it.kind === 'draw' || it.kind === 'box' || it.kind === 'arrow') { set(it, 'color', color.value); set(it, 'width', strokeWidth.value) }
  if (changed) commit()
})

const selectItem = (id: string | null) => {
  selectedId.value = id
  const it = selected.value
  if (!it) return
  // Sync the toolbar to the item.
  if (it.kind === 'text') { textSize.value = it.size; bold.value = it.bold; color.value = it.color }
  else if (it.kind === 'highlight') hlColor.value = it.color
  else if (it.kind === 'draw' || it.kind === 'box' || it.kind === 'arrow') { color.value = it.color; strokeWidth.value = it.width }
}

const removeItem = (it: EditorItem) => {
  items.value = items.value.filter(x => x.id !== it.id)
  if (selectedId.value === it.id) selectedId.value = null
  commit()
}

// ── Text items ──

let measureCtx: CanvasRenderingContext2D | null = null
const measureWidth = (text: string, px: number, isBold: boolean) => {
  measureCtx ??= document.createElement('canvas').getContext('2d')
  if (!measureCtx) return text.length * px * 0.55
  measureCtx.font = `${isBold ? 'bold ' : ''}${px}px Helvetica, Arial, sans-serif`
  return measureCtx.measureText(text).width
}

/** Text box size in points (matches what pdf-lib will lay out). */
const textBox = (it: TextItem): Box => {
  const lines = it.text.split('\n')
  const w = Math.max(...lines.map(l => measureWidth(l || ' ', it.size, it.bold)))
  return { x: it.x, y: it.y, w: w + 2, h: lines.length * it.size * LINE_HEIGHT }
}

const textStyle = (it: TextItem) => {
  const s = scale.value
  const b = textBox(it)
  return {
    color: it.color,
    fontSize: `${it.size * s}px`,
    lineHeight: String(LINE_HEIGHT),
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontWeight: it.bold ? 700 : 400,
    whiteSpace: 'pre',
    // A little slack so the caret at the end of the longest line is visible.
    width: `${Math.ceil((b.w + it.size) * s) + 4}px`,
    height: `${Math.ceil(b.h * s) + 2}px`,
    ...(it.color.toLowerCase() === '#ffffff' ? { textShadow: '0 0 2px rgba(0,0,0,0.5)' } : {}),
  }
}

let textBefore = ''
const onTextFocus = (it: TextItem) => {
  selectItem(it.id)
  textBefore = it.text
}

const onTextBlur = (it: TextItem) => {
  if (!it.text.trim()) { removeItem(it); return }
  if (it.text !== textBefore) commit()
}

// ── Geometry helpers ──

const layersOf = (p: PageInfo): Layer[] => layersByPage.value.get(p.num) ?? []

const layerDims = (p: PageInfo, rot: number) => {
  const swap = ((p.rot - rot + 360) % 360) % 180 !== 0
  return { w: swap ? p.vh : p.vw, h: swap ? p.vw : p.vh }
}

const layersByPage = computed(() => {
  const map = new Map<number, Layer[]>()
  for (const p of pages.value) map.set(p.num, [{ rot: p.rot, w: p.vw, h: p.vh, items: [], texts: [] }])
  for (const it of items.value) {
    const p = pageMap.value.get(it.page)
    const layers = map.get(it.page)
    if (!p || !layers) continue
    let L = layers.find(l => l.rot === it.rot)
    if (!L) {
      L = { rot: it.rot, ...layerDims(p, it.rot), items: [], texts: [] }
      layers.push(L)
    }
    if (it.kind === 'text') L.texts.push(it)
    else L.items.push(it)
  }
  return map
})

const ROT_TRANSFORM: Record<number, string> = {
  0: 'none',
  90: 'rotate(90deg) translateY(-100%)',
  180: 'rotate(180deg) translate(-100%, -100%)',
  270: 'rotate(270deg) translateX(-100%)',
}

const layerStyle = (p: PageInfo, L: Layer) => ({
  width: `${L.w * scale.value}px`,
  height: `${L.h * scale.value}px`,
  transform: ROT_TRANSFORM[(p.rot - L.rot + 360) % 360],
})

/** Convert a screen-space delta into an item's own (possibly rotated) space. */
const toItemDelta = (p: PageInfo, rot: number, dx: number, dy: number): Pt => {
  const d = (p.rot - rot + 360) % 360
  const s = scale.value
  dx /= s
  dy /= s
  if (d === 90) return { x: dy, y: -dx }
  if (d === 180) return { x: -dx, y: -dy }
  if (d === 270) return { x: -dy, y: dx }
  return { x: dx, y: dy }
}

const bboxOf = (it: EditorItem): Box => {
  switch (it.kind) {
    case 'text': return textBox(it)
    case 'rect':
    case 'box':
    case 'image': return { x: it.x, y: it.y, w: it.w, h: it.h }
    case 'arrow': {
      const pad = it.width
      const x = Math.min(it.x1, it.x2) - pad
      const y = Math.min(it.y1, it.y2) - pad
      return { x, y, w: Math.abs(it.x2 - it.x1) + pad * 2, h: Math.abs(it.y2 - it.y1) + pad * 2 }
    }
    case 'highlight':
    case 'draw': {
      const pts: Pt[] = it.kind === 'draw'
        ? it.points
        : it.rects.flatMap(r => [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y + r.h }])
      const pad = it.kind === 'draw' ? it.width / 2 : 0
      const xs = pts.map(q => q.x)
      const ys = pts.map(q => q.y)
      const x = Math.min(...xs) - pad
      const y = Math.min(...ys) - pad
      return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y }
    }
  }
}

const strokePath = (it: DrawItem) => {
  if (!it.points.length) return ''
  const [first, ...rest] = it.points
  return `M ${first!.x.toFixed(2)} ${first!.y.toFixed(2)}${rest.map(q => ` L ${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join('')}`
}

const arrowHead = (it: ArrowItem): Pt[] => {
  const dx = it.x2 - it.x1
  const dy = it.y2 - it.y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const size = Math.max(8, it.width * 4)
  const bx = it.x2 - ux * size
  const by = it.y2 - uy * size
  const half = size * 0.5
  return [
    { x: it.x2, y: it.y2 },
    { x: bx - uy * half, y: by + ux * half },
    { x: bx + uy * half, y: by - ux * half },
  ]
}

const shiftItem = (it: EditorItem, orig: EditorItem, dx: number, dy: number) => {
  switch (it.kind) {
    case 'text':
    case 'rect':
    case 'box':
    case 'image': {
      const o = orig as typeof it
      it.x = o.x + dx
      it.y = o.y + dy
      break
    }
    case 'arrow': {
      const o = orig as ArrowItem
      it.x1 = o.x1 + dx; it.y1 = o.y1 + dy; it.x2 = o.x2 + dx; it.y2 = o.y2 + dy
      break
    }
    case 'highlight': {
      const o = orig as HighlightItem
      it.rects = o.rects.map(r => ({ ...r, x: r.x + dx, y: r.y + dy }))
      break
    }
    case 'draw': {
      const o = orig as DrawItem
      it.points = o.points.map(q => ({ x: q.x + dx, y: q.y + dy }))
      break
    }
  }
}

// ── Pointer interactions ──

interface Action {
  type: 'move' | 'resize' | 'rect-new' | 'box-new' | 'arrow-new' | 'draw'
  item: EditorItem
  page: PageInfo
  startX: number
  startY: number
  /** Deep copy of the item at gesture start. */
  orig: EditorItem
  /** Page container rect at gesture start (creation gestures). */
  rect: DOMRect | null
  moved: boolean
}
let action: Action | null = null

const pagePoint = (p: PageInfo, rect: DOMRect, e: PointerEvent): Pt => ({
  x: clamp((e.clientX - rect.left) / scale.value, 0, p.vw),
  y: clamp((e.clientY - rect.top) / scale.value, 0, p.vh),
})

const bindWindow = () => {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp, { once: true })
  window.addEventListener('pointercancel', onPointerUp, { once: true })
}

const begin = (type: Action['type'], item: EditorItem, page: PageInfo, e: PointerEvent, rect: DOMRect | null) => {
  action = { type, item, page, startX: e.clientX, startY: e.clientY, orig: JSON.parse(JSON.stringify(item)) as EditorItem, rect, moved: false }
  bindWindow()
}

const onPageDown = (p: PageInfo, e: PointerEvent) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (deleted.value.has(p.num)) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pt = pagePoint(p, rect, e)
  const m = mode.value

  if (m === 'select' || m === 'highlight') {
    // Click on the page background: clear the selection, let the text layer select text.
    selectedId.value = null
    return
  }

  if (m === 'text') {
    e.preventDefault()
    const it: TextItem = {
      id: uid(), kind: 'text', page: p.num, rot: p.rot,
      x: pt.x, y: clamp(pt.y - textSize.value * 0.6, 0, p.vh - textSize.value),
      size: textSize.value, color: color.value, bold: bold.value, text: '',
    }
    items.value.push(it)
    mode.value = 'select'
    selectItem(it.id)
    nextTick(() => document.querySelector<HTMLTextAreaElement>(`[data-text-id="${it.id}"]`)?.focus())
    return
  }

  if (m === 'image' && pendingImage.value) {
    const src = imageStore.get(pendingImage.value)
    if (!src) { mode.value = 'select'; return }
    const w = Math.min(240, src.natW * 0.75, p.vw * 0.6)
    const h = w * (src.natH / src.natW)
    const it: ImageItem = {
      id: uid(), kind: 'image', page: p.num, rot: p.rot,
      x: clamp(pt.x - w / 2, 0, p.vw - w),
      y: clamp(pt.y - h / 2, 0, p.vh - h),
      w, h, srcId: pendingImage.value,
    }
    items.value.push(it)
    pendingImage.value = null
    mode.value = 'select'
    selectItem(it.id)
    commit()
    return
  }

  e.preventDefault()
  if (m === 'rect') {
    const it: RectItem = { id: uid(), kind: 'rect', page: p.num, rot: p.rot, x: pt.x, y: pt.y, w: 0, h: 0 }
    items.value.push(it)
    begin('rect-new', it, p, e, rect)
  }
  else if (m === 'box') {
    const it: BoxItem = { id: uid(), kind: 'box', page: p.num, rot: p.rot, x: pt.x, y: pt.y, w: 0, h: 0, color: color.value, width: strokeWidth.value }
    items.value.push(it)
    begin('box-new', it, p, e, rect)
  }
  else if (m === 'arrow') {
    const it: ArrowItem = { id: uid(), kind: 'arrow', page: p.num, rot: p.rot, x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, color: color.value, width: strokeWidth.value }
    items.value.push(it)
    begin('arrow-new', it, p, e, rect)
  }
  else if (m === 'draw') {
    const it: DrawItem = { id: uid(), kind: 'draw', page: p.num, rot: p.rot, color: color.value, width: strokeWidth.value, points: [pt] }
    items.value.push(it)
    begin('draw', it, p, e, rect)
  }
}

const startMove = (it: EditorItem, p: PageInfo, e: PointerEvent) => {
  if (mode.value !== 'select') return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  e.preventDefault()
  selectItem(it.id)
  begin('move', it, p, e, null)
}

const startResize = (it: Sized, p: PageInfo, e: PointerEvent) => {
  if (mode.value !== 'select') return
  e.preventDefault()
  begin('resize', it, p, e, null)
}

const onPointerMove = (e: PointerEvent) => {
  if (!action) return
  const { type, item, page, startX, startY, orig, rect } = action
  action.moved = true

  if (type === 'move') {
    const d = toItemDelta(page, item.rot, e.clientX - startX, e.clientY - startY)
    // Keep the item on the page.
    const L = layerDims(page, item.rot)
    const b = bboxOf(orig)
    const dx = clamp(d.x, -b.x, L.w - b.x - b.w)
    const dy = clamp(d.y, -b.y, L.h - b.y - b.h)
    shiftItem(item, orig, dx, dy)
    return
  }

  if (type === 'resize' && (item.kind === 'rect' || item.kind === 'image' || item.kind === 'box')) {
    const d = toItemDelta(page, item.rot, e.clientX - startX, e.clientY - startY)
    const L = layerDims(page, item.rot)
    const o = orig as Sized
    if (item.kind === 'image') {
      const src = imageStore.get(item.srcId)
      const ratio = src ? src.natH / src.natW : o.h / o.w
      let w = clamp(o.w + d.x, 12, L.w - item.x)
      let h = w * ratio
      if (item.y + h > L.h) { h = L.h - item.y; w = h / ratio }
      item.w = w
      item.h = h
    }
    else {
      item.w = clamp(o.w + d.x, 4, L.w - item.x)
      item.h = clamp(o.h + d.y, 4, L.h - item.y)
    }
    return
  }

  if (!rect) return
  const pt = pagePoint(page, rect, e)
  const o = orig as Sized

  if ((type === 'rect-new' || type === 'box-new') && (item.kind === 'rect' || item.kind === 'box')) {
    item.x = Math.min(o.x, pt.x)
    item.y = Math.min(o.y, pt.y)
    item.w = Math.abs(pt.x - o.x)
    item.h = Math.abs(pt.y - o.y)
  }
  else if (type === 'arrow-new' && item.kind === 'arrow') {
    if (e.shiftKey) {
      // Snap to 45° steps.
      const dx = pt.x - item.x1
      const dy = pt.y - item.y1
      const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
      const len = Math.hypot(dx, dy)
      item.x2 = item.x1 + Math.cos(ang) * len
      item.y2 = item.y1 + Math.sin(ang) * len
    }
    else { item.x2 = pt.x; item.y2 = pt.y }
  }
  else if (type === 'draw' && item.kind === 'draw') {
    const last = item.points[item.points.length - 1]!
    if (Math.hypot(pt.x - last.x, pt.y - last.y) > 0.5) item.points.push(pt)
  }
}

const onPointerUp = () => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  if (!action) return
  const { type, item, moved } = action
  action = null

  // Discard degenerate gestures (a stray click).
  if ((type === 'rect-new' || type === 'box-new') && (item.kind === 'rect' || item.kind === 'box') && (item.w < 3 || item.h < 3)) {
    items.value = items.value.filter(x => x.id !== item.id)
    return
  }
  if (type === 'arrow-new' && item.kind === 'arrow' && Math.hypot(item.x2 - item.x1, item.y2 - item.y1) < 4) {
    items.value = items.value.filter(x => x.id !== item.id)
    return
  }
  if (type === 'draw' && item.kind === 'draw') {
    if (item.points.length < 2) item.points.push({ x: item.points[0]!.x + 0.5, y: item.points[0]!.y })
    commit()
    return
  }
  if (type === 'rect-new' || type === 'box-new' || type === 'arrow-new') {
    mode.value = 'select'
    selectItem(item.id)
    commit()
    return
  }
  if (moved) commit()
}

/** Highlight tool: turn the current text selection into a highlight. */
const onViewerUp = () => {
  if (mode.value !== 'highlight') return
  setTimeout(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const startEl = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement
    const pageDiv = startEl?.closest<HTMLElement>('[data-page]')
    if (!pageDiv) return
    const num = Number(pageDiv.dataset.page)
    const p = pageMap.value.get(num)
    if (!p) return
    const pr = pageDiv.getBoundingClientRect()
    const s = scale.value
    const raw: Box[] = []
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 1 || r.height < 1) continue
      if (r.bottom < pr.top || r.top > pr.bottom || r.right < pr.left || r.left > pr.right) continue
      raw.push({ x: (r.left - pr.left) / s, y: (r.top - pr.top) / s, w: r.width / s, h: r.height / s })
    }
    if (!raw.length) return
    // Merge the per-span rects into one box per line.
    raw.sort((a, b) => a.y - b.y || a.x - b.x)
    const lines: Box[] = []
    for (const r of raw) {
      const last = lines[lines.length - 1]
      if (last && Math.abs(r.y - last.y) < Math.min(r.h, last.h) * 0.5) {
        const x = Math.min(last.x, r.x)
        const right = Math.max(last.x + last.w, r.x + r.w)
        last.x = x
        last.w = right - x
        last.y = Math.min(last.y, r.y)
        last.h = Math.max(last.h, r.h)
      }
      else lines.push({ ...r })
    }
    // pdf.js spans are a little taller than the glyphs; tighten slightly.
    const rects = lines.map(r => ({ x: r.x, y: r.y + r.h * 0.06, w: r.w, h: r.h * 0.9 }))
    const it: HighlightItem = { id: uid(), kind: 'highlight', page: num, rot: p.rot, color: hlColor.value, rects }
    items.value.push(it)
    sel.removeAllRanges()
    commit()
  }, 0)
}

// Match pdf.js' own selection behaviour: while dragging a selection the
// endOfContent div expands so the selection can extend past the last span.
const onDocPointerDown = (e: PointerEvent) => {
  const tl = (e.target as Element | null)?.closest?.('.pdfw .textLayer')
  if (tl) {
    tl.classList.add('selecting')
    window.addEventListener('pointerup', () => tl.classList.remove('selecting'), { once: true })
  }
}

// ── Keyboard ──

const onKey = (e: KeyboardEvent) => {
  if (!loaded.value) return
  const target = e.target as HTMLElement | null
  const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
  const mod = e.ctrlKey || e.metaKey

  if (mod && e.key.toLowerCase() === 'f') { e.preventDefault(); if (!findOpen.value) toggleFind(); else findInput.value?.focus(); return }
  if (typing) return

  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return }
  if (mod && (e.key === '+' || e.key === '=')) { e.preventDefault(); zoomBy(1); return }
  if (mod && e.key === '-') { e.preventDefault(); zoomBy(-1); return }
  if (mod && e.key === '0') { e.preventDefault(); fitMode.value = 'width'; applyFit(); return }
  if (mod) return

  if (e.key === 'Escape') {
    if (selectedId.value) selectedId.value = null
    else if (mode.value !== 'select') { mode.value = 'select'; pendingImage.value = null }
    else if (findOpen.value) toggleFind()
    else if (fullscreen.value) fullscreen.value = false
    return
  }
  const sel = selected.value
  if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); removeItem(sel); return }
  if (sel && sel.kind !== 'text' && e.key.startsWith('Arrow')) {
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
    const p = pageMap.value.get(sel.page)
    if (!p) return
    const d = toItemDelta(p, sel.rot, dx * scale.value, dy * scale.value)
    shiftItem(sel, JSON.parse(JSON.stringify(sel)) as EditorItem, d.x, d.y)
    commit()
    return
  }
  if (e.key === 'PageDown' || e.key === 'PageUp') { e.preventDefault(); goTo(currentIndex.value + (e.key === 'PageDown' ? 1 : -1)); return }
  if (e.key === 'Home') { e.preventDefault(); goTo(0); return }
  if (e.key === 'End') { e.preventDefault(); goTo(ordered.value.length - 1); return }
  const m = (Object.keys(KEYS) as Mode[]).find(k => KEYS[k] === e.key.toLowerCase())
  if (m) { e.preventDefault(); setMode(m) }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.addEventListener('pointerdown', onDocPointerDown, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  window.removeEventListener('pointermove', onPointerMove)
  reset()
})

// ── Find ──

const hitsByPage = computed(() => {
  const map = new Map<number, Hit[]>()
  for (const h of hits.value) {
    const list = map.get(h.page) ?? []
    list.push(h)
    map.set(h.page, list)
  }
  return map
})

const findStatus = computed(() => {
  if (!findQuery.value.trim()) return ''
  if (!hits.value.length) return t('portal.tools.pdfEdit.findNone')
  return t('portal.tools.pdfEdit.findCount', { i: hitIndex.value + 1, n: hits.value.length })
})

const toggleFind = () => {
  findOpen.value = !findOpen.value
  if (findOpen.value) nextTick(() => findInput.value?.select())
  else { hits.value = []; hitIndex.value = -1 }
}

let findTimer: ReturnType<typeof setTimeout> | null = null
let findToken = 0
watch(findQuery, () => {
  if (findTimer) clearTimeout(findTimer)
  findTimer = setTimeout(() => void runFind(), 250)
})

const runFind = async () => {
  const q = findQuery.value.trim().toLowerCase()
  const token = ++findToken
  if (!q || !pdfDoc) { hits.value = []; hitIndex.value = -1; return }
  const found: Hit[] = []
  for (const p of ordered.value) {
    const [page, content] = await Promise.all([getPage(p.num), getText(p.num)])
    if (token !== findToken) return
    const viewport = page.getViewport({ scale: 1, rotation: p.rot })
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue
      const str = item.str.toLowerCase()
      let from = 0
      let at: number
      while ((at = str.indexOf(q, from)) !== -1) {
        from = at + q.length
        const [, , , , e, f] = item.transform as number[]
        const w = item.width
        const h = item.height || 10
        const x0 = e! + w * (at / str.length)
        const x1 = e! + w * ((at + q.length) / str.length)
        const [ax, ay] = viewport.convertToViewportPoint(x0, f! - h * 0.22)
        const [bx, by] = viewport.convertToViewportPoint(x1, f! + h * 0.78)
        found.push({
          idx: found.length,
          page: p.num,
          x: Math.min(ax, bx),
          y: Math.min(ay, by),
          w: Math.abs(bx - ax),
          h: Math.abs(by - ay),
        })
      }
    }
  }
  hits.value = found
  hitIndex.value = found.length ? 0 : -1
  if (found.length) scrollToHit(found[0]!)
}

const findStep = (dir: 1 | -1) => {
  if (!hits.value.length) return
  hitIndex.value = (hitIndex.value + dir + hits.value.length) % hits.value.length
  scrollToHit(hits.value[hitIndex.value]!)
}

const scrollToHit = (h: Hit) => {
  const viewer = viewerEl.value
  const el = pageEl(h.page)
  if (!viewer || !el) return
  const y = el.offsetTop + (h.y + h.h / 2) * scale.value
  viewer.scrollTo({ top: y - viewer.clientHeight / 2, behavior: 'smooth' })
}

// ── Export ──

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/**
 * Matrix mapping "flat" annotation space (origin bottom-left of the page as
 * displayed at `rot`, y up) into the page's own unrotated user space.
 */
const ctmFor = (rot: number, box: { x: number, y: number, width: number, height: number }): [number, number, number, number, number, number] => {
  const { x, y, width: w, height: h } = box
  switch (rot) {
    case 90: return [0, 1, -1, 0, x + w, y]
    case 180: return [-1, 0, 0, -1, x + w, y + h]
    case 270: return [0, -1, 1, 0, x, y + h]
    default: return [1, 0, 0, 1, x, y]
  }
}

const exportPdf = async () => {
  if (!origBytes) return
  error.value = ''
  busy.value = true
  try {
    const doc = await PDFDocument.load(origBytes, { ignoreEncryption: true })
    const fonts = {
      regular: await doc.embedFont(StandardFonts.Helvetica),
      bold: await doc.embedFont(StandardFonts.HelveticaBold),
    }
    const imgCache = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>()
    const embedImage = async (srcId: string) => {
      let img = imgCache.get(srcId)
      if (!img) {
        const src = imageStore.get(srcId)
        if (!src) return null
        img = src.format === 'jpg' ? await doc.embedJpg(src.bytes) : await doc.embedPng(src.bytes)
        imgCache.set(srcId, img)
      }
      return img
    }

    for (const p of pages.value) {
      if (deleted.value.has(p.num)) continue
      const page = doc.getPage(p.num - 1)
      const box = page.getCropBox()
      const pageItems = items.value.filter(i => i.page === p.num)
      const rots = [...new Set(pageItems.map(i => i.rot))]

      for (const rot of rots) {
        const group = pageItems.filter(i => i.rot === rot)
        const vh = rot % 180 === 0 ? box.height : box.width
        page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...ctmFor(rot, box)))

        // White-out first so everything else stays on top, matching the preview.
        const sorted = [...group.filter(i => i.kind === 'rect'), ...group.filter(i => i.kind !== 'rect')]
        for (const it of sorted) {
          if (it.kind === 'rect') {
            page.drawRectangle({ x: it.x, y: vh - it.y - it.h, width: it.w, height: it.h, color: rgb(1, 1, 1) })
          }
          else if (it.kind === 'highlight') {
            for (const r of it.rects) {
              page.drawRectangle({ x: r.x, y: vh - r.y - r.h, width: r.w, height: r.h, color: hexToRgb(it.color), blendMode: BlendMode.Multiply })
            }
          }
          else if (it.kind === 'text') {
            if (!it.text.trim()) continue
            page.drawText(it.text, {
              x: it.x,
              y: vh - it.y - it.size * BASELINE,
              size: it.size,
              lineHeight: it.size * LINE_HEIGHT,
              font: it.bold ? fonts.bold : fonts.regular,
              color: hexToRgb(it.color),
            })
          }
          else if (it.kind === 'image') {
            const img = await embedImage(it.srcId)
            if (img) page.drawImage(img, { x: it.x, y: vh - it.y - it.h, width: it.w, height: it.h })
          }
          else if (it.kind === 'box') {
            page.drawRectangle({ x: it.x, y: vh - it.y - it.h, width: it.w, height: it.h, borderColor: hexToRgb(it.color), borderWidth: it.width })
          }
          else if (it.kind === 'arrow') {
            const c = hexToRgb(it.color)
            page.drawLine({ start: { x: it.x1, y: vh - it.y1 }, end: { x: it.x2, y: vh - it.y2 }, thickness: it.width, color: c, lineCap: LineCapStyle.Round })
            const head = arrowHead(it)
            page.drawSvgPath(`M ${head.map(q => `${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join(' L ')} Z`, { x: 0, y: vh, color: c, borderWidth: 0 })
          }
          else if (it.kind === 'draw') {
            if (it.points.length < 2) continue
            page.drawSvgPath(strokePath(it), {
              x: 0,
              y: vh,
              borderColor: hexToRgb(it.color),
              borderWidth: it.width,
              borderLineCap: LineCapStyle.Round,
            })
          }
        }
        page.pushOperators(popGraphicsState())
      }

      if (p.userRot) page.setRotation(degrees(p.rot))
    }

    const keep = order.value.filter(n => !deleted.value.has(n))
    const inOrder = keep.every((n, i) => i === 0 || n > keep[i - 1]!)
    let out: Uint8Array
    if (inOrder) {
      for (const n of [...deleted.value].sort((a, b) => b - a)) doc.removePage(n - 1)
      out = await doc.save()
    }
    else {
      // Pages were reordered: rebuild the document in the new order.
      const rebuilt = await PDFDocument.create()
      const copied = await rebuilt.copyPages(doc, keep.map(n => n - 1))
      for (const pg of copied) rebuilt.addPage(pg)
      out = await rebuilt.save()
    }
    downloadBlob(out, `${baseName(origName)}-breytt.pdf`, 'application/pdf')
  }
  catch (e) {
    console.error('[pdf-editor]', e)
    error.value = t('portal.tools.pdfEdit.failed')
  }
  finally {
    busy.value = false
  }
}

useHead({ title: 'PDF ritill · Hjálpartól · Portal' })
</script>

<style>
/* Toolbar chrome */
.pdfw .tb {
  @apply inline-flex h-7 min-w-7 items-center justify-center gap-1.5 border border-transparent px-1.5 text-xs text-bone-400 transition-colors
    hover:border-ink-700 hover:text-bone-100 disabled:opacity-30 disabled:hover:border-transparent disabled:hover:text-bone-400;
}
.pdfw .tb.on {
  @apply border-gold-500 bg-gold-500/15 text-gold-400;
}
.pdfw .tbsel {
  @apply h-7 border border-ink-700 bg-ink-900 px-1.5 text-xs text-bone-100 focus:border-gold-500 focus:outline-none;
}
.pdfw .tbinput {
  @apply h-7 border border-ink-700 bg-ink-900 px-1.5 text-xs text-bone-100 placeholder-ink-500 focus:border-gold-500 focus:outline-none;
}
.pdfw .sep {
  @apply mx-1 h-5 w-px bg-ink-700;
}

/* Cursor per tool */
.pdfw.m-select .pdfw-page { cursor: default; }
.pdfw.m-text .pdfw-page { cursor: text; }
.pdfw.m-highlight .pdfw-page { cursor: text; }
.pdfw.m-draw .pdfw-page,
.pdfw.m-rect .pdfw-page,
.pdfw.m-box .pdfw-page,
.pdfw.m-arrow .pdfw-page { cursor: crosshair; touch-action: none; }
.pdfw.m-image .pdfw-page { cursor: copy; }

/* Which overlay receives the pointer depends on the active tool */
.pdfw .it, .pdfw .hit { pointer-events: none; }
.pdfw.m-select .it { pointer-events: auto; cursor: move; }
.pdfw.m-select .hit { pointer-events: stroke; cursor: move; }
.pdfw .tx { pointer-events: none; }
.pdfw.m-select .tx, .pdfw.m-text .tx { pointer-events: auto; }
.pdfw .textLayer { pointer-events: none; }
.pdfw.m-select .textLayer, .pdfw.m-highlight .textLayer { pointer-events: auto; }

/* pdf.js text layer (trimmed copy of pdf_viewer.css) */
.pdfw-page {
  --user-unit: 1;
  --total-scale-factor: calc(var(--scale-factor) * var(--user-unit));
  --scale-round-x: 1px;
  --scale-round-y: 1px;
}
.pdfw-page .textLayer {
  color-scheme: only light;
  position: absolute;
  text-align: initial;
  inset: 0;
  overflow: clip;
  opacity: 1;
  line-height: 1;
  letter-spacing: normal;
  word-spacing: normal;
  text-size-adjust: none;
  forced-color-adjust: none;
  transform-origin: 0 0;
  z-index: 1;
  --min-font-size: 1;
  --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
  --min-font-size-inv: calc(1 / var(--min-font-size));
}
.pdfw-page .textLayer :is(span, br) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
  user-select: text;
}
.pdfw-page .textLayer > :not(.markedContent),
.pdfw-page .textLayer .markedContent span:not(.markedContent) {
  z-index: 1;
  --font-height: 0;
  font-size: calc(var(--text-scale-factor) * var(--font-height));
  --scale-x: 1;
  --rotate: 0deg;
  transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
}
.pdfw-page .textLayer .markedContent { display: contents; }
.pdfw-page .textLayer ::selection { background: rgba(0, 90, 255, 0.3); }
.pdfw-page .textLayer .endOfContent {
  display: block;
  position: absolute;
  inset: 100% 0 0;
  z-index: 0;
  cursor: default;
  user-select: none;
}
.pdfw-page .textLayer.selecting .endOfContent { top: 0; }
.pdfw-page .textLayer[data-main-rotation="90"] { transform: rotate(90deg) translateY(-100%); }
.pdfw-page .textLayer[data-main-rotation="180"] { transform: rotate(180deg) translate(-100%, -100%); }
.pdfw-page .textLayer[data-main-rotation="270"] { transform: rotate(270deg) translateX(-100%); }
</style>
