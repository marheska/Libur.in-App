import { getAccessToken } from '../../utils/auth';

export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showReportsListMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showReportsListMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async addMarkersToMap(stories) {
    stories.forEach((story) => {
      if (story.location && story.location.latitude && story.location.longitude) {
        const coordinate = [story.location.latitude, story.location.longitude];
        const markerOptions = { alt: story.title };
        const popupOptions = { content: story.title };
        this.#view.addMarkerToMap(coordinate, markerOptions, popupOptions);
      }
    });
  }

  async initialGalleryAndMap() {
    this.#view.showLoading();
    try {
      await this.showReportsListMap();

      const token = getAccessToken();
      const response = await this.#model.getStories(token);

      if (!response) {
        this.#view.populateReportsListError('Failed to fetch stories');
        return;
      }

      this.#view.populateReportsList('Stories loaded successfully', response);
      await this.addMarkersToMap(response);
    } catch (error) {
      console.error('initialGalleryAndMap: error:', error);
      this.#view.populateReportsListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
