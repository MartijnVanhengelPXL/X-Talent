import {
  P,
  FRAME_MS,
  activeIndex,
  cameraForScroll,
  clamp,
  ease,
  fade,
  followFactor,
  hudVisibility,
  scrollForCamera,
  worldScale,
} from './math'

/**
 * De treinrit langs de stations.
 *
 * De pagina scrollt gewoon (niets kaapt je scrollwiel). Een heel hoog "spoor" geeft
 * de scrollruimte; daarin blijft een sticky podium staan met een CSS-3D-wereld.
 * Elk object in die wereld is een DOM-element met data-attributen die zeggen waar
 * het staat (zie world/WorldLayer.vue). Bij elke scroll berekent de engine waar de
 * camera hoort, laat hem daar zacht naartoe glijden en verschuift alleen de objecten
 * in de buurt. Staat de camera stil, dan doet de engine niets.
 *
 * Tekenvolgorde: de browser sorteert de vlakken hier niet zelf (dat ging mis bij grote
 * vlakken, zoals de heuvel met de tunnel). Elk object krijgt een z-index: wat verst weg
 * is, wordt eerst getekend. Tijdens de rit verandert die volgorde nooit (alles schuift
 * evenveel op), dus ze wordt één keer gezet. Alleen op het perron, als de camera opzij
 * kijkt, rekent de engine ze per frame opnieuw uit.
 *
 * Afstappen: de camera glijdt van het spoor naar het perron en draait naar de
 * stationsmuur. Scrollen staat dan even stil, tot je weer opstapt.
 */

const NARROW = 760
/** Hoelang afstappen en opstappen duren, in ms. */
const STEP_MS = 1700

function pair(value, fallback) {
  if (!value) return fallback
  const [a, b] = value.split(',').map(Number)
  return [a ?? fallback[0], b ?? fallback[1]]
}

function num(value, fallback) {
  return value === undefined || value === '' ? fallback : Number(value)
}

const r1 = (v) => Math.round(v * 10) / 10

export class RideEngine {
  layers = []
  overlays = []
  cam = 0
  snap = true
  raf = 0
  lastFrame = 0
  destroyed = false
  trackTop = 0
  trackHeight = 0
  width = 0
  height = 0
  dims = ''
  active = -1
  boardKey = ''

  /** Waar de camera staat naast de rit: zijwaarts (x), hoogte (y), draaiing (yaw, in graden) en z op het perron. */
  view = { x: 0, y: 0, yaw: 0, z: 0 }
  /** Op het perron (of onderweg ernaartoe of terug). */
  platform = false
  tween = null

  /**
   * @param els { track, stage, scaler, world, huds: {id: element}, marker, markerTrack, hint }
   * @param layout uit buildLayout()
   * @param callbacks { onChapter(index), onBoard({ mode, id }) }
   */
  constructor(els, layout, callbacks) {
    this.els = els
    this.layout = layout
    this.windows = layout.windows
    this.callbacks = callbacks
  }

  start() {
    this.layers = Array.from(this.els.world.querySelectorAll('[data-layer]')).map((el) => {
      const d = el.dataset
      const L = {
        el,
        kind: d.layer,
        z: num(d.z, 0),
        x: num(d.x, 0),
        y: num(d.y, 0),
        len: num(d.len, 0),
        fog: pair(d.fog, [6000, 8500]),
        near: pair(d.near, [-120, -450]),
        mx: d.mx !== undefined ? Number(d.mx) : null,
        my: d.my !== undefined ? Number(d.my) : null,
        ms: num(d.ms, 1),
        bias: num(d.bias, 0),
        base: d.base !== undefined,
        ride: d.ride !== undefined,
        zi: -1,
        shown: false,
        op: -1,
        tf: '',
        // Halve breedte, om te weten of iets door de tunnelopening te zien is.
        hw: (d.layer === 'billboard' || d.layer === 'floor' || d.layer === 'ceiling' ? el.offsetWidth : 0) / 2,
      }
      return L
    })
    this.setRideOrder()
    this.overlays = Array.from(this.els.stage.querySelectorAll('[data-overlay]')).map((el) => ({
      el,
      from: Number(el.dataset.from),
      to: Number(el.dataset.to),
      max: num(el.dataset.max, 1),
      last: -1,
    }))
    this.hudState = {}
    window.addEventListener('scroll', this.request, { passive: true })
    window.addEventListener('resize', this.onResize)
    this.measure()
    document.fonts?.ready.then(() => {
      if (this.destroyed) return
      this.measure()
      this.request()
    })
    this.request()
  }

