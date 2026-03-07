/**
 * SQLite cart persistence helper
 * Saves cart items to local SQLite database
 * Loads cart on app start, clears after checkout
 *
 * The DB instance is provided by SQLiteProvider in App.js via setActiveDB().
 * This avoids the Android NullPointerException caused by openDatabaseAsync
 * returning before the native layer is ready.
 */

// Set by CartLoader via useSQLiteContext() — guaranteed ready before use
let _db = null;

export const setActiveDB = (db) => {
    _db = db;
    console.log('[CartDB] Database instance set');
};

const requireDB = () => {
    if (!_db) throw new Error('[CartDB] Database not ready. Ensure SQLiteProvider is mounted.');
    return _db;
};

// SQL run once by SQLiteProvider onInit (see App.js)
export const CART_SCHEMA = `
    CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT UNIQUE,
        name TEXT,
        price REAL,
        image TEXT,
        countInStock INTEGER,
        quantity INTEGER DEFAULT 1,
        data TEXT
    );
`;

// No-op kept for backward compat — real init happens in SQLiteProvider
export const initCartDB = async () => true;

// Get all cart items from SQLite
export const getCartItems = async () => {
    try {
        const db = requireDB();
        const rows = await db.getAllAsync('SELECT * FROM cart_items');
        return rows.map(row => {
            try {
                return JSON.parse(row.data);
            } catch {
                return {
                    id: row.product_id,
                    name: row.name,
                    price: row.price,
                    image: row.image,
                    countInStock: row.countInStock,
                    quantity: row.quantity,
                };
            }
        });
    } catch (error) {
        console.error('[CartDB] Get items error:', error);
        return [];
    }
};

// Add item to cart in SQLite
export const addCartItem = async (item) => {
    try {
        const db = requireDB();
        const productId = item.id || item._id;
        const data = JSON.stringify(item);
        await db.runAsync(
            `INSERT OR REPLACE INTO cart_items (product_id, name, price, image, countInStock, quantity, data) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                productId,
                item.name || '',
                item.price || 0,
                item.image || '',
                item.countInStock || 0,
                item.quantity || 1,
                data,
            ]
        );
        console.log('[CartDB] Item added:', item.name);
        return true;
    } catch (error) {
        console.error('[CartDB] Add item error:', error);
        return false;
    }
};

// Remove item from cart in SQLite
export const removeCartItem = async (item) => {
    try {
        const db = requireDB();
        const productId = item.id || item._id;
        await db.runAsync('DELETE FROM cart_items WHERE product_id = ?', [productId]);
        console.log('[CartDB] Item removed:', item.name || productId);
        return true;
    } catch (error) {
        console.error('[CartDB] Remove item error:', error);
        return false;
    }
};

// Clear all cart items from SQLite (after checkout)
export const clearCartDB = async () => {
    try {
        const db = requireDB();
        await db.runAsync('DELETE FROM cart_items');
        console.log('[CartDB] Cart cleared');
        return true;
    } catch (error) {
        console.error('[CartDB] Clear cart error:', error);
        return false;
    }
};

// Sync entire cart state to SQLite (replaces all items)
export const syncCartToDB = async (cartItems) => {
    try {
        const db = requireDB();
        await db.runAsync('DELETE FROM cart_items');
        for (const item of cartItems) {
            await addCartItem(item);
        }
        console.log('[CartDB] Cart synced, items:', cartItems.length);
        return true;
    } catch (error) {
        console.error('[CartDB] Sync error:', error);
        return false;
    }
};
