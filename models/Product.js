const { pool } = require("../db");

class Product {
  #tableName = "products";

  // --- 1. Бүх бүтээгдэхүүн ---
  async getAllProducts({ limit = 10, page = 0 } = {}) {
    const offset = page * limit;
    const result = await pool.query(
      `
      SELECT 
        id,
        sku,
        name,
        description,
        price,
        currency,
        active,
        category_id,
        brand_id
      FROM ${this.#tableName}
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    return result.rows;
  }

  // --- 2. Нэг бүтээгдэхүүн (products-оос) ---
  async getProductById(id) {
    const result = await pool.query(
      `
      SELECT 
        id,
        sku,
        name,
        description,
        price,
        currency,
        active,
        category_id,
        brand_id
      FROM ${this.#tableName}
      WHERE id = $1
      `,
      [id]
    );
    return result.rows[0];
  }

  // --- 3. Нэг бүтээгдэхүүний attributes ---
  async getAttributesByProductId(productId) {
    const result = await pool.query(
      `
      SELECT 
        a.name AS attribute_name,
        av.value AS attribute_value
      FROM product_attributes pa
      JOIN attributes a ON pa.attribute_id = a.id
      JOIN attribute_values av ON pa.attribute_value_id = av.id
      WHERE pa.product_id = $1
      ORDER BY a.name, av.value
      `,
      [productId]
    );

    return result.rows.map((row) => ({
      name: row.attribute_name,
      value: row.attribute_value,
    }));
  }

  // --- 4. Шинэ бүтээгдэхүүн үүсгэх ---
  async createProduct(dto) {
    const {
      sku,
      name,
      description,
      price,
      currency,
      active,
      category_id,
      brand_id,
      attributes,
    } = dto;

    if (!sku) throw new Error("SKU is required");
    if (!name) throw new Error("Name is required");
    if (price == null) throw new Error("Price is required");

    // SKU давхардал шалгах
    const dup = await pool.query(
      `SELECT id FROM ${this.#tableName} WHERE LOWER(sku) = LOWER($1)`,
      [sku]
    );
    if (dup.rows.length > 0) {
      throw new Error("This SKU is already used");
    }

    // үндсэн бүтээгдэхүүнээ оруулна
    const result = await pool.query(
      `
      INSERT INTO ${this.#tableName}
        (sku, name, description, price, currency, active, category_id, brand_id)
      VALUES
        ($1,  $2,   $3,         $4,   $5,       $6,     $7,          $8)
      RETURNING *
      `,
      [
        sku,
        name,
        description || null,
        price,
        currency || "MNT",
        typeof active === "boolean" ? active : true,
        category_id || null,
        brand_id || null,
      ]
    );

    const newProduct = result.rows[0];

    // attributes ирсэн бол холбоно
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      for (const attr of attributes) {
        // 1. attribute (өргөн нэр) байгаа эсэх
        let attrRes = await pool.query(
          `SELECT id FROM attributes WHERE name = $1`,
          [attr.name]
        );
        if (attrRes.rows.length === 0) {
          // category-тэй холбож болно, чиний schema-д category_id байгаа
          attrRes = await pool.query(
            `INSERT INTO attributes (name, category_id) VALUES ($1, $2) RETURNING id`,
            [attr.name, category_id || null]
          );
        }
        const attributeId = attrRes.rows[0].id;

        // 2. value байгаа эсэх
        let valRes = await pool.query(
          `SELECT id FROM attribute_values WHERE attribute_id = $1 AND value = $2`,
          [attributeId, attr.value]
        );
        if (valRes.rows.length === 0) {
          valRes = await pool.query(
            `INSERT INTO attribute_values (attribute_id, value) VALUES ($1, $2) RETURNING id`,
            [attributeId, attr.value]
          );
        }
        const attributeValueId = valRes.rows[0].id;

        // 3. product_attributes-д холбоно
        await pool.query(
          `
          INSERT INTO product_attributes (product_id, attribute_id, attribute_value_id)
          VALUES ($1, $2, $3)
          `,
          [newProduct.id, attributeId, attributeValueId]
        );
      }
    }

    return newProduct;
  }

  // --- 5. Бүтээгдэхүүн шинэчлэх ---
  async updateProduct(id, dto) {
    const existing = await this.getProductById(id);
    if (!existing) return null;

    const {
      sku,
      name,
      description,
      price,
      currency,
      active,
      category_id,
      brand_id,
    } = dto;

    const result = await pool.query(
      `
      UPDATE ${this.#tableName}
      SET
        sku = COALESCE($1, sku),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        currency = COALESCE($5, currency),
        active = COALESCE($6, active),
        category_id = COALESCE($7, category_id),
        brand_id = COALESCE($8, brand_id)
      WHERE id = $9
      RETURNING *
      `,
      [
        sku || null,
        name || null,
        description !== undefined ? description : null,
        price !== undefined ? price : null,
        currency || null,
        typeof active === "boolean" ? active : null,
        category_id !== undefined ? category_id : null,
        brand_id !== undefined ? brand_id : null,
        id,
      ]
    );

    return result.rows[0];
  }

  // --- 6. Устгах ---
  async deleteProduct(id) {
    const result = await pool.query(
      `DELETE FROM ${this.#tableName} WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Product;