  destroy() {
    this.destroyed = true
    window.removeEventListener('scroll', this.request)
    window.removeEventListener('resize', this.onResize)
    this.unlockScroll()
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  /** Vaste tekenvolgorde voor de rit: volgens de diepte in de wereld. */
  setRideOrder() {
    for (const L of this.layers) {
      if (L.base) {
        this.setZ(L, 0)
        continue
      }
      const key = L.kind === 'billboard' ? L.z : L.z + L.len - L.bias
      this.setZ(L, Math.max(1, Math.round(1e6 - key)))
    }
  }

  setZ(L, zi) {
    if (zi !== L.zi) {
      L.zi = zi
      L.el.style.zIndex = String(zi)
    }
  }

  get span() {
    return this.trackHeight - this.height
  }

  scrollFor(cam) {
    return scrollForCamera(cam, this.trackTop, this.span, this.layout.total)
  }

  /** Scroll zodat de trein bij een halte aankomt. */
  goTo(index) {
    const w = this.windows[index]
    if (!w || this.platform) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) this.snap = true
    window.scrollTo({ top: this.scrollFor(w.cam), behavior: reduce ? 'auto' : 'smooth' })
  }

  /* ───────────── Afstappen en opstappen ───────────── */

  /** Stap af bij de halte met dit id. De belofte wordt vervuld als de camera op het perron staat. */
  alight(id) {
    const w = this.windows.find((x) => x.id === id)
    const stop = this.layout.stops.find((s) => s.id === id)
    if (!w || !stop || this.platform) return Promise.resolve()
    this.platform = true
    this.lockScroll()
    // De trein staat (of komt) stil bij de halte: zet de scroll daar meteen vast.
    const from = { x: 0, y: 0, yaw: 0, z: this.cam }
    window.scrollTo({ top: this.scrollFor(w.cam), behavior: 'instant' })
    this.cam = w.cam
    const pv = this.layout.platformView
    const narrow = this.width < NARROW
    const to = { x: narrow ? pv.mobileX : pv.x, y: pv.y, yaw: 90, z: stop.z + pv.dz }
    return this.startTween(from, to)
  }

  /** Stap weer op: terug naar de cabine, daarna kun je verder scrollen. */
  board() {
    if (!this.platform) return Promise.resolve()
    const to = { x: 0, y: 0, yaw: 0, z: this.cam }
    return this.startTween({ ...this.view }, to).then(() => {
      this.platform = false
      this.view = { x: 0, y: 0, yaw: 0, z: 0 }
      this.setRideOrder()
      this.unlockScroll()
      this.request()
    })
  }

  startTween(from, to) {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    return new Promise((resolve) => {
      this.tween = { from, to, start: performance.now(), dur: reduce ? 1 : STEP_MS, resolve }
      this.request()
    })
  }

  stepTween(now) {
    const t = this.tween
    const p = clamp((now - t.start) / t.dur, 0, 1)
    // Eerst opzij schuiven, dan draaien: zoals uitstappen en je omdraaien naar de muur.
    const move = ease(p * 1.25)
    const turn = ease((p - 0.2) / 0.8)
    const lerp = (a, b, k) => a + (b - a) * k
    const out = t.to.yaw > t.from.yaw
    const mk = out ? move : ease((p - 0.2) / 0.8)
    const tk = out ? turn : ease(p * 1.25)
    this.view = {
      x: lerp(t.from.x, t.to.x, mk),
      y: lerp(t.from.y, t.to.y, mk),
      z: lerp(t.from.z, t.to.z, mk),
      yaw: lerp(t.from.yaw, t.to.yaw, tk),
    }
    if (p >= 1) {
      this.tween = null
      t.resolve()
    }
  }

