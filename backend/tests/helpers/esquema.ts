import type { Db, Document } from "mongodb";

/**
 * Validadores e índices de la base real.
 *
 * FUENTE DE VERDAD: `database/pedidos_utmach.js`.
 * Si el esquema real cambia, estas definiciones deben actualizarse en el
 * mismo Pull Request. Las pruebas de `validadores.test.ts` detectan
 * desincronizaciones básicas.
 */
export const VALIDADORES: Record<string, Document> = {
  usuarios: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "email", "passwordHash", "rol", "creadoEn"],
      properties: {
        nombre: { bsonType: "string", minLength: 3 },
        email: {
          bsonType: "string",
          pattern: "^[^@\\s]+@[^@\\s]+\\.[a-z]{2,}$"
        },
        passwordHash: { bsonType: "string" },
        rol: { enum: ["estudiante", "admin"] },
        creadoEn: { bsonType: "date" }
      }
    }
  },
  categorias: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "slug"],
      properties: {
        nombre: { bsonType: "string", minLength: 3 },
        slug: { bsonType: "string", pattern: "^[a-z0-9-]+$" }
      }
    }
  },
  productos: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "precio", "disponible", "categoria", "creadoEn"],
      properties: {
        nombre: { bsonType: "string", minLength: 3 },
        descripcion: { bsonType: "string" },
        precio: {
          bsonType: ["double", "int", "decimal"],
          minimum: 0.01
        },
        imagenUrl: { bsonType: "string" },
        disponible: { bsonType: "bool" },
        categoria: {
          bsonType: "object",
          required: ["_id", "nombre"],
          properties: {
            _id: { bsonType: "objectId" },
            nombre: { bsonType: "string" }
          }
        },
        creadoEn: { bsonType: "date" }
      }
    }
  },
  pedidos: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "usuario",
        "items",
        "total",
        "horaRecogida",
        "estado",
        "historialEstados",
        "creadoEn"
      ],
      properties: {
        usuario: {
          bsonType: "object",
          required: ["_id", "nombre"],
          properties: {
            _id: { bsonType: "objectId" },
            nombre: { bsonType: "string" }
          }
        },
        items: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: [
              "productoId",
              "nombre",
              "precioUnitario",
              "cantidad",
              "subtotal"
            ],
            properties: {
              productoId: { bsonType: "objectId" },
              nombre: { bsonType: "string" },
              precioUnitario: {
                bsonType: ["double", "int", "decimal"],
                minimum: 0.01
              },
              cantidad: {
                bsonType: ["int", "long", "double"],
                minimum: 1,
                maximum: 20,
                multipleOf: 1
              },
              subtotal: {
                bsonType: ["double", "int", "decimal"],
                minimum: 0.01
              }
            }
          }
        },
        total: { bsonType: ["double", "int", "decimal"], minimum: 0.01 },
        horaRecogida: { bsonType: "date" },
        estado: { enum: ["recibido", "preparando", "listo", "entregado"] },
        historialEstados: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["estado", "fecha"],
            properties: {
              estado: { enum: ["recibido", "preparando", "listo", "entregado"] },
              fecha: { bsonType: "date" }
            }
          }
        },
        creadoEn: { bsonType: "date" }
      }
    }
  }
};

export async function crearColecciones(db: Db): Promise<void> {
  for (const [nombre, validator] of Object.entries(VALIDADORES)) {
    await db.createCollection(nombre, {
      validator,
      validationLevel: "strict",
      validationAction: "error"
    });
  }
}

export async function crearIndices(db: Db): Promise<void> {
  await db
    .collection("usuarios")
    .createIndex({ email: 1 }, { unique: true, name: "ux_email" });

  await db
    .collection("categorias")
    .createIndex({ slug: 1 }, { unique: true, name: "ux_slug" });

  await db
    .collection("productos")
    .createIndex(
      { "categoria._id": 1, disponible: 1 },
      { name: "ix_categoria_disponible" }
    );

  await db.collection("productos").createIndex(
    { nombre: "text", descripcion: "text" },
    {
      name: "tx_busqueda",
      default_language: "spanish",
      weights: { nombre: 3, descripcion: 1 }
    }
  );

  await db
    .collection("pedidos")
    .createIndex(
      { "usuario._id": 1, creadoEn: -1 },
      { name: "ix_usuario_fecha" }
    );

  await db
    .collection("pedidos")
    .createIndex(
      { estado: 1, horaRecogida: 1 },
      { name: "ix_estado_hora" }
    );
}
