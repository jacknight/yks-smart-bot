const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionsSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    session: {
      type: Object,
      require: true,
    },
  },
  { minimize: false },
);

module.exports = mongoose.model('sessions', sessionsSchema);
