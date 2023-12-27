import mongoose from 'mongoose';
import { Schema } from 'mongoose';

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

export default mongoose.model('model', guildSchema);
