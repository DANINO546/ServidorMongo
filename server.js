const express = require('express');
const mongoose = require('mongoose'); // Librería para MongoDB
const mysql = require('mysql2/promise'); // Librería para MySQL
const app = express();

app.use(express.json());

// ==========================================
// 1. CONEXIÓN A MONGODB (Usuarios y Perfiles)
// ==========================================
mongoose.connect('mongodb+srv://Servidor_db_user:8Cz5KnWJW.Kz_p3@cluster0.kpsvyl0.mongodb.net/db1?appName=Cluster0')
    .then(() => {
        console.log("🍃 Conectado con éxito a MongoDB (Caja Fuerte de Usuarios)");
    })
    .catch(err => console.log("❌ Error de conexión en MongoDB:", err));

// Modelos de MongoDB
const Usuario = mongoose.model('Usuario', new mongoose.Schema({
    correo: { type: String, unique: true },
    password: String
}));

const Perfil = mongoose.model('Perfil', new mongoose.Schema({
    usuario_id: mongoose.Schema.Types.ObjectId,
    correo: { type: String, unique: true },
    nombre: String,
    edad: String,
    sexo: String,
    peso: String,
    altura: String,
    alergias: String 
}));

// ==========================================
// 2. CONEXIÓN A MYSQL EN LA NUBE (Clever Cloud)
// ==========================================
const pool = mysql.createPool({
    host: 'bvzijdiu7doiy0vrw3le-mysql.services.clever-cloud.com',       
    user: 'uuqcawlegzh85jlj',            
    password: '33mmQw5nuv5EUX1AHOVL', 
    database: 'bvzijdiu7doiy0vrw3le',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    ssl: {
        rejectUnauthorized: false // Obligatorio para la conexión segura en la nube
    }
});

// Ejecutamos la función de validación y llenado automático al arrancar
cargarAlimentosSiEstaVacio();


// ==========================================
// 3. RUTAS QUE USAN MONGODB
// ==========================================

// Iniciar Sesión (Busca en MongoDB)
app.post('/login', async (req, res) => {
    try {
        const { correo, password } = req.body;
        const usuario = await Usuario.findOne({ correo: correo });

        if (!usuario) {
            return res.status(401).json({ exito: false, mensaje: "Usuario no encontrado" });
        }
        if (usuario.password !== password) {
            return res.status(401).json({ exito: false, mensaje: "Contraseña incorrecta" });
        }

        res.json({ exito: true, mensaje: "Bienvenido", usuarioId: usuario._id });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Error en el servidor" });
    }
});

// Guardar Perfil (En MongoDB)
app.post('/perfil/guardar', async (req, res) => {
    try {
        const datos = req.body;
        const perfilActualizado = await Perfil.findOneAndUpdate(
            { correo: datos.correo }, 
            datos, 
            { upsert: true, new: true }
        );
        res.json({ exito: true, mensaje: "Perfil guardado en Mongo", perfil: perfilActualizado });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Error al guardar perfil" });
    }
});


// ==========================================
// 4. RUTAS QUE USAN MYSQL
// ==========================================

// Obtener Alimentos para tu pantalla de Comparador (Busca en MySQL)
app.get('/alimentos', async (req, res) => {
    try {
        const [lista] = await pool.query('SELECT * FROM alimentos');
        res.json({ lista: lista }); 
    } catch (error) {
        res.status(500).json({ error: "Error al obtener alimentos de MySQL" });
    }
});

// Dieta Inteligente (Lee alergias en Mongo -> Filtra en MySQL)
app.get('/dieta-inteligente/:correo/:objetivo', async (req, res) => {
    try {
        const { correo, objetivo } = req.params;

        const perfil = await Perfil.findOne({ correo: correo });
        let alergias = [];
        
        if (perfil && perfil.alergias) {
            alergias = perfil.alergias.split(',').map(a => a.trim());
        }

        let query = "SELECT nombre, categoria_plato, calorias, proteinas FROM alimentos";
        let queryParams = [];

        if (alergias.length > 0) {
            const placeholders = alergias.map(() => '?').join(','); 
            query += ` WHERE nombre NOT IN (${placeholders})`;
            queryParams = [...alergias];
        }

        if (objetivo === 'bajar_peso') {
            query += alergias.length > 0 ? " AND " : " WHERE ";
            query += "categoria_plato IN ('Verdura', 'Origen Animal') ORDER BY calorias ASC LIMIT 10";
        } 
        else if (objetivo === 'ganar_musculo') {
            query += " ORDER BY proteinas DESC LIMIT 10";
        }

        const [resultados] = await pool.query(query, queryParams);
        res.json({ exito: true, lista: resultados });

    } catch (error) {
        console.error(error);
        res.status(500).json({ exito: false, error: "Error en el motor de dietas" });
    }
});


