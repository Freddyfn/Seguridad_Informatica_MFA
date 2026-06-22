const bcrypt = require('bcryptjs');
const db = require('./db');

const seed = async () => {
    await new Promise(r => setTimeout(r, 1000));

    console.log('Starting seed process...');

    const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    try {
        await runQuery('DELETE FROM users');
        await runQuery('DELETE FROM products');
        await runQuery('DELETE FROM orders');

        const passwordHash = await bcrypt.hash('123456', 10);

        const users = [
            ['Carlos Valderrama', 'Cra. 52 # 14-30, Medellín', '+57 300 123 4567', 'carlos@ejemplo.com', passwordHash],
            ['Freddy Rincón', 'Calle 100 # 15-20, Bogotá', '+57 310 987 6543', 'freddy@ejemplo.com', passwordHash],
            ['René Higuita', 'Av. San Juan # 80-10, Medellín', '+57 320 456 7890', 'rene@ejemplo.com', passwordHash],
            ['Faustino Asprilla', 'Cra. 1 # 5-60, Cali', '+57 315 111 2233', 'tino@ejemplo.com', passwordHash]
        ];

        for (const u of users) {
            await runQuery('INSERT INTO users (name, address, phone, email, password) VALUES (?, ?, ?, ?, ?)', u);
        }
        console.log('Seeded Users.');

        const products = [
            ['Camiseta Colombia Local 2026', 'La nueva piel amarilla de la selección. Ajuste perfecto y tecnología absorbente.', 250000, '/home.png', 'Jerseys'],
            ['Camiseta Colombia Visitante 2026', 'Elegancia en negro y detalles vivos para los partidos de visitante. Edición especial.', 250000, '/away.png', 'Jerseys'],
            ['Camiseta Retro Colombia 90s', 'Edición clásica inspirada en la época dorada de los 90s con patrones geométricos.', 180000, '/retro.png', 'Retro']
        ];

        for (const p of products) {
            await runQuery('INSERT INTO products (name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?)', p);
        }
        console.log('Seeded Products.');

        console.log('Database successfully seeded!');
    } catch (err) {
        console.error('Seed Error:', err);
    } finally {
        db.close();
    }
};

seed();
