const mongoose = require('mongoose');

/** Plat du menu : rattaché à une catégorie et à un restaurant, avec prix et disponibilité. */
const dishSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom du plat est obligatoire.'],
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },
    prix: {
      type: Number,
      required: [true, 'Le prix est obligatoire.'],
      // Prix plancher à 0,10 pour éviter les plats gratuits.
      min: [0.1, 'Le prix doit être supérieur à 0.'],
    },
    image: {
      type: String,
      default: '',
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    // Restaurant dupliqué sur le plat pour filtrer directement les menus.
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dish', dishSchema);
