const mongoose = require('mongoose');

/** Restaurant : fiche soumise à validation admin et rattachée à un propriétaire. */
const restaurantSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom du restaurant est obligatoire.'],
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire.'],
      trim: true,
      maxlength: 500,
    },
    adresse: {
      type: String,
      required: [true, "L'adresse est obligatoire."],
      trim: true,
    },
    typeCuisine: {
      type: String,
      required: [true, 'Le type de cuisine est obligatoire.'],
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    fraisLivraison: {
      type: Number,
      default: 5,
      min: [0, 'Les frais de livraison ne peuvent pas être négatifs.'],
    },
    horaires: {
      type: String,
      default: '10:00 - 23:00',
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    // Validation par l'administrateur
    statut: {
      type: String,
      enum: ['en_attente', 'valide', 'suspendu'],
      default: 'en_attente',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index texte pour la recherche par nom, cuisine et description.
restaurantSchema.index({ nom: 'text', description: 'text', typeCuisine: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