  /** Scrollen blokkeren zonder de schuifbalk weg te halen (dan zou de pagina verspringen). */
  lockScroll() {
    if (this.locked) return
    this.locked = true
    window.addEventListener('wheel', this.blockScroll, { passive: false })
    window.addEventListener('touchmove', this.blockScroll, { passive: false })
    window.addEventListener('keydown', this.blockKeys)
  }

  unlockScroll() {
    if (!this.locked) return
    this.locked = false
    window.removeEventListener('wheel', this.blockScroll)
    window.removeEventListener('touchmove', this.blockScroll)
    window.removeEventListener('keydown', this.blockKeys)
  }

  /** Scrollen mag wel in het tekstpaneel op het perron. */
  blockScroll = (e) => {
    if (!e.target.closest?.('[data-scrollable]')) e.preventDefault()
  }

  blockKeys = (e) => {
    const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']
    if (keys.includes(e.key) && !e.target.closest?.('[data-scrollable], input, textarea')) e.preventDefault()
  }

  /* ───────────── Meten ───────────── */

  /** Alleen hier wordt de layout gemeten, nooit tijdens een frame. */
  measure() {
    const rect = this.els.track.getBoundingClientRect()
    this.trackTop = rect.top + window.scrollY
    this.trackHeight = this.els.track.offsetHeight
    this.width = this.els.stage.clientWidth
    this.height = this.els.stage.clientHeight
    this.markerWidth = this.els.markerTrack?.clientWidth ?? 0
    this.dims = ''
  }

  onResize = () => {
    const oldW = this.width
    const oldH = this.height
    const cam = cameraForScroll(window.scrollY, this.trackTop, this.span, this.layout.total)
    const inRide = window.scrollY <= this.trackTop + this.span
    this.measure()
    // Op een gsm verschijnt en verdwijnt de adresbalk tijdens het scrollen. Dan niet terugspringen.
    const onlyBar = this.width === oldW && Math.abs(this.height - oldH) < 160
    if (inRide && !onlyBar && !this.platform) {
      this.snap = true
      window.scrollTo({ top: this.scrollFor(cam), behavior: 'instant' })
    }
    this.request()
  }

  request = () => {
    if (!this.raf && !this.destroyed) this.raf = requestAnimationFrame(this.tick)
  }

  /* ───────────── Elk frame ───────────── */

