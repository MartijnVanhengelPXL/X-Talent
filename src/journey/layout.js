/**
 * Waar alles langs het spoor staat, in wereld-eenheden.
 * Ongeveer 133 eenheden is 1 meter: het oog van de machinist zit 3 meter boven de grond.
 *
 *   vertrek ──► stations van spoor 2 ──► tunnel ──► stations van spoor 3 ──► eindstation
 *
 * De lijst met stations komt uit portfolio.json; afstanden en posities volgen daaruit.
 */

/** Hoogte van de grond (positieve y is omlaag; het oog zit op y 0). */
export const GROUND = 400
/** Bovenkant van het perron (ongeveer 76 cm boven de grond). */
export const PLATFORM_TOP = 300
/** Afstand tussen twee stations. */
export const GAP = 3400
/** Hoe ver voor het stationsbord de trein stopt. */
export const STOP_BEFORE = 900
/**
 * De muur van het stationsgebouw achteraan het perron, met de foto's. Van onder het
 * dak (top) tot op het perron (bottom), en `half` naar voor en naar achter vanaf het bord.
 */
export const WALL = { x: 1060, top: -195, bottom: PLATFORM_TOP, half: 700 }

/**
 * Waar de camera staat als je afstapt: vlak voor de muur, op ooghoogte van de foto's,
 * naar rechts kijkend. Op een gsm wat verder weg, zodat de hele muur in beeld past.
 */
export const PLATFORM_VIEW = { x: WALL.x - 60, mobileX: WALL.x - 900, y: (WALL.top + WALL.bottom) / 2, dz: 0 }

/** De tunnel: halve breedte en hoogte van de boog (middelpunt en straal). */
export const TUNNEL = { halfWidth: 460, archY: -150, length: 2600 }

/** Kleine voorspelbare "toevalsgenerator", zodat bomen altijd op dezelfde plek staan. */
function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function buildLayout(data) {
  const stops = []
  let z = 900

  stops.push({ id: 'vertrek', kind: 'vertrek', year: data.jaren[0].id, bord: data.voorstelling.bord, titel: data.voorstelling.titel, fotos: data.voorstelling.fotos ?? [], z })

  let tunnel = null
  data.jaren.forEach((jaar, j) => {
    if (j > 0) {
      // Tussen twee jaren: de tunnel.
      const start = z + 2000
      tunnel = { start, end: start + TUNNEL.length, label: jaar.label, year: jaar.id }
      z = tunnel.end + 2400 - GAP
    }
    jaar.stations.forEach((station) => {
      z += GAP
      stops.push({ id: station.id, kind: station.verslag ? 'showcase' : 'station', year: jaar.id, bord: station.bord, titel: station.bord, fotos: station.fotos ?? [], station, z })
    })
  })

  z += GAP
  const lastYear = data.jaren[data.jaren.length - 1].id
  stops.push({ id: 'eindstation', kind: 'eind', year: lastYear, bord: data.eindreflectie.bord, titel: 'Eindreflectie', fotos: data.eindreflectie.fotos ?? [], z })
  const bufferZ = z + 750

  /**
   * Hoofdstukken op de rit, in volgorde:
   * - cam: waar de trein stopt als je erheen springt
   * - start: vanaf hier telt het hoofdstuk als actief
   * - hud: tussen deze cameraposities is de tekst zichtbaar
   */
  const windows = []
  stops.forEach((stop, i) => {
    if (tunnel && stop.year === tunnel.year && !windows.some((w) => w.id === 'tunnel')) {
      windows.push({ id: 'tunnel', kind: 'tunnel', year: tunnel.year, cam: tunnel.start + 1300, start: tunnel.start + 1150, hud: null })
    }
    windows.push({
      id: stop.id,
      kind: stop.kind,
      year: stop.year,
      bord: stop.bord,
      cam: stop.z - STOP_BEFORE,
      start: i === 0 ? -1e9 : stop.z - 1900,
      hud: [i === 0 ? -1e9 : stop.z - 1700, stop.kind === 'eind' ? 1e9 : stop.z - 250],
    })
  })

  const total = stops[stops.length - 1].z - STOP_BEFORE + 300
  const trackVh = Math.round(total / 11)

  // Grondstukken: ze stoppen aan de tunnel en aan het stootblok, zodat er nooit twee vlakken door elkaar lopen.
  const breaks = [-1600]
  for (let b = -1600 + 2000; b < bufferZ + 4000; b += 2000) breaks.push(b)
  if (tunnel) breaks.push(tunnel.start, tunnel.end)
  breaks.push(bufferZ, bufferZ + 4000)
  const sorted = [...new Set(breaks)].sort((a, b) => a - b).filter((b) => b <= bufferZ + 4000)
  const ground = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]
    const to = sorted[i + 1]
    if (tunnel && from >= tunnel.start && to <= tunnel.end) continue
    ground.push({
      z: from,
      len: to - from,
      year: tunnel && from >= tunnel.end ? tunnel.year : data.jaren[0].id,
      track: from < bufferZ,
    })
  }

  const inTunnel = (zz, margin = 0) => tunnel && zz > tunnel.start - margin && zz < tunnel.end + margin
  const nearStation = (zz) => stops.some((s) => zz > s.z - 1300 && zz < s.z + 1300)

  // Bovenleiding: een paal links van het spoor, om de 700 eenheden.
  const poles = []
  for (let pz = -700; pz < bufferZ; pz += 700) {
    if (!inTunnel(pz, 150)) poles.push({ z: pz })
  }
  const wires = ground.filter((g) => g.track).map((g) => ({ z: g.z, len: g.len }))

  // Bomen en struiken langs het spoor.
  const rand = seeded(42)
  const trees = []
  for (let tz = -400; tz < bufferZ + 3000; tz += 240 + rand() * 280) {
    if (inTunnel(tz, 500)) continue
    const year = tunnel && tz > tunnel.end ? tunnel.year : data.jaren[0].id
    const side = rand() < 0.5 ? -1 : 1
    const near = side > 0 && nearStation(tz)
    const x = side * ((near ? 1500 : 650) + rand() * 2300)
    const kinds = year === data.jaren[0].id ? ['populier', 'populier', 'rond', 'struik', 'wilg'] : ['spar', 'spar', 'rond', 'spar', 'struik']
    trees.push({ z: Math.round(tz), x: Math.round(x), kind: kinds[Math.floor(rand() * kinds.length)], size: 0.8 + rand() * 0.5 })
  }

  return { stops, windows, tunnel, tunnelHalfWidth: TUNNEL.halfWidth, total, trackVh, ground, poles, wires, trees, bufferZ, platformView: PLATFORM_VIEW }
}
