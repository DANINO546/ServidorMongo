const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// 1. CONEXIÓN A MONGODB
mongoose.connect('mongodb+srv://Servidor_db_user:8Cz5KnWJW.Kz_p3@cluster0.kpsvyl0.mongodb.net/db1?appName=Cluster0')
    .then(() => {
        console.log("Conectado a la caja fuerte (DB)");
        cargarAlimentosSiEstaVacio();
        cargarDietasSiEstaVacio();
    })
    .catch(err => console.log("Error de conexión:", err));

// 2. MODELOS (Esquemas de datos)
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

const Dieta = mongoose.model('Dieta', new mongoose.Schema({
    objetivo: String,
    desayuno: String,
    colacion1: String,
    comida: String,
    colacion2: String,
    cena: String
}));

const Alimento = mongoose.model('Alimento', new mongoose.Schema({
    nombre: String,
    calorias: Number,
    proteinas: Number,
    grasas: Number,
    carbohidratos: Number
}));

const Historial = mongoose.model('Historial', new mongoose.Schema({
    alimento1: String,
    alimento2: String,
    fecha: { type: Date, default: Date.now }
}));

// 3. RUTAS (Ventanillas de servicio)

// --- Ventanilla para Registrar Usuarios ---
app.post('/registrar', async (req, res) => {
    try {
        const { correo, password } = req.body;
        const nuevoUsuario = new Usuario({ correo, password });
        await nuevoUsuario.save();
        res.json({ mensaje: "Usuario creado con éxito" });
    } catch (error) {
        // Si el correo ya existe, MongoDB lanzará un error
        res.status(500).json({ error: "El correo ya está registrado o hubo un error" });
    }
});

// --- Ventanilla para Iniciar Sesión ---
app.post('/login', async (req, res) => {
    try {
        const { correo, password } = req.body;
        
        // Buscamos al usuario por su correo
        const usuario = await Usuario.findOne({ correo: correo });

        if (!usuario) {
            // Si no existe el correo
            return res.status(401).json({ exito: false, mensaje: "Usuario no encontrado" });
        }

        if (usuario.password !== password) {
            // Si la contraseña no coincide
            return res.status(401).json({ exito: false, mensaje: "Contraseña incorrecta" });
        }

        // Si todo está bien
        res.json({ exito: true, mensaje: "Bienvenido", usuarioId: usuario._id });

    } catch (error) {
        res.status(500).json({ exito: false, error: "Error en el servidor" });
    }
});

// --- Obtener Perfil ---
app.get('/perfil/:correo', async (req, res) => {
    try {
        const perfil = await Perfil.findOne({ correo: req.params.correo });
        // Si no existe, enviamos un objeto con campos vacíos pero estructura válida
        res.json(perfil || { nombre: "", edad: "", sexo: "", peso: "", altura: "", alergias: "" });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener perfil" });
    }
});

// --- Única ruta para Guardar/Actualizar Perfil ---
app.post('/perfil/guardar', async (req, res) => {
    try {
        const datos = req.body;
        if (!datos.correo) {
            return res.status(400).json({ exito: false, error: "Falta el correo" });
        }

        // findOneAndUpdate busca por correo, si no existe lo crea (upsert)
        const perfilActualizado = await Perfil.findOneAndUpdate(
            { correo: datos.correo }, 
            datos, 
            { upsert: true, new: true }
        );
        
        res.json({ exito: true, mensaje: "Perfil actualizado", perfil: perfilActualizado });
    } catch (error) {
        console.error("Error al guardar:", error);
        res.status(500).json({ exito: false, error: "Error al guardar en la base de datos" });
    }
});

// --- Ventanilla para obtener la lista de alimentos ---
app.get('/alimentos', async (req, res) => {
    try {
        const lista = await Alimento.find(); // Busca todos los alimentos en la DB
        res.json({ lista: lista });          // Los envía dentro de un objeto con la llave "lista"
    } catch (error) {
        res.status(500).json({ error: "Error al obtener alimentos" });
    }
});

// --- Ventanilla para obtener dietas por objetivo ---
app.get('/dietas/:objetivo', async (req, res) => {
    try {
        const objetivoBuscado = req.params.objetivo;
        const lista = await Dieta.find({ objetivo: objetivoBuscado });
        res.json({ lista: lista });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las dietas" });
    }
});

