const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/** Utilisateur : client, restaurateur ou admin ; mot de passe haché et masqué. */
const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire.'],
      trim: true,
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères.'],
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est obligatoire.'],
      trim: true,
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères.'],
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Adresse email invalide.'],
    },
    telephone: {
      type: String,
      required: [true, 'Le numéro de téléphone est obligatoire.'],
      trim: true,
      match: [/^[0-9+\s]{8,15}$/, 'Numéro de téléphone invalide.'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire.'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères.'],
      // Le mot de passe ne sort jamais des requêtes par défaut.
      select: false,
    },
    role: {
      type: String,
      enum: ['client', 'restaurateur', 'admin'],
      default: 'client',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/** Hachage automatique du mot de passe avant sauvegarde (règle 11). */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/** Compare le mot de passe en clair avec le hash bcrypt. */
userSchema.methods.matchPassword = function matchPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Sécurité : retire aussi le mot de passe de la réponse JSON.
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
