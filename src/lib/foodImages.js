// Curated ultra-realistic food photography mapping
// Uses local ultra-realistic generated/curated images for authentic Kenyan cafeteria items,
// and curated high-resolution photography for specialties.

const FOOD_IMAGE_MAP = [
  { match: /black\s*tea/i, image: "/foods/black-tea.jpg" },
  { match: /white\s*tea/i, image: "/foods/white-tea.jpg" },
  { match: /n?dazi|mandazi|mahamri/i, image: "/foods/ndazi.jpg" },
  { match: /beef\s*chapo|chapo\s*mix/i, image: "/foods/chapo-mix.jpg" },
  { match: /chapati|chapo/i, image: "/foods/chapati.jpg" },
  { match: /beef\s*rice/i, image: "/foods/beef-rice.jpg" },
  { match: /rice\s*mix/i, image: "/foods/rice-mix.jpg" },
  { match: /rice/i, image: "/foods/rice.jpg" },
  { match: /beef\s*ugali|beef\s*stew|nyama/i, image: "/foods/beef-stew.jpg" },
  { match: /egg\s*ugali|egg/i, image: "/foods/egg-ugali.jpg" },
  { match: /ugali\s*mix|ugali/i, image: "/foods/ugali.jpg" },
  { match: /vegetable|kales|cabbage|sukuma/i, image: "/foods/vegetables.jpg" },
  { match: /ndengu|green\s*gram|lentil/i, image: "/foods/ndengu-stew.jpg" },
  { match: /bean/i, image: "/foods/beans-stew.jpg" },
  { match: /chai/i, image: "/foods/white-tea.jpg" },
  { match: /avocado/i, image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=800&q=80" },
  { match: /oat|porridge/i, image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80" },
  { match: /pancake/i, image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80" },
  { match: /burger/i, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80" },
  { match: /tilapia|fish/i, image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80" },
  { match: /chicken/i, image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80" },
  { match: /wrap/i, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80" },
  { match: /vegan|bowl|salad/i, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80" },
];

export function getRealisticFoodImage(name, currentImage = "") {
  // If currentImage is a specific local image, keep it
  if (currentImage && currentImage.startsWith("/foods/")) {
    return currentImage;
  }

  // Look for match by food name
  if (name) {
    for (const entry of FOOD_IMAGE_MAP) {
      if (entry.match.test(name)) {
        return entry.image;
      }
    }
  }

  // If currentImage is valid and not a known wrong placeholder
  const badPatterns = [
    "photo-1510627489930-0c1b0bfb6785", // house
    "photo-1558961363-fa8fdf82db35", // chocolate cookies
  ];
  if (currentImage && !badPatterns.some(bp => currentImage.includes(bp))) {
    return currentImage;
  }

  return "/foods/beef-stew.jpg";
}
