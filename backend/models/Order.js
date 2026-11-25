const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'en_attente',
  'acceptee',
  'en_preparation',
  'prete',
  'en_livraison',
  'livree',
  'refusee',
  'annulee',
];

const orderItemSchema = new mongoose.Schema(
  {
    plat: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
    nom: { type: String, required: true },
    quantite: { type: Number, required: true, min: 1 },
    prixUnitaire: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
  },
  { _id: false }
);

/** Commande : articles figés, totaux calculés côté serveur et suivi par statut. */
const orderSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    // Les noms et prix sont figés au moment de l'achat (historique fiable).
    articles: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'Une commande doit contenir au moins un article.',
      },
    },
    adresseLivraison: {
      type: String,
      required: [true, "L'adresse de livraison est obligatoire."],
      trim: true,
    },
    telephone: { type: String, trim: true, default: '' },
    sousTotal: { type: Number, required: true, min: 0 },
    fraisLivraison: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    modePaiement: {
      type: String,
      enum: ['livraison', 'en_ligne'],
      default: 'livraison',
    },
    statut: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'en_attente',
    },
    remarque: { type: String, trim: true, maxlength: 300, default: '' },
    motifRefus: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

// Index pour l'historique client et le suivi par restaurant/statut.
orderSchema.index({ client: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, statut: 1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
