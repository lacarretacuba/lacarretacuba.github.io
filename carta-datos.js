/* La Carreta · datos de la carta
   Este es el ÚNICO archivo que hay que tocar para cambiar platos o precios.
   Cada plato: [nombre, medida, nombre en inglés o descripción, precio en CUP]
   Transcrito de la carta online (qrco.de/LaCarretaMenuHabitual). */

window.CARTA = {
  moneda: 'CUP',
  secciones: [
    { id: 'entrantes', grupo: 'cocina', es: 'Entrantes', en: 'Appetizers', items: [
      ['Cesta de panes de la casa', '145 g', 'House breads and butter', 1600],
      ['Cóctel collage de frutas tropicales', '125 g', 'Fruit cocktail', 1600],
      ['Ensalada de frutas tropicales', '200 g', 'Tropical fruit salad', 1600],
      ['Tabla mediterránea', '380 g', 'Jamón serrano, queso manchego, pan baguette · Cured ham, cheese board, bread', 12000],
      ['Ensalada de la huerta', '240 g', 'House vegetable salad', 1600],
      ['Vegetales salteados', '240 g', 'Sautéed vegetables', 1800],
      ['Ajiaco criollo', '240 g', 'Creole traditional soup', 1300],
      ['Vianda hervida', '240 g', 'Boiled root vegetables', 1400],
      ['Tamal en hojas', '240 g', 'Tamale', 1200]
    ]},
    { id: 'compartir', grupo: 'cocina', es: 'Para compartir', en: 'To share', items: [
      ['Grillada del Corral', '550 g', 'Bistec de cerdo, pollo grillé, lonjas de res · Pork, chicken, slices of beef', 15000],
      ['Paletilla de cordero al vino tinto y romero', '700 g', 'Lamb shoulder with rosemary and red wine', 15000],
      ['Cantío de Gallo', '650 g', 'Arroz con pollo · Chicken rice', 8000]
    ]},
    { id: 'pollo', grupo: 'cocina', es: 'Pollo', en: 'Chicken', items: [
      ['Asado al estilo Carreta', '280 g', 'Roast chicken Carreta style', 5000],
      ['Pechuga grillé', '215 g', 'Grilled chicken breast', 5200]
    ]},
    { id: 'res', grupo: 'cocina', es: 'Res', en: 'Beef', items: [
      ['Picadillo a la habanera', '120 g', 'Ground beef Havana style', 3000],
      ['Vaca frita a la tradición', '120 g', 'Cuban style fried beef', 5000],
      ['Ropa vieja carretera', '120 g', 'Cuban style shredded beef', 5000]
    ]},
    { id: 'cerdo', grupo: 'cocina', es: 'Cerdo', en: 'Pork', items: [
      ['Lonjas de cerdo al estribo', '150 g', 'Roast pork slices', 5000],
      ['Bistec del Yunta', '250 g', 'Pork steak', 5000],
      ['Masas fritas a lo campestre', '220 g', 'Fried pork chunks creole style', 7500]
    ]},
    { id: 'cordero', grupo: 'cocina', es: 'Cordero', en: 'Lamb', items: [
      ['Chilindrón a lo montuno', '170 g', 'Lamb stew', 8000]
    ]},
    { id: 'pescados', grupo: 'cocina', es: 'Pescados y mariscos', en: 'Fish & seafood', items: [
      ['Filete de pescado grillé', '215 g', 'Grilled fish fillet', 5500],
      ['Filete de pescado enchilado', '215 g', 'Fish fillet creole', 5600]
    ]},
    { id: 'guarniciones', grupo: 'cocina', es: 'Guarniciones', en: 'Sides', items: [
      ['Arroz blanco', '150 g', 'White rice', 600],
      ['Moros y cristianos', '150 g', 'Cuban style black beans and rice', 700],
      ['Arroz primavera', '200 g', 'Rice and vegetables', 800],
      ['Frijoles negros', '240 g', 'Black bean soup', 800]
    ]},
    { id: 'ninos', grupo: 'cocina', es: 'Para niños', en: "Children's menu", items: [
      ['Pechuga de pollo con arroz, vianda frita y jugo natural', '345 g · 200 ml', 'Chicken breast with rice, fried sweet potatoes and natural juice', 4000],
      ['Pizza napolitana y jugo natural', '250 g', 'Neapolitan pizza and natural juice', 4000],
      ['Espaguetis napolitanos y jugo natural', '240 g', 'Neapolitan spaghetti and natural juice', 4000]
    ]},
    { id: 'postres', grupo: 'cocina', es: 'Postres de la casa', en: 'Desserts', items: [
      ['Bocadito dulce de limón y crema', '120 g', 'Homemade sweet', 2200],
      ['Regalo de mulato', '130 g', 'Homemade sweet', 2400],
      ['Canoa de helado', '110 g', 'Ice cream bowl', 2200],
      ['Variedad de postres', '580 g', 'Special of the house', 6000],
      ['Flan tentador', '130 g', 'Homemade flan · De la tradición', 1800],
      ['Arroz con leche de la abuela', '150 g', 'Rice pudding · De la tradición', 1800],
      ['Cake a la moda', '130 g', 'Cake with ice cream · De la tradición', 2400]
    ]},

    { id: 'aguas', grupo: 'bebidas', es: 'Aguas y refrescos', en: 'Water & soft drinks', items: [
      ['Agua nacional', '500 ml', 'National water', 800],
      ['Agua tónica nacional', '330 ml', 'National tonic water', 900],
      ['Agua importada', '500 ml', 'Imported water', 1400],
      ['Refrescos nacionales', '355 ml', 'National soft drinks', 1100],
      ['Refrescos importados', '355 ml', 'Imported soft drinks', 1200],
      ['Malta', '355 ml', 'Malt', 1200],
      ['Malteada', '405 ml', 'Malt with condensed milk', 1500]
    ]},
    { id: 'sin-alcohol', grupo: 'bebidas', es: 'Sin alcohol', en: 'Non alcoholic', items: [
      ['Jugos naturales', '360 ml', 'Natural juices', 800],
      ['San Francisco', '750 ml', '', 800],
      ['Limonada frapé', '300 ml', 'Frozen lemonade', 850],
      ['Limonada frescura', '300 ml', 'Frozen lemonade with peppermint', 1000]
    ]},
    { id: 'cafe', grupo: 'bebidas', es: 'Café', en: 'Coffee', items: [
      ['Expreso', '30 ml', 'Espresso', 500],
      ['Cortado', '35 ml', 'Coffee, milk', 550],
      ['Americano', '150 ml', 'American', 550],
      ['Capuchino', '150 ml', 'Coffee, milk cream', 900],
      ['Café con leche', '150 ml', 'Coffee with milk', 900],
      ['Bombón', '40 ml', '', 1200],
      ['Frapuchino', '150 ml', 'Frappuccino', 1500],
      ['Té', '100 ml', 'Tea', 400]
    ]},
    { id: 'cervezas', grupo: 'bebidas', es: 'Cervezas', en: 'Beer', items: [
      ['Cervezas nacionales', '350 ml', 'National beer', 1500],
      ['Cervezas importadas', '355 ml', 'Imported beer', 1000],
      ['Vaso 8 oz', '', 'Beer glass', 600],
      ['Jarra', '500 ml', 'Beer jar', 1200]
    ]},
    { id: 'vinos', grupo: 'bebidas', es: 'Vinos por copa', en: 'Wine by the glass', items: [
      ['Blanco', '150 ml', 'White', 2000],
      ['Rosado', '150 ml', 'Rosé', 2000],
      ['Tinto', '150 ml', 'Red', 2000]
    ]},
    { id: 'cocteles', grupo: 'bebidas', es: 'Coctelería nacional', en: 'National cocktails', items: [
      ['Mojito tradicional', '360 ml', 'Creole mojito', 1600],
      ['Mojito tropical', '360 ml', 'Creole mojito with tropical fruits', 1700],
      ['Daiquirí natural', '240 ml', 'White rum and maraschino liqueur', 1600],
      ['Daiquirí frapé', '240 ml', 'Frozen white rum and maraschino liqueur', 1600],
      ['Cubanito', '300 ml', 'White rum, tomato juice, lemon juice and Worcestershire sauce', 1600],
      ['Cuba libre', '300 ml', 'White rum, coke', 1600]
    ]},
    { id: 'refrescantes', grupo: 'bebidas', es: 'Coctelería refrescante', en: 'Refreshing cocktails', items: [
      ['Canchánchara', '300 ml', '', 1600],
      ['Caipirísima', '300 ml', '', 1600],
      ['Caipiriña', '300 ml', 'Sugar, lemon, aguardiente', 1600],
      ['Caipiroska', '300 ml', 'Sugar, lemon, vodka', 1600],
      ['Screwdriver', '300 ml', 'Vodka and orange juice', 2000],
      ['Bloody Mary', '300 ml', 'Vodka, tomato juice, lemon juice and Worcestershire sauce', 2000],
      ['Piña colada', '480 ml', 'Pineapple juice, coconut milk, white rum', 2400]
    ]},
    { id: 'con-cerveza', grupo: 'bebidas', es: 'Coctelería con cerveza', en: 'With beer', items: [
      ['Chelada', '500 ml', '', 1600],
      ['Michelada', '500 ml', '', 1700],
      ['Mega mojito', '900 ml', 'Frozen mojito with beer', 2000]
    ]},
    { id: 'internacional', grupo: 'bebidas', es: 'Coctelería internacional', en: 'International', items: [
      ['Gin tonic con Imagin', '360 ml', '', 2200],
      ['Gin tonic con Beefeater', '360 ml', '', 2400],
      ['Gin tonic con Tanqueray', '360 ml', '', 2500],
      ['Vodka tonic con Belvedere', '360 ml', '', 2500],
      ['Vodka tonic con Absolut', '360 ml', '', 2400],
      ['Sangría', '750 ml', 'Red wine, sparkling water, sugar, brandy, lemon juice and fruits', 2500],
      ['Tinto de verano', '750 ml', 'Lemon soft drink and red wine', 2300]
    ]},
    { id: 'rones', grupo: 'bebidas', es: 'Rones', en: 'Rum', items: [
      ['Havana Club 3 Años', '50 ml', '', 750],
      ['Havana Club Especial', '45 ml', '', 800],
      ['Havana Club Reserva', '45 ml', '', 850],
      ['Havana Club Ritual', '45 ml', '', 850],
      ['Havana Club 7 Años', '45 ml', '', 1200],
      ['Havana Club Selección de Maestros', '45 ml', '', 2000],
      ['Havana Club Profundo', '45 ml', '', 900],
      ['Santiago Añejo', '45 ml', '', 1000],
      ['Santiago Añejo 8 Años', '45 ml', '', 1400],
      ['Santiago Añejo 11 Años', '45 ml', '', 2000],
      ['Santiago Añejo 12 Años', '45 ml', '', 2200],
      ['Santiago Extra Seco', '45 ml', '', 2500],
      ['Santero 11 Años', '45 ml', '', 1500]
    ]},
    { id: 'whiskies', grupo: 'bebidas', es: 'Whiskies y cognac', en: 'Whisky & cognac', items: [
      ["Ballantine's", '45 ml', '', 1600],
      ['Chivas Regal 12 Años', '45 ml', '', 2400],
      ['Jameson', '45 ml', '', 2000],
      ["Buchanan's", '45 ml', '', 4500],
      ['Johnnie Walker Red Label', '45 ml', '', 2000],
      ['Johnnie Walker Black Label', '45 ml', '', 3500],
      ['Hennessy', '45 ml', 'Cognac', 1800]
    ]},
    { id: 'destilados', grupo: 'bebidas', es: 'Ginebras, vodkas y tequilas', en: 'Gin, vodka & tequila', items: [
      ['Beefeater', '60 ml', 'Gin', 1500],
      ['Imagin', '60 ml', 'Gin', 1400],
      ['Reythor', '60 ml', 'Gin', 1500],
      ['Absolut', '60 ml', 'Vodka', 1600],
      ['Belvedere', '60 ml', 'Vodka', 2000],
      ['Olmeca Blanco', '45 ml', 'Tequila', 1600],
      ['Olmeca Reposado', '45 ml', 'Tequila', 1700]
    ]},
    { id: 'licores', grupo: 'bebidas', es: 'Licores, brandies y vermut', en: 'Liqueurs, brandy & vermouth', items: [
      ['Sambuca', '45 ml', '', 1500],
      ['Anís seco', '45 ml', '', 1500],
      ['Campari', '45 ml', '', 1500],
      ['Limoncello', '45 ml', '', 1800],
      ['Aperol', '45 ml', '', 2000],
      ['Grappa', '45 ml', '', 2000],
      ['Torres 5', '60 ml', 'Brandy', 1500],
      ['Napoleon', '60 ml', 'Brandy', 1600],
      ['Vermut Rosso', '45 ml', 'Vermouth', 1600],
      ['Vermut Bianco', '45 ml', 'Vermouth', 1600],
      ['Vermut Extra Dry', '45 ml', 'Vermouth', 1600],
      ['Aguardiente de la casa', '60 ml', '', 1600]
    ]},

    { id: 'caf-picaderas', grupo: 'cafeteria', es: 'Entradas y picaderas', en: 'Starters & snacks', items: [
      ['Ensalada fría', '150 g', 'Cold salad', 400],
      ['Picaderas de tamal', '200 g', 'Tamale bites', 700]
    ]},
    { id: 'caf-sopas', grupo: 'cafeteria', es: 'Sopas y platos fríos', en: 'Soups & cold dishes', items: [
      ['Ajiaco cubano', '6 oz', 'Cuban stew soup', 200],
      ['Arroz con leche', '180 g', 'Rice pudding', 400],
      ['Gelatina', '180 g', 'Jelly', 200],
      ['Jugos naturales', '6 oz', 'Natural juices', 200]
    ]},
    { id: 'caf-principales', grupo: 'cafeteria', es: 'Platos principales', en: 'Main dishes', items: [
      ['Completa de arroz frito', '200 g', 'Fried rice combo plate', 1000],
      ['Completa de picadillo', '150 g', 'Ground beef combo plate', 1200]
    ]},
    { id: 'caf-pizzas', grupo: 'cafeteria', es: 'Pizzas', en: 'Pizzas', items: [
      ['Pizza de queso blanco', '150 g', 'White cheese pizza', 400],
      ['Pizza de queso gouda', '150 g', 'Gouda cheese pizza', 650]
    ]},
    { id: 'caf-pan', grupo: 'cafeteria', es: 'Pan especialidad', en: 'Sandwiches', items: [
      ['Pan con lechón', '250 g', 'Roast pork sandwich', 1500],
      ['Pan con hamburguesa', '140 g', 'Burger', 550]
    ]},
    { id: 'caf-bebidas', grupo: 'cafeteria', es: 'Café y cervezas', en: 'Coffee & beer', items: [
      ['Café', '30 ml', 'Cuban coffee', 100],
      ['Jarra de cerveza', '500 ml', 'Beer jar', 800],
      ['Vaso de cerveza', '', 'Glass of beer', 400]
    ]},
    { id: 'caf-agregos', grupo: 'cafeteria', es: 'Agregos', en: 'Extras', items: [
      ['Ketchup', '5 g', '', 40],
      ['Mostaza', '5 g', 'Mustard', 40]
    ]}
  ]
};