// 4. FUNCIÓN PARA LLENAR LA BASE POR PRIMERA VEZ
async function cargarAlimentosSiEstaVacio() {
    const conteo = await Alimento.countDocuments();
    if (conteo < 10) { 
        console.log("Poblando la base de datos...");
        const listaAlimentos = [
            { nombre: 'Manzana', calorias: 52, proteinas: 0.3, grasas: 0.2, carbohidratos: 14 },
            { nombre: 'Plátano', calorias: 89, proteinas: 1.1, grasas: 0.3, carbohidratos: 23 },
            { nombre: 'Naranja', calorias: 47, proteinas: 0.9, grasas: 0.1, carbohidratos: 12 },
            { nombre: 'Fresa', calorias: 32, proteinas: 0.7, grasas: 0.3, carbohidratos: 8 },
            { nombre: 'Uvas', calorias: 69, proteinas: 0.7, grasas: 0.2, carbohidratos: 18 },
            { nombre: 'Mango', calorias: 60, proteinas: 0.8, grasas: 0.4, carbohidratos: 15 },
            { nombre: 'Piña', calorias: 50, proteinas: 0.5, grasas: 0.1, carbohidratos: 13 },
            { nombre: 'Sandía', calorias: 30, proteinas: 0.6, grasas: 0.2, carbohidratos: 8 },
            { nombre: 'Melón', calorias: 34, proteinas: 0.8, grasas: 0.2, carbohidratos: 8 },
            { nombre: 'Papaya', calorias: 43, proteinas: 0.5, grasas: 0.3, carbohidratos: 11 },
            { nombre: 'Pollo', calorias: 239, proteinas: 27, grasas: 14, carbohidratos: 0 },
            { nombre: 'Res', calorias: 250, proteinas: 26, grasas: 15, carbohidratos: 0 },
            { nombre: 'Cerdo', calorias: 242, proteinas: 27, grasas: 14, carbohidratos: 0 },
            { nombre: 'Pescado', calorias: 206, proteinas: 22, grasas: 12, carbohidratos: 0 },
            { nombre: 'Atún', calorias: 132, proteinas: 28, grasas: 1, carbohidratos: 0 },
            { nombre: 'Salmón', calorias: 208, proteinas: 20, grasas: 13, carbohidratos: 0 },
            { nombre: 'Huevo', calorias: 155, proteinas: 13, grasas: 11, carbohidratos: 1 },
            { nombre: 'Jamón', calorias: 145, proteinas: 21, grasas: 6, carbohidratos: 1 },
            { nombre: 'Salchicha', calorias: 301, proteinas: 12, grasas: 27, carbohidratos: 2 },
            { nombre: 'Tocino', calorias: 541, proteinas: 37, grasas: 42, carbohidratos: 1 },
            { nombre: 'Leche', calorias: 42, proteinas: 3.4, grasas: 1, carbohidratos: 5 },
            { nombre: 'Queso', calorias: 402, proteinas: 25, grasas: 33, carbohidratos: 1 },
            { nombre: 'Yogurt', calorias: 59, proteinas: 10, grasas: 0.4, carbohidratos: 3.6 },
            { nombre: 'Mantequilla', calorias: 717, proteinas: 0.9, grasas: 81, carbohidratos: 0.1 },
            { nombre: 'Crema', calorias: 340, proteinas: 2, grasas: 36, carbohidratos: 3 },
            { nombre: 'Arroz', calorias: 130, proteinas: 2.7, grasas: 0.3, carbohidratos: 28 },
            { nombre: 'Pasta', calorias: 131, proteinas: 5, grasas: 1.1, carbohidratos: 25 },
            { nombre: 'Pan', calorias: 265, proteinas: 9, grasas: 3.2, carbohidratos: 49 },
            { nombre: 'Tortilla', calorias: 218, proteinas: 5.7, grasas: 2.8, carbohidratos: 45 },
            { nombre: 'Avena', calorias: 389, proteinas: 17, grasas: 7, carbohidratos: 66 },
            { nombre: 'Papa', calorias: 77, proteinas: 2, grasas: 0.1, carbohidratos: 17 },
            { nombre: 'Zanahoria', calorias: 41, proteinas: 0.9, grasas: 0.2, carbohidratos: 10 },
            { nombre: 'Brócoli', calorias: 55, proteinas: 3.7, grasas: 0.6, carbohidratos: 11 },
            { nombre: 'Espinaca', calorias: 23, proteinas: 2.9, grasas: 0.4, carbohidratos: 3.6 },
            { nombre: 'Lechuga', calorias: 15, proteinas: 1.4, grasas: 0.2, carbohidratos: 2.9 },
            { nombre: 'Hamburguesa', calorias: 295, proteinas: 17, grasas: 14, carbohidratos: 30 },
            { nombre: 'Pizza', calorias: 266, proteinas: 11, grasas: 10, carbohidratos: 33 },
            { nombre: 'Hot dog', calorias: 290, proteinas: 10, grasas: 26, carbohidratos: 4 },
            { nombre: 'Papas fritas', calorias: 312, proteinas: 3.4, grasas: 15, carbohidratos: 41 },
            { nombre: 'Nuggets', calorias: 296, proteinas: 15, grasas: 20, carbohidratos: 18 },
            { nombre: 'Refresco', calorias: 41, proteinas: 0, grasas: 0, carbohidratos: 10 },
            { nombre: 'Jugo', calorias: 45, proteinas: 0.7, grasas: 0.1, carbohidratos: 11 },
            { nombre: 'Café', calorias: 1, proteinas: 0.1, grasas: 0, carbohidratos: 0 },
            { nombre: 'Té', calorias: 1, proteinas: 0, grasas: 0, carbohidratos: 0 },
            { nombre: 'Cerveza', calorias: 43, proteinas: 0.5, grasas: 0, carbohidratos: 3.6 },
            { nombre: 'Chocolate', calorias: 546, proteinas: 4.9, grasas: 31, carbohidratos: 61 },
            { nombre: 'Helado', calorias: 207, proteinas: 3.5, grasas: 11, carbohidratos: 24 },
            { nombre: 'Pastel', calorias: 257, proteinas: 3.6, grasas: 9.3, carbohidratos: 38 },
            { nombre: 'Galletas', calorias: 502, proteinas: 6, grasas: 24, carbohidratos: 64 },
            { nombre: 'Dulces', calorias: 394, proteinas: 0, grasas: 0, carbohidratos: 98 }
        ];
        await Alimento.insertMany(listaAlimentos);
        console.log("✅ ¡Todo cargado!");
    }
}

