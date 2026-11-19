import { NEW_REDDIT_ORIGIN, OLD_REDDIT_ORIGIN } from './config.js';
import { extractNewListing } from './extractors/new/listing.js';
import { extractNewThread } from './extractors/new/thread.js';
import { extractListing } from './extractors/old/listing.js';
import { extractThread } from './extractors/old/thread.js';

// The two Reddit front ends. Both extractor sets return the same data shape.
export const LAYOUTS = {
  old: {
    name: 'old',
    origin: OLD_REDDIT_ORIGIN,
    extractors: { listing: extractListing, thread: extractThread },
  },
  new: {
    name: 'new',
    origin: NEW_REDDIT_ORIGIN,
    extractors: { listing: extractNewListing, thread: extractNewThread },
  },
};
