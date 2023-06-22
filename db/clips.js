const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clipsSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    attachment: {
      type: Object,
      required: false,
    },
  },
  { minimize: false },
);

module.exports = mongoose.model('clips', clipsSchema);
