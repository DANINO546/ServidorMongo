const express = require('express');
const mongoose = require('mongoose'); 
const app = express();

app.use(express.json());

// ==========================================
// 1. CONEXIÓN A MONGODB
// ==========================================
mongoose.connect('mongodb+srv://Servidor_db_user:8Cz5KnWJW.Kz_p3@cluster0.kpsvyl0.mongodb.net/db1?appName=Cluster0')
    .then(() => {
        console.log("🍃 Conectado con éxito a MongoDB (Base de datos global)");
        poblarMongoSiEstaVacio();
    })
    .catch(err => console.log("❌ Error de conexión en MongoDB:", err));

// ==========================================
// 2. MODELOS Y ESQUEMAS DE MONGODB
// ==========================================

const Usuario = mongoose.model('Usuario', new mongoose.Schema({
    correo: { type: String, unique: true, required: true },
    password: { type: String, required: true }
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

const Alimento = mongoose.model('Alimento', new mongoose.Schema({
    nombre: String,
    categoria_plato: String,
    calorias: Number,
    proteinas: Number,
    grasas: Number,
    carbohidratos: Number
}));

const Dieta = mongoose.model('Dieta', new mongoose.Schema({
    objetivo: String, 
    desayuno: String,
    colacion1: String,
    comida: String,
    colacion2: String,
    cena: String
}));

// ==========================================
// 3. RUTAS DE AUTENTICACIÓN Y PERFIL
// ==========================================

// Crear Cuenta / Registro (Con validación obligatoria de Gmail)
app.post('/registro', async (req, res) => {
    try {
        const { correo, password } = req.body;
        
        // 🛑 VALIDACIÓN OBLIGATORIA: Solo correos de @gmail.com
        if (!correo || !correo.toLowerCase().endsWith('@gmail.com')) {
            return res.status(400).json({ 
                exito: false, 
                mensaje: "Registro denegado. Solo se permiten correos @gmail.com" 
            });
        }

        // Validamos si el usuario ya existe
        const usuarioExiste = await Usuario.findOne({ correo: correo });
        if (usuarioExiste) {
            return res.status(400).json({ exito: false, mensaje: "El correo ya está registrado" });
        }

        // Creamos y guardamos el nuevo usuario
        const nuevoUsuario = new Usuario({ correo, password });
        await nuevoUsuario.save();

        res.json({ exito: true, mensaje: "Cuenta creada con éxito", usuarioId: nuevoUsuario._id });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Error al registrar usuario" });
    }
});

// Iniciar Sesión 
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

// Guardar Perfil 
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

// Obtener Perfil desde MongoDB
app.get('/perfil/:correo', async (req, res) => {
    try {
        const { correo } = req.params;
        const perfil = await Perfil.findOne({ correo: correo });
        
        if (!perfil) {
            return res.json({ exito: false, mensaje: "Perfil no encontrado" });
        }

        res.json({ exito: true, perfil: perfil });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Error al obtener el perfil" });
    }
});

// ==========================================
// 4. RUTAS DE MÓDULOS DE SALUD
// ==========================================

app.get('/alimentos', async (req, res) => {
    try {
        const lista = await Alimento.find();
        res.json({ lista: lista }); 
    } catch (error) {
        res.status(500).json({ error: "Error al obtener alimentos de MongoDB" });
    }
});

app.get('/dieta-inteligente/:correo/:objetivo', async (req, res) => {
    try {
        const { correo, objetivo } = req.params;
        const dietasDisponibles = await Dieta.find({ objetivo: objetivo });

        if (dietasDisponibles.length === 0) {
            return res.json({ exito: true, lista: [] });
        }

        res.json({ exito: true, lista: dietasDisponibles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ exito: false, error: "Error al cargar las dietas desde MongoDB" });
    }
});

// ==========================================
// 5. SEMBRADOR AUTOMÁTICO DE DATOS
// ==========================================
async function poblarMongoSiEstaVacio() {
    try {
        const conteoAlimentos = await Alimento.countDocuments();
        if (conteoAlimentos === 0) {
            console.log("⏳ Colección 'Alimentos' vacía. Migrando datos...");
            const listaAlimentos = [
                { nombre: 'Manzana', categoria_plato: 'Fruta', calorias: 52, proteinas: 0.3, grasas: 0.2, carbohidratos: 14 },
                { nombre: 'Plátano', categoria_plato: 'Fruta', calorias: 89, proteinas: 1.1, grasas: 0.3, carbohidratos: 23 },
                { nombre: 'Pollo', categoria_plato: 'Origen Animal', calorias: 239, proteinas: 27, grasas: 14, carbohidratos: 0 },
                { nombre: 'Res', categoria_plato: 'Origen Animal', calorias: 250, proteinas: 26, grasas: 15, carbohidratos: 0 },
                { nombre: 'Atún', categoria_plato: 'Origen Animal', calorias: 132, proteinas: 28, grasas: 1, carbohidratos: 0 },
                { nombre: 'Queso', categoria_plato: 'Lácteo', calorias: 402, proteinas: 25, grasas: 33, carbohidratos: 1 },
                { nombre: 'Arroz', categoria_plato: 'Cereal', calorias: 130, proteinas: 2.7, grasas: 0.3, carbohidratos: 28 },
                { nombre: 'Avena', categoria_plato: 'Cereal', calorias: 389, proteinas: 17, grasas: 7, carbohidratos: 66 },
                { nombre: 'Espinaca', categoria_plato: 'Verdura', calorias: 23, proteinas: 2.9, grasas: 0.4, carbohidratos: 3.6 },
                { nombre: 'Lechuga', categoria_plato: 'Verdura', calorias: 15, proteinas: 1.4, grasas: 0.2, carbohidratos: 2.9 },
                { nombre: 'Soya texturizada', categoria_plato: 'Leguminosa', calorias: 327, proteinas: 50, grasas: 1, carbohidratos: 30 }
            ];
            await Alimento.insertMany(listaAlimentos);
            console.log("✅ Alimentos sembrados con éxito.");
        }

        const conteoDietas = await Dieta.countDocuments();
        if (conteoDietas === 0) {
            console.log("⏳ Colección 'Dietas' vacía. Creando menús fijos...");
            const dietasSemilla = [
                {
                    objetivo: 'vegano',
                    desayuno: 'Licuado de plátano con leche de soya y avena',
                    colacion1: 'Manzana picada con almendras',
                    comida: 'Tacos de soya texturizada con nopales asados y jitomate',
                    colacion2: 'Pepino con limón y sal',
                    cena: 'Ensalada de espinacas fresas y nueces'
                },
                {
                    objetivo: 'bajar_peso',
                    desayuno: 'Claras de huevo con espinacas y 1 tortilla de maíz',
                    colacion1: 'Una taza de fresas completas',
                    comida: 'Pechuga de pollo asada con brócoli al vapor y lechuga',
                    colacion2: 'Bastones de apio y jícama',
                    cena: 'Atún en agua con rodajas de jitomate y pepino'
                },
                {
                    objetivo: 'ganar_musculo',
                    desayuno: '3 huevos revueltos con jamón y un plato de avena',
                    colacion1: 'Yogurt griego con plátano',
                    comida: 'Filete de res a la plancha con una taza de arroz y verduras',
                    colacion2: 'Licuado de leche con crema de cacahuate',
                    cena: 'Filete de salmón o pollo con ensalada mixta'
                }
            ];
            await Dieta.insertMany(dietasSemilla);
            console.log("✅ Menús de prueba sembrados.");
        }
    } catch (error) {
        console.error("❌ Error al inicializar datos:", error);
    }
}

// Encender Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor MongoDB corriendo en el puerto ${PORT}`);
});