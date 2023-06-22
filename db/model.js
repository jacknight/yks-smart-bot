const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const guildSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    settings: {
      type: Object,
      required: true,
    },
  },
  { minimize: false },
);

module.exports = mongoose.model('model', guildSchema);
