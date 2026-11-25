const mongoose = require('mongoose');

/**
 * Connexion à la base MongoDB "foodexpress".
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodexpress';

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connecté : ${mongoose.connection.name}`);
  } catch (error) {
    console.error('Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB déconnecté');
  });
};

module.exports = connectDB;
