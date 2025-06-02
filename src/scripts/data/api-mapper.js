import Map from '../utils/map';

export async function reportMapper(story) {
  // Validasi lat/lon sebelum request ke MapTiler
  let placeName = '-';
  if (
    typeof story.lat === 'number' &&
    typeof story.lon === 'number' &&
    !isNaN(story.lat) &&
    !isNaN(story.lon)
  ) {
    try {
      placeName = await Map.getPlaceNameByCoordinate(story.lat, story.lon);
    } catch (e) {
      console.error('getPlaceNameByCoordinate error:', e);
      placeName = '-';
    }
  }

  return {
    id: story.id,
    title: story.name,
    description: story.description,
    image: story.photoUrl,
    date: new Date(story.createdAt).toLocaleString(),
    location: {
      latitude: story.lat ?? null,
      longitude: story.lon ?? null,
      placeName: placeName,
    },
    reporter: { name: story.name },
    damageLevel: story.damageLevel || '-',
    evidenceImages: Array.isArray(story.evidenceImages) ? story.evidenceImages : [],
    createdAt: story.createdAt || null
  };
}
