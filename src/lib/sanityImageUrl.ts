import imageUrlBuilder from '@sanity/image-url';
import sanityClient from './sanityClient'; 
import { SanityImageSource } from '@sanity/image-url/lib/types/types'; 

const builder = imageUrlBuilder(sanityClient);

function hasAsset(source: SanityImageSource): source is SanityImageSource & { asset: { _ref: string } } {
  return typeof source === 'object' && source !== null && 'asset' in source;
}

export function urlFor(source: SanityImageSource | undefined | null) {
  if (source && hasAsset(source)) {
    return builder.image(source);
  }
  return null;
}