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
    DROP TABLE IF EXISTS cart_items;
    CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        product_id TEXT,
        name TEXT,
        price REAL,
        image TEXT,
        countInStock INTEGER,
        quantity INTEGER DEFAULT 1,
        data TEXT,
        UNIQUE(user_id, product_id)
    );
`;

// No-op kept for backward compat — real init happens in SQLiteProvider
export const initCartDB = async () => true;

// Get all cart items for a user from SQLite
export const getCartItems = async (userId) => {
    if (!userId) return [];
    try {
        const db = requireDB();
        const rows = await db.getAllAsync('SELECT * FROM cart_items WHERE user_id = ?', [userId]);
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

// Add item to cart in SQLite for a user
export const addCartItem = async (item, userId) => {
    if (!userId) return false;
    try {
        const db = requireDB();
        const productId = item.id || item._id;
        const data = JSON.stringify(item);
        await db.runAsync(
            `INSERT OR REPLACE INTO cart_items (user_id, product_id, name, price, image, countInStock, quantity, data) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                productId,
                item.name || '',
                item.price || 0,
                item.image || '',
                item.countInStock || 0,
                item.quantity || 1,
                data,
            ]
        );
        console.log('[CartDB] Item added for user', userId, ':', item.name);
        return true;
    } catch (error) {
        console.error('[CartDB] Add item error:', error);
        return false;
    }
};

// Remove item from cart in SQLite for a user
export const removeCartItem = async (item, userId) => {
    if (!userId) return false;
    try {
        const db = requireDB();
        const productId = item.id || item._id;
        await db.runAsync('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
        console.log('[CartDB] Item removed for user', userId, ':', item.name || productId);
        return true;
    } catch (error) {
        console.error('[CartDB] Remove item error:', error);
        return false;
    }
};

// Clear all cart items for a user from SQLite (after checkout or logout)
export const clearCartDB = async (userId) => {
    if (!userId) return false;
    try {
        const db = requireDB();
        await db.runAsync('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        console.log('[CartDB] Cart cleared for user', userId);
        return true;
    } catch (error) {
        console.error('[CartDB] Clear cart error:', error);
        return false;
    }
};

// Sync entire cart state to SQLite (replaces all items)
export const syncCartToDB = async (cartItems, userId) => {
    if (!userId) return false;
    try {
        const db = requireDB();
        await db.runAsync('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        for (const item of cartItems) {
            await addCartItem(item, userId);
        }
        console.log('[CartDB] Cart synced for user', userId, 'items:', cartItems.length);
        return true;
    } catch (error) {
        console.error('[CartDB] Sync error:', error);
        return false;
    }
};
