const mongoose = require('mongoose');

/**
 * Catégories :
 *  - type "cuisine" : catégories générales gérées par l'administrateur (Pizza, Tunisien...)
 *  - type "plat"    : catégories du menu d'un restaurant (Entrées, Pizzas, Boissons...)
 */
const categorySchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom de la catégorie est obligatoire.'],
      trim: true,
      maxlength: 60,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    type: {
      type: String,
      enum: ['plat', 'cuisine'],
      default: 'plat',
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
  },
  { timestamps: true }
);

// Index composé : recherche par restaurant, sans unicité du nom.
categorySchema.index({ restaurant: 1, nom: 1 }, { unique: false });

module.exports = mongoose.model('Category', categorySchema);