async function cargarDietasSiEstaVacio() {
    const conteo = await Dieta.countDocuments();
    if (conteo === 0) {
        console.log("Poblando dietas...");
        const listaDietas = [
            { objetivo: 'bajar_peso', desayuno: 'Avena con fresa', colacion1: 'Manzana', comida: 'Pollo plancha ensalada', colacion2: 'Pepino', cena: 'Atún verduras' },
            { objetivo: 'bajar_peso', desayuno: '2 huevos espinaca', colacion1: 'Papaya', comida: 'Salmón arroz integral', colacion2: 'Almendras', cena: 'Ensalada verde' },
            { objetivo: 'subir_peso', desayuno: 'Avena plátano miel', colacion1: 'Nueces', comida: 'Pollo arroz aguacate', colacion2: 'Yogurt', cena: 'Huevos pan' },
            { objetivo: 'ganar_musculo', desayuno: '6 claras avena', colacion1: 'Plátano', comida: 'Pollo arroz', colacion2: 'Almendras', cena: 'Salmón papa' },
            // ... AGREGA AQUÍ EL RESTO DE TUS DIETAS ...
            { objetivo: 'keto', desayuno: 'Huevos aguacate', colacion1: 'Queso', comida: 'Carne ensalada', colacion2: 'Nueces', cena: 'Pollo brócoli' }
        ];
        await Dieta.insertMany(listaDietas);
        console.log("✅ ¡Dietas cargadas!");
    }
}

// 5. ENCENDER SERVIDOR
app.listen(3000, '0.0.0.0', () => {
    console.log("Servidor escuchando en http://192.168.0.20:3000");
});