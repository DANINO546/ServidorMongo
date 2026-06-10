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

app.post('/registro', async (req, res) => {
    try {
        const { correo, password } = req.body;
        
        if (!correo || !correo.toLowerCase().endsWith('@gmail.com')) {
            return res.status(400).json({ 
                exito: false, 
                mensaje: "Registro denegado. Solo se permiten correos @gmail.com" 
            });
        }

        const usuarioExiste = await Usuario.findOne({ correo: correo });
        if (usuarioExiste) {
            return res.status(400).json({ exito: false, mensaje: "El correo ya está registrado" });
        }

        const nuevoUsuario = new Usuario({ correo, password });
        await nuevoUsuario.save();

        res.json({ exito: true, mensaje: "Cuenta creada con éxito", usuarioId: nuevoUsuario._id });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Error al registrar usuario" });
    }
});

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
// 5. SEMBRADOR AUTOMÁTICO DE DATOS (CATÁLOGO AMPLIADO)
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

        // Drop e inserción limpia para asegurar que se actualicen las 10 opciones por objetivo
        await Dieta.deleteMany({}); 
        console.log("⏳ Actualizando el catálogo completo de dietas (10 opciones por objetivo)...");
        
        const dietasSemilla = [
            // ==================== BAJAR PESO (10 opciones) ====================
            { "objetivo": "bajar_peso", "desayuno": "Avena con leche descremada, manzana y chía (400 kcal)", "colacion1": "Yogur natural + nueces (150 kcal)", "comida": "Pollo 120g + arroz integral + ensalada mixta con aceite de oliva (600 kcal)", "colacion2": "Zanahoria rallada + hummus (100 kcal)", "cena": "Tacos de atún en hojas de lechuga con jitomate y aguacate (450 kcal)" },
            { "objetivo": "bajar_peso", "desayuno": "Omelette de 2 claras y 1 huevo entero con espinaca + 1 tortilla (380 kcal)", "colacion1": "Pera picada (90 kcal)", "comida": "Filete de pescado a la plancha + puré de camote + ensalada verde (620 kcal)", "colacion2": "Yogur light batido (120 kcal)", "cena": "Sopa de verduras clara + 100g de pollo deshebrado + aguacate (440 kcal)" },
            { "objetivo": "bajar_peso", "desayuno": "Yogur griego sin azúcar + 3 cucharadas de avena + frutos rojos (400 kcal)", "colacion1": "1 Manzana mediana + 6 almendras (180 kcal)", "comida": "Brochetas de res magra con pimientos + 1/2 taza de quinoa + verduras al vapor (620 kcal)", "colacion2": "Pepino picado con limón y una pizca de sal (60 kcal)", "cena": "Ensalada de atún en agua con garbanzos, jitomate y apio (460 kcal)" },
            { "objetivo": "bajar_peso", "desayuno": "2 Rebanadas de pan tostado integral con requesón y rodajas de jitomate (350 kcal)", "colacion1": "1/2 taza de jícama con limón (50 kcal)", "comida": "Pechuga de pavo asada + 1/2 taza de lentejas + calabacitas salteadas (580 kcal)", "colacion2": "Gelatina de agua sin azúcar (20 kcal)", "cena": "Salpicón de pollo con cebolla, jitomate, lechuga y unas gotas de aceite de oliva (410 kcal)" },
            { "objetivo": "bajar_peso", "desayuno": "Licuado de fresas con leche de almendra, 1 cucharada de avena y linaza (320 kcal)", "colacion1": "10 mitades de nuez (130 kcal)", "comida": "Tiras de pollo asadas con nopalitos + 1 tortilla de maíz + guacamole (590 kcal)", "colacion2": "1 Toronja en gajos (80 kcal)", "cena": "Filete de pescado al vapor con guarnición de espárragos y champiñones (390 kcal)" },
            { "objetivo": "bajar_peso", "desayuno": "Huevos revueltos con ejotes hechos con un toque de aceite en aerosol + 1 rebanada de pan integral (370 kcal)", "colacion1": "Yogur natural descremado (110 kcal)", "comida": "Picadillo de res magra con bastantes verduras picadas + ensalada de lechuga (610 kcal)", "colacion2": "Bastones de apio con queso crema descremado (90 kcal)", "cena": "Crema de calabacita casera (sin crema) + 80g de pechuga de pavo asada (360 kcal)" },
            { "objetivo": "bajar_peso", "desayuno": "Sándwich de pan integral con queso panela, espinaca y rodajas de pepino (360 kcal)", "colacion1": "1 Kiwi mediano (60 kcal)", "comida": "Salmón a la plancha + brócoli al vapor + 1/3 de taza de arroz salvaje (630 kcal)", "colacion2": "Yogur griego light (100 kcal)", "cena": "Consomé de pollo desgrasado con verduras y 60g de pollo (340 kcal)" },
            { "objetivo": "bajar_peso", "desayuno": "Pudín de chía hecho con leche de almendras y esencia de vainilla + frutos secos (340 kcal)", "colacion1": "1/2 plátano maduro (60 kcal)", "comida": "Pollo a la naranja casero (sin azúcar) + coliflor al vapor + ensalada verde (570 kcal)", "colacion2": "1 Taza de sandía picada (80 kcal)", "cena": "Ceviche de pescado blanco con jitomate, cebolla, cilantro y aguacate (400 kcal)" },
            { "objetivo": "bajar_peso", "desayuno": "2 Quesadillas en tortilla de maíz con queso panela y champiñones al comal (390 kcal)", "colacion1": "10 almendras frescas (70 kcal)", "comida": "Carne de res salteada con brócoli y champiñones + ensalada de espinaca (600 kcal)", "colacion2": "1/2 taza de puré de manzana sin azúcar (70 kcal)", "cena": "Brochetas de pollo y calabacita a la plancha (380 kcal)" },
            { "objetivo": "bajar_peso", "desayuno": "Bowl de papaya picada con requesón y una cucharada de semillas de girasol (350 kcal)", "colacion1": "Gelatina light de sabor (20 kcal)", "comida": "Fajitas de pollo con cebolla y pimiento morrón + ensalada de lechuga y jitomate (590 kcal)", "colacion2": "1 taza de fresas enteras (50 kcal)", "cena": "Ensalada verde con tiras de pechuga de pavo, cubitos de queso panela y aderezo ligero (410 kcal)" },

            // ==================== SUBIR PESO (10 opciones) ====================
            { "objetivo": "subir_peso", "desayuno": "Avena con leche entera, 1 plátano, chía y 2 cucharadas de crema de cacahuate (800 kcal)", "colacion1": "Yogur griego con granola abundante y nueces (350 kcal)", "comida": "Pollo 150g + 1.5 tazas de arroz + frijoles refritos + aguacate entero + aceite de oliva (900 kcal)", "colacion2": "Sándwich integral doble de jamón de pavo y queso manchego (350 kcal)", "cena": "Pescado 150g + puré de camote con mantequilla + ensalada con aceite de oliva (650 kcal)" },
            { "objetivo": "subir_peso", "desayuno": "3 Huevos revueltos con jamón y queso + 2 piezas de pan tostado con mantequilla (780 kcal)", "colacion1": "Licuado de leche entera con plátano, avena y miel (400 kcal)", "comida": "Filete de res asado + 1 papa grande al horno con crema + verduras con mantequilla (920 kcal)", "colacion2": "Un puñado grande de almendras y pasas (300 kcal)", "cena": "Pechuga de pollo a la plancha + pasta al pesto con piñones + aguacate (700 kcal)" },
            { "objetivo": "subir_peso", "desayuno": "3 Hotcakes de avena y plátano con miel de abeja y nueces picadas (750 kcal)", "colacion1": "Yogur entero con fresas, coco rallado y semillas de cáñamo (360 kcal)", "comida": "Guisado de cerdo en salsa verde + 1.5 tazas de arroz blanco + 4 tortillas de maíz (950 kcal)", "colacion2": "Pan integral con crema de almendras y rodajas de fresa (340 kcal)", "cena": "Filete de salmón + quinoa cocida en caldo + espárragos salteados en aceite de oliva (680 kcal)" },
            { "objetivo": "subir_peso", "desayuno": "Sándwich de tres pisos con huevo, queso, jamón de pavo y mayonesa (810 kcal)", "colacion1": "2 Barras de granola con chocolate u frutos secos (320 kcal)", "comida": "Pechuga de pollo rellena de queso y espinaca + puré de papa + frijoles negros (890 kcal)", "colacion2": "1 Taza de arroz con leche casero (350 kcal)", "cena": "Tacos de carne asada (3 piezas) con queso fundido, cebolla y guacamole (720 kcal)" },
            { "objetivo": "subir_peso", "desayuno": "Licuado masivo: leche entera, proteína, avena, fresas, crema de cacahuate y miel (850 kcal)", "colacion1": "Queso panela en cubos con galletas saladas e higos secos (330 kcal)", "comida": "Pasta boloñesa con carne de res abundante + queso parmesano espolvoreado + pan de ajo (940 kcal)", "colacion2": "1 Plátano con una cucharada de cajeta o dulce de leche (280 kcal)", "cena": "Atún en aceite (2 latas) preparado con mayonesa, verduras y galletas horneadas (660 kcal)" },
            { "objetivo": "subir_peso", "desayuno": "Chilaquiles con crema, queso y 2 huevos estrellados encima + frijoles (830 kcal)", "colacion1": "Batido de yogur bebible entero con galletas de avena (310 kcal)", "comida": "Milanesa de pollo empanizada + arroz con elote + ensalada rusa con mayonesa (960 kcal)", "colacion2": "Mix de frutos secos (cacahuates, nueces, almendras) (340 kcal)", "cena": "Panini de roast beef con queso gouda derretido y aderezo chipotle (690 kcal)" },
            { "objetivo": "subir_peso", "desayuno": "3 Molletes con frijoles, queso manchego derretido y chorizo + pico de gallo (800 kcal)", "colacion1": "1 Taza de mango picado con yogur griego y miel (290 kcal)", "comida": "Carne de res con papas en caldo rojo + arroz rojo + aguacate completo (910 kcal)", "colacion2": "Sándwich de crema de cacahuate y mermelada (360 kcal)", "cena": "Pechuga de pavo asada + ensalada de pasta fría con cubos de queso y aderezo césar (680 kcal)" },
            { "objetivo": "subir_peso", "desayuno": "Tortilla española de patatas (3 huevos, papas y cebolla cocinadas en aceite de oliva) (790 kcal)", "colacion1": "Licuado de chocolate con leche entera y crema de avellanas (380 kcal)", "comida": "Estofado de res con zanahoria y papa + arroz blanco + tortillas de maíz (930 kcal)", "colacion2": "2 Hamburguesas pequeñas caseras de pollo con queso (400 kcal)", "cena": "Tostadas de tinga de pollo con crema y queso (650 kcal)" },
            { "objetivo": "subir_peso", "desayuno": "2 Bagels tostados con queso crema, salmón ahumado y rebanadas de aguacate (820 kcal)", "colacion1": "Yogur entero sazonado con semillas de girasol y arándanos (320 kcal)", "comida": "Alóndigas de res rellenas de huevo en salsa de jitomate + arroz blanco abundante (900 kcal)", "colacion2": "1 Barra de chocolate amargo con almendras (270 kcal)", "cena": "Enchiladas suizas (3 piezas) rellenas de pollo con queso gratinado (710 kcal)" },
            { "objetivo": "subir_peso", "desayuno": "Tamal verde o rojo tradicional + 1 taza de champurrado o atole (850 kcal)", "colacion1": "1 Manzana con crema de cacahuate abundante (300 kcal)", "comida": "Pescado rebozado + papas fritas caseras + ensalada de col con aderezo dulce (980 kcal)", "colacion2": "Pan dulce tradicional o muffin de avena (320 kcal)", "cena": "Burritos de carne deshebrada con frijoles y queso asadero (730 kcal)" },

            // ==================== GANAR MÚSCULO (10 opciones) ====================
            { "objetivo": "ganar_musculo", "desayuno": "Avena con leche, plátano, chía y 1 scoop de proteína en polvo (750 kcal)", "colacion1": "Yogur griego alto en proteína con nueces y miel (350 kcal)", "comida": "Pollo 180g + 1 taza de arroz integral + brócoli al vapor + aceite de oliva (850 kcal)", "colacion2": "Sándwich de pechuga de pavo con pan integral y queso bajo en grasa (350 kcal)", "cena": "Pescado blanco 160g + camote horneado + ensalada con aguacate (600 kcal)" },
            { "objetivo": "ganar_musculo", "desayuno": "4 Claras de huevo y 1 huevo entero revueltos con pavo + 2 rebanadas de pan integral (680 kcal)", "colacion1": "Licuado de proteína con agua, fresas y 1/2 taza de avena (320 kcal)", "comida": "Filete de res magro 180g + pasta integral hervida + champiñones al ajillo (890 kcal)", "colacion2": "Lata de atún en agua con galletas horneadas e hilos de aguacate (290 kcal)", "cena": "Pechuga de pollo a la plancha + ensalada de quinoa con pimientos y espinaca (650 kcal)" },
            { "objetivo": "ganar_musculo", "desayuno": "Bowl de queso cottage bajo en grasa con piña, manzana y semillas de cáñamo (hump) (550 kcal)", "colacion1": "3 Huevos cocidos enteros (240 kcal)", "comida": "Salmón fresco a la plancha + puré de camote + espárragos salteados (820 kcal)", "colacion2": "Batido de proteína con crema de cacahuate desgrasada (310 kcal)", "cena": "Tiras de pechuga de pavo salteadas con verduras estilo oriental + arroz al vapor (670 kcal)" },
            { "objetivo": "ganar_musculo", "desayuno": "Sándwich en pan integral con 150g de pechuga de pollo deshebrada, espinaca y jitomate (610 kcal)", "colacion1": "Yogur griego natural sin azúcar + 15 almendras (280 kcal)", "comida": "Atún fresco sellado + papa cocida machacada con aceite de oliva + ejotes (830 kcal)", "colacion2": "1 Taza de edamames al vapor con sal de mar (180 kcal)", "cena": "Filete de res magro a la plancha + calabacitas al horno + ensalada de lechuga (640 kcal)" },
            { "objetivo": "ganar_musculo", "desayuno": "Waffles de proteína caseros (claras, avena, proteína en polvo) con frutos rojos (580 kcal)", "colacion1": "Licuado de leche descremada con plátano y cacao en polvo (300 kcal)", "comida": "Pechuga de pollo asada + ensalada de lentejas cocidas con jitomate y cebolla (810 kcal)", "colacion2": "Queso panela asado con rodajas de jitomate y orégano (240 kcal)", "cena": "Filete de pescado blanco + arroz integral + verduras mixtas salteadas (600 kcal)" },
            { "objetivo": "ganar_musculo", "desayuno": "Omelette de claras relleno de champiñones y queso ricotta + 1 manzana (520 kcal)", "colacion1": "Barra de proteína comercial (mínimo 20g de proteína) (250 kcal)", "comida": "Bistec de res magro + frijoles de la olla + ensalada de nopales con aguacate (840 kcal)", "colacion2": "Lata de salmón en agua con palitos de apio (220 kcal)", "cena": "Pechuga de pollo deshebrada + sopa de pasta integral con verduras (630 kcal)" },
            { "objetivo": "ganar_musculo", "desayuno": "2 Rebanadas de pan tostado con aguacate machacado y 2 huevos poché encima (590 kcal)", "colacion1": "Yogur griego con arándanos deshidratados (260 kcal)", "comida": "Pavo molido cocinado con jitomate + pasta integral + ejotes al vapor (820 kcal)", "colacion2": "Mix de nueces y semillas de calabaza (280 kcal)", "cena": "Filete de pescado blanco + puré de papa ligero hecho con leche descremada (590 kcal)" },
            { "objetivo": "ganar_musculo", "desayuno": "Licuado ultra proteico: leche descremada, proteína en polvo, avena, chía y almendras (710 kcal)", "colacion1": "2 Rebanadas de jamón de pechuga de pavo enrolladas con queso panela (190 kcal)", "comida": "Filete de res magro + arroz blanco + ensalada verde con aderezo de oliva (860 kcal)", "colacion2": "1 Taza de yogur griego natural (150 kcal)", "cena": "Ensalada grande de espinacas, tiras de pollo asado, nueces y aderezo ligero (610 kcal)" },
            { "objetivo": "ganar_musculo", "desayuno": "Licuado de avena con claras de huevo pasteurizadas, plátano y canela (620 kcal)", "colacion1": "100g de pechuga de pavo asada fría en rollitos (120 kcal)", "comida": "Pechuga de pollo + quinoa cocida + verduras mixtas al horno (800 kcal)", "colacion2": "Un puñado de cacahuates naturales tostados (200 kcal)", "cena": "Tacos de pescado a la plancha (3 piezas) en tortilla de maíz con col y aguacate (640 kcal)" },
            { "objetivo": "ganar_musculo", "desayuno": "Arroz inflado natural con leche descremada, proteína en polvo y fresas rebanadas (560 kcal)", "colacion1": "2 Huevos cocidos (160 kcal)", "comida": "Carne de res magra salteada con pimientos + arroz integral + aguacate (850 kcal)", "colacion2": "Queso cottage con rodajas de pepino (180 kcal)", "cena": "Pechuga de pollo asada + puré de camote + brócoli al vapor (620 kcal)" },

            // ==================== BAJAR AZÚCAR (10 opciones - Sin azúcar, IG bajo) ====================
            { "objetivo": "bajar_azucar", "desayuno": "Avena con chía, canela y manzana verde (400 kcal, IG bajo)", "colacion1": "Yogur natural sin azúcar + nueces (200 kcal)", "comida": "Pollo 150g + quinoa + ensalada verde con aceite de oliva (600 kcal)", "colacion2": "Pepino y jícama picados con limón (80 kcal)", "cena": "Salmón 140g + brócoli al vapor + camote pequeño (420 kcal)" },
            { "objetivo": "bajar_azucar", "desayuno": "Huevos revueltos con ejotes frescos y cebolla picada (320 kcal)", "colacion1": "10 Almendras naturales frescas (80 kcal)", "comida": "Filete de pescado a la plancha + ensalada de nopales + aguacate (540 kcal)", "colacion2": "Apio con queso crema ligero (90 kcal)", "cena": "Pechuga de pollo asada + calabacitas salteadas al ajillo (380 kcal)" },
            { "objetivo": "bajar_azucar", "desayuno": "Omelette de espinacas y champiñones preparado con aceite de oliva (340 kcal)", "colacion1": "1/2 taza de frambuesas frescas (40 kcal)", "comida": "Bistec de res asado + ensalada verde grande con pepino + aguacate (580 kcal)", "colacion2": "Yogur griego sin azúcar (100 kcal)", "cena": "Atún en agua con jitomate, cebolla, cilantro y unas gotas de limón (310 kcal)" },
            { "objetivo": "bajar_azucar", "desayuno": "Tofu revuelto con cúrcuma, jitomate y espinaca (290 kcal)", "colacion1": "Nueces de la India naturales (110 kcal)", "comida": "Pechuga de pollo rellena de pimientos + chayotes al vapor (510 kcal)", "colacion2": "Gelatina sin azúcar (10 kcal)", "cena": "Filete de pescado blanco al horno con guarnición de espárragos (340 kcal)" },
            { "objetivo": "bajar_azucar", "desayuno": "Rollitos de jamón de pavo rellenos de queso panela y aguacate (310 kcal)", "colacion1": "1/2 Manzana verde mediana (50 kcal)", "comida": "Salpicón de res magra con lechuga, jitomate, rábano y aguacate (550 kcal)", "colacion2": "Semillas de calabaza tostadas sin sal (120 kcal)", "cena": "Sopa de verduras sin pasta + pollo deshebrado (320 kcal)" },
            { "objetivo": "bajar_azucar", "desayuno": "Queso cottage sin azúcar con semillas de chía y unas pocas fresas picadas (330 kcal)", "colacion1": "Bastones de pepino con limón (40 kcal)", "comida": "Pescado al papillote (al horno en papel aluminio) con verduras mixtas (490 kcal)", "colacion2": "Yogur natural sin azúcar (90 kcal)", "cena": "Ensalada verde con tiras de pollo asado y lascas de queso parmesano (390 kcal)" },
            { "objetivo": "bajar_azucar", "desayuno": "2 Huevos poché sobre una cama de espinacas al vapor con hilos de aceite de oliva (320 kcal)", "colacion1": "Pistaches naturales sin sal (100 kcal)", "comida": "Filete de res magro + brócoli y coliflor al vapor + guacamole casero (570 kcal)", "colacion2": "1/2 taza de jícama picada (40 kcal)", "cena": "Brochetas de pollo con cebolla y pimiento morrón al comal (360 kcal)" },
            { "objetivo": "bajar_azucar", "desayuno": "Licuado verde: espinaca, pepino, apio, agua, linaza y 1/2 manzana verde (210 kcal)", "colacion1": "1 Huevo cocido entero (80 kcal)", "comida": "Pechuga de pollo a las hierbas + ensalada de aguacate y jitomate (530 kcal)", "colacion2": "Champiñones salteados al ajillo (70 kcal)", "cena": "Filete de pescado a la plancha con ensalada de col picada (330 kcal)" },
            { "objetivo": "bajar_azucar", "desayuno": "Huevos revueltos con nopales picados y cebolla (310 kcal)", "colacion1": "Nueces de pecana (120 kcal)", "comida": "Tiras de carne de res salteadas con pimientos y cebolla + ensalada verde (590 kcal)", "colacion2": "Gelatina light de agua (10 kcal)", "cena": "Sopa de pollo clara con calabacita y hebras de pollo (310 kcal)" },
            { "objetivo": "bajar_azucar", "desayuno": "Pan integral tostado (1 rebanada) con aguacate machacado y queso panela (320 kcal)", "colacion1": "1 Kiwi pequeño (50 kcal)", "comida": "Salmón a la plancha con guarnición de ejotes salteados (560 kcal)", "colacion2": "Yogur griego sin azúcar (100 kcal)", "cena": "Ensalada de lechuga con atún en agua, apio y aceite de oliva (350 kcal)" },

            // ==================== SALUDABLE (10 opciones) ====================
            { "objetivo": "saludable", "desayuno": "Avena con leche entera, plátano, chía y canela (500 kcal)", "colacion1": "Yogur natural con fruta fresca picada (200 kcal)", "comida": "Pollo 150g + arroz integral + ensalada fresca con aceite de oliva (700 kcal)", "colacion2": "Manzana mediana + almendras (200 kcal)", "cena": "Pescado 150g + verduras salteadas + camote horneado (500 kcal)" },
            { "objetivo": "saludable", "desayuno": "2 Huevos revueltos con jitomate y cebolla + 2 tortillas de maíz (420 kcal)", "colacion1": "1 Taza de melón picado (80 kcal)", "comida": "Bistec de res a la plancha + frijoles de la olla + ensalada de nopales (680 kcal)", "colacion2": "Yogur griego con miel (180 kcal)", "cena": "Sándwich de pechuga de pavo con queso panela, lechuga y aguacate (460 kcal)" },
            { "objetivo": "saludable", "desayuno": "Licuado de plátano con avena, leche de almendras y un toque de miel (410 kcal)", "colacion1": "Un puñado de cacahuates tostados sin sal (150 kcal)", "comida": "Filete de salmón + 1 taza de quinoa cocida + espárragos al vapor (720 kcal)", "colacion2": "1 Taza de fresas enteras (60 kcal)", "cena": "Tacos de pollo asado (2 piezas) con salsa casera y aguacate (440 kcal)" },
            { "objetivo": "saludable", "desayuno": "Sándwich integral de huevo revuelto con espinacas y una rebanada de queso panela (390 kcal)", "colacion1": "1 Pera picada (90 kcal)", "comida": "Pechuga de pollo rellena de verduras + arroz blanco con elote (690 kcal)", "colacion2": "Gelatina de leche light (120 kcal)", "cena": "Ensalada de atún en agua con jitomate, elote, cebolla y galletas horneadas (420 kcal)" },
            { "objetivo": "saludable", "desayuno": "Bowl de frutas mixtas (papaya, melón, plátano) con yogur natural y granola (440 kcal)", "colacion1": "1 Huevo cocido (80 kcal)", "comida": "Picadillo de res con verduras + 1 taza de arroz integral + 1 tortilla (710 kcal)", "colacion2": "Bastones de zanahoria y pepino con limón (70 kcal)", "cena": "Filete de pescado blanco a la plancha con puré de papa ligero (450 kcal)" },
            { "objetivo": "saludable", "desayuno": "2 Enmoladas o enfrijoladas rellenas de pollo deshebrado con queso fresco (460 kcal)", "colacion1": "1 Manzana verde (60 kcal)", "comida": "Tiras de res salteadas con verduras + quinoa + aguacate (700 kcal)", "colacion2": "Yogur griego natural (120 kcal)", "cena": "Crema de verduras casera + pechuga de pavo asada (390 kcal)" },
            { "objetivo": "saludable", "desayuno": "Omelette de champiñones y queso panela + 1 rebanada de pan tostado integral (410 kcal)", "colacion1": "Nueces picadas (130 kcal)", "comida": "Pescado al horno con rodajas de jitomate y cebolla + puré de camote (660 kcal)", "colacion2": "1 Taza de sandía picada (80 kcal)", "cena": "Tostadas de pollo asado (2 piezas) con lechuga, jitomate y aguacate (430 kcal)" },
            { "objetivo": "saludable", "desayuno": "Pudín de chía con leche de soya, vainilla, fresas y láminas de almendra (380 kcal)", "colacion1": "Queso panela en cubos (110 kcal)", "comida": "Pechuga de pollo asada + pasta integral con salsa de jitomate natural (690 kcal)", "colacion2": "1 Naranja en gajos (70 kcal)", "cena": "Ensalada verde con atún, garbanzos cocidos y aceite de oliva (440 kcal)" },
            { "objetivo": "saludable", "desayuno": "Huevos revueltos con jamón de pavo + 1 rebanada de pan integral con aguacate (420 kcal)", "colacion1": "1 Taza de piña picada (80 kcal)", "comida": "Carne de res con calabacitas en salsa roja + arroz blanco + 1 tortilla (680 kcal)", "colacion2": "Yogur light para beber (110 kcal)", "cena": "Sopa de verduras clara + brochetas de pollo asadas (410 kcal)" },
            { "objetivo": "saludable", "desayuno": "Pan tostado integral con requesón, rodajas de plátano y un hilo de miel (400 kcal)", "colacion1": "10 Almendras naturales (70 kcal)", "comida": "Filete de pescado a la plancha + lentejas de la olla + ensalada fresca (670 kcal)", "colacion2": "Jícama picada con limón (50 kcal)", "cena": "Fajitas de pollo con cebolla y pimiento morrón al comal (430 kcal)" },

            // ==================== VEGANO (10 opciones - 100% LIBRE de origen animal) ====================
            { "objetivo": "vegano", "desayuno": "Avena cocida con leche de soya, plátano maduro y crema de cacahuate (550 kcal)", "colacion1": "Yogur vegetal fortificado con coco y granola (250 kcal)", "comida": "Lentejas guisadas con jitomate y cebolla + arroz integral + ensalada mixta (750 kcal)", "colacion2": "Manzana rebanada + almendras frescas (200 kcal)", "cena": "Tofu firme salteado con brócoli, pimientos y quinoa (450 kcal)" },
            { "objetivo": "vegano", "desayuno": "Tofu revuelto estilo 'huevo' con cúrcuma, jitomate, cebolla y 2 tortillas de maíz (410 kcal)", "colacion1": "1 Taza de papaya picada con semillas de girasol (140 kcal)", "comida": "Garbanzos al curry con leche de coco + arroz jazmín + verduras al vapor (730 kcal)", "colacion2": "Bastones de zanahoria con hummus casero (160 kcal)", "cena": "Ensalada de frijoles negros con elote, jitomate, cilantro y aguacate (440 kcal)" },
            { "objetivo": "vegano", "desayuno": "Sándwich de pan integral con hummus abundante, rodajas de aguacate, espinaca y pepino (460 kcal)", "colacion1": "Mix de nueces y arándanos secos (180 kcal)", "comida": "Soya texturizada guisada a la mexicana + arroz blanco + frijoles de la olla (710 kcal)", "colacion2": "Yogur de almendra natural (110 kcal)", "cena": "Crema de calabacita casera hecha con leche de almendras + tacos de nopal (380 kcal)" },
            { "objetivo": "vegano", "desayuno": "Licuado espeso de plátano, fresas, leche de soya, avena y linaza molida (430 kcal)", "colacion1": "1/2 taza de edamames preparados con limón (120 kcal)", "comida": "Hamburguesa de lentejas en pan integral con lechuga, jitomate y guacamole (690 kcal)", "colacion2": "1 Taza de melón picado (80 kcal)", "cena": "Ceviche de champiñones con jitomate, cebolla, cilantro, limón y aguacate (360 kcal)" },
            { "objetivo": "vegano", "desayuno": "Pudín de chía con leche de coco, esencia de vainilla y frutos rojos (390 kcal)", "colacion1": "Pepino y jícama con limón y chile en polvo (70 kcal)", "comida": "Ensalada de pasta integral con cubos de tofu asado, aceitunas y pimientos (720 kcal)", "colacion2": "Semillas de calabaza tostadas (130 kcal)", "cena": "Sopa de lentejas clara con verduras picadas + tostadas horneadas (410 kcal)" },
            { "objetivo": "vegano", "desayuno": "2 Enfrijoladas de maíz rellenas de champiñones y nopales salteados (400 kcal)", "colacion1": "1 Pera picada (90 kcal)", "comida": "Chili vegano de frijoles y soya texturizada + arroz integral (740 kcal)", "colacion2": "Nueces de la India naturales (140 kcal)", "cena": "Calabacitas rellenas de elote y jitomate gratinadas con queso vegano (390 kcal)" },
            { "objetivo": "vegano", "desayuno": "Pan integral tostado con aguacate machacado, semillas de cáñamo y jitomate cherry (420 kcal)", "colacion1": "Yogur de soya sabor vainilla (130 kcal)", "comida": "Milanesas de seitán a la plancha + puré de papa con aceite de oliva + verduras (760 kcal)", "colacion2": "1 Taza de fresas enteras (50 kcal)", "cena": "Brochetas de champiñones, tofu y pimiento morrón al comal (370 kcal)" },
            { "objetivo": "vegano", "desayuno": "Avena nocturna (Overnight oats) con leche de almendras, chía, cacao y nueces (460 kcal)", "colacion1": "1/2 plátano con una cucharadita de crema de almendras (130 kcal)", "comida": "Tacos de canasta veganos (3 piezas de frijol y papa) + salsa verde casera (680 kcal)", "colacion2": "Gelatina vegetal a base de agar-agar (20 kcal)", "cena": "Ensalada verde con quinoa, nuez picada, arándanos y aderezo balsámico (430 kcal)" },
            { "objetivo": "vegano", "desayuno": "Bowl de quinoa dulce cocida con leche de soya, canela y manzana picada (410 kcal)", "colacion1": "Cacahuates naturales tostados (120 kcal)", "comida": "Falafels de garbanzo horneados + ensalada mediterránea + arroz integral (730 kcal)", "colacion2": "1 Taza de sandía picada (80 kcal)", "cena": "Sopa de verduras mixta con cubitos de tofu firme (350 kcal)" },
            { "objetivo": "vegano", "desayuno": "Hotcakes veganos hechos con harina de avena, plátano y leche de almendras (430 kcal)", "colacion1": "Semillas de girasol (100 kcal)", "comida": "Tinga de zanahoria y Jamaica + 1 taza de arroz blanco + frijoles negros (690 kcal)", "colacion2": "1 Kiwi fresco (60 kcal)", "cena": "Tacos de soya texturizada al pastor con cebolla, cilantro y piña (450 kcal)" }
        ];

        await Dieta.insertMany(dietasSemilla);
        console.log("✅ Catálogo completo de dietas sembrado con éxito.");
    } catch (error) {
        console.error("❌ Error al sembrar datos:", error);
    }
}

// ==========================================
// 6. INICIO DEL SERVIDOR
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});