// const { pool } = require("../db");

// const tableName = "brands";

// // Бүх брэндүүдийг авах (pagination-тай)
// async function getAllBrands({ limit = 10, page = 0 } = {}) {
//   const offset = page * limit;
//   const result = await pool.query(
//     `SELECT * FROM ${tableName} 
//      ORDER BY created_at DESC 
//      LIMIT $1 OFFSET $2`,
//     [limit, offset]
//   );
//   return result.rows;
// }

// // ID-аар брэнд авах
// async function getBrandById(id) {
//   const result = await pool.query(
//     `SELECT * FROM ${tableName} WHERE id = $1`,
//     [id]
//   );
//   return result.rows?.[0];
// }

// // Нэрээр брэнд хайх (давхардал шалгах)
// async function getBrandByName(name) {
//   const result = await pool.query(
//     `SELECT * FROM ${tableName} WHERE LOWER(name) = LOWER($1)`,
//     [name]
//   );
//   return result.rows?.[0];
// }

// // Шинэ брэнд үүсгэх
// async function createBrand(dto) {
//   const { name, description } = dto;

//   if (!name || name.trim().length === 0) {
//     throw new Error("Брэндийн нэр хоосон байж болохгүй");
//   }

//   // Давхардсан нэр шалгах
//   const existing = await getBrandByName(name);
//   if (existing) {
//     throw new Error("Ийм нэртэй брэнд аль хэдийн бүртгэлтэй байна");
//   }

//   const result = await pool.query(
//     `INSERT INTO ${tableName} (name, description, created_at, updated_at) 
//      VALUES ($1, $2, NOW(), NOW()) 
//      RETURNING *`,
//     [name.trim(), description || null]
//   );

//   return result.rows[0];
// }

// // Брэнд шинэчлэх
// async function updateBrand(id, dto) {
//   const { name, description } = dto;

//   // Брэнд байгаа эсэхийг шалгах
//   const existing = await getBrandById(id);
//   if (!existing) {
//     return null;
//   }

//   // Хэрэв нэр өөрчлөгдсөн бол давхардал шалгах
//   if (name && name !== existing.name) {
//     const duplicate = await getBrandByName(name);
//     if (duplicate && duplicate.id !== parseInt(id)) {
//       throw new Error("Ийм нэртэй брэнд аль хэдийн бүртгэлтэй байна");
//     }
//   }

//   const result = await pool.query(
//     `UPDATE ${tableName} 
//      SET name = COALESCE($1, name),
//          description = COALESCE($2, description),
//          updated_at = NOW()
//      WHERE id = $3
//      RETURNING *`,
//     [
//       name?.trim() || null,
//       description !== undefined ? description : null,
//       id
//     ]
//   );

//   return result.rows[0];
// }

// // Брэнд устгах
// async function deleteBrand(id) {
//   // Эхлээд брэнд байгаа эсэхийг шалгах
//   const existing = await getBrandById(id);
//   if (!existing) {
//     return null;
//   }

//   // Энэ брэндийн бүтээгдэхүүн байгаа эсэхийг шалгах
//   const productsCheck = await pool.query(
//     `SELECT COUNT(*) as count FROM products WHERE brand_id = $1`,
//     [id]
//   );

//   if (parseInt(productsCheck.rows[0].count) > 0) {
//     throw new Error("Энэ брэндийн бүтээгдэхүүн байгаа тул устгах боломжгүй");
//   }

//   const result = await pool.query(
//     `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
//     [id]
//   );

//   return result.rows[0];
// }

// // Брэндийн бүтээгдэхүүний тоо
// async function getBrandProductCount(id) {
//   const result = await pool.query(
//     `SELECT COUNT(*) as product_count FROM products WHERE brand_id = $1`,
//     [id]
//   );
//   return parseInt(result.rows[0].product_count);
// }

// module.exports = {
//   getAllBrands,
//   getBrandById,
//   getBrandByName,
//   createBrand,
//   updateBrand,
//   deleteBrand,
//   getBrandProductCount,
// };
const { pool } = require("../db");

class Product {
  #tableName = "products";
  #attributesTable = "attributes";
  #valuesTable = "attribute_values";
  #productAttributesTable = "product_attributes";

