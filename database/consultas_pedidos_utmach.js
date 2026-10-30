// =====================================================================
//  PedidosUTMACH — Consultas, agregaciones, índices y validación
//  Ejecutar en Studio 3T → IntelliShell DESPUÉS de pedidos_utmach.js.
//  Selecciona una consulta y presiona F9 (ejecutar selección) o ejecútalas
//  en orden. 📸 = captura sugerida para el informe.
//  Las secciones A–C solo leen datos; ejecútalas antes de la D (escritura)
//  para obtener exactamente los resultados reportados en el informe.
// =====================================================================

db = db.getSiblingDB("pedidos_utmach");

// =====================================================================
// A. CONSULTAS DE LECTURA (find)
// =====================================================================

// A1. Menú: productos DISPONIBLES de la categoría Almuerzos (usa ix_categoria_disponible)
//     Resultado esperado: Almuerzo del día, Seco de pollo, Encebollado.  📸
db.productos.find(
  { "categoria._id": ObjectId("64c000000000000000000002"), disponible: true },
  { _id: 0, nombre: 1, precio: 1, "categoria.nombre": 1 }
).sort({ precio: 1 });

// A2. Búsqueda de texto (índice tx_busqueda, idioma español) de productos disponibles
//     Resultado esperado: Bolón de verde y Chifles (Tigrillo no está disponible).  📸
db.productos.find(
  { $text: { $search: "verde" }, disponible: true },
  { _id: 0, nombre: 1, descripcion: 1, puntaje: { $meta: "textScore" } }
).sort({ puntaje: { $meta: "textScore" } });

// A3. "Mis pedidos": últimos 5 pedidos de la estudiante Ana Torres (usa ix_usuario_fecha)  📸
db.pedidos.find(
  { "usuario._id": ObjectId("64a100000000000000000001") },
  { _id: 0, creadoEn: 1, estado: 1, total: 1, "items.nombre": 1, "items.cantidad": 1 }
).sort({ creadoEn: -1 }).limit(5);

// A4. Pedidos activos del bar ordenados por hora de recogida (usa ix_estado_hora)
//     Resultado esperado: 2 pedidos (uno "recibido" y uno "preparando").  📸
db.pedidos.find(
  { estado: { $in: ["recibido", "preparando", "listo"] } },
  { _id: 1, "usuario.nombre": 1, estado: 1, horaRecogida: 1, total: 1 }
).sort({ horaRecogida: 1 });

// A5. Consulta sobre un arreglo embebido: ¿cuántos pedidos incluyen Encebollado?
//     Resultado esperado: 8
db.pedidos.countDocuments({ "items.nombre": "Encebollado" });

// =====================================================================
// B. AGREGACIONES (reportes para el administrador)
// =====================================================================

// B1. Top 5 productos más vendidos  📸
db.pedidos.aggregate([
  { $unwind: "$items" },
  { $group: {
      _id: "$items.nombre",
      unidades: { $sum: "$items.cantidad" },
      ingresos: { $sum: "$items.subtotal" }
  }},
  { $project: { _id: 0, producto: "$_id", unidades: 1, ingresos: { $round: ["$ingresos", 2] } } },
  { $sort: { unidades: -1, producto: 1 } },
  { $limit: 5 }
]);

// B2. Ventas por día (hora de Ecuador)  📸
db.pedidos.aggregate([
  { $match: { horaRecogida: { $gte: ISODate("2026-10-14T05:00:00Z"), $lt: ISODate("2026-10-28T05:00:00Z") } } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$horaRecogida", timezone: "America/Guayaquil" } },
      pedidos: { $sum: 1 },
      total: { $sum: "$total" }
  }},
  { $project: { _id: 0, dia: "$_id", pedidos: 1, total: { $round: ["$total", 2] } } },
  { $sort: { dia: 1 } }
]);

// B3. Hora pico de recogida  📸
db.pedidos.aggregate([
  { $group: {
      _id: { $hour: { date: "$horaRecogida", timezone: "America/Guayaquil" } },
      pedidos: { $sum: 1 }
  }},
  { $project: { _id: 0, hora: "$_id", pedidos: 1 } },
  { $sort: { pedidos: -1, hora: 1 } }
]);

// B4. Ventas por categoría ($lookup a productos)  📸
db.pedidos.aggregate([
  { $unwind: "$items" },
  { $lookup: { from: "productos", localField: "items.productoId", foreignField: "_id", as: "producto" } },
  { $unwind: "$producto" },
  { $group: {
      _id: "$producto.categoria.nombre",
      unidades: { $sum: "$items.cantidad" },
      ingresos: { $sum: "$items.subtotal" }
  }},
  { $project: { _id: 0, categoria: "$_id", unidades: 1, ingresos: { $round: ["$ingresos", 2] } } },
  { $sort: { ingresos: -1 } }
]);

// B5. Ticket promedio por estudiante  📸
db.pedidos.aggregate([
  { $group: {
      _id: "$usuario.nombre",
      pedidos: { $sum: 1 },
      gasto: { $sum: "$total" },
      ticket: { $avg: "$total" }
  }},
  { $project: { _id: 0, estudiante: "$_id", pedidos: 1, gasto: { $round: ["$gasto", 2] }, ticket: { $round: ["$ticket", 2] } } },
  { $sort: { gasto: -1 } }
]);

