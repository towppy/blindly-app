/**
 * SQLite cart persistence helper
 * Saves cart items to local SQLite database
 * Loads cart on app start, clears after checkout
 */
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'blindly_cart.db';

let db = null;

// Initialize database and create cart table
export const initCartDB = async () => {
    try {
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        
        await db.execAsync(`
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
        `);
        
        console.log('[CartDB] Database initialized');
        return true;
    } catch (error) {
        console.error('[CartDB] Init error:', error);
        return false;
    }
};

// Get all cart items from SQLite
export const getCartItems = async () => {
    try {
        if (!db) await initCartDB();
        
        const rows = await db.getAllAsync('SELECT * FROM cart_items');
        
        // Parse the full product data from JSON
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
        if (!db) await initCartDB();
        
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
                data
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
        if (!db) await initCartDB();
        
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
        if (!db) await initCartDB();
        
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
        if (!db) await initCartDB();
        
        // Clear existing items
        await db.runAsync('DELETE FROM cart_items');
        
        // Insert all current items
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
