// utils/reportFilters.js

const MUNICIPALITY_KEYWORDS = [
  "road",
  "pothole",
  "street light",
  "traffic light",
  "drain",
  "drainage",
  "sewage",
  "garbage",
  "trash",
  "waste",
  "litter",
  "water leak",
];

function buildMunicipalityTypeOrFilter() {
  return MUNICIPALITY_KEYWORDS.map((k) => ({
    type: { $regex: k, $options: "i" },
  }));
}

module.exports = {
  MUNICIPALITY_KEYWORDS,
  buildMunicipalityTypeOrFilter,
};