  tick = (now) => {
    this.raf = 0
    const dt = this.lastFrame ? now - this.lastFrame : FRAME_MS
    this.lastFrame = now
    const W = this.width
    const H = this.height
    const total = this.layout.total

    let moving = false
    if (!this.platform) {
      const target = cameraForScroll(window.scrollY, this.trackTop, this.span, total)
      if (this.snap) {
        this.cam = target
        this.snap = false
      } else {
        const diff = target - this.cam
        this.cam = Math.abs(diff) < 0.3 ? target : this.cam + diff * followFactor(dt)
      }
      moving = this.cam !== target
      const active = activeIndex(this.windows, target)
      if (active !== this.active) {
        this.active = active
        this.callbacks.onChapter(active)
      }
    }
    if (this.tween) {
      this.stepTween(now)
      moving = true
    }

    const ws = worldScale(W)
    const dims = `${W}x${H}`
    if (dims !== this.dims) {
      this.dims = dims
      Object.assign(this.els.scaler.style, {
        transform: `scale(${ws})`,
        width: `${W / ws}px`,
        height: `${H / ws}px`,
      })
      for (const L of this.layers) L.tf = ''
    }

    const narrow = W < NARROW
    const side = this.platform || this.view.yaw !== 0 || this.view.x !== 0
    const camZ = side ? this.view.z : this.cam
    if (side) {
      const yaw = (this.view.yaw * Math.PI) / 180
      const sin = Math.sin(yaw)
      const cos = Math.cos(yaw)
      const prefix =
        this.view.yaw !== 0 ? `translateZ(${P}px) rotateY(${r1(this.view.yaw)}deg) translateZ(${-P}px) ` : ''
      const ride = 1 - clamp(this.view.yaw / 35, 0, 1)
      for (const L of this.layers) this.placeSide(L, camZ, narrow, sin, cos, prefix, ride)
    } else {
      // In de tunnel zie je van spoor 3 alleen wat door de uitgang past: de rest niet tekenen.
      const T = this.layout.tunnel
      this.tunnelView =
        T && camZ > T.start + P - 100 && camZ < T.end + 50
          ? { end: T.end, lim: (this.layout.tunnelHalfWidth + 40) / (P + T.end - camZ) }
          : null
      for (const L of this.layers) this.place(L, camZ, narrow)
    }

    this.updateHud(this.cam)
    this.updateOverlays(this.cam)
    this.updateBoard(this.cam)
    if (this.els.marker) {
      this.els.marker.style.transform = `translateX(${r1((this.cam / total) * this.markerWidth)}px)`
    }
    if (this.els.hint) {
      const v = this.cam < 250 && !this.platform ? '1' : '0'
      if (this.els.hint.style.opacity !== v) this.els.hint.style.opacity = v
    }

    if (moving) this.request()
    else this.lastFrame = 0
  }

  /** De gewone rit: de camera kijkt recht vooruit over het spoor. */
  place(L, cam, narrow) {
    const d = L.z - cam
    const x = narrow && L.mx !== null ? L.mx : L.x
    const y = narrow && L.my !== null ? L.my : L.y
    let show
    let opacity
    let transform

    if (L.kind === 'billboard') {
      // Een plat object dat naar de camera kijkt: vervaagt in de verte en net nadat je het voorbij bent.
      opacity = fade(d, L.fog[0], L.fog[1]) * fade(-d, -L.near[0], -L.near[1])
      show = opacity > 0.01 && d > -(P - 60)
      const s = narrow ? L.ms : 1
      transform = `translate3d(${x}px,${y}px,${r1(-d)}px)${s !== 1 ? ` scale(${s})` : ''} translate(-50%,-50%)`
      if (show && this.hiddenByTunnel(L, x, d)) show = false
    } else {
      const dFar = d + L.len
      show = dFar > -(P - 60) && d < L.fog[1] && !this.hiddenByTunnel(L, x, d)
      opacity = L.base ? 1 : fade(d, L.fog[0], L.fog[1])
      transform = this.planeTransform(L, x, y, d, dFar)
    }
    this.apply(L, show, opacity, transform)
  }

  /** Staat dit object achter de tunnelwand, buiten wat je door de uitgang ziet? */
  hiddenByTunnel(L, x, d) {
    const tv = this.tunnelView
    if (!tv || L.base || L.z <= tv.end + 5) return false
    return Math.abs(x) - L.hw > tv.lim * (P + d)
  }

