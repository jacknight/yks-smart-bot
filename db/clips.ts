import mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const clipsSchema = new Schema(
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

clipsSchema.index({ transcriptionIndex: 'text' }, { sparse: true });
export default mongoose.model('clips', clipsSchema);