// ==========================================
// 5. FUNCIONES DE APOYO (MySQL)
// ==========================================
async function cargarAlimentosSiEstaVacio() {
    try {
        // 1. CREADOR DE TABLA AUTOMÁTICO: Si Clever Cloud está vacío, creamos la estructura
        const queryTabla = `
            CREATE TABLE IF NOT EXISTS alimentos (
                id_alimento INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100),
                categoria_plato VARCHAR(50),
                calorias FLOAT,
                proteinas FLOAT,
                grasas FLOAT,
                carbohidratos FLOAT
            );
        `;
        await pool.query(queryTabla);
        console.log("🔹 Tabla 'alimentos' verificada con éxito en la nube.");

        // 2. Validamos si la tabla ya tiene registros sembrados
        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM alimentos');
        const conteo = rows[0].total;

        if (conteo === 0) {
            console.log("⏳ La base de datos en la nube está vacía. Poblando alimentos reales...");
            
            // Estructura correcta con categorías: [nombre, categoria, calorias, proteinas, grasas, carbohidratos]
            const listaAlimentos = [
                ['Manzana', 'Fruta', 52, 0.3, 0.2, 14],
                ['Plátano', 'Fruta', 89, 1.1, 0.3, 23],
                ['Naranja', 'Fruta', 47, 0.9, 0.1, 12],
                ['Fresa', 'Fruta', 32, 0.7, 0.3, 8],
                ['Uvas', 'Fruta', 69, 0.7, 0.2, 18],
                ['Mango', 'Fruta', 60, 0.8, 0.4, 15],
                ['Piña', 'Fruta', 50, 0.5, 0.1, 13],
                ['Sandía', 'Fruta', 30, 0.6, 0.2, 8],
                ['Melón', 'Fruta', 34, 0.8, 0.2, 8],
                ['Papaya', 'Fruta', 43, 0.5, 0.3, 11],
                ['Pollo', 'Origen Animal', 239, 27, 14, 0],
                ['Res', 'Origen Animal', 250, 26, 15, 0],
                ['Cerdo', 'Origen Animal', 242, 27, 14, 0],
                ['Pescado', 'Origen Animal', 206, 22, 12, 0],
                ['Atún', 'Origen Animal', 132, 28, 1, 0],
                ['Salmón', 'Origen Animal', 208, 20, 13, 0],
                ['Huevo', 'Origen Animal', 155, 13, 11, 1],
                ['Jamón', 'Origen Animal', 145, 21, 6, 1],
                ['Salchicha', 'Origen Animal', 301, 12, 27, 2],
                ['Tocino', 'Origen Animal', 541, 37, 42, 1],
                ['Leche', 'Lácteo', 42, 3.4, 1, 5],
                ['Queso', 'Lácteo', 402, 25, 33, 1],
                ['Yogurt', 'Lácteo', 59, 10, 0.4, 3.6],
                ['Mantequilla', 'Lácteo', 717, 0.9, 81, 0.1],
                ['Crema', 'Lácteo', 340, 2, 36, 3],
                ['Arroz', 'Cereal', 130, 2.7, 0.3, 28],
                ['Pasta', 'Cereal', 131, 5, 1.1, 25],
                ['Pan', 'Cereal', 265, 9, 3.2, 49],
                ['Tortilla', 'Cereal', 218, 5.7, 2.8, 45],
                ['Avena', 'Cereal', 389, 17, 7, 66],
                ['Papa', 'Verdura', 77, 2, 0.1, 17],
                ['Zanahoria', 'Verdura', 41, 0.9, 0.2, 10],
                ['Brócoli', 'Verdura', 55, 3.7, 0.6, 11],
                ['Espinaca', 'Verdura', 23, 2.9, 0.4, 3.6],
                ['Lechuga', 'Verdura', 15, 1.4, 0.2, 2.9],
                ['Flor de calabaza', 'Verdura', 15, 0.5, 0.1, 3],
                ['Pepino', 'Verdura', 15, 0.6, 0.1, 3],
                ['Nopal', 'Verdura', 16, 1.3, 0.1, 3.3],
                ['Apio', 'Verdura', 16, 0.7, 0.2, 3],
                ['Rábano', 'Verdura', 16, 0.6, 0.1, 3.4],
                ['Calabacita', 'Verdura', 17, 1.2, 0.1, 3.4],
                ['Jitomate', 'Verdura', 18, 0.9, 0.2, 3.9],
                ['Acelga', 'Verdura', 19, 1.8, 0.2, 3.7],
                ['Chayote', 'Verdura', 19, 0.7, 0.1, 4.5],
                ['Soya texturizada', 'Leguminosa', 327, 50, 1, 30],
                ['Soya (semilla)', 'Leguminosa', 446, 36.5, 20, 30],
                ['Semilla de calabaza', 'Leguminosa', 559, 30.2, 49, 15],
                ['Pulpo', 'Origen Animal', 164, 30, 2, 4],
                ['Carne de conejo', 'Origen Animal', 173, 29, 6, 0],
                ['Milanesa de pollo', 'Origen Animal', 190, 28, 7, 0]
            ];

            const queryInsert = 'INSERT INTO alimentos (nombre, categoria_plato, calorias, proteinas, grasas, carbohidratos) VALUES ?';
            await pool.query(queryInsert, [listaAlimentos]);
            
            console.log("✅ ¡Éxito! Los 50 alimentos han sido sembrados en Clever Cloud.");
        } else {
            console.log(`ℹ️ Clever Cloud ya contiene ${conteo} alimentos registrados. Saltando población.`);
        }
    } catch (error) {
        console.error("❌ Error al poblar alimentos en MySQL:", error);
    }
}

// Encender el Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor híbrido escuchando en el puerto ${PORT}`);
});