// B6. Resumen general en una sola consulta ($facet)  📸
db.pedidos.aggregate([
  { $facet: {
      porEstado: [ { $group: { _id: "$estado", pedidos: { $sum: 1 } } }, { $sort: { pedidos: -1 } } ],
      totales:   [ { $group: { _id: null, pedidos: { $sum: 1 }, ventas: { $sum: "$total" } } },
                   { $project: { _id: 0, pedidos: 1, ventas: { $round: ["$ventas", 2] } } } ]
  }}
]);

// =====================================================================
// C. ÍNDICES Y PLANES DE EJECUCIÓN
// =====================================================================

// C1. Índices creados  📸
db.productos.getIndexes();
db.pedidos.getIndexes();

// C2. SIN índice: se fuerza un recorrido completo con hint({ $natural: 1 })
//     Esperado: stage COLLSCAN, totalDocsExamined = 40  📸
db.pedidos.find({ estado: "preparando" }).sort({ horaRecogida: 1 })
  .hint({ $natural: 1 }).explain("executionStats");

// C3. CON índice ix_estado_hora
//     Esperado: stage IXSCAN, totalKeysExamined = 1, totalDocsExamined = 1  📸
db.pedidos.find({ estado: "preparando" }).sort({ horaRecogida: 1 })
  .explain("executionStats");

// C4. "Mis pedidos" con índice ix_usuario_fecha
//     Esperado: IXSCAN, totalDocsExamined = 8 (en lugar de 40)  📸
db.pedidos.find({ "usuario._id": ObjectId("64a100000000000000000001") })
  .sort({ creadoEn: -1 }).explain("executionStats");

// =====================================================================
// D. OPERACIONES DE ESCRITURA (CRUD)
// =====================================================================

// D1. Crear un pedido nuevo (estudiante Ana Torres): 2 bolones + 1 jugo = 3.75  📸
db.pedidos.insertOne({
  usuario: { _id: ObjectId("64a100000000000000000001"), nombre: "Ana Torres" },
  items: [
    { productoId: ObjectId("64d000000000000000000001"), nombre: "Bolón de verde", precioUnitario: 1.5,  cantidad: 2, subtotal: 3.0 },
    { productoId: ObjectId("64d000000000000000000007"), nombre: "Jugo natural",   precioUnitario: 0.75, cantidad: 1, subtotal: 0.75 }
  ],
  total: 3.75,
  horaRecogida: ISODate("2026-10-28T15:00:00Z"),   // 10:00 hora de Ecuador
  estado: "recibido",
  historialEstados: [ { estado: "recibido", fecha: new Date() } ],
  creadoEn: new Date()
});

// D2. Avanzar el estado de forma atómica: solo si sigue "recibido" ($set + $push)  📸
db.pedidos.updateOne(
  { _id: ObjectId("64f000000000000000000014"), estado: "recibido" },
  { $set: { estado: "preparando" },
    $push: { historialEstados: { estado: "preparando", fecha: new Date() } } }
);
db.pedidos.findOne({ _id: ObjectId("64f000000000000000000014") }, { estado: 1, historialEstados: 1 });

// D3. El administrador vuelve a habilitar el Tigrillo en el menú
db.productos.updateOne({ nombre: "Tigrillo" }, { $set: { disponible: true } });

// D4. Subir 10 % el precio de todas las bebidas ($mul) y redondear
db.productos.updateMany({ "categoria.nombre": "Bebidas" }, [
  { $set: { precio: { $round: [{ $multiply: ["$precio", 1.10] }, 2] } } }
]);

// D5. Crear y eliminar una categoría de prueba
db.categorias.insertOne({ nombre: "Postres", slug: "postres" });
db.categorias.deleteOne({ slug: "postres" });

// =====================================================================
// E. VALIDACIÓN DEL ESQUEMA ($jsonSchema) E ÍNDICE ÚNICO
// =====================================================================

// E1. Pedido inválido: estado inexistente y cantidad 0
//     Esperado: error "Document failed validation" (código 121)  📸
db.pedidos.insertOne({
  usuario: { _id: ObjectId("64a100000000000000000002"), nombre: "Luis Ramírez" },
  items: [ { productoId: ObjectId("64d000000000000000000004"), nombre: "Almuerzo del día", precioUnitario: 2.75, cantidad: 0, subtotal: 0 } ],
  total: 0,
  horaRecogida: ISODate("2026-10-28T17:30:00Z"),
  estado: "pagado",
  historialEstados: [],
  creadoEn: new Date()
});

// E2. Producto con precio negativo. Esperado: "Document failed validation"
db.productos.insertOne({
  nombre: "Producto de prueba", precio: -1, disponible: true,
  categoria: { _id: ObjectId("64c000000000000000000004"), nombre: "Snacks" }, creadoEn: new Date()
});

// E3. Correo duplicado. Esperado: E11000 duplicate key error (índice ux_email)  📸
db.usuarios.insertOne({
  nombre: "Ana Torres Duplicada", email: "ana.torres@utmachala.edu.ec",
  passwordHash: "x", rol: "estudiante", creadoEn: new Date()
});

// E4. Ver el validador de una colección  📸
db.getCollectionInfos({ name: "pedidos" })[0].options.validator;
