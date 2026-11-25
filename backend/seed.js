/**
 * Script de peuplement de la base "foodexpress".
 * Utilisation : npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Category = require('./models/Category');
const Dish = require('./models/Dish');
const Order = require('./models/Order');

const RESTAURANTS = [
  {
    owner: 'resto1',
    nom: 'Pizza House',
    description: 'Restaurant spécialisé en pizzas artisanales cuites au feu de bois.',
    adresse: '12 Avenue Habib Bourguiba, Tunis',
    typeCuisine: 'Pizza',
    image: '/images/pizza.jpg',
    fraisLivraison: 5,
    horaires: '10:00 - 23:00',
    isOpen: true,
    statut: 'valide',
    categories: ['Entrées', 'Pizzas', 'Pâtes', 'Desserts', 'Boissons'],
    plats: [
      ['Bruschetta', 'Pain grillé, tomates fraîches, ail et basilic.', 7, 'Entrées', '/images/salad.jpg'],
      ['Pizza Margherita', 'Tomate, mozzarella et basilic frais.', 15, 'Pizzas', '/images/pizza.jpg'],
      ['Pizza Regina', 'Sauce tomate, mozzarella, jambon de dinde et champignons.', 19, 'Pizzas', '/images/pizza.jpg'],
      ['Pizza Quatre Fromages', 'Mozzarella, gorgonzola, emmental et parmesan.', 22, 'Pizzas', '/images/pizza.jpg'],
      ['Pizza Végétarienne', 'Poivrons, olives, oignons, champignons et mozzarella.', 18, 'Pizzas', '/images/pizza.jpg'],
      ['Spaghetti Bolognaise', 'Pâtes fraîches, sauce tomate et viande hachée.', 17, 'Pâtes', '/images/pasta.jpg'],
      ['Penne Arrabbiata', 'Pâtes, sauce tomate épicée, ail et piment.', 14, 'Pâtes', '/images/pasta.jpg'],
      ['Tiramisu', 'Dessert italien au café et mascarpone.', 8, 'Desserts', '/images/dessert.jpg'],
      ['Coca-Cola 33cl', 'Boisson fraîche.', 3, 'Boissons', '/images/drinks.jpg'],
      ['Limonade maison', 'Citron frais, menthe et sucre.', 4, 'Boissons', '/images/drinks.jpg'],
    ],
  },
  {
    owner: 'resto1',
    nom: 'Dar El Couscous',
    description: 'Cuisine tunisienne authentique, couscous et plats du terroir.',
    adresse: '45 Rue des Artisans, La Marsa',
    typeCuisine: 'Tunisien',
    image: '/images/tunisien.jpg',
    fraisLivraison: 3,
    horaires: '11:00 - 22:30',
    isOpen: true,
    statut: 'valide',
    categories: ['Entrées', 'Plats principaux', 'Desserts', 'Boissons'],
    plats: [
      ['Brik à l’œuf', 'Feuille de malsouka, œuf, thon et persil.', 4, 'Entrées', '/images/tunisien.jpg'],
      ['Chorba frik', 'Soupe traditionnelle au blé concassé et agneau.', 6, 'Entrées', '/images/tunisien.jpg'],
      ['Couscous agneau', 'Semoule, agneau, carottes, courgettes et pois chiches.', 21, 'Plats principaux', '/images/tunisien.jpg'],
      ['Couscous poulet', 'Semoule, poulet fermier et légumes de saison.', 18, 'Plats principaux', '/images/tunisien.jpg'],
      ['Loubia au tajine', 'Haricots blancs mijotés et tajine tunisien.', 16, 'Plats principaux', '/images/tunisien.jpg'],
      ['Assiette méchouia', 'Poivrons grillés, tomates, thon et olives.', 8, 'Entrées', '/images/salad.jpg'],
      ['Makroudh', 'Pâtisserie traditionnelle à la datte et semoule.', 6, 'Desserts', '/images/dessert.jpg'],
      ['Thé à la menthe', 'Thé vert aux pignons.', 3, 'Boissons', '/images/drinks.jpg'],
    ],
  },
  {
    owner: 'resto1',
    nom: 'Burger Lab',
    description: 'Burgers gourmands, frites maison et sauces signature.',
    adresse: '8 Rue de Marseille, Tunis',
    typeCuisine: 'Fast-food',
    image: '/images/burger.jpg',
    fraisLivraison: 4,
    horaires: '11:00 - 00:00',
    isOpen: true,
    statut: 'valide',
    categories: ['Sandwichs', 'Entrées', 'Desserts', 'Boissons'],
    plats: [
      ['Cheeseburger Classic', 'Steak haché, cheddar, salade, tomate et sauce maison.', 16, 'Sandwichs', '/images/burger.jpg'],
      ['Double Cheese Bacon', 'Double steak, cheddar fondu, bacon de dinde.', 23, 'Sandwichs', '/images/burger.jpg'],
      ['Chicken Crispy', 'Poulet croustillant, coleslaw et sauce blanche.', 17, 'Sandwichs', '/images/burger.jpg'],
      ['Burger Végétarien', 'Galette de légumes, cheddar et avocat.', 15, 'Sandwichs', '/images/burger.jpg'],
      ['Frites maison', 'Pommes de terre fraîches, sel de mer.', 6, 'Entrées', '/images/burger.jpg'],
      ['Onion Rings', 'Rondelles d’oignon panées.', 7, 'Entrées', '/images/burger.jpg'],
      ['Brownie', 'Brownie au chocolat noir et noix.', 8, 'Desserts', '/images/dessert.jpg'],
      ['Milkshake vanille', 'Glace vanille, lait et chantilly.', 9, 'Boissons', '/images/drinks.jpg'],
    ],
  },
  {
    owner: 'resto2',
    nom: 'Pasta & Co',
    description: 'Pâtes fraîches et recettes italiennes généreuses.',
    adresse: '3 Rue de Rome, Tunis',
    typeCuisine: 'Italien',
    image: '/images/pasta.jpg',
    fraisLivraison: 5,
    horaires: '12:00 - 23:00',
    isOpen: true,
    statut: 'valide',
    categories: ['Entrées', 'Pâtes', 'Desserts', 'Boissons'],
    plats: [
      ['Salade Caprese', 'Mozzarella, tomates cerises et basilic.', 10, 'Entrées', '/images/salad.jpg'],
      ['Tagliatelles Alfredo', 'Crème, parmesan et poulet grillé.', 20, 'Pâtes', '/images/pasta.jpg'],
      ['Risotto aux champignons', 'Riz arborio, champignons et parmesan.', 24, 'Pâtes', '/images/pasta.jpg'],
      ['Lasagnes maison', 'Bœuf, béchamel et parmesan gratiné.', 21, 'Pâtes', '/images/pasta.jpg'],
      ['Panna Cotta', 'Crème vanillée et coulis de fruits rouges.', 9, 'Desserts', '/images/dessert.jpg'],
      ['Eau minérale 50cl', 'Bouteille d’eau fraîche.', 2, 'Boissons', '/images/drinks.jpg'],
    ],
  },
  {
    owner: 'resto2',
    nom: 'Green Bowl',
    description: 'Bowls équilibrés, salades fraîches et jus détox.',
    adresse: '22 Rue du Lac, Les Berges du Lac',
    typeCuisine: 'Sain',
    image: '/images/salad.jpg',
    fraisLivraison: 4,
    horaires: '09:00 - 20:00',
    isOpen: true,
    statut: 'valide',
    categories: ['Entrées', 'Plats principaux', 'Boissons'],
    plats: [
      ['Bowl Poulet Quinoa', 'Quinoa, poulet grillé, avocat et légumes croquants.', 19, 'Plats principaux', '/images/salad.jpg'],
      ['Bowl Saumon', 'Riz complet, saumon fumé, concombre et sésame.', 24, 'Plats principaux', '/images/salad.jpg'],
      ['Salade César', 'Laitue, poulet, parmesan et sauce césar.', 16, 'Entrées', '/images/salad.jpg'],
      ['Soupe de légumes', 'Légumes de saison mixés.', 7, 'Entrées', '/images/salad.jpg'],
      ['Jus détox', 'Pomme, concombre, épinards et gingembre.', 8, 'Boissons', '/images/drinks.jpg'],
      ['Smoothie mangue', 'Mangue, banane et lait d’amande.', 9, 'Boissons', '/images/drinks.jpg'],
    ],
  },
  {
    owner: 'resto2',
    nom: 'Sweet Corner',
    description: 'Pâtisseries, crêpes et douceurs pour tous les gourmands.',
    adresse: '17 Avenue de France, Tunis',
    typeCuisine: 'Desserts',
    image: '/images/dessert.jpg',
    fraisLivraison: 3,
    horaires: '09:00 - 21:00',
    isOpen: false,
    statut: 'valide',
    categories: ['Desserts', 'Boissons'],
    plats: [
      ['Crêpe Nutella', 'Crêpe garnie de pâte à tartiner et banane.', 9, 'Desserts', '/images/dessert.jpg'],
      ['Cheesecake fruits rouges', 'Cheesecake crémeux et coulis de fruits rouges.', 11, 'Desserts', '/images/dessert.jpg'],
      ['Fondant au chocolat', 'Cœur coulant au chocolat noir.', 10, 'Desserts', '/images/dessert.jpg'],
      ['Café expresso', 'Café serré.', 2.5, 'Boissons', '/images/drinks.jpg'],
      ['Chocolat chaud', 'Chocolat fondu et crème.', 5, 'Boissons', '/images/drinks.jpg'],
    ],
  },
  {
    owner: 'resto2',
    nom: 'Table du Gourmet',
    description: 'Restaurant gastronomique en cours de validation par l’administrateur.',
    adresse: '1 Rue de la Médina, Sousse',
    typeCuisine: 'Tunisien',
    image: '/images/tunisien.jpg',
    fraisLivraison: 6,
    horaires: '18:00 - 23:30',
    isOpen: true,
    statut: 'en_attente',
    categories: ['Plats principaux', 'Desserts'],
    plats: [
      ['Filet de bœuf aux épices', 'Filet de bœuf, purée de courge et jus corsé.', 34, 'Plats principaux', '/images/tunisien.jpg'],
      ['Assiette de pâtisseries', 'Sélection de pâtisseries maison.', 12, 'Desserts', '/images/dessert.jpg'],
    ],
  },
];

const CUISINES = [
  ['Pizza', 'Pizzas artisanales cuites au feu de bois.'],
  ['Tunisien', 'Spécialités tunisiennes traditionnelles.'],
  ['Fast-food', 'Burgers, sandwichs et frites maison.'],
  ['Italien', 'Pâtes fraîches et cuisine italienne.'],
  ['Sain', 'Bolws équilibrés et salades fraîches.'],
  ['Desserts', 'Pâtisseries, crêpes et douceurs.'],
];

const run = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    Category.deleteMany({}),
    Dish.deleteMany({}),
    Order.deleteMany({}),
  ]);

  const admin = await User.create({
    nom: 'Ben Salah',
    prenom: 'Ines',
    email: 'admin@foodexpress.tn',
    telephone: '22100000',
    password: 'Admin1234',
    role: 'admin',
  });

  const resto1 = await User.create({
    nom: 'Trabelsi',
    prenom: 'Mehdi',
    email: 'resto@foodexpress.tn',
    telephone: '22334455',
    password: 'Resto1234',
    role: 'restaurateur',
  });

  const resto2 = await User.create({
    nom: 'Gharbi',
    prenom: 'Sarra',
    email: 'resto2@foodexpress.tn',
    telephone: '22445566',
    password: 'Resto1234',
    role: 'restaurateur',
  });

  const client = await User.create({
    nom: 'Ali',
    prenom: 'Ahmed',
    email: 'client@foodexpress.tn',
    telephone: '22123456',
    password: 'Client1234',
    role: 'client',
  });

  await User.create({
    nom: 'Khelifi',
    prenom: 'Nour',
    email: 'nour@foodexpress.tn',
    telephone: '22556677',
    password: 'Client1234',
    role: 'client',
  });

  // Catégories générales de cuisine
  await Category.insertMany(
    CUISINES.map(([nom, description]) => ({ nom, description, type: 'cuisine', restaurant: null }))
  );

  const owners = { resto1, resto2 };
  const restaurantsByKey = {};

  for (const data of RESTAURANTS) {
    const restaurant = await Restaurant.create({
      nom: data.nom,
      description: data.description,
      adresse: data.adresse,
      typeCuisine: data.typeCuisine,
      image: data.image,
      fraisLivraison: data.fraisLivraison,
      horaires: data.horaires,
      isOpen: data.isOpen,
      statut: data.statut,
      owner: owners[data.owner]._id,
    });
    restaurantsByKey[data.nom] = restaurant;

    const categoriesByName = {};
    for (const nom of data.categories) {
      const category = await Category.create({
        nom,
        description: `Nos ${nom.toLowerCase()}`,
        type: 'plat',
        restaurant: restaurant._id,
      });
      categoriesByName[nom] = category;
    }

    for (const [nom, description, prix, categorie, image] of data.plats) {
      await Dish.create({
        nom,
        description,
        prix,
        image,
        disponible: true,
        categorie: categoriesByName[categorie]._id,
        restaurant: restaurant._id,
      });
    }
  }

  // Commandes de démonstration
  const pizzaHouse = restaurantsByKey['Pizza House'];
  const burgerLab = restaurantsByKey['Burger Lab'];
  const dar = restaurantsByKey['Dar El Couscous'];

  const pizzaMargherita = await Dish.findOne({ nom: 'Pizza Margherita' });
  const coca = await Dish.findOne({ nom: 'Coca-Cola 33cl' });
  const tiramisu = await Dish.findOne({ nom: 'Tiramisu' });
  const cheeseburger = await Dish.findOne({ nom: 'Cheeseburger Classic' });
  const frites = await Dish.findOne({ nom: 'Frites maison' });
  const couscous = await Dish.findOne({ nom: 'Couscous agneau' });

  const buildOrder = (restaurant, clientUser, articles, statut, createdAt) => {
    const sousTotal = articles.reduce((sum, a) => sum + a.quantite * a.prixUnitaire, 0);
    return Order.create({
      client: clientUser._id,
      restaurant: restaurant._id,
      articles,
      adresseLivraison: 'Avenue Habib Bourguiba, Tunis',
      telephone: clientUser.telephone,
      sousTotal,
      fraisLivraison: restaurant.fraisLivraison,
      total: sousTotal + restaurant.fraisLivraison,
      modePaiement: 'livraison',
      statut,
      remarque: statut === 'en_attente' ? 'Sans oignons' : '',
      createdAt,
      updatedAt: createdAt,
    });
  };

  await buildOrder(
    pizzaHouse,
    client,
    [
      { plat: pizzaMargherita._id, nom: pizzaMargherita.nom, quantite: 2, prixUnitaire: pizzaMargherita.prix, image: pizzaMargherita.image },
      { plat: coca._id, nom: coca.nom, quantite: 1, prixUnitaire: coca.prix, image: coca.image },
      { plat: tiramisu._id, nom: tiramisu.nom, quantite: 1, prixUnitaire: tiramisu.prix, image: tiramisu.image },
    ],
    'en_attente',
    new Date(Date.now() - 1000 * 60 * 30)
  );

  await buildOrder(
    burgerLab,
    client,
    [
      { plat: cheeseburger._id, nom: cheeseburger.nom, quantite: 1, prixUnitaire: cheeseburger.prix, image: cheeseburger.image },
      { plat: frites._id, nom: frites.nom, quantite: 2, prixUnitaire: frites.prix, image: frites.image },
    ],
    'en_preparation',
    new Date(Date.now() - 1000 * 60 * 60 * 5)
  );

  await buildOrder(
    dar,
    client,
    [{ plat: couscous._id, nom: couscous.nom, quantite: 1, prixUnitaire: couscous.prix, image: couscous.image }],
    'livree',
    new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
  );

  console.log('\nBase de données FoodExpress initialisée.');
  console.log('-----------------------------------------');
  console.log('Admin         : admin@foodexpress.tn   / Admin1234');
  console.log('Restaurateur  : resto@foodexpress.tn   / Resto1234');
  console.log('Restaurateur  : resto2@foodexpress.tn  / Resto1234');
  console.log('Client        : client@foodexpress.tn  / Client1234');
  console.log('-----------------------------------------\n');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('Erreur lors du peuplement :', error);
  await mongoose.connection.close();
  process.exit(1);
});
