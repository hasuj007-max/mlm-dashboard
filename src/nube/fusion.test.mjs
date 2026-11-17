// Pruebas de la fusión: node src/nube/fusion.test.mjs
import assert from 'node:assert/strict'
import { fusionarMeses, fusionarObjeto } from './fusion.js'

const m = (id, actualizado = 0, g = 1) => ({ id, actualizado, ganancias: g })

// Primer uso: la nube está vacía y el dispositivo tiene todo → se sube todo
let r = fusionarMeses([m('2026-01'), m('2026-02')], [], [])
assert.equal(r.meses.length, 2); assert.equal(r.subir.length, 2); assert.equal(r.borrarEnNube.length, 0)

// Teléfono nuevo: vacío → baja todo y no borra nada, aunque tenga "conocidos" viejos
r = fusionarMeses([], [m('2026-01'), m('2026-02')], ['2026-01', '2026-02'])
assert.equal(r.meses.length, 2); assert.equal(r.subir.length, 0); assert.equal(r.borrarEnNube.length, 0)

// Mes nuevo aquí → se sube; mes nuevo en la nube → se baja
r = fusionarMeses([m('2026-01'), m('2026-03', 5)], [m('2026-01'), m('2026-02')], ['2026-01'])
assert.deepEqual(r.meses.map((x) => x.id), ['2026-01', '2026-02', '2026-03'])
assert.deepEqual(r.subir.map((x) => x.id), ['2026-03'])

// Borrado en otro dispositivo → se borra aquí
r = fusionarMeses([m('2026-01'), m('2026-02')], [m('2026-01')], ['2026-01', '2026-02'])
assert.deepEqual(r.meses.map((x) => x.id), ['2026-01']); assert.equal(r.subir.length, 0)

// Borrado aquí (estaba sincronizado) → se borra de la nube
r = fusionarMeses([m('2026-01')], [m('2026-01'), m('2026-02')], ['2026-01', '2026-02'])
assert.deepEqual(r.borrarEnNube, ['2026-02']); assert.deepEqual(r.meses.map((x) => x.id), ['2026-01'])

// Editado en los dos lados → gana el más reciente; empate → la nube
r = fusionarMeses([m('2026-01', 10, 111)], [m('2026-01', 5, 222)], ['2026-01'])
assert.equal(r.meses[0].ganancias, 111); assert.equal(r.subir.length, 1)
r = fusionarMeses([m('2026-01', 5, 111)], [m('2026-01', 10, 222)], ['2026-01'])
assert.equal(r.meses[0].ganancias, 222); assert.equal(r.subir.length, 0)
r = fusionarMeses([m('2026-01', 0, 111)], [m('2026-01', 0, 222)], [])
assert.equal(r.meses[0].ganancias, 222)

// Objetos: se unen claves; en conflicto gana el más reciente
let o = fusionarObjeto({ a: 1, b: 2 }, 10, { b: 9, c: 3 }, 5)
assert.deepEqual(o.datos, { a: 1, b: 2, c: 3 }); assert.ok(o.cambioLocal && o.cambioNube)
o = fusionarObjeto({ a: 1, b: 2 }, 1, { b: 9, c: 3 }, 5)
assert.deepEqual(o.datos, { a: 1, b: 9, c: 3 })
o = fusionarObjeto({}, 0, { x: 1 }, 5)
assert.deepEqual(o.datos, { x: 1 }); assert.ok(o.cambioLocal); assert.ok(!o.cambioNube)
o = fusionarObjeto({ x: 1 }, 9, {}, 0)
assert.ok(!o.cambioLocal); assert.ok(o.cambioNube)

console.log('✓ fusión: todas las pruebas pasan')
