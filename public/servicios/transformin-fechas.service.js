'use strict';
// Transformín: fechas sugeridas, independientes de la persistencia MySQL.
const ANIO_MIN=1900, ANIO_MAX=9999;
function validarAnio(valor){
    const n=Number(valor);
    if(!Number.isInteger(n)||n<ANIO_MIN||n>ANIO_MAX) throw new RangeError(`Año fuera del rango permitido (${ANIO_MIN}-${ANIO_MAX}).`);
    return n;
}
function normalizarNombre(valor){
    return String(valor??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
}
function fechaISO(anio,mes,dia){
    anio=validarAnio(anio);
    if(!Number.isInteger(mes)||!Number.isInteger(dia)||mes<1||mes>12||dia<1||dia>31) throw new RangeError('Fecha inválida.');
    const d=new Date(Date.UTC(anio,mes-1,dia));
    if(d.getUTCMonth()!==mes-1||d.getUTCDate()!==dia) throw new RangeError('Fecha inválida.');
    return d.toISOString().slice(0,10);
}
function validarFecha(valor,anio){
    if(valor instanceof Date){if(!Number.isFinite(valor.getTime())) throw new RangeError('Fecha inválida.');valor=valor.toISOString().slice(0,10);}
    if(typeof valor!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw new TypeError('Utilice YYYY-MM-DD.');
    const [a,m,d]=valor.split('-').map(Number);
    const fecha=fechaISO(a,m,d);
    if(anio!=null&&a!==validarAnio(anio)) throw new RangeError('La fecha no pertenece al año seleccionado.');
    return fecha;
}
function diaOrdinal(anio,mes,diaSemana,ordinal){
    anio=validarAnio(anio);
    if(!Number.isInteger(diaSemana)||diaSemana<0||diaSemana>6||!Number.isInteger(ordinal)||ordinal<1||ordinal>5) throw new RangeError('Regla semanal inválida.');
    fechaISO(anio,mes,1);
    const primero=new Date(Date.UTC(anio,mes-1,1)).getUTCDay();
    return fechaISO(anio,mes,1+(diaSemana-primero+7)%7+7*(ordinal-1));
}
// Catálogo base FT-SST-147. Las fechas son sugerencias editables.
const CATALOGO=Object.freeze([
    ['AÑO NUEVO',1,1,'CELEBRACION'],
    ['CARNAVAL DE NEGROS Y BLANCOS',1,5,'CELEBRACION'],
    ['Día Mundial de la Educación Ambiental',1,26,'AMBIENTAL'],
    ['Día Mundial de los Humedales',2,2,'AMBIENTAL'],
    ['Día Nacional del Reciclador',3,1,'AMBIENTAL'],
    ['Día Internacional de la Mujer',3,8,'CELEBRACION'],
    ['Día del Hombre',3,19,'CELEBRACION'],
    ['Día Mundial del Agua',3,22,'AMBIENTAL'],
    ['Día Internacional de la Madre Tierra',4,22,'AMBIENTAL'],
    ['Día Mundial de la Seguridad y Salud en el Trabajo',4,28,'INSTITUCIONAL'],
    ['Día de la Madre',5,[0,2],'CELEBRACION'],
    ['Día Mundial del Reciclaje',5,17,'AMBIENTAL'],
    ['Día Mundial del Medio Ambiente',6,5,'AMBIENTAL'],
    ['Día del Padre',6,[0,3],'CELEBRACION'],
    ['Día de la Independencia de Colombia',7,20,'CELEBRACION'],
    ['Batalla de Boyacá',8,7,'CELEBRACION'],
    ['Día Nacional de la Biodiversidad',9,11,'AMBIENTAL'],
    ['Día del Amor y la Amistad',9,[6,3],'CELEBRACION'],
    ['Jornada de conciencia sobre el cambio climático',10,24,'AMBIENTAL'],
    ['Halloween',10,31,'CELEBRACION'],
    ['Día Mundial del Aire Puro',11,[4,3],'AMBIENTAL'],
    ['Día de las Velitas',12,7,'CELEBRACION'],
    ['Navidad',12,25,'CELEBRACION'],
    ['Despedida del Año Viejo',12,31,'CELEBRACION'],
    ['CUMPLEAÑOS COLABORADORES',null,null,'CELEBRACION'],
    ['CUMPLEAÑOS TRANSFORMIN',null,null,'CELEBRACION'],
    ['EDUCACION AMBIENTAL',null,null,'AMBIENTAL']
].map(([nombre,mes,dia,tipo])=>Object.freeze({nombre,mes,dia:Array.isArray(dia)?Object.freeze(dia):dia,tipo})));
const INDICE=new Map(CATALOGO.map(e=>[normalizarNombre(e.nombre),e]));
const ALIAS=new Map([
    ['DIA DE LA TIERRA','DIA INTERNACIONAL DE LA MADRE TIERRA'],
    ['DIA MUNDIAL DE LA TIERRA','DIA INTERNACIONAL DE LA MADRE TIERRA'],
    ['DIA DEL RECICLADOR','DIA NACIONAL DEL RECICLADOR'],
    ['AMOR Y AMISTAD','DIA DEL AMOR Y LA AMISTAD'],
    ['DIA DEL AIRE PURO','DIA MUNDIAL DEL AIRE PURO'],
    ['DIA DE VELITAS','DIA DE LAS VELITAS'],
    ['ANO VIEJO','DESPEDIDA DEL ANO VIEJO']
]);
function obtenerRegla(nombre){const clave=normalizarNombre(nombre);return INDICE.get(ALIAS.get(clave)||clave)||null;}
function obtenerFechaSugerida(nombre,anio){
    anio=validarAnio(anio);
    const regla=obtenerRegla(nombre);
    if(!regla||regla.mes===null) return null;
    return Array.isArray(regla.dia)?diaOrdinal(anio,regla.mes,...regla.dia):fechaISO(anio,regla.mes,regla.dia);
}
// undefined = no hay cambio; null = el administrador desea quitar la fecha.
function resolverFechaActividad({nombre,actividad,anio,fechaManual,fechaExistente,usarSugerencia=true}={}){
    anio=validarAnio(anio);
    const sugerida=obtenerFechaSugerida(nombre??actividad,anio);
    if(fechaManual!==undefined) return {fecha:fechaManual===null?null:validarFecha(fechaManual,anio),origen:'MANUAL',fechaSugerida:sugerida};
    if(fechaExistente!=null) return {fecha:validarFecha(fechaExistente,anio),origen:'REGISTRADA',fechaSugerida:sugerida};
    return {fecha:usarSugerencia?sugerida:null,origen:usarSugerencia&&sugerida?'AUTOMATICA':'PENDIENTE',fechaSugerida:sugerida};
}
function listarFechasAnuales(anio){
    anio=validarAnio(anio);
    return CATALOGO.map(r=>({nombre:r.nombre,tipo:r.tipo,fecha:obtenerFechaSugerida(r.nombre,anio),regla:r.mes===null?'INTERNA':Array.isArray(r.dia)?'VARIABLE':'FIJA'})).sort((a,b)=>(a.fecha||'9999-99-99').localeCompare(b.fecha||'9999-99-99'));
}
// Cumpleaños: la política para el 29 de febrero debe ser explícita.
function fechaCumpleanos(nacimiento,anio,politica='OMITIR'){
    anio=validarAnio(anio);
    if(nacimiento instanceof Date){if(!Number.isFinite(nacimiento.getTime())) throw new RangeError('Nacimiento inválido.');nacimiento=nacimiento.toISOString().slice(0,10);}
    if(typeof nacimiento!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(nacimiento)) throw new TypeError('Nacimiento inválido.');
    const [a,m,d]=nacimiento.split('-').map(Number);
    const original=new Date(`${nacimiento}T00:00:00Z`);
    if(!Number.isFinite(original.getTime())||original.toISOString().slice(0,10)!==nacimiento||a>anio) throw new RangeError('Nacimiento inválido.');
    if(!['OMITIR','FEBRERO_28','MARZO_1'].includes(politica)) throw new RangeError('Política bisiesta inválida.');
    if(m===2&&d===29&&new Date(Date.UTC(anio,1,29)).getUTCMonth()!==1){
        return politica==='FEBRERO_28'?fechaISO(anio,2,28):politica==='MARZO_1'?fechaISO(anio,3,1):null;
    }
    return fechaISO(anio,m,d);
}
module.exports={ANIO_MIN,ANIO_MAX,validarAnio,normalizarNombre,fechaISO,validarFecha,diaOrdinal,obtenerRegla,obtenerFechaSugerida,resolverFechaActividad,listarFechasAnuales,fechaCumpleanos};