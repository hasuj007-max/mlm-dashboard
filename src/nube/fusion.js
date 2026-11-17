// Fusión entre lo que hay en este dispositivo y lo que hay en la nube.
// Funciones puras (sin Firebase) para poder probarlas solas.
//
// Reglas:
// - Un mes que solo está aquí y nunca se había sincronizado → es nuevo, se sube.
// - Un mes que solo está aquí pero YA se había sincronizado → se borró en otro
//   dispositivo, se borra aquí.
// - Un mes que solo está en la nube → se baja (salvo que se haya borrado aquí
//   estando sincronizado: entonces se borra de la nube).
// - En los dos lados → gana el de `actualizado` más reciente; si empatan, la nube.
// - Un dispositivo vacío jamás borra la nube: solo baja.

/**
 * @param locales   meses de este dispositivo
 * @param nube      meses leídos del servidor
 * @param conocidos ids que este dispositivo ya sabía que estaban en la nube
 * @returns { meses, subir, borrarEnNube } — `meses` es el resultado local
 */
export function fusionarMeses(locales, nube, conocidos) {
  const L = new Map(locales.map((m) => [m.id, m]))
  const N = new Map(nube.map((m) => [m.id, m]))
  const vistos = new Set(conocidos || [])
  const dispositivoVacio = locales.length === 0
  const resultado = []
  const subir = []
  const borrarEnNube = []

  for (const [id, local] of L) {
    const remoto = N.get(id)
    if (!remoto) {
      if (vistos.has(id)) continue // se borró en otro dispositivo
      resultado.push(local)
      subir.push(local)
    } else if ((local.actualizado || 0) > (remoto.actualizado || 0)) {
      resultado.push(local)
      subir.push(local)
    } else {
      resultado.push(remoto)
    }
  }
  for (const [id, remoto] of N) {
    if (L.has(id)) continue
    if (vistos.has(id) && !dispositivoVacio) borrarEnNube.push(id) // se borró aquí
    else resultado.push(remoto)
  }

  resultado.sort((a, b) => a.id.localeCompare(b.id))
  return { meses: resultado, subir, borrarEnNube }
}

/**
 * Fusiona un objeto por claves (seguimiento, actividad, arranque, mensajes).
 * Nunca se pierden claves: se unen las de los dos lados y, cuando una clave
 * está en ambos, gana el lado que se modificó más recientemente.
 * @returns { datos, cambioLocal, cambioNube }
 */
export function fusionarObjeto(local, tLocal, remoto, tRemoto) {
  const l = local || {}
  const r = remoto || {}
  const ganaLocal = (tLocal || 0) > (tRemoto || 0)
  const datos = ganaLocal ? { ...r, ...l } : { ...l, ...r }
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  return { datos, cambioLocal: !igual(datos, l), cambioNube: !igual(datos, r) }
}