  /** Op het perron (of onderweg): de camera staat opzij en kijkt naar rechts. */
  placeSide(L, camZ, narrow, sin, cos, prefix, ride) {
    const vx = this.view.x
    const vy = this.view.y
    const wx = (narrow && L.mx !== null ? L.mx : L.x) - vx
    const y = (narrow && L.my !== null ? L.my : L.y) - vy
    const wd = L.z - camZ
    // Afstand tot het scherm in de kijkrichting.
    const f = wx * sin + wd * cos
    // Het oog staat P achter het scherm, in de kijkrichting. De wereld wordt zo verschoven
    // dat het oog van CSS (P voor het scherm) op die plek valt; dan draaien we eromheen.
    const x = wx + P * sin
    const d = wd + P * cos - P
    let show
    let opacity
    let transform
    let key

    if (L.kind === 'billboard') {
      opacity = fade(f, L.fog[0], L.fog[1]) * fade(-f, -L.near[0], -L.near[1])
      if (L.ride) opacity *= ride
      show = opacity > 0.01 && f > -(P - 60) && Math.abs(wd) < 6000
      transform = `${prefix}translate3d(${r1(x)}px,${r1(y)}px,${r1(-d)}px) translate(-50%,-50%)`
      key = f
    } else {
      const dFar = d + L.len
      const fMid = wx * sin + (wd + L.len / 2) * cos
      const fMax = Math.max(wx * sin + wd * cos, wx * sin + (wd + L.len) * cos)
      show = L.base || (fMax > -(P - 60) && Math.abs(wd) < 6000 && Math.abs(fMid) < 7000)
      opacity = L.base ? 1 : fade(Math.abs(wd), 5000, 6000)
      if (L.ride) opacity *= ride
      if (opacity < 0.01) show = false
      transform = prefix + this.planeTransform(L, x, y, d, dFar)
      key = L.base ? 1e6 : fMid - L.bias
    }
    if (show) this.setZ(L, L.base ? 0 : Math.max(1, Math.round(1e6 - key)))
    this.apply(L, show, opacity, transform)
  }

  planeTransform(L, x, y, d, dFar) {
    if (L.kind === 'wall-left') return `translate3d(${r1(x)}px,${r1(y)}px,${r1(-d)}px) rotateY(90deg) translateY(-50%)`
    if (L.kind === 'wall-right') return `translate3d(${r1(x)}px,${r1(y)}px,${r1(-dFar)}px) rotateY(-90deg) translateY(-50%)`
    return `translate3d(${r1(x)}px,${r1(y)}px,${r1(-d)}px) rotateX(-90deg) translateX(-50%)`
  }

  /** Schrijf alleen naar de DOM wat echt veranderd is. */
  apply(L, show, opacity, transform) {
    const st = L.el.style
    if (!show) {
      if (L.shown) {
        st.visibility = 'hidden'
        L.shown = false
      }
      return
    }
    if (!L.shown) {
      st.visibility = 'visible'
      L.shown = true
    }
    const op = Math.round(opacity * 100) / 100
    if (op !== L.op) {
      L.op = op
      st.opacity = String(op)
    }
    if (transform !== L.tf) {
      L.tf = transform
      st.transform = transform
    }
  }

  updateHud(cam) {
    for (const w of this.windows) {
      const el = this.els.huds[w.id]
      if (!el || !w.hud) continue
      const t = this.platform ? 0 : Math.round(hudVisibility(cam, w.hud[0], w.hud[1]) * 100) / 100
      if (this.hudState[w.id] === t) continue
      this.hudState[w.id] = t
      el.style.opacity = String(t)
      el.style.transform = `translateY(${r1((1 - t) * 20)}px)`
      el.style.pointerEvents = t > 0.5 ? 'auto' : 'none'
      el.classList.toggle('is-hidden', t === 0)
    }
  }

  updateOverlays(cam) {
    for (const o of this.overlays) {
      const v = Math.round(hudVisibility(cam, o.from, o.to, 300) * o.max * 100) / 100
      if (v !== o.last) {
        o.last = v
        o.el.style.opacity = String(v)
      }
    }
  }

  /** Het vertrekbord: "Volgende halte" tijdens het rijden, "Halte" als de trein stilstaat. */
  updateBoard(cam) {
    const stops = this.windows.filter((w) => w.kind !== 'tunnel')
    const here = stops.find((w) => Math.abs(cam - w.cam) < 220)
    const next = stops.find((w) => w.cam > cam + 120) ?? stops[stops.length - 1]
    const state = here ? { mode: 'halte', id: here.id } : { mode: 'volgende', id: next.id }
    const key = `${state.mode}:${state.id}`
    if (key !== this.boardKey) {
      this.boardKey = key
      this.callbacks.onBoard?.(state)
    }
  }
}
