/* ================================================
   ORIGINAL ARTWORK CATALOG — SERVER-SIDE SOURCE OF TRUTH
   The name and price PayPal charges come from HERE, never from
   the browser, so a visitor cannot change what an artwork costs.
   Keep these prices identical to the ones shown in index.html.
   ================================================ */
export const CURRENCY = 'EUR';

export const ARTWORKS = {
  midnightbloom:      { name: 'Midnight Bloom',            price: 360 },
  whispersshoreline:  { name: 'Whispers of the Shoreline', price: 110 },
  coastalquiet:       { name: 'Coastal Quiet',             price: 110 },
  bluehorizon:        { name: 'Blue Horizon',              price: 118 },
  quietisland:        { name: 'The Quiet Island',          price: 100 },
  acrossquietwater:   { name: 'Across the Quiet Water',    price: 120 },
  adriaticatmosphere: { name: 'Adriatic Atmosphere',       price: 700 },
  celestial:          { name: 'Celestial Bloom',           price: 600 },
  quietcurrent:       { name: 'Quiet Current',             price: 660 },
  housesbluehill:     { name: 'Houses on the Blue Hill',   price: 110 },
  littlehill:         { name: 'Little Hill, Quiet Sea',    price: 120 },
  sunsetmosaic:       { name: 'Sunset Mosaic Hills',       price: 150 },
  gatheredsilence:    { name: 'Gathered Silence',          price: 640 },
  quiethorizongrove:  { name: 'Quiet Horizon Grove',       price: 720 },
};

export const isArtworkKey = (key) =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(ARTWORKS, key);

export const money = (n) => Number(n).toFixed(2);

/* "Free delivery to EU" is only free inside the EU. When this is true,
   an order whose PayPal shipping address is outside the EU is NOT charged
   (the buyer is asked to contact the gallery instead).
   Set to false if you are happy to ship free outside the EU as well. */
export const EU_ONLY_CHECKOUT = true;

export const EU_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE',
  'IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
]);