  // Бүх бүтээгдэхүүн авах (pagination, filter, search)
  async getAllProducts({ limit = 10, page = 0, category_id, brand_id, active, search }) {
    const offset = page * limit;
    let query = `
      SELECT p.*, 
             c.name as category_name, 
             b.name as brand_name
      FROM ${this.#tableName} p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category_id) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (brand_id) {
      query += ` AND p.brand_id = $${paramIndex}`;
      params.push(brand_id);
      paramIndex++;
    }

    if (active !== undefined) {
      query += ` AND p.active = $${paramIndex}`;
      params.push(active);
      paramIndex++;
    }

    if (search) {
      query += ` AND (LOWER(p.name) LIKE LOWER($${paramIndex}) OR LOWER(p.description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY p.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ID-аар авах
  async getProductById(id) {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM ${this.#tableName} p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows?.[0];
  }

  // SKU-аар авах
  async getProductBySku(sku) {
    const result = await pool.query(
      `SELECT * FROM ${this.#tableName} WHERE LOWER(sku) = LOWER($1)`,
      [sku]
    );
    return result.rows?.[0];
  }

  // Нэрээр авах
  async getProductByName(name) {
    const result = await pool.query(
      `SELECT * FROM ${this.#tableName} WHERE LOWER(name) = LOWER($1)`,
      [name]
    );
    return result.rows?.[0];
  }

  // Шинэ бүтээгдэхүүн үүсгэх
  async createProduct(dto) {
    const { sku, name, description, price, currency, active, category_id, brand_id } = dto;

    if (!sku || sku.trim().length === 0) throw new Error("SKU хоосон байж болохгүй");
    if (!name || name.trim().length === 0) throw new Error("Нэр хоосон байж болохгүй");
    if (price === undefined || price === null || price < 0) throw new Error("Үнэ 0-с их эсвэл тэнцүү байх ёстой");

    const existingSku = await this.getProductBySku(sku);
    if (existingSku) throw new Error("Ийм SKU-тай бүтээгдэхүүн аль хэдийн бүртгэлтэй байна");

    if (category_id) {
      const categoryCheck = await pool.query(`SELECT id FROM categories WHERE id = $1`, [category_id]);
      if (categoryCheck.rows.length === 0) throw new Error("Ийм ангилал олдсонгүй");
    }

    if (brand_id) {
      const brandCheck = await pool.query(`SELECT id FROM brands WHERE id = $1`, [brand_id]);
      if (brandCheck.rows.length === 0) throw new Error("Ийм брэнд олдсонгүй");
    }

    const result = await pool.query(
      `INSERT INTO ${this.#tableName} 
       (sku, name, description, price, currency, active, category_id, brand_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        sku.trim(),
        name.trim(),
        description || null,
        price,
        currency || 'MNT',
        active !== undefined ? active : true,
        category_id || null,
        brand_id || null
      ]
    );

    return result.rows[0];
  }

  // Бүтээгдэхүүн шинэчлэх
  async updateProduct(id, dto) {
    const { sku, name, description, price, currency, active, category_id, brand_id } = dto;

    const existing = await this.getProductById(id);
    if (!existing) return null;

    if (sku && sku !== existing.sku) {
      const duplicate = await this.getProductBySku(sku);
      if (duplicate && duplicate.id !== parseInt(id)) throw new Error("Ийм SKU-тай бүтээгдэхүүн аль хэдийн бүртгэлтэй байна");
    }

    if (price !== undefined && price < 0) throw new Error("Үнэ 0-с их эсвэл тэнцүү байх ёстой");

    if (category_id) {
      const categoryCheck = await pool.query(`SELECT id FROM categories WHERE id = $1`, [category_id]);
      if (categoryCheck.rows.length === 0) throw new Error("Ийм ангилал олдсонгүй");
    }

    if (brand_id) {
      const brandCheck = await pool.query(`SELECT id FROM brands WHERE id = $1`, [brand_id]);
      if (brandCheck.rows.length === 0) throw new Error("Ийм брэнд олдсонгүй");
    }

    const result = await pool.query(
      `UPDATE ${this.#tableName} 
       SET sku = COALESCE($1, sku),
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           price = COALESCE($4, price),
           currency = COALESCE($5, currency),
           active = COALESCE($6, active),
           category_id = COALESCE($7, category_id),
           brand_id = COALESCE($8, brand_id)
       WHERE id = $9
       RETURNING *`,
      [
        sku?.trim() || null,
        name?.trim() || null,
        description !== undefined ? description : null,
        price !== undefined ? price : null,
        currency || null,
        active !== undefined ? active : null,
        category_id !== undefined ? category_id : null,
        brand_id !== undefined ? brand_id : null,
        id
      ]
    );

    return result.rows[0];
  }

  // Бүтээгдэхүүн устгах
  async deleteProduct(id) {
    const existing = await this.getProductById(id);
    if (!existing) return null;

    const result = await pool.query(`DELETE FROM ${this.#tableName} WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
  }

  // Бүтээгдэхүүн идэвхгүй болгох
  async deactivateProduct(id) {
    const result = await pool.query(
      `UPDATE ${this.#tableName} SET active = false WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  // Ангиллын бүтээгдэхүүнүүд
  async getProductsByCategory(category_id, { limit = 10, page = 0 } = {}) {
    const offset = page * limit;
    const result = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM ${this.#tableName} p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.category_id = $1 AND p.active = true
       ORDER BY p.id DESC
       LIMIT $2 OFFSET $3`,
      [category_id, limit, offset]
    );
    return result.rows;
  }

  // Брэндийн бүтээгдэхүүнүүд
  async getProductsByBrand(brand_id, { limit = 10, page = 0 } = {}) {
    const offset = page * limit;
    const result = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM ${this.#tableName} p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.brand_id = $1 AND p.active = true
       ORDER BY p.id DESC
       LIMIT $2 OFFSET $3`,
      [brand_id, limit, offset]
    );
    return result.rows;
  }

  // 🔹 Attribute-based search
  async searchByAttributes(attributes) {
    let query = `SELECT DISTINCT p.* FROM ${this.#tableName} p `;
    const params = [];
    let joinIndex = 1;

    attributes.forEach((attr, idx) => {
      const paAlias = `pa${idx}`;
      const avAlias = `av${idx}`;
      const aAlias = `a${idx}`;

      query += `JOIN ${this.#productAttributesTable} ${paAlias} ON p.id = ${paAlias}.product_id `;
      query += `JOIN ${this.#valuesTable} ${avAlias} ON ${paAlias}.attribute_value_id = ${avAlias}.id `;
      query += `JOIN ${this.#attributesTable} ${aAlias} ON ${paAlias}.attribute_id = ${aAlias}.id `;

      query += `AND ${aAlias}.name = $${joinIndex} AND ${avAlias}.value = $${joinIndex + 1} `;
      params.push(attr.name, attr.value);
      joinIndex += 2;
    });

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = new Product();
