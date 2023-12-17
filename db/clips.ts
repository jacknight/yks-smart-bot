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
    transcription: {
      type: String,
      required: false,
    },
  },
  { minimize: false },
);

clipsSchema.index({ name: 'transcriptionIndex', transcription: 'text' });
module.exports = mongoose.model('clips', clipsSchema);

export default clipsSchema;